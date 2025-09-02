// src/pages/Spotlight2Sections.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { listSections, createSection, updateSection, deleteSection } from '../services/spotlight2Service';
import { Link } from 'react-router-dom';

export default function Spotlight2Sections() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null); // object or null
  const [form, setForm] = useState({ name: '', key: '', description: '', enabled: true, sortIndex: 0 });

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await listSections({ q, limit: 100 });
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
      if (editing?._id) {
        await updateSection(editing._id, form);
      } else {
        await createSection(form);
      }
      setEditing(null);
      setForm({ name: '', key: '', description: '', enabled: true, sortIndex: 0 });
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
    setForm(row ? {
      name: row.name || '', key: row.key || '', description: row.description || '',
      enabled: !!row.enabled, sortIndex: row.sortIndex ?? 0
    } : { name: '', key: '', description: '', enabled: true, sortIndex: 0 });
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

      {/* Drawer/Modal substitute */}
      {editing !== null && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
          <h3>{editing?._id ? 'Edit Section' : 'New Section'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>Name<input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} /></label>
            <label>Key (slug)<input value={form.key} onChange={(e)=>setForm(f=>({...f,key:e.target.value.toLowerCase().trim()}))} /></label>
            <label style={{ gridColumn: '1 / span 2' }}>Description
              <textarea rows={3} value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))}/>
            </label>
            <label>Enabled
              <select value={String(form.enabled)} onChange={(e)=>setForm(f=>({...f,enabled:e.target.value==='true'}))}>
                <option value="true">true</option><option value="false">false</option>
              </select>
            </label>
            <label>Sort Index<input type="number" value={form.sortIndex} onChange={(e)=>setForm(f=>({...f,sortIndex:Number(e.target.value)||0}))} /></label>
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
