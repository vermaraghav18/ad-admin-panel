import React, { useEffect, useState } from 'react';
import { createSection, updateSection } from '../api/sections';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

// lightweight loader for single section (we keep it inline)
async function loadSection(id) {
  const res = await api.get('/sections', { params: {} });
  const item = (res.data.items || []).find(x => x._id === id);
  return item || null;
}

export default function SectionEdit() {
  const nav = useNavigate();
  const { id } = useParams(); // "new" or ObjectId
  const isNew = id === 'new';
  const [state, setState] = useState({ name: '', slug: '', order: 999, enabled: true });
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    (async () => {
      if (!isNew) {
        setLoading(true);
        const item = await loadSection(id);
        if (item) setState({ name: item.name, slug: item.slug, order: item.order ?? 999, enabled: !!item.enabled });
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...state };
    if (isNew) await createSection(payload);
    else await updateSection(id, payload);
    nav('/sections');
  };

  return (
    <div className="p-4">
      <h2>{isNew ? 'New Section' : 'Edit Section'}</h2>
      {loading ? <div>Loading…</div> : (
        <form onSubmit={save} style={{maxWidth: 520}}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value={state.name} onChange={e => setState(s => ({...s, name: e.target.value}))} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Slug</label>
            <input className="form-control" value={state.slug} onChange={e => setState(s => ({...s, slug: e.target.value}))} placeholder="auto from name if left blank" />
            <div className="form-text">Use this slug as the <code>category</code> on the Feeds page.</div>
          </div>
          <div className="mb-3">
            <label className="form-label">Order</label>
            <input type="number" className="form-control" value={state.order} onChange={e => setState(s => ({...s, order: Number(e.target.value)}))}/>
          </div>
          <div className="form-check mb-3">
            <input id="enabled" type="checkbox" className="form-check-input" checked={state.enabled} onChange={e => setState(s => ({...s, enabled: e.target.checked}))}/>
            <label htmlFor="enabled" className="form-check-label">Enabled</label>
          </div>

          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      )}

      <hr />
      {!isNew && (
        <div className="mt-3">
          <h4>Attach RSS URLs</h4>
          <p>Go to the <b>Feeds</b> page and add new rows with <code>category = {state.slug || 'your-section-slug'}</code>. The aggregator already uses this category.</p>
        </div>
      )}
    </div>
  );
}
