// ad-admin-panel/src/pages/SpotlightSectionEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SpotlightApi } from '../services/spotlightApi';

const empty = {
  title: 'Spotlight',
  sectionType: 'category',
  sectionValue: 'Top',
  placement: 'both',
  afterNth: 5,
  repeatEvery: 0,
  repeatCount: 0,
  enabled: true,
  background: {
    kind: 'gradient',
    imageUrl: '',
    overlayColor: '#000000',
    overlayOpacity: 0,
    gradient: { colors: ['#7A0000', '#E00000'], orientation: 'vertical' },
  },
};

export default function SpotlightSectionEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [model, setModel] = useState(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
      const data = await SpotlightApi.getSection(id);
      if (!data.background) data.background = empty.background;
      setModel(data); setLoading(false);
    })();
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    if (id) await SpotlightApi.updateSection(id, model);
    else await SpotlightApi.createSection(model);
    nav('/spotlights/sections');
  };

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

  if (loading) return <div>Loading…</div>;

  const bg = model.background || empty.background;

  return (
    <div className="page">
      <h2>{id ? 'Edit Spotlight Section' : 'New Spotlight Section'}</h2>

      <form onSubmit={save} className="form">
        <div className="row">
          <label>Title</label>
          <input value={model.title} onChange={e => on('title', e.target.value)} />
        </div>

        <div className="row">
          <label>Scope</label>
          <select value={model.sectionType} onChange={e => on('sectionType', e.target.value)}>
            <option value="category">Category</option>
            <option value="state">State</option>
            <option value="city">City</option>
          </select>
          <input
            placeholder="e.g. Top / Delhi / Jalandhar"
            value={model.sectionValue}
            onChange={e => on('sectionValue', e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </div>

        <div className="row">
          <label>Placement</label>
          <select value={model.placement} onChange={e => on('placement', e.target.value)}>
            <option value="both">Both (scroll + swipe)</option>
            <option value="scroll">Scroll only</option>
            <option value="swipe">Swipe only</option>
          </select>

          <label style={{ marginLeft: 16 }}>After Nth</label>
          <input type="number" min="1" value={model.afterNth} onChange={e => on('afterNth', +e.target.value)} style={{ width: 90 }} />

          <label style={{ marginLeft: 12 }}>Repeat Every</label>
          <input type="number" min="0" value={model.repeatEvery} onChange={e => on('repeatEvery', +e.target.value)} style={{ width: 90 }} />

          <label style={{ marginLeft: 12 }}>Repeat Count</label>
          <input type="number" min="0" value={model.repeatCount} onChange={e => on('repeatCount', +e.target.value)} style={{ width: 90 }} />
        </div>

        <div className="row">
          <label>Enabled</label>
          <input type="checkbox" checked={model.enabled} onChange={e => on('enabled', e.target.checked)} />
        </div>

        <fieldset style={{ marginTop: 16 }}>
          <legend>Background</legend>

          <div className="row">
            <label>Mode</label>
            <select value={bg.kind} onChange={e => on('background.kind', e.target.value)}>
              <option value="gradient">Gradient</option>
              <option value="image">Image (Cloudinary)</option>
            </select>
          </div>

          {bg.kind === 'image' ? (
            <div className="row">
              <label>Image URL</label>
              <input
                placeholder="https://res.cloudinary.com/…"
                value={bg.imageUrl || ''}
                onChange={e => on('background.imageUrl', e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="row">
                <label>Gradient Colors</label>
                <input type="color" value={bg.gradient.colors?.[0] || '#7A0000'}
                  onChange={e => on('background.gradient.colors', [e.target.value, bg.gradient.colors?.[1] || '#E00000'])}/>
                <input type="color" value={bg.gradient.colors?.[1] || '#E00000'} style={{ marginLeft: 8 }}
                  onChange={e => on('background.gradient.colors', [bg.gradient.colors?.[0] || '#7A0000', e.target.value])}/>
                <select value={bg.gradient.orientation}
                  onChange={e => on('background.gradient.orientation', e.target.value)}
                  style={{ marginLeft: 12 }}>
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              </div>
            </>
          )}

          <div className="row">
            <label>Overlay</label>
            <input type="color" value={bg.overlayColor || '#000000'} onChange={e => on('background.overlayColor', e.target.value)} />
            <input type="number" min="0" max="1" step="0.05"
              value={bg.overlayOpacity ?? 0}
              onChange={e => on('background.overlayOpacity', parseFloat(e.target.value))}
              style={{ width: 90, marginLeft: 8 }}
            />
          </div>
        </fieldset>

        <div className="row">
          <button type="submit" className="primary">Save</button>
        </div>
      </form>
    </div>
  );
}
