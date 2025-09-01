// src/pages/CartoonHubManager.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');
const api = axios.create({ baseURL: API_BASE });

// Sort helper
const by = (k) => (a, b) => ((a?.[k] ?? 0) - (b?.[k] ?? 0));
const pretty = (v) => JSON.stringify(v, null, 2);

// Audience lists (keep in sync with app)
const CATEGORIES = [
  'Top News', 'World', 'Finance', 'Entertainment', 'Sports',
  'Technology', 'Health', 'Education', 'Politics'
];

const STATES = [
  'Delhi','Punjab','Maharashtra','Tamil Nadu','West Bengal','Karnataka','Uttar Pradesh',
  'Rajasthan','Madhya Pradesh','Himachal Pradesh','Andhra Pradesh','Bihar',
  'Chhattisgarh','Gujarat','Haryana','Kerala','Jharkhand'
];

const CITIES = [
  'Ahmedabad','Bangalore','Bhopal','Chennai','Chandigarh','Delhi','Gurgaon','Hyderabad',
  'Indore','Jaipur','Jalandhar','Kanpur','Kolkata','Lucknow','Mumbai','Patna','Pune',
  'Surat','Vadodara','Visakhapatnam',
];

// API base path for Cartoon Hub on the server
const BASE = '/api/cartoons';

