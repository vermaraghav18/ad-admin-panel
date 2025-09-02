// src/pages/SpotlightSections.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SpotlightApi from '../services/spotlightApi';

export default function SpotlightSections() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await SpotlightApi.listSections());
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    await SpotlightApi.deleteSection(id);
    refresh();
  };

  return (
    <div className="container">
      <h2>Spotlight Sections</h2>
      <div style={{ marginBottom: 12 }}>
        <Link className="btn btn-primary" to="/spotlights/sections/new">+ New Section</Link>
      </div>
      {loading ? <p>Loading…</p> : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th><th>Scope</th><th>Placement</th>
              <th>After</th><th>Every</th><th>Count</th><th>Enabled</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s._id}>
                <td>{s.title}</td>
                <td>{s.scopeType}{s.scopeValue ? `:${s.scopeValue}` : ''}</td>
                <td>{s.placement}</td>
                <td>{s.afterNth}</td>
                <td>{s.repeatEvery}</td>
                <td>{s.repeatCount}</td>
                <td>{s.enabled ? 'Yes' : 'No'}</td>
                <td>
                  <Link to={`/spotlights/sections/${s._id}`} className="btn btn-sm btn-outline-secondary">Edit</Link>{' '}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(s._id)}>Delete</button>{' '}
                  <Link to={`/spotlights?sectionId=${s._id}`} className="btn btn-sm btn-outline-primary">Entries</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
