import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config/apiBase';

const defaultForm = {
  title: '',
  description: '',
  link: '',

  videoUrl: '',       // required
  posterUrl: '',      // optional
  mime: '',           // e.g. "video/mp4" (optional)

  autoplay: true,
  muted: true,
  loop: true,

  type: 'normal',     // 'normal' | 'fullpage'

  cities: '',
  states: '',         // comma-separated in form; arrays are sent to API

  afterNth: 1,
  repeatEvery: 0,
  repeatCount: 0,

  enabled: true,
};

function joinCSV(arr) {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.join(', ');
  return String(arr || '');
}

function toArrayCSV(value) {
  if (Array.isArray(value)) return value.map(s => String(s || '').trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function api(path, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export default function VideoGeoAdsManager() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('all'); // all|true|false

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // row being edited
  const [form, setForm] = useState(defaultForm);

  const listPath = useMemo(() => {
    const q = filterEnabled === 'all' ? '' : `?enabled=${filterEnabled}`;
    return `/api/video-geo-ads${q}`;
  }, [filterEnabled]);

  async function load() {
    setBusy(true);
    setError('');
    try {
      const data = await api(listPath);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, [listPath]);

  function startCreate() {
    setEditing(null);
    setForm({ ...defaultForm });
    setShowForm(true);
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      ...defaultForm,
      ...item,
      cities: joinCSV(item.cities),
      states: joinCSV(item.states),
    });
    setShowForm(true);
  }

  async function remove(id) {
    if (!id) return;
    if (!window.confirm('Delete this video geo ad?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/video-geo-ads/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    // Basic validation
    if (!form.videoUrl || !form.videoUrl.trim()) {
      setError('Video URL is required');
      return;
    }
    if (!form.link || !form.link.trim()) {
      setError('CTA link is required');
      return;
    }

    const payload = {
      ...form,
      cities: toArrayCSV(form.cities),
      states: toArrayCSV(form.states),
      afterNth: Number(form.afterNth || 1),
      repeatEvery: Number(form.repeatEvery || 0),
      repeatCount: Number(form.repeatCount || 0),
    };

    setBusy(true);
    setError('');
    try {
      if (editing && editing._id) {
        await api(`/api/video-geo-ads/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/video-geo-ads`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...defaultForm });
      await load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h2>Video Geo Ads</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={startCreate}>+ New Video Geo Ad</button>
        <label>Filter:&nbsp;</label>
        <select value={filterEnabled} onChange={e => setFilterEnabled(e.target.value)}>
          <option value="all">All</option>
          <option value="true">Enabled only</option>
          <option value="false">Disabled only</option>
        </select>
        {busy && <span>Loading…</span>}
        {error && <span style={{ color: 'crimson' }}>{error}</span>}
      </div>

      {showForm && (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <h3>{editing ? 'Edit' : 'Create'}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              placeholder="Title (optional)"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="CTA Link (required)"
              value={form.link}
              onChange={e => setForm({ ...form, link: e.target.value })}
            />

            <input
              placeholder="Video URL (MP4 or HLS .m3u8) (required)"
              value={form.videoUrl}
              onChange={e => setForm({ ...form, videoUrl: e.target.value })}
            />
            <input
              placeholder="Poster URL (optional)"
              value={form.posterUrl}
              onChange={e => setForm({ ...form, posterUrl: e.target.value })}
            />
            <input
              placeholder="MIME (e.g. video/mp4)"
              value={form.mime}
              onChange={e => setForm({ ...form, mime: e.target.value })}
            />

            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="fullpage">Full Page</option>
            </select>

            <input
              placeholder="Cities (comma separated)"
              value={form.cities}
              onChange={e => setForm({ ...form, cities: e.target.value })}
            />
            <input
              placeholder="States (comma separated)"
              value={form.states}
              onChange={e => setForm({ ...form, states: e.target.value })}
            />

            <input
              type="number"
              placeholder="afterNth (1..)"
              value={form.afterNth}
              onChange={e => setForm({ ...form, afterNth: e.target.value })}
            />
            <input
              type="number"
              placeholder="repeatEvery (0 = once)"
              value={form.repeatEvery}
              onChange={e => setForm({ ...form, repeatEvery: e.target.value })}
            />
            <input
              type="number"
              placeholder="repeatCount (0 = unlimited)"
              value={form.repeatCount}
              onChange={e => setForm({ ...form, repeatCount: e.target.value })}
            />

            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{ gridColumn: '1 / span 2' }}
            />

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                /> Enabled
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.autoplay}
                  onChange={e => setForm({ ...form, autoplay: e.target.checked })}
                /> Autoplay
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.muted}
                  onChange={e => setForm({ ...form, muted: e.target.checked })}
                /> Muted
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.loop}
                  onChange={e => setForm({ ...form, loop: e.target.checked })}
                /> Loop
              </label>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={busy}>{editing ? 'Update' : 'Create'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm({ ...defaultForm }); }}>
              Cancel
            </button>
            {error && <span style={{ color: 'crimson' }}>{error}</span>}
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Title</th>
            <th>Target</th>
            <th>Placement</th>
            <th>Enabled</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id} style={{ borderTop: '1px solid #eee' }}>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{it.title || '(untitled)'}</strong>
                  <small>video: {it.videoUrl}</small>
                  {it.posterUrl ? <small>poster: {it.posterUrl}</small> : null}
                </div>
              </td>
              <td>
                <small>cities: {(it.cities || []).join(', ') || '—'}</small><br />
                <small>states: {(it.states || []).join(', ') || '—'}</small>
              </td>
              <td>
                <small>afterNth: {it.afterNth}</small><br />
                <small>repeatEvery: {it.repeatEvery}</small><br />
                <small>repeatCount: {it.repeatCount}</small>
              </td>
              <td>{it.enabled ? 'Yes' : 'No'}</td>
              <td><small>{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : '—'}</small></td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(it)}>Edit</button>
                  <button onClick={() => remove(it._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr><td colSpan="6" style={{ padding: 16, textAlign: 'center' }}>No items</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
