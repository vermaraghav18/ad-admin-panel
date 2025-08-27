// src/pages/FeatureBannerGroupsManager.js
import React, { useEffect, useState } from 'react';
import { listGroups, createGroup, updateGroup, deleteGroup } from '../services/featureBannerGroupsApi';

const empty = {
  name: '',
  category: '',
  nth: 3,
  priority: 0,
  enabled: true,
  startAt: '',
  endAt: '',
  items: [
    // { id:'', title:'', description:'', imageUrl:'', link:'', source:'', publishedAt:'' }
  ],
};

export default function FeatureBannerGroupsManager() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => setGroups(await listGroups());
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, nth: Number(form.nth), priority: Number(form.priority) || 0 };
    if (editing) await updateGroup(editing, payload); else await createGroup(payload);
    setForm(empty); setEditing(null); load();
  };

  const onEdit = (g) => { setEditing(g._id); setForm({ ...g, startAt: g.startAt?.slice(0,16) || '', endAt: g.endAt?.slice(0,16) || '' }); };
  const onDelete = async (id) => { if (window.confirm('Delete?')) { await deleteGroup(id); load(); } };

  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };
    setForm({ ...form, items });
  };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <h2>Feature Banner Groups</h2>

      <form onSubmit={save} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input placeholder="Category (e.g. Sports)" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}/>
        <input type="number" placeholder="nth" value={form.nth} onChange={e=>setForm({...form, nth:e.target.value})}/>
        <input type="number" placeholder="priority" value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}/>
        <label><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form, enabled:e.target.checked})}/> Enabled</label>
        <input type="datetime-local" value={form.startAt} onChange={e=>setForm({...form, startAt:e.target.value})}/>
        <input type="datetime-local" value={form.endAt} onChange={e=>setForm({...form, endAt:e.target.value})}/>
        <button type="submit" style={{ gridColumn: 'span 1' }}>{editing ? 'Update' : 'Create'}</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <h3>Items in this group</h3>
        {form.items.map((it, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 2fr 1fr 1fr', gap:8, margin:'8px 0' }}>
            <input placeholder="title" value={it.title||''} onChange={e=>updateItem(i,'title',e.target.value)}/>
            <input placeholder="source" value={it.source||''} onChange={e=>updateItem(i,'source',e.target.value)}/>
            <input placeholder="imageUrl" value={it.imageUrl||''} onChange={e=>updateItem(i,'imageUrl',e.target.value)}/>
            <input placeholder="link" value={it.link||''} onChange={e=>updateItem(i,'link',e.target.value)}/>
            <input placeholder="pub date (ISO)" value={it.publishedAt||''} onChange={e=>updateItem(i,'publishedAt',e.target.value)}/>
            <button type="button" onClick={()=>setForm({...form, items: form.items.filter((_,x)=>x!==i)})}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={()=>setForm({...form, items:[...form.items, {}]})}>+ Add Item</button>
      </div>

      <hr style={{ margin:'24px 0' }}/>

      <table width="100%" cellPadding="8" style={{ borderCollapse:'collapse' }}>
        <thead><tr><th>Name</th><th>Category</th><th>nth</th><th>Items</th><th>Enabled</th><th>Actions</th></tr></thead>
        <tbody>
          {groups.map(g=>(
            <tr key={g._id}>
              <td>{g.name}</td>
              <td>{g.category}</td>
              <td>{g.nth}</td>
              <td>{g.items?.length||0}</td>
              <td>{g.enabled ? 'Yes':'No'}</td>
              <td>
                <button onClick={()=>onEdit(g)}>Edit</button>{' '}
                <button onClick={()=>onDelete(g._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
