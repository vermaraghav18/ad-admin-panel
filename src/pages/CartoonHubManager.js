// ad-admin-panel/src/pages/CartoonHubManager.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');
const api = axios.create({ baseURL: API_BASE });

const by = (k) => (a, b) => ((a?.[k] ?? 0) - (b?.[k] ?? 0));
const pretty = (v) => JSON.stringify(v, null, 2);

export default function CartoonHubManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Create/Edit Section form
  const [name, setName]                 = useState('');
  const [heading, setHeading]           = useState('');
  const [placementIndex, setPlacement]  = useState(5);
  const [repeatEvery, setRepeatEvery]   = useState(0);
  const [sortIndex, setSortIndex]       = useState(0);
  const [enabled, setEnabled]           = useState(true);

  // Entry form (always multipart; if no file, it can carry imageUrl as a text field)
  const [imageUrl, setImageUrl] = useState('');
  const [media, setMedia]       = useState(null);
  const [caption, setCaption]   = useState('');
  const [entSort, setEntSort]   = useState(0);
  const [entEnabled, setEntEnabled] = useState(true);

  const selectedSection = useMemo(
    () => sections.find((s) => s._id === selectedId) || null,
    [sections, selectedId]
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/cartoon-hub');
      const arr = Array.isArray(res.data) ? res.data : [];
      setSections(arr);
      if (!selectedId && arr.length) setSelectedId(arr[0]._id);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetSectionForm() {
    setEditingId(null);
    setName(''); setHeading('');
    setPlacement(5); setRepeatEvery(0);
    setSortIndex(0); setEnabled(true);
  }

  async function saveSection(e) {
    e.preventDefault();
    if (!name.trim() || !heading.trim() || !placementIndex) {
      alert('Please fill name, heading, placementIndex.');
      return;
    }
    try {
      const body = {
        name: name.trim(),
        heading: heading.trim(),
        placementIndex: Number(placementIndex),
        repeatEvery: Number(repeatEvery) || 0,
        sortIndex: Number(sortIndex) || 0,
        enabled: !!enabled,
      };
      if (editingId) {
        await api.patch(`/api/cartoon-hub/sections/${editingId}`, body);
      } else {
        await api.post('/api/cartoon-hub/sections', body);
      }
      resetSectionForm();
      load();
    } catch (err) {
      alert('Save failed. Check console.');
      console.error(err);
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Delete this cartoon section (and all its images)?')) return;
    try {
      await api.delete(`/api/cartoon-hub/sections/${id}`);
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (err) {
      alert('Delete failed'); console.error(err);
    }
  }

  function beginEditSection(s) {
    setEditingId(s._id);
    setName(s.name || '');
    setHeading(s.heading || '');
    setPlacement(s.placementIndex ?? 1);
    setRepeatEvery(s.repeatEvery ?? 0);
    setSortIndex(s.sortIndex ?? 0);
    setEnabled(!!s.enabled);
  }

  function resetEntryForm() {
    setImageUrl('');
    setMedia(null);
    setCaption('');
    setEntSort(0);
    setEntEnabled(true);
  }

  async function addEntry(e) {
    e.preventDefault();
    if (!selectedId) return alert('Select a section first.');
    if (!media && !imageUrl.trim()) {
      return alert('Provide an image file or paste an image URL.');
    }

    try {
      const fd = new FormData();
      if (media) fd.append('media', media); // field name MUST be "media"
      if (imageUrl.trim()) fd.append('imageUrl', imageUrl.trim());
      if (caption.trim()) fd.append('caption', caption.trim());
      fd.append('sortIndex', String(Number(entSort) || 0));
      fd.append('enabled', String(!!entEnabled));

      await api.post(`/api/cartoon-hub/sections/${selectedId}/entries`, fd);
      resetEntryForm();
      load();
    } catch (err) {
      alert('Add entry failed'); console.error(err);
    }
  }

  async function toggleEntry(eid, current) {
    try {
      await api.patch(`/api/cartoon-hub/entries/${eid}`, { enabled: !current });
      load();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  }

  async function deleteEntry(eid) {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/api/cartoon-hub/entries/${eid}`);
      load();
    } catch (err) {
      alert('Delete failed'); console.error(err);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-3">🎨 Cartoon Hub</h2>
      <p className="text-sm opacity-80 mb-4">
        Manage horizontally swipable cartoon image strips. Paste a Cloudinary URL or upload an image.
        Set <b>placementIndex</b> (insert after N-th news card) and optional <b>repeatEvery</b> (0 = don’t repeat).
      </p>

      {error && <div className="p-2 bg-red-900/40 border border-red-700 rounded mb-3">Error: {error}</div>}

      {/* Section form */}
      <form onSubmit={saveSection} className="bg-gray-900 rounded p-3 mb-5 flex flex-wrap gap-2 items-center">
        <input className="p-2 bg-gray-800 rounded" placeholder="Name (slug)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="p-2 bg-gray-800 rounded" placeholder="Heading (display)" value={heading} onChange={(e) => setHeading(e.target.value)} />
        <input className="p-2 bg-gray-800 rounded" type="number" min={1} placeholder="Placement Index" value={placementIndex} onChange={(e) => setPlacement(e.target.value)} />
        <input className="p-2 bg-gray-800 rounded" type="number" min={0} placeholder="Repeat Every (0=off)" value={repeatEvery} onChange={(e) => setRepeatEvery(e.target.value)} />
        <input className="p-2 bg-gray-800 rounded" type="number" placeholder="Sort Index" value={sortIndex} onChange={(e) => setSortIndex(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>Enabled</span>
        </label>
        <button className="bg-blue-600 px-4 py-2 rounded">{editingId ? 'Update Section' : 'Create Section'}</button>
        {editingId && (
          <button type="button" className="bg-gray-700 px-3 py-2 rounded" onClick={resetSectionForm}>
            Cancel
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sections list */}
        <div className="md:col-span-1 bg-gray-900 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Sections</h3>
            {loading && <span className="text-xs opacity-70">Loading…</span>}
          </div>
          <div className="space-y-2">
            {[...sections].sort(by('placementIndex')).map((s) => (
              <div key={s._id} className={`p-2 rounded cursor-pointer ${selectedId === s._id ? 'bg-gray-700' : 'bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div onClick={() => setSelectedId(s._id)}>
                    <div className="font-semibold">{s.heading} <span className="opacity-60 text-xs">({s.name})</span></div>
                    <div className="text-xs opacity-70">
                      after <b>{s.placementIndex}</b>{s.repeatEvery ? ` • repeat every ${s.repeatEvery}` : ''} • sort {s.sortIndex} • {s.enabled ? 'enabled' : 'disabled'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs bg-indigo-600 rounded px-2 py-1" onClick={() => beginEditSection(s)}>Edit</button>
                    <button className="text-xs bg-red-600 rounded px-2 py-1" onClick={() => deleteSection(s._id)}>Delete</button>
                  </div>
                </div>

                {/* tiny horizontal preview strip */}
                <div className="mt-2 overflow-x-auto">
                  <div className="flex gap-2">
                    {(s.entries || []).map((e) => (
                      <img
                        key={e._id}
                        src={e.imageUrl}
                        alt=""
                        className="rounded"
                        style={{ width: 84, height: 84, objectFit: 'cover' }}
                        onError={(ev) => (ev.currentTarget.style.visibility = 'hidden')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {sections.length === 0 && <div className="text-sm opacity-70">No sections yet.</div>}
          </div>
        </div>

        {/* Entries for selected section */}
        <div className="md:col-span-2 bg-gray-900 rounded p-3">
          <h3 className="font-semibold mb-2">Images {selectedSection ? `for “${selectedSection.heading}”` : ''}</h3>

          {/* Add entry form */}
          <form onSubmit={addEntry} className="bg-gray-800 rounded p-3 flex flex-wrap gap-2 items-center">
            <input type="file" accept="image/*" className="p-2 bg-gray-700 rounded" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
            <input className="p-2 bg-gray-700 rounded" placeholder="…or paste Cloudinary URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <input className="p-2 bg-gray-700 rounded w-48" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <input className="p-2 bg-gray-700 rounded w-32" type="number" placeholder="Sort Index" value={entSort} onChange={(e) => setEntSort(e.target.value)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={entEnabled} onChange={(e) => setEntEnabled(e.target.checked)} />
              Enabled
            </label>
            <button className="bg-blue-600 px-4 py-2 rounded" disabled={!selectedId}>Add Image</button>
          </form>

          {/* Entries grid */}
          {!selectedSection ? (
            <div className="text-sm opacity-70 mt-2">Select a section to manage images.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
              {[...(selectedSection.entries || [])].sort(by('sortIndex')).map((e) => (
                <div key={e._id} className="bg-black rounded p-2">
                  <img
                    src={e.imageUrl}
                    alt={e.caption || ''}
                    className="rounded w-full aspect-video object-cover"
                    onError={(ev) => (ev.currentTarget.style.display = 'none')}
                  />
                  {e.caption ? (
                    <div className="mt-2 text-sm line-clamp-2">{e.caption}</div>
                  ) : null}
                  <div className="text-xs opacity-70 mt-1">sort {e.sortIndex} • {e.enabled ? 'enabled' : 'disabled'}</div>
                  <div className="flex items-center justify-between mt-2">
                    <button className="text-xs bg-yellow-600 rounded px-2 py-1" onClick={() => toggleEntry(e._id, e.enabled)}>
                      {e.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="text-xs bg-red-600 rounded px-2 py-1" onClick={() => deleteEntry(e._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {(selectedSection.entries || []).length === 0 && (
                <div className="text-sm opacity-70">No images yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Debug */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs opacity-70">Debug payload</summary>
        <pre className="text-xs bg-gray-950 p-2 rounded overflow-auto">{pretty(sections)}</pre>
      </details>
    </div>
  );
}
