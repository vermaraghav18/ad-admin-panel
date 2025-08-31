// src/pages/SectionEdit.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listSections, createSection, updateSection } from '../api/sections';

export default function SectionEdit() {
  const nav = useNavigate();
  const { id: routeId } = useParams();              // may be undefined on /sections/new
  const isNew = !routeId || routeId === 'new';      // <-- key fix
  const [state, setState] = useState({
    name: '',
    slug: '',
    order: 999,
    enabled: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return; // nothing to load
    (async () => {
      try {
        setLoading(true);
        const items = await listSections();
        const item = items.find(x => x._id === routeId);
        if (item) {
          setState({
            name: item.name ?? '',
            slug: item.slug ?? '',
            order: item.order ?? 999,
            enabled: !!item.enabled,
          });
        } else {
          setError('Section not found');
        }
      } catch (e) {
        setError('Failed to load section');
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, routeId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...state };
      if (isNew) {
        await createSection(payload);               // <-- POST when creating
      } else {
        await updateSection(routeId, payload);      // <-- PATCH only when id exists
      }
      nav('/sections');
    } catch (e) {
      setError('Failed to save section');
      console.error(e);
      alert(JSON.stringify({ error: 'Failed to save section' }));
    }
  };

  return (
    <div className="p-4">
      <h2>{isNew ? 'New Section' : 'Edit Section'}</h2>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
          <div className="mb-3">
            <label className="form-label"><strong>Name</strong></label>
            <input
              className="form-control"
              value={state.name}
              onChange={e => setState(s => ({ ...s, name: e.target.value }))}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Slug</strong></label>
            <input
              className="form-control"
              value={state.slug}
              onChange={e => setState(s => ({ ...s, slug: e.target.value }))}
              placeholder="auto from name if left blank"
            />
            <div className="form-text">
              Use this slug as the <code>category</code> on the Feeds page.
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Order</strong></label>
            <input
              type="number"
              className="form-control"
              value={state.order}
              onChange={e => setState(s => ({ ...s, order: Number(e.target.value) }))}
            />
          </div>

          <div className="form-check mb-3">
            <input
              id="enabled"
              type="checkbox"
              className="form-check-input"
              checked={state.enabled}
              onChange={e => setState(s => ({ ...s, enabled: e.target.checked }))}
            />
            <label htmlFor="enabled" className="form-check-label">Enabled</label>
          </div>

          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </form>
      )}

      {!isNew && (
        <>
          <hr />
          <div className="mt-3">
            <h4>Attach RSS URLs</h4>
            <p>
              Go to the <strong>Feeds</strong> page and add new rows with{' '}
              <code>category = {state.slug || 'your-section-slug'}</code>. The aggregator already uses this category.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
