// src/pages/FeatureBannerGroupsManager.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');

const emptyItem = () => ({
  title: '',
  imageUrl: '',
  link: '',
  pubDate: '',
  description: '',
});

// helper: get the document id regardless of _id/id transform
const getId = (g) => g?._id ?? g?.id ?? '';

export default function FeatureBannerGroupsManager() {
  const [groups, setGroups] = useState([]);

  // create/edit state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [nth, setNth] = useState(3);
  const [priority, setPriority] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [articleKey, setArticleKey] = useState('');
  const [items, setItems] = useState([]);

  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    const res = await axios.get(`${API_BASE}/api/feature-banner-groups`);
    // normalize so we always have _id
    const data = (res.data || []).map(g => ({ _id: getId(g), ...g }));
    setGroups(data);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setCategory('');
    setNth(3);
    setPriority(0);
    setEnabled(true);
    setStartAt('');
    setEndAt('');
    setArticleKey('');
    setItems([]);
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx, key, val) {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  }

  async function createOrUpdate() {
    const payload = {
      name,
      category,
      nth: Number(nth) || 0,
      priority: Number(priority) || 0,
      enabled,
      startAt: startAt || null,
      endAt: endAt || null,
      articleKey: (articleKey || '').trim(),
      items: items.map(i => ({
        title: i.title,
        imageUrl: i.imageUrl,
        link: i.link,
        pubDate: i.pubDate || null,
        description: i.description || '',
      })),
    };

    if (editingId) {
      await axios.put(`${API_BASE}/api/feature-banner-groups/${editingId}`, payload);
    } else {
      await axios.post(`${API_BASE}/api/feature-banner-groups`, payload);
    }
    resetForm();
    fetchGroups();
  }

  function startEdit(g) {
    const id = getId(g);
    setEditingId(id || null);
    setName(g.name || '');
    setCategory(g.category || '');
    setNth(g.nth ?? 0);
    setPriority(g.priority ?? 0);
    setEnabled(!!g.enabled);
    setStartAt(g.startAt ? String(g.startAt).slice(0, 16) : '');
    setEndAt(g.endAt ? String(g.endAt).slice(0, 16) : '');
    setArticleKey(g.articleKey || '');
    setItems((g.items || []).map(it => ({
      title: it.title || '',
      imageUrl: it.imageUrl || '',
      link: it.link || '',
      pubDate: it.pubDate ? String(it.pubDate).slice(0, 16) : '',
      description: it.description || '',
    })));
  }

  async function removeGroup(idLike) {
    const id = idLike || editingId;
    if (!id) {
      alert('Missing id for deletion.');
      return;
    }
    if (!window.confirm('Delete this group?')) return;
    await axios.delete(`${API_BASE}/api/feature-banner-groups/${id}`);
    if (editingId === id) resetForm();
    fetchGroups();
  }

  const actionLabel = editingId ? 'Update' : 'Create';

  return (
    <div className="page">
      <h2>Feature Banner Groups</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Category (e.g. Sports)" value={category} onChange={e => setCategory(e.target.value)} />
          <input placeholder="Nth" type="number" value={nth} onChange={e => setNth(e.target.value)} />
          <input placeholder="Priority" type="number" value={priority} onChange={e => setPriority(e.target.value)} />
        </div>

        <div className="row">
          <label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Enabled</label>
          <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
          <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
        </div>

        <div className="row">
          <input
            placeholder="Article key (optional: inject after this article ID)"
            value={articleKey}
            onChange={e => setArticleKey(e.target.value)}
          />
        </div>

        <h4>Items in this group</h4>
        {items.map((it, idx) => (
          <div className="row" key={idx}>
            <input placeholder="Title" value={it.title} onChange={e => updateItem(idx, 'title', e.target.value)} />
            <input placeholder="Image URL (.jpg/.png/.webp)" value={it.imageUrl} onChange={e => updateItem(idx, 'imageUrl', e.target.value)} />
            <input placeholder="Link (optional)" value={it.link} onChange={e => updateItem(idx, 'link', e.target.value)} />
            <input type="datetime-local" value={it.pubDate} onChange={e => updateItem(idx, 'pubDate', e.target.value)} />
            <input placeholder="Description (shown under title)" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
            <button onClick={() => removeItem(idx)}>Remove</button>
          </div>
        ))}
        <div className="row">
          <button onClick={addItem}>+ Add Item</button>
          <div style={{ flex: 1 }} />
          <button onClick={createOrUpdate}>{actionLabel}</button>
          {editingId && <button onClick={resetForm} style={{ marginLeft: 8 }}>Cancel</button>}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>nth</th><th>Article Key</th><th>Items</th><th>Enabled</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => {
            const id = getId(g);
            return (
              <tr key={id}>
                <td>{g.name}</td>
                <td>{g.category}</td>
                <td>{g.nth}</td>
                <td style={{maxWidth:260, overflow:'hidden', textOverflow:'ellipsis'}}>{g.articleKey || '—'}</td>
                <td>{g.items?.length ?? 0}</td>
                <td>{g.enabled ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => startEdit(g)}>Edit</button>
                  <button onClick={() => removeGroup(id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
