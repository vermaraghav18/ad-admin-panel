// src/pages/Spotlight2Items.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listItems, createItem, updateItem, deleteItem, extractFromUrlOrXml, listSections } from '../services/spotlight2Service';
import ImageUploader from '../components/ImageUploader';

export default function Spotlight2Items() {
  const { sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('manual'); // 'manual' | 'linkxml'
  const [form, setForm] = useState({
    imageUrl: '', sourceName: '', title: '', description: '', linkUrl: '',
    publishedAt: '', enabled: true, sortIndex: 0
  });
  const [link, setLink] = useState('');
  const [xml, setXml] = useState('');

  const fetchSection = async () => {
    const all = await listSections({ limit: 500 });
    const found = (all.items || []).find(s => s._id === sectionId);
    setSection(found || null);
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await listItems(sectionId, { q, limit: 100 });
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      alert('Load failed: ' + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSection(); fetchRows(); }, [sectionId]); // eslint-disable-line

  const startEdit = (row) => {
    setEditing(row || {});
    setTab('manual');
    setForm(row ? {
      imageUrl: row.imageUrl || '',
      sourceName: row.sourceName || '',
      title: row.title || '',
      description: row.description || '',
      linkUrl: row.linkUrl || '',
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString().slice(0,16) : '',
      enabled: !!row.enabled,
      sortIndex: row.sortIndex ?? 0
    } : {
      imageUrl: '', sourceName: '', title: '', description: '', linkUrl: '', publishedAt: '', enabled: true, sortIndex: 0
    });
    setLink(''); setXml('');
  };

  const onSave = async () => {
    const payload = {
      ...form,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    };
    try {
      if (editing?._id) await updateItem(editing._id, payload);
      else await createItem(sectionId, payload);
      setEditing(null);
      await fetchRows();
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteItem(id); await fetchRows(); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  const onFetchFromLinkXml = async () => {
    try {
      const body = {};
      if (link) body.url = link;
      if (xml) body.xml = xml;
      if (!body.url && !body.xml) { alert('Provide a URL or paste XML.'); return; }
      const res = await extractFromUrlOrXml(body);
      setForm(f => ({
        ...f,
        imageUrl: res.imageUrl || f.imageUrl,
        sourceName: res.sourceName || f.sourceName,
        title: res.title || f.title,
        description: res.description || f.description,
        linkUrl: res.linkUrl || f.linkUrl,
        publishedAt: res.publishedAt ? new Date(res.publishedAt).toISOString().slice(0,16) : f.publishedAt
      }));
      alert('Fetched and filled!');
    } catch (e) {
      alert('Extract failed: ' + e.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>
          <Link to="/spotlight-2">⟵ Sections</Link> &nbsp; / &nbsp;
          Spotlight-2 Items — {section ? section.name : '…'}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search…" />
          <button onClick={fetchRows} disabled={loading}>Refresh</button>
          <button onClick={()=>startEdit(null)}>+ New Item</button>
        </div>
      </div>

      <table style={{ width:'100%', borderCollapse:'collapse', marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left' }}>Title</th>
            <th>Source</th>
            <th>Published</th>
            <th>Enabled</th>
            <th>Sort</th>
            <th>Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} style={{ borderTop:'1px solid #eee' }}>
              <td>{r.title}</td>
              <td>{r.sourceName}</td>
              <td>{r.publishedAt ? new Date(r.publishedAt).toLocaleString() : ''}</td>
              <td>{String(r.enabled)}</td>
              <td>{r.sortIndex}</td>
              <td>{r.linkUrl ? <a href={r.linkUrl} target="_blank" rel="noreferrer">open</a> : ''}</td>
              <td style={{ textAlign:'right' }}>
                <button onClick={()=>startEdit(r)}>Edit</button>{' '}
                <button onClick={()=>onDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing !== null && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
          <h3>{editing?._id ? 'Edit Item' : 'New Item'}</h3>

          <div style={{ display:'flex', gap:16, marginBottom:12 }}>
            <button onClick={()=>setTab('manual')} disabled={tab==='manual'}>Manual</button>
            <button onClick={()=>setTab('linkxml')} disabled={tab==='linkxml'}>From Link / XML</button>
          </div>

          {tab === 'manual' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ gridColumn:'1 / span 2' }}>Image
                <ImageUploader value={form.imageUrl} onChange={(v)=>setForm(f=>({...f,imageUrl:v}))} />
              </label>
              <label>Source Name<input value={form.sourceName} onChange={(e)=>setForm(f=>({...f,sourceName:e.target.value}))} /></label>
              <label>Title<input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} /></label>
              <label style={{ gridColumn:'1 / span 2' }}>Description
                <textarea rows={4} value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))}/>
              </label>
              <label>Article Link<input value={form.linkUrl} onChange={(e)=>setForm(f=>({...f,linkUrl:e.target.value}))} /></label>
              <label>Published At
                <input type="datetime-local" value={form.publishedAt} onChange={(e)=>setForm(f=>({...f,publishedAt:e.target.value}))} />
              </label>
              <label>Enabled
                <select value={String(form.enabled)} onChange={(e)=>setForm(f=>({...f,enabled:e.target.value==='true'}))}>
                  <option value="true">true</option><option value="false">false</option>
                </select>
              </label>
              <label>Sort Index
                <input type="number" value={form.sortIndex} onChange={(e)=>setForm(f=>({...f,sortIndex:Number(e.target.value)||0}))} />
              </label>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ gridColumn:'1 / span 2' }}>Paste Article URL
                <input placeholder="https://..." value={link} onChange={(e)=>setLink(e.target.value)} />
              </label>
              <label style={{ gridColumn:'1 / span 2' }}>Or paste RSS/Atom XML (single item is okay)
                <textarea rows={8} placeholder="<item>...</item>" value={xml} onChange={(e)=>setXml(e.target.value)}/>
              </label>
              <div style={{ gridColumn:'1 / span 2' }}>
                <button onClick={onFetchFromLinkXml}>Fetch details</button>
              </div>
              <div style={{ gridColumn:'1 / span 2', color:'#555' }}>
                <small>We’ll fill title, description, image, source name, published time if available.</small>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button onClick={onSave}>Save</button>{' '}
            <button onClick={()=>setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
