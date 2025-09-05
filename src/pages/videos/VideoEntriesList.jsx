// admin/src/pages/videos/VideoEntriesList.jsx
import React, { useEffect, useState } from 'react';
import { listEntries, getSection, deleteEntry } from '../../services/videosApi';
import { useNavigate, useParams } from 'react-router-dom';

export default function VideoEntriesList() {
  const { id: sectionId } = useParams();
  const nav = useNavigate();
  const [section, setSection] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await getSection(sectionId);
      setSection(s?.section || null);
      const list = await listEntries(sectionId);
      setRows(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [sectionId]);

  const onDelete = async (entryId) => {
    if (!window.confirm('Delete this entry?')) return;
    await deleteEntry(entryId);
    refresh();
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2>Video Entries</h2>
          {section && (
            <p style={{opacity:.8}}>
              <b>Section:</b> {section.title} • <b>Scope:</b> {section.scopeType}{section.scopeType!=='global' ? `:${section.scopeValue}`:''} •{' '}
              <b>Injection:</b> after {section.injection?.afterNth}, every {section.injection?.repeatEvery}, x{section.injection?.repeatCount}
            </p>
          )}
        </div>
        <div>
          <button onClick={() => nav(`/admin/videos/sections/${sectionId}/entries/new`)}>+ Add Entry</button>{' '}
          <button onClick={() => nav('/admin/videos/sections')}>Back to Sections</button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No entries yet.</p> : (
        <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th>Poster</th>
              <th>Caption</th>
              <th>Aspect</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Window</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {rows.map(e => (
            <tr key={e._id}>
              <td>{e.posterUrl ? <img src={e.posterUrl} alt="" style={{height:48}}/> : '—'}</td>
              <td>{e.caption || '—'}</td>
              <td>{e.aspect}</td>
              <td>{e.durationSec ?? 0}s</td>
              <td>{e.status}</td>
              <td>{e.publishedAt ? new Date(e.publishedAt).toLocaleString() : '—'} → {e.expiresAt ? new Date(e.expiresAt).toLocaleString() : '—'}</td>
              <td style={{whiteSpace:'nowrap'}}>
                <button onClick={() => nav(`/admin/videos/entries/${e._id}/edit?sectionId=${sectionId}`)}>Edit</button>{' '}
                <button onClick={() => onDelete(e._id)} style={{color:'crimson'}}>Delete</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
