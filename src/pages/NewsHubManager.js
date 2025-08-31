// ad-admin-panel/src/pages/NewsHubManager.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');
const api = axios.create({ baseURL: API_BASE });

// Small helpers
const toBool = (v) => (typeof v === 'boolean' ? v : String(v ?? '').toLowerCase() === 'true');
const by = (k) => (a, b) => ((a?.[k] ?? 0) - (b?.[k] ?? 0));

export default function NewsHubManager() {
  const [hub, setHub] = useState([]);              // sections + entries
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Section form (create/update)
  const [secIdEditing, setSecIdEditing] = useState(null);
  const [secName, setSecName] = useState('');
  const [secHeading, setSecHeading] = useState('');
  const [secPlacement, setSecPlacement] = useState(8);
  const [secSort, setSecSort] = useState(0);
  const [secEnabled, setSecEnabled] = useState(true);
  // NEW: per-section swipe BG
  const [secBgUrl, setSecBgUrl] = useState('');

  // Entry form (create)
  const [entMedia, setEntMedia] = useState(null);
  const [entTitle, setEntTitle] = useState('');
  const [entDesc, setEntDesc] = useState('');
  const [entUrl, setEntUrl] = useState('');
  const [entSort, setEntSort] = useState(0);
  const [entEnabled, setEntEnabled] = useState(true);

  const selectedSection = useMemo(
    () => hub.find((s) => s._id === selectedId) || null,
    [hub, selectedId]
  );

  const fetchHub = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/news-hub');
      const arr = Array.isArray(res.data) ? res.data : [];
      setHub(arr);
      if (!selectedId && arr.length) setSelectedId(arr[0]._id);
    } catch (err) {
      console.error('❌ Failed to load News Hub:', err);
      alert('Failed to load News Hub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetSectionForm = () => {
    setSecIdEditing(null);
    setSecName('');
    setSecHeading('');
    setSecPlacement(8);
    setSecSort(0);
    setSecEnabled(true);
    setSecBgUrl('');
  };

  const onEditSection = (s) => {
    setSecIdEditing(s._id);
    setSecName(s.name || '');
    setSecHeading(s.heading || '');
    setSecPlacement(s.placementIndex ?? 1);
    setSecSort(s.sortIndex ?? 0);
    setSecEnabled(!!s.enabled);
    setSecBgUrl(s.backgroundImageUrl || '');
  };

  const submitSection = async (e) => {
    e.preventDefault();
    if (!secName || !secHeading || !secPlacement) {
      return alert('Please fill name, heading, and placementIndex.');
    }
    try {
      if (secIdEditing) {
        await api.patch(`/api/news-hub/sections/${secIdEditing}`, {
          name: secName,
          heading: secHeading,
          placementIndex: Number(secPlacement),
          sortIndex: Number(secSort),
          enabled: !!secEnabled,
          backgroundImageUrl: (secBgUrl || '').trim(), // ✅ include BG URL on edit
        });
      } else {
        await api.post('/api/news-hub/sections', {
          name: secName,
          heading: secHeading,
          placementIndex: Number(secPlacement),
          sortIndex: Number(secSort),
          enabled: !!secEnabled,
          backgroundImageUrl: (secBgUrl || '').trim(), // ✅ include BG URL on create
        });
      }
      resetSectionForm();
      fetchHub();
    } catch (err) {
      console.error('❌ Section save failed:', err);
      alert('Section save failed.');
    }
  };

  const deleteSection = async (id) => {
    if (!window.confirm('Delete this section (and all its entries)?')) return;
    try {
      await api.delete(`/api/news-hub/sections/${id}`);
      if (selectedId === id) setSelectedId(null);
      fetchHub();
    } catch (err) {
      console.error('❌ Delete section failed:', err);
      alert('Delete failed.');
    }
  };

  // ✅ Upload/replace swipe BG via file
  const uploadBgFile = async (sectionId, file) => {
    if (!sectionId || !file) return;
    const fd = new FormData();
    fd.append('background', file); // field name MUST be 'background'
    try {
      await api.patch(`/api/news-hub/sections/${sectionId}/background`, fd);
      if (secIdEditing === sectionId) setSecBgUrl(''); // clear URL field if we just uploaded a file
      await fetchHub();
    } catch (err) {
      console.error('❌ BG upload failed:', err);
      alert('Background upload failed.');
    }
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    if (!selectedId) return alert('Select a section first.');
    if (!entMedia || !entTitle || !entDesc) {
      return alert('Please select an image and fill title/description.');
    }
    const formData = new FormData();
    formData.append('media', entMedia); // ✅ field name MUST be 'media'
    formData.append('title', entTitle);
    formData.append('description', entDesc);
    formData.append('targetUrl', entUrl); // server normalizes & requires non-empty
    formData.append('sortIndex', String(entSort));
    formData.append('enabled', String(entEnabled));

    try {
      await api.post(`/api/news-hub/sections/${selectedId}/entries`, formData);
      // clear
      setEntMedia(null);
      setEntTitle('');
      setEntDesc('');
      setEntUrl('');
      setEntSort(0);
      setEntEnabled(true);
      fetchHub();
    } catch (err) {
      console.error('❌ Entry save failed:', err);
      alert('Entry save failed.');
    }
  };

  const toggleEntry = async (entry) => {
    try {
      await api.patch(`/api/news-hub/entries/${entry._id}`, {
        enabled: !toBool(entry.enabled),
      });
      fetchHub();
    } catch (err) {
      console.error('❌ Toggle entry failed:', err);
    }
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/api/news-hub/entries/${entryId}`);
      fetchHub();
    } catch (err) {
      console.error('❌ Delete entry failed:', err);
      alert('Delete entry failed.');
    }
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-3">🧱 News Hub</h2>

      {/* Section Editor */}
      <form onSubmit={submitSection} className="mb-4 flex flex-wrap gap-2 items-center bg-gray-800 p-3 rounded">
        <input className="p-2 bg-gray-700 rounded" placeholder="Section Name" value={secName} onChange={(e) => setSecName(e.target.value)} />
        <input className="p-2 bg-gray-700 rounded" placeholder="Heading shown in app" value={secHeading} onChange={(e) => setSecHeading(e.target.value)} />
        <input className="p-2 bg-gray-700 rounded" type="number" min={1} placeholder="Placement (after Nth news card)" value={secPlacement} onChange={(e) => setSecPlacement(e.target.value)} />
        <input className="p-2 bg-gray-700 rounded" type="number" placeholder="Sort Index" value={secSort} onChange={(e) => setSecSort(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={secEnabled} onChange={(e) => setSecEnabled(e.target.checked)} />
          Enabled
        </label>

        {/* NEW: Swipe BG URL (optional) */}
        <input
          className="p-2 bg-gray-700 rounded w-full md:flex-1"
          placeholder="Swipe BG Image URL (optional)"
          value={secBgUrl}
          onChange={(e) => setSecBgUrl(e.target.value)}
        />
        {secBgUrl ? (
          <img
            src={secBgUrl}
            alt="bg preview"
            className="rounded border border-gray-700"
            style={{ maxWidth: 360, maxHeight: 160 }}
            onError={(ev) => (ev.currentTarget.style.display = 'none')}
          />
        ) : null}

        <button className="bg-blue-500 px-4 py-2 rounded">{secIdEditing ? 'Update Section' : 'Add Section'}</button>
        {secIdEditing && (
          <button type="button" className="bg-gray-600 px-3 py-2 rounded" onClick={resetSectionForm}>
            Cancel
          </button>
        )}
      </form>

      {/* When editing a section, allow uploading/replacing the BG image file */}
      {secIdEditing && (
        <div className="mb-4 bg-gray-800 p-3 rounded flex flex-wrap items-center gap-3">
          <div className="text-sm opacity-80">Upload/Replace Swipe BG for: <b>{secName || secIdEditing}</b></div>
          <input
            type="file"
            accept="image/*"
            className="p-2 bg-gray-700 rounded"
            onChange={(e) => uploadBgFile(secIdEditing, e.target.files?.[0] || null)}
          />
          <div className="text-xs opacity-60">
            Sends <code>PATCH /api/news-hub/sections/{secIdEditing}/background</code> (field <b>background</b>)
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sections list */}
        <div className="md:col-span-1 bg-gray-900 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Sections</h3>
            {loading && <span className="text-xs opacity-70">Loading…</span>}
          </div>
          <div className="space-y-2">
            {[...hub].sort(by('placementIndex')).map((s) => (
              <div
                key={s._id}
                className={`p-2 rounded cursor-pointer ${selectedId === s._id ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div onClick={() => setSelectedId(s._id)} className="flex-1">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs opacity-70">
                      {s.heading} • after <b>{s.placementIndex}</b> • entries: {s.entries?.length || 0}
                    </div>
                    {/* Small BG preview if set */}
                    {s.backgroundImageUrl ? (
                      <img
                        src={s.backgroundImageUrl}
                        alt="bg"
                        className="rounded mt-1"
                        style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'cover' }}
                        onError={(ev) => (ev.currentTarget.style.display = 'none')}
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="text-xs bg-indigo-600 rounded px-2 py-1" onClick={() => onEditSection(s)}>
                      Edit
                    </button>
                    <button className="text-xs bg-red-600 rounded px-2 py-1" onClick={() => deleteSection(s._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hub.length === 0 && <div className="text-sm opacity-70">No sections yet.</div>}
          </div>
        </div>

        {/* Entries for selected section */}
        <div className="md:col-span-2 bg-gray-900 rounded p-3">
          <h3 className="font-semibold mb-2">
            Entries {selectedSection ? `for “${selectedSection.name}”` : ''}
          </h3>

          {/* Add entry */}
          <form onSubmit={submitEntry} className="mb-3 flex flex-wrap gap-2 items-center bg-gray-800 p-3 rounded">
            <input type="file" accept="image/*" onChange={(e) => setEntMedia(e.target.files[0])} className="p-2 bg-gray-700 rounded" />
            <input className="p-2 bg-gray-700 rounded" placeholder="Title" value={entTitle} onChange={(e) => setEntTitle(e.target.value)} />
            <input className="p-2 bg-gray-700 rounded" placeholder="Description" value={entDesc} onChange={(e) => setEntDesc(e.target.value)} />
            <input className="p-2 bg-gray-700 rounded" placeholder="Target URL" value={entUrl} onChange={(e) => setEntUrl(e.target.value)} />
            <input className="p-2 bg-gray-700 rounded" type="number" placeholder="Sort Index" value={entSort} onChange={(e) => setEntSort(e.target.value)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={entEnabled} onChange={(e) => setEntEnabled(e.target.checked)} />
              Enabled
            </label>
            <button className="bg-blue-500 px-4 py-2 rounded" disabled={!selectedId}>Add Entry</button>
          </form>

          {/* Entries grid */}
          {!selectedSection ? (
            <div className="text-sm opacity-70">Select a section to manage entries.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...(selectedSection.entries || [])].sort(by('sortIndex')).map((e) => (
                <div key={e._id} className="bg-black rounded p-2">
                  <img
                    src={e.imageUrl?.startsWith('http') ? e.imageUrl : `${API_BASE}${e.imageUrl}`}
                    alt={e.title}
                    className="rounded w-full aspect-video object-cover"
                  />
                  <div className="mt-2 text-sm font-semibold line-clamp-1">{e.title}</div>
                  <div className="text-xs opacity-80 line-clamp-2">{e.description}</div>
                  <div className="text-xs opacity-70 break-all">{e.targetUrl || '—'}</div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      className="text-xs bg-yellow-600 rounded px-2 py-1"
                      onClick={() => toggleEntry(e)}
                    >
                      {toBool(e.enabled) ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="text-xs bg-red-600 rounded px-2 py-1"
                      onClick={() => deleteEntry(e._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {(selectedSection.entries || []).length === 0 && (
                <div className="text-sm opacity-70">No entries yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
