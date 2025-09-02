// src/pages/Spotlight2Sections.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { listSections, createSection, updateSection, deleteSection } from '../services/spotlight2Service';
import { Link } from 'react-router-dom';

const defaultForm = {
  name: '', key: '', description: '', enabled: true, sortIndex: 0,
  targetType: 'global', targetValue: '',
  modes: ['scroll','swipe'],
  afterNth: 0, repeatEvery: 0, repeatCount: 1,
  placement: 'inline',
};

export default function Spotlight2Sections() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null); // object or null
  const [form, setForm] = useState(defaultForm);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await listSections({ q, limit: 200 });
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      alert('Load failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []); // eslint-disable-line

  const onSave = async () => {
    try {
      const payload = { ...form };
      if (payload.targetType === 'global') payload.targetValue = ''; // keep clean
      if (!Array.isArray(payload.modes)) {
        payload.modes = ['scroll','swipe'].filter(m => m === payload.modes);
      }
      if (editing?._id) await updateSection(editing._id, payload);
      else await createSection(payload);

      setEditing(null);
      setForm(defaultForm);
      await fetchRows();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this section and all its items?')) return;
    try { await deleteSection(id); await fetchRows(); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  const startEdit = (row) => {
    setEditing(row || {});
    if (row) {
      setForm({
        name: row.name || '',
        key: row.key || '',
        description: row.description || '',
        enabled: !!row.enabled,
        sortIndex: row.sortIndex ?? 0,
        targetType: row.targetType || 'global',
        targetValue: row.targetValue || '',
        modes: row.modes?.length ? row.modes : ['scroll','swipe'],
        afterNth: row.afterNth ?? 0,
        repeatEvery: row.repeatEvery ?? 0,
        repeatCount: row.repeatCount ?? 1,
        placement: row.placement || 'inline',
      });
    } else {
      setForm(defaultForm);
    }
  };

  const toggleMode = (m) => {
    setForm(f => {
      const has = f.modes.includes(m);
      return { ...f, modes: has ? f.modes.filter(x => x !== m) : [...f.modes, m] };
    });
  };

  const header = useMemo(() => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ margin: 0 }}>Spotlight-2 Sections ({total})</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
        <button onClick={fetchRows} disabled={loading}>Refresh</button>
        <button onClick={() => startEdit(null)}>+ New Section</button>
      </div>
    </div>
  ), [q, total, loading]); // eslint-disable-line

  return (
    <div style={{ padding: 16 }}>
      {header}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th>Key</th>
            <th>Target</th>
            <th>Placement</th>
            <th>Modes</th>
            <th>Enabled</th>
            <th>Sort</th>
            <th>Updated</th>
            <th>Items</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} style={{ borderTop: '1px solid #eee' }}>
              <td>{r.name}</td>
              <td>{r.key}</td>
              <td>{r.targetType === 'global' ? 'global' : `${r.targetType}:${r.targetValue}`}</td>
              <td>{`after ${r.afterNth} • every ${r.repeatEvery} • x${r.repeatCount} • ${r.placement}`}</td>
              <td>{(r.modes || []).join(', ')}</td>
              <td>{String(r.enabled)}</td>
              <td>{r.sortIndex}</td>
              <td>{new Date(r.updatedAt).toLocaleString()}</td>
              <td><Link to={`/spotlight-2/${r._id}/items`}>Manage Items</Link></td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => startEdit(r)}>Edit</button>{' '}
                <button onClick={() => onDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing !== null && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
          <h3>{editing?._id ? 'Edit Section' : 'New Section'}</h3>

          {/* Basic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>Name<input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} /></label>
            <label>Key (slug)<input value={form.key} onChange={(e)=>setForm(f=>({...f,key:e.target.value.toLowerCase().trim()}))} /></label>
            <label style={{ gridColumn: '1 / span 2' }}>Description
              <textarea rows={3} value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))}/>
            </label>
          </div>

          {/* Targeting */}
          <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', borderRadius: 8 }}>
            <strong>Targeting</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
              <label>Target Type
                <select value={form.targetType} onChange={(e)=>setForm(f=>({...f,targetType:e.target.value}))}>
                  <option value="global">global</option>
                  <option value="category">category</option>
                  <option value="state">state</option>
                  <option value="city">city</option>
                </select>
              </label>
              <label>Target Value
                <input placeholder={form.targetType==='global' ? '(not used)' : 'e.g. politics / Maharashtra / Mumbai'}
                       value={form.targetValue}
                       onChange={(e)=>setForm(f=>({...f,targetValue:e.target.value}))}
                       disabled={form.targetType==='global'}
                />
              </label>
              <label>Modes
                <div>
                  <label style={{ marginRight: 12 }}>
                    <input type="checkbox" checked={form.modes.includes('scroll')} onChange={()=>toggleMode('scroll')} />
                    &nbsp;scroll
                  </label>
                  <label>
                    <input type="checkbox" checked={form.modes.includes('swipe')} onChange={()=>toggleMode('swipe')} />
                    &nbsp;swipe
                  </label>
                </div>
              </label>
            </div>
          </div>

          {/* Placement */}
          <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', borderRadius: 8 }}>
            <strong>Placement</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 8 }}>
              <label>After Nth
                <input type="number" value={form.afterNth} onChange={(e)=>setForm(f=>({...f,afterNth:Number(e.target.value)||0}))} />
              </label>
              <label>Repeat Every
                <input type="number" value={form.repeatEvery} onChange={(e)=>setForm(f=>({...f,repeatEvery:Number(e.target.value)||0}))} />
              </label>
              <label>Repeat Count
                <input type="number" value={form.repeatCount} onChange={(e)=>setForm(f=>({...f,repeatCount:Number(e.target.value)||1}))} />
              </label>
              <label>Placement
                <select value={form.placement} onChange={(e)=>setForm(f=>({...f,placement:e.target.value}))}>
                  <option value="inline">inline</option>
                  <option value="rail">rail</option>
                  <option value="top">top</option>
                  <option value="bottom">bottom</option>
                </select>
              </label>
              <label>Sort Index
                <input type="number" value={form.sortIndex} onChange={(e)=>setForm(f=>({...f,sortIndex:Number(e.target.value)||0}))} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Enabled
              <select value={String(form.enabled)} onChange={(e)=>setForm(f=>({...f,enabled:e.target.value==='true'}))}>
                <option value="true">true</option><option value="false">false</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={onSave}>Save</button>{' '}
            <button onClick={()=>setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
