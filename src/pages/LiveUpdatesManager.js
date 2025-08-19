// ad-admin-panel/src/pages/LiveUpdatesManager.js
import React, { useEffect, useMemo, useState } from 'react';

const API = process.env.REACT_APP_API_BASE || ''; // e.g. "http://localhost:3001"

// ---------- Helpers for FormData ----------
async function uploadFormData(url, data) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) formData.append(key, val);
  }
  const res = await fetch(url, { method: 'POST', body: formData });
  return res.json();
}

async function patchFormData(url, data) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) formData.append(key, val);
  }
  const res = await fetch(url, { method: 'PATCH', body: formData });
  return res.json();
}

// ---------- SSE Hook ----------
function useSSE(onEvent) {
  useEffect(() => {
    const es = new EventSource(`${API}/api/live/stream`);
    es.onmessage = () => {};
    es.addEventListener('topic_created', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('topic_updated', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('topic_deleted', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('entry_created', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('entry_updated', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('entry_deleted', e => onEvent(JSON.parse(e.data)));
    es.addEventListener('banner_updated', e => onEvent(JSON.parse(e.data)));
    return () => es.close();
    // eslint-disable-next-line
  }, []);
}

// ---------- Main Component ----------
export default function LiveUpdatesManager() {
  const [tab, setTab] = useState('topics');

  const [topics, setTopics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [topicIdFilter, setTopicIdFilter] = useState('');
  const [banner, setBanner] = useState(null);

  // Entry form state
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [summary, setSummary] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [ordinal, setOrdinal] = useState(0);
  const [media, setMedia] = useState(null);

  const refresh = async () => {
    const [t, b] = await Promise.all([
      fetch(`${API}/api/live/topics`).then(r => r.json()),
      fetch(`${API}/api/live/banner`).then(r => r.json()),
    ]);
    setTopics(t);
    setBanner(b);
    if (topicIdFilter) {
      const es = await fetch(`${API}/api/live/entries?topicId=${topicIdFilter}`).then(r => r.json());
      setEntries(es);
    }
  };

  useEffect(() => { refresh(); }, []); // initial
  useEffect(() => {
    if (topicIdFilter)
      fetch(`${API}/api/live/entries?topicId=${topicIdFilter}`).then(r => r.json()).then(setEntries);
  }, [topicIdFilter]);

  useSSE(() => refresh());

  // ---------- Topic Helpers ----------
  async function addTopic() {
    const title = prompt('Topic title');
    if (!title) return;
    await fetch(`${API}/api/live/topics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    refresh();
  }
  async function toggleTopic(t) {
    await fetch(`${API}/api/live/topics/${t._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive })
    });
    refresh();
  }
  async function renameTopic(t) {
    const title = prompt('New title', t.title);
    if (!title) return;
    await fetch(`${API}/api/live/topics/${t._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    refresh();
  }
  async function deleteTopic(t) {
    if (!window.confirm('Delete topic and its entries?')) return;
    await fetch(`${API}/api/live/topics/${t._id}`, { method: 'DELETE' });
    if (topicIdFilter === t._id) setTopicIdFilter('');
    refresh();
  }

  // ---------- Entry Helpers ----------
  function openForm(entry = null) {
    if (!topicIdFilter) { alert('Choose a topic first'); return; }
    setEditingEntry(entry);
    setSummary(entry?.summary || '');
    setLinkUrl(entry?.linkUrl || '');
    setSourceName(entry?.sourceName || '');
    setOrdinal(entry?.ordinal || 0);
    setMedia(null);
    setShowForm(true);
  }

  async function submitEntry() {
    if (!summary) { alert("Summary required"); return; }

    const data = {
      topicId: topicIdFilter,
      summary,
      linkUrl: linkUrl?.startsWith('http') ? linkUrl : `https://${linkUrl}`,
      sourceName,
      ordinal,
      media,
    };

    if (editingEntry) {
      await patchFormData(`${API}/api/live/entries/${editingEntry._id}`, data);
    } else {
      await uploadFormData(`${API}/api/live/entries`, data);
    }
    setShowForm(false);
    setEditingEntry(null);
    refresh();
  }

  async function deleteEntry(e) {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`${API}/api/live/entries/${e._id}`, { method: 'DELETE' });
    refresh();
  }

  // ---------- Banner Helpers ----------
  async function saveBanner(next) {
    await patchFormData(`${API}/api/live/banner`, next);
    refresh();
  }

  const selectedTopic = useMemo(() => topics.find(t => t._id === topicIdFilter), [topics, topicIdFilter]);

  // ---------- Render ----------
  return (
    <div style={{ padding: 20 }}>
      <h1>Live Updates</h1>

      <div style={{ margin: '16px 0' }}>
        <button onClick={() => setTab('topics')} disabled={tab==='topics'}>Topics</button>{' '}
        <button onClick={() => setTab('entries')} disabled={tab==='entries'}>Entries</button>{' '}
        <button onClick={() => setTab('banner')} disabled={tab==='banner'}>Banner</button>
      </div>

      {/* --- Topics Tab --- */}
      {tab === 'topics' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <button onClick={addTopic}>+ Add Topic</button>
          </div>
          <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Title</th><th>Active</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {topics.map(t => (
                <tr key={t._id}>
                  <td>{t.title}</td>
                  <td><input type="checkbox" checked={!!t.isActive} onChange={() => toggleTopic(t)} /></td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => renameTopic(t)}>Rename</button>{' '}
                    <button onClick={() => deleteTopic(t)}>Delete</button>{' '}
                    <button onClick={() => { setTab('entries'); setTopicIdFilter(t._id); }}>Open Entries</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* --- Entries Tab --- */}
      {tab === 'entries' && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <label>
              Topic:{' '}
              <select value={topicIdFilter} onChange={e => setTopicIdFilter(e.target.value)}>
                <option value="">-- choose --</option>
                {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </label>
            <button onClick={() => openForm()} disabled={!topicIdFilter}>+ Add Entry</button>
            {selectedTopic && <span style={{ opacity: 0.7 }}>({selectedTopic.title})</span>}
          </div>

          {showForm && (
            <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
              <h3>{editingEntry ? 'Edit Entry' : 'Add Entry'}</h3>
              <input
                type="text"
                placeholder="Summary (1–280 chars)"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                style={{ display: 'block', marginBottom: 8, width: '100%' }}
              />
              <input
                type="text"
                placeholder="Article Link (https://…)"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                style={{ display: 'block', marginBottom: 8, width: '100%' }}
              />
              <input
                type="text"
                placeholder="Source Name"
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                style={{ display: 'block', marginBottom: 8, width: '100%' }}
              />
              <input
                type="number"
                placeholder="Ordinal"
                value={ordinal}
                onChange={e => setOrdinal(e.target.value)}
                style={{ display: 'block', marginBottom: 8, width: '100%' }}
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={e => setMedia(e.target.files[0])}
                style={{ display: 'block', marginBottom: 8 }}
              />
              <button onClick={submitEntry}>Save</button>{' '}
              <button onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          )}

          <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Summary</th><th>Source</th><th>Link</th><th>Media</th><th>Ordinal</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id}>
                  <td style={{ maxWidth: 420 }}>{e.summary}</td>
                  <td>{e.sourceName || '-'}</td>
                  <td><a href={e.linkUrl} target="_blank" rel="noreferrer">Open</a></td>
                  <td>
                    {e.imageUrl
                      ? <img src={e.imageUrl} alt="" style={{ width: 56, height: 36, objectFit: 'cover' }}/>
                      : '-'}
                  </td>
                  <td>{e.ordinal}</td>
                  <td>{new Date(e.updatedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => openForm(e)}>Edit</button>{' '}
                    <button onClick={() => deleteEntry(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* --- Banner Tab --- */}
      {tab === 'banner' && (
        <>
          <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
            <label>Headline
              <input
                type="text"
                defaultValue={banner?.headline || 'Live Updates'}
                onBlur={e => saveBanner({ headline: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>Upload Media (image/video)
              <input
                type="file"
                accept="image/*,video/*"
                onChange={async e => {
                  const file = e.target.files[0];
                  if (file) {
                    await patchFormData(`${API}/api/live/banner`, { media: file });
                    refresh();
                  }
                }}
              />
            </label>
            <label>Media Type
              <select defaultValue={banner?.mediaType || 'image'} onChange={e => saveBanner({ mediaType: e.target.value })}>
                <option value="image">image</option>
                <option value="video">video</option>
              </select>
            </label>
            <label>Insert After Nth Card
              <input
                type="number"
                min="0"
                defaultValue={banner?.insertAfterNthCard ?? 5}
                onBlur={e => saveBanner({ insertAfterNthCard: Number(e.target.value || 0) })}
              />
            </label>
            <label>Target Topic
              <select defaultValue={banner?.targetTopicId || ''} onChange={e => saveBanner({ targetTopicId: e.target.value || null })}>
                <option value="">-- none --</option>
                {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </label>
            <label>
              <input type="checkbox" defaultChecked={!!banner?.isEnabled} onChange={e => saveBanner({ isEnabled: e.target.checked })}/>
              {' '}Enabled
            </label>
          </div>
          {banner?.mediaUrl && (
            <div style={{ marginTop: 16 }}>
              <div style={{ width: '100%', maxWidth: 800, aspectRatio: '16 / 4', border: '1px dashed #aaa', overflow: 'hidden' }}>
                {banner.mediaType === 'video'
                  ? <video src={banner.mediaUrl} style={{ width: '100%' }} controls/>
                  : <img src={banner.mediaUrl} alt="" style={{ width: '100%', objectFit: 'cover' }}/>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
