// src/pages/SpotlightEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SpotlightApi from '../services/spotlightApi';

const empty = {
  sectionId: '',
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  sortIndex: 0,
  enabled: true,
};

export default function SpotlightEdit() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const [model, setModel] = useState(empty);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const ss = await SpotlightApi.listSections();
        setSections(ss);
        if (id) {
          setModel(await SpotlightApi.getEntry(id));
        } else {
          const sid = sp.get('sectionId') || ss[0]?._id || '';
          setModel(m => ({ ...m, sectionId: sid }));
        }
      } catch (e) { alert(e.message); }
    })();
  }, [id]);

  const change = patch => setModel(prev => ({ ...prev, ...patch }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...model,
        sortIndex: Number(model.sortIndex) || 0,
      };
      if (id) await SpotlightApi.updateEntry(id, payload);
      else await SpotlightApi.createEntry(payload);
      navigate(`/spotlights?sectionId=${payload.sectionId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h2>{id ? 'Edit' : 'New'} Spotlight Entry</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-2">
          <label>Section</label>
          <select className="form-select" value={model.sectionId}
                  onChange={e => change({ sectionId: e.target.value })} required>
            <option value="">Select…</option>
            {sections.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
          </select>
        </div>

        <div className="mb-2">
          <label>Title</label>
          <input className="form-control" value={model.title}
                 onChange={e => change({ title: e.target.value })} required />
        </div>

        <div className="mb-2">
          <label>Subtitle</label>
          <input className="form-control" value={model.subtitle}
                 onChange={e => change({ subtitle: e.target.value })} />
        </div>

        <div className="row mb-2">
          <div className="col">
            <label>Image URL</label>
            <input className="form-control" value={model.imageUrl}
                   onChange={e => change({ imageUrl: e.target.value })} />
          </div>
          <div className="col">
            <label>Link URL</label>
            <input className="form-control" value={model.linkUrl}
                   onChange={e => change({ linkUrl: e.target.value })} />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col">
            <label>Sort Index</label>
            <input type="number" className="form-control" value={model.sortIndex}
                   onChange={e => change({ sortIndex: e.target.value })} />
          </div>
          <div className="col d-flex align-items-end">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="enabled"
                     checked={!!model.enabled} onChange={e => change({ enabled: e.target.checked })} />
              <label className="form-check-label" htmlFor="enabled">Enabled</label>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
