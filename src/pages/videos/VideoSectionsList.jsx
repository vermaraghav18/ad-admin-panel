// admin/src/pages/videos/VideoSectionsList.jsx
import React, { useEffect, useState } from 'react';
import { listSections, deleteSection } from '../../services/videosApi';
import { useNavigate } from 'react-router-dom';

export default function VideoSectionsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listSections();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this section (and its entries)?')) return;
    await deleteSection(id);
    refresh();
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Video Sections</h2>
        <button onClick={() => nav('/admin/videos/sections/new')}>+ New Section</button>
      </div>

      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No sections yet.</p> : (
        <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Scope</th>
              <th>Placement</th>
              <th>Injection</th>
              <th>Sort</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {rows.map(s => (
            <tr key={s._id}>
              <td>{s.title}</td>
              <td>{s.scopeType}{s.scopeType!=='global' ? `:${s.scopeValue}` : ''}</td>
              <td>{s.placement}</td>
              <td>after {s.injection?.afterNth} • every {s.injection?.repeatEvery} • x{s.injection?.repeatCount}</td>
              <td>{s.sortIndex ?? 0}</td>
              <td>{s.enabled ? 'Yes' : 'No'}</td>
              <td style={{whiteSpace:'nowrap'}}>
                <button onClick={() => nav(`/admin/videos/sections/${s._id}/edit`)}>Edit</button>{' '}
                <button onClick={() => nav(`/admin/videos/sections/${s._id}/entries`)}>Entries</button>{' '}
                <button onClick={() => onDelete(s._id)} style={{color:'crimson'}}>Delete</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