export default function CartoonHubManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Section form
  const [name, setName]                 = useState('');
  const [heading, setHeading]           = useState('');
  const [placementIndex, setPlacement]  = useState(5);
  const [repeatEvery, setRepeatEvery]   = useState(0);
  const [sortIndex, setSortIndex]       = useState(0);
  const [enabled, setEnabled]           = useState(true);

  // Audience
  const [audType, setAudType]     = useState('category'); // category|state|city|any
  const [audValue, setAudValue]   = useState('Top News'); // value depends on type

  // Entry form (create)
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
      const res = await api.get(`${BASE}`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setSections(arr);
      if (!selectedId && arr.length) setSelectedId(arr[0]._id);
    } catch (e) {
      setError(String(e?.response?.data?.error || e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetSectionForm() {
    setEditingId(null);
    setName('');
    setHeading('');
    setPlacement(5);
    setRepeatEvery(0);
    setSortIndex(0);
    setEnabled(true);
    setAudType('category');
    setAudValue('Top News');
  }

  function beginEditSection(s) {
    setEditingId(s._id);
    setName(s.name || '');
    setHeading(s.heading || '');
    setPlacement(s.placementIndex ?? 1);
    setRepeatEvery(s.repeatEvery ?? 0);
    setSortIndex(s.sortIndex ?? 0);
    setEnabled(!!s.enabled);

    // audience: accept both {audienceType, audienceValue} or nested s.audience
    const t = (s.audienceType || s?.audience?.type || 'category').toString();
    const v = (s.audienceValue || s?.audience?.value || (t === 'any' ? '' : 'Top News')).toString();
    setAudType(t);
    setAudValue(v);
  }

  async function saveSection(e) {
    e.preventDefault();
    if (!name.trim() || !heading.trim() || !placementIndex) {
      alert('Please fill name, heading, placementIndex.');
      return;
    }

    // Validate audience value only if not 'any'
    if (audType !== 'any' && !audValue.trim()) {
      return alert('Please choose an audience value for the selected audience type.');
    }

    try {
      const payload = {
        name: name.trim(),
        heading: heading.trim(),
        placementIndex: Math.max(1, Number(placementIndex) || 1),
        repeatEvery: Math.max(0, Number(repeatEvery) || 0),
        sortIndex: Number(sortIndex) || 0,
        enabled: !!enabled,
        audienceType: audType,
        audienceValue: audType === 'any' ? '' : audValue.trim(),
      };

      if (editingId) {
        await api.patch(`${BASE}/sections/${editingId}`, payload);
      } else {
        await api.post(`${BASE}/sections`, payload);
      }

      resetSectionForm();
      load();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed. See console for details.');
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Delete this cartoon section (and all its images)?')) return;
    try {
      await api.delete(`${BASE}/sections/${id}`);
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed.');
    }
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
      return alert('Provide an image file or paste a Cloudinary image URL.');
    }

    try {
      const fd = new FormData();
      if (media) fd.append('media', media); // field MUST be "media"
      if (imageUrl.trim()) fd.append('imageUrl', imageUrl.trim());
      if (caption.trim()) fd.append('caption', caption.trim());
      fd.append('sortIndex', String(Number(entSort) || 0));
      fd.append('enabled', String(!!entEnabled));

      await api.post(`${BASE}/sections/${selectedId}/entries`, fd);
      resetEntryForm();
      load();
    } catch (err) {
      console.error('Add entry failed:', err);
      alert('Add entry failed. See console for details.');
    }
  }

  async function toggleEntry(eid, current) {
    try {
      await api.patch(`${BASE}/entries/${eid}`, { enabled: !current });
      load();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  }

  async function deleteEntry(eid) {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`${BASE}/entries/${eid}`);
      load();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed.');
    }
  }

  // UI helpers
  function AudienceSelector() {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audType"
            checked={audType === 'category'}
            onChange={() => setAudType('category')}
          />
          <span>Category</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audType"
            checked={audType === 'state'}
            onChange={() => setAudType('state')}
          />
          <span>State</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audType"
            checked={audType === 'city'}
            onChange={() => setAudType('city')}
          />
          <span>City</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audType"
            checked={audType === 'any'}
            onChange={() => setAudType('any')}
          />
          <span>Any</span>
        </label>

        {audType !== 'any' && (
          audType === 'category' ? (
            <select
              className="p-2 bg-gray-800 rounded"
              value={audValue}
              onChange={(e) => setAudValue(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : audType === 'state' ? (
            <select
              className="p-2 bg-gray-800 rounded"
              value={audValue}
              onChange={(e) => setAudValue(e.target.value)}
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <select
              className="p-2 bg-gray-800 rounded"
              value={audValue}
              onChange={(e) => setAudValue(e.target.value)}
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )
        )}
      </div>
    );
  }

  function scopeLabel(s) {
    const t = (s.audienceType || s?.audience?.type || 'any').toString();
    const v = (s.audienceValue || s?.audience?.value || '').toString();
    if (t === 'any' || !v) return 'All';
    if (t === 'category') return `Category: ${v}`;
    if (t === 'state') return `State: ${v}`;
    if (t === 'city') return `City: ${v}`;
    return 'All';
    }

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-3">🎭 Cartoon Hub</h2>
      <p className="text-sm opacity-80 mb-4">
        Create a cartoon <b>section</b>, choose its <b>audience</b> (category/state/city/any),
        decide where to show it using <b>placementIndex</b> (after Nth article),
        and optionally <b>repeatEvery</b> (0 = don’t repeat).
        Then add images (via Cloudinary URL or file upload). Users will swipe horizontally through them.
      </p>

      {error && <div className="p-2 bg-red-900/40 border border-red-700 rounded mb-3">Error: {error}</div>}

      {/* Section editor */}
      <form onSubmit={saveSection} className="bg-gray-900 rounded p-3 mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input className="p-2 bg-gray-800 rounded" placeholder="Name (slug)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="p-2 bg-gray-800 rounded" placeholder="Heading (display)" value={heading} onChange={(e) => setHeading(e.target.value)} />
          <input className="p-2 bg-gray-800 rounded" type="number" min={1} placeholder="Placement Index (Nth)" value={placementIndex} onChange={(e) => setPlacement(e.target.value)} />
          <input className="p-2 bg-gray-800 rounded" type="number" min={0} placeholder="Repeat Every (0=off)" value={repeatEvery} onChange={(e) => setRepeatEvery(e.target.value)} />
          <input className="p-2 bg-gray-800 rounded" type="number" placeholder="Sort Index" value={sortIndex} onChange={(e) => setSortIndex(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Enabled</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm opacity-80">Audience (who sees this section?)</div>
          <AudienceSelector />
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-blue-600 px-4 py-2 rounded">{editingId ? 'Update Section' : 'Create Section'}</button>
          {editingId && (
            <button type="button" className="bg-gray-700 px-3 py-2 rounded" onClick={resetSectionForm}>
              Cancel
            </button>
          )}
        </div>
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
                    <div className="font-semibold">
                      {s.heading} <span className="opacity-60 text-xs">({s.name})</span>
                    </div>
                    <div className="text-xs opacity-70">
                      after <b>{s.placementIndex}</b>
                      {s.repeatEvery ? ` • repeat every ${s.repeatEvery}` : ''}
                      {' • '}sort {s.sortIndex}
                      {' • '}{s.enabled ? 'enabled' : 'disabled'}
                    </div>
                    <div className="text-xs opacity-70">scope: {scopeLabel(s)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs bg-indigo-600 rounded px-2 py-1" onClick={() => beginEditSection(s)}>Edit</button>
                    <button className="text-xs bg-red-600 rounded px-2 py-1" onClick={() => deleteSection(s._id)}>Delete</button>
                  </div>
                </div>

                {/* little horizontal preview strip */}
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

          {/* Add entry */}
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
