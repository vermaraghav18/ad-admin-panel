// ad-admin-panel/src/pages/SpotlightEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SpotlightApi } from '../services/spotlightApi';

const empty = {
  sectionId: '',
  status: 'live',
  enabled: true,
  order: 0,
  source: '',
  title: '',
  description: '',
  link: '',
  variants: [
    { aspect: '16:9', url: '' },
    { aspect: '9:16', url: '' },
  ],
};

export default function SpotlightEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sections, setSections] = useState([]);
  const [model, setModel] = useState(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await SpotlightApi.listSections();
      setSections(s);
      if (id) {
        const e = await SpotlightApi.getEntry(id);
        // ensure default variants present
        const map = Object.fromEntries((e.variants || []).map(v => [v.aspect, v.url]));
        e.variants = [
          { aspect: '16:9', url: map['16:9'] || '' },
          { aspect: '9:16', url: map['9:16'] || '' },
        ];
        setModel(e);
      }
      setLoading(false);
    })();
  }, [id]);

  const on = (path, val) => {
    setModel(m => {
      const copy = { ...m };
      const seg = path.split('.');
      let ref = copy;
      while (seg.length > 1) ref = ref[seg.shift()];
      ref[seg[0]] = val;
      return copy;
    });
  };

  const setVariant = (idx, url) => {
    setModel(m => {
      const v = [...m.variants];
      v[idx] = { ...v[idx], url };
      return { ...m, variants: v };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    // strip empty variants
    const payload = {
      ...model,
      variants: (model.variants || []).filter(v => (v.url || '').trim().length),
    };
    if (id) await SpotlightApi.updateEntry(id, payload);
    else await SpotlightApi.createEntry(payload);
    nav('/spotlights/entries');
  };

  if (loading) return <div>Loading…</div>;

  return (
    <div className="page">
      <h2>{id ? 'Edit Spotlight Entry' : 'New Spotlight Entry'}</h2>

      <form onSubmit={save} className="form">
        <div className="row">
          <label>Section</label>
          <select value={model.sectionId} onChange={e => on('sectionId', e.target.value)} required>
            <option value="">Select…</option>
            {sections.map(s => (
              <option key={s._id} value={s._id}>
                {s.title} — {s.sectionType}:{s.sectionValue}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Status</label>
          <select value={model.status} onChange={e => on('status', e.target.value)}>
            <option value="live">live</option>
            <option value="draft">draft</option>
            <option value="dead">dead</option>
          </select>
          <label style={{ marginLeft: 16 }}>Enabled</label>
          <input type="checkbox" checked={model.enabled} onChange={e => on('enabled', e.target.checked)} />
          <label style={{ marginLeft: 16 }}>Order</label>
          <input type="number" value={model.order} onChange={e => on('order', +e.target.value)} style={{ width: 90 }} />
        </div>

        <div className="row">
          <label>Source</label>
          <input value={model.source} onChange={e => on('source', e.target.value)} placeholder="e.g., Reuters" />
        </div>

        <div className="row">
          <label>Title</label>
          <input value={model.title} onChange={e => on('title', e.target.value)} />
        </div>

        <div className="row">
          <label>Description</label>
          <textarea rows="3" value={model.description} onChange={e => on('description', e.target.value)} />
        </div>

        <div className="row">
          <label>Link</label>
          <input value={model.link} onChange={e => on('link', e.target.value)} placeholder="https://…" />
        </div>

        <fieldset style={{ marginTop: 16 }}>
          <legend>Images (Cloudinary URLs)</legend>
          <div className="row">
            <label>16:9</label>
            <input value={model.variants[0]?.url || ''} onChange={e => setVariant(0, e.target.value)} placeholder="https://res.cloudinary.com/…" />
          </div>
          <div className="row">
            <label>9:16</label>
            <input value={model.variants[1]?.url || ''} onChange={e => setVariant(1, e.target.value)} placeholder="https://res.cloudinary.com/…" />
          </div>
        </fieldset>

        <div className="row">
          <button type="submit" className="primary">Save Entry</button>
        </div>
      </form>
    </div>
  );
}
