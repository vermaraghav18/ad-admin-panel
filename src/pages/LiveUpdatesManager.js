// ad-admin-panel/src/pages/LiveUpdatesManager.js
import React, { useEffect, useMemo, useState } from 'react';

const API = process.env.REACT_APP_API_BASE || ''; // e.g. "http://localhost:3001"

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

export default function LiveUpdatesManager() {
  const [tab, setTab] = useState('topics');

  const [topics, setTopics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [topicIdFilter, setTopicIdFilter] = useState('');
  const [banner, setBanner] = useState(null);

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
  useEffect(() => { if (topicIdFilter) fetch(`${API}/api/live/entries?topicId=${topicIdFilter}`).then(r => r.json()).then(setEntries); }, [topicIdFilter]);

  useSSE(() => refresh());

  // ---------- Forms helpers ----------
  async function addTopic() {
    const title = prompt('Topic title');
    if (!title) return;
    await fetch(`${API}/api/live/topics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    refresh();
  }
  async function toggleTopic(t) {
    await fetch(`${API}/api/live/topics/${t._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !t.isActive }) });
    refresh();
  }
  async function renameTopic(t) {
    const title = prompt('New title', t.title);
    if (!title) return;
    await fetch(`${API}/api/live/topics/${t._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    refresh();
  }
  async function deleteTopic(t) {
    if (!window.confirm('Delete topic and its entries?')) return;
    await fetch(`${API}/api/live/topics/${t._id}`, { method: 'DELETE' });
    if (topicIdFilter === t._id) setTopicIdFilter('');
    refresh();
  }

  async function addEntry() {
    if (!topicIdFilter) { alert('Choose a topic first'); return; }
    const summary = prompt('Summary (1–280 chars)');
    if (!summary) return;
    let linkUrl = prompt('Article link (http/https)');
    if (!/^https?:\/\//i.test(linkUrl || '')) linkUrl = `https://${linkUrl}`;
    const sourceName = prompt('Source (optional)') || '';
    const imageUrl = prompt('Image URL (optional)') || '';
    const ordinal = Number(prompt('Ordinal (0..n, optional)', '0')) || 0;

    await fetch(`${API}/api/live/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: topicIdFilter, summary, linkUrl, sourceName, imageUrl, ordinal })
    });
    refresh();
  }
  async function editEntry(e) {
    const summary = prompt('Summary', e.summary) ?? e.summary;
    let linkUrl = prompt('Article link', e.linkUrl) ?? e.linkUrl;
    if (!/^https?:\/\//i.test(linkUrl || '')) linkUrl = `https://${linkUrl}`;
    const sourceName = prompt('Source', e.sourceName || '') ?? e.sourceName;
    const imageUrl = prompt('Image URL', e.imageUrl || '') ?? e.imageUrl;
    const ordinal = Number(prompt('Ordinal', String(e.ordinal))) ?? e.ordinal;

    await fetch(`${API}/api/live/entries/${e._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, linkUrl, sourceName, imageUrl, ordinal })
    });
    refresh();
  }
  async function deleteEntry(e) {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`${API}/api/live/entries/${e._id}`, { method: 'DELETE' });
    refresh();
  }

  async function saveBanner(next) {
    await fetch(`${API}/api/live/banner`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    refresh();
  }

  const selectedTopic = useMemo(() => topics.find(t => t._id === topicIdFilter), [topics, topicIdFilter]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Updates</h1>

      <div style={{ margin: '16px 0' }}>
        <button onClick={() => setTab('topics')} disabled={tab==='topics'}>Topics</button>{' '}
        <button onClick={() => setTab('entries')} disabled={tab==='entries'}>Entries</button>{' '}
        <button onClick={() => setTab('banner')} disabled={tab==='banner'}>Banner</button>
      </div>

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
            <button onClick={addEntry} disabled={!topicIdFilter}>+ Add Entry</button>
            {selectedTopic && <span style={{ opacity: 0.7 }}>({selectedTopic.title})</span>}
          </div>
          <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Summary</th><th>Source</th><th>Link</th><th>Image</th><th>Ordinal</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id}>
                  <td style={{ maxWidth: 420 }}>{e.summary}</td>
                  <td>{e.sourceName || '-'}</td>
                  <td><a href={e.linkUrl} target="_blank" rel="noreferrer">Open</a></td>
                  <td>{e.imageUrl ? <img src={e.imageUrl} alt="" style={{ width: 56, height: 36, objectFit: 'cover' }}/> : '-'}</td>
                  <td>{e.ordinal}</td>
                  <td>{new Date(e.updatedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => editEntry(e)}>Edit</button>{' '}
                    <button onClick={() => deleteEntry(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
            <label>Media URL (image/video)
              <input
                type="text"
                defaultValue={banner?.mediaUrl || ''}
                onBlur={e => saveBanner({ mediaUrl: e.target.value })}
                style={{ width: '100%' }}
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
