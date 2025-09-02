// src/pages/SpotlightSectionEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SpotlightApi from '../services/spotlightApi';

const empty = {
  title: '',
  scopeType: 'global',
  scopeValue: '',
  placement: 'both',
  afterNth: 0,
  repeatEvery: 0,
  repeatCount: 0,
  enabled: true,
  background: { mode: 'image', imageUrl: '', color: '', overlay: 0 },
};

export default function SpotlightSectionEdit() {
  const { id } = useParams();
  const [model, setModel] = useState(empty);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setModel(await SpotlightApi.getSection(id)); }
      catch (e) { alert(e.message); }
    })();
  }, [id]);

  const change = (patch) => setModel(prev => ({ ...prev, ...patch }));
  const bgChange = (patch) => setModel(prev => ({ ...prev, background: { ...prev.background, ...patch } }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...model,
        afterNth: Number(model.afterNth) || 0,
        repeatEvery: Number(model.repeatEvery) || 0,
        repeatCount: Number(model.repeatCount) || 0,
        background: {
          ...model.background,
          overlay: Number(model.background?.overlay) || 0,
        },
      };
      if (id) await SpotlightApi.updateSection(id, payload);
      else await SpotlightApi.createSection(payload);
      navigate('/spotlights/sections');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h2>{id ? 'Edit' : 'New'} Spotlight Section</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-2">
          <label>Title</label>
          <input className="form-control" value={model.title}
                 onChange={e => change({ title: e.target.value })} required />
        </div>

        <div className="row mb-2">
          <div className="col">
            <label>Scope Type</label>
            <select className="form-select" value={model.scopeType}
                    onChange={e => change({ scopeType: e.target.value })}>
              <option value="global">Global</option>
              <option value="category">Category</option>
              <option value="state">State</option>
              <option value="city">City</option>
            </select>
          </div>
          <div className="col">
            <label>Scope Value</label>
            <input className="form-control" value={model.scopeValue}
                   onChange={e => change({ scopeValue: e.target.value })} placeholder="e.g., Punjab" />
          </div>
          <div className="col">
            <label>Placement</label>
            <select className="form-select" value={model.placement}
                    onChange={e => change({ placement: e.target.value })}>
              <option value="scroll">scroll</option>
              <option value="swipe">swipe</option>
              <option value="both">both</option>
            </select>
          </div>
        </div>

        <div className="row mb-2">
          <div className="col">
            <label>After Nth</label>
            <input type="number" className="form-control" value={model.afterNth}
                   onChange={e => change({ afterNth: e.target.value })} />
          </div>
          <div className="col">
            <label>Repeat Every</label>
            <input type="number" className="form-control" value={model.repeatEvery}
                   onChange={e => change({ repeatEvery: e.target.value })} />
          </div>
          <div className="col">
            <label>Repeat Count</label>
            <input type="number" className="form-control" value={model.repeatCount}
                   onChange={e => change({ repeatCount: e.target.value })} />
          </div>
        </div>

        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" id="enabled"
                 checked={!!model.enabled} onChange={e => change({ enabled: e.target.checked })} />
          <label className="form-check-label" htmlFor="enabled">Enabled</label>
        </div>

        <fieldset className="mb-3">
          <legend>Background</legend>
          <div className="row">
            <div className="col">
              <label>Mode</label>
              <select className="form-select" value={model.background?.mode || 'image'}
                      onChange={e => bgChange({ mode: e.target.value })}>
                <option value="image">Image</option>
                <option value="color">Color</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="col">
              <label>Image URL</label>
              <input className="form-control" value={model.background?.imageUrl || ''}
                     onChange={e => bgChange({ imageUrl: e.target.value })} />
            </div>
            <div className="col">
              <label>Color</label>
              <input className="form-control" value={model.background?.color || ''}
                     onChange={e => bgChange({ color: e.target.value })} />
            </div>
            <div className="col">
              <label>Overlay (0–100)</label>
              <input type="number" className="form-control" value={model.background?.overlay || 0}
                     onChange={e => bgChange({ overlay: e.target.value })} />
            </div>
          </div>
        </fieldset>

        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
