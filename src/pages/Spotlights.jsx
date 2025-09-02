// src/pages/Spotlights.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SpotlightApi from '../services/spotlightApi';

export default function Spotlights() {
  const [params] = useSearchParams();
  const sectionId = params.get('sectionId');
  const [rows, setRows] = useState([]);
  const [sections, setSections] = useState([]);

  const query = useMemo(() => (sectionId ? { sectionId } : {}), [sectionId]);

  const refresh = async () => {
    try {
      const [es, ss] = await Promise.all([
        SpotlightApi.listEntries(query),
        SpotlightApi.listSections(),
      ]);
      setRows(es);
      setSections(ss);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => { refresh(); }, [sectionId]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await SpotlightApi.deleteEntry(id);
    refresh();
  };

  const name = id => sections.find(s => s._id === id)?.title || '—';

  return (
    <div className="container">
      <h2>Spotlight Entries</h2>
      <div style={{ marginBottom: 12 }}>
        <Link className="btn btn-primary" to={`/spotlights/new${sectionId ? `?sectionId=${sectionId}` : ''}`}>
          + New Entry
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Section</th><th>Title</th><th>Enabled</th><th>Updated</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{name(r.sectionId)}</td>
              <td>{r.title}</td>
              <td>{r.enabled ? 'Yes' : 'No'}</td>
              <td>{new Date(r.updatedAt).toLocaleString()}</td>
              <td>
                <Link to={`/spotlights/${r._id}`} className="btn btn-sm btn-outline-secondary">Edit</Link>{' '}
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
