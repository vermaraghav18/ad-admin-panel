// ad-admin-panel/src/pages/SpotlightSections.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpotlightApi } from '../services/spotlightApi';

export default function SpotlightSections() {
  const [rows, setRows] = useState([]);

  const load = async () => setRows(await SpotlightApi.listSections());
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm('Delete this section (and its entries)?')) return;
    await SpotlightApi.deleteSection(id);
    load();
  };

  return (
    <div className="page">
      <h2>Spotlight Sections</h2>
      <p><Link to="/spotlights/sections/new">+ New Section</Link></p>
      <table className="tbl">
        <thead>
          <tr>
            <th>Title</th>
            <th>Scope</th>
            <th>Placement</th>
            <th>After/Every/Count</th>
            <th>BG</th>
            <th>Enabled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{r.title}</td>
              <td>{r.sectionType}:{r.sectionValue}</td>
              <td>{r.placement}</td>
              <td>{r.afterNth}/{r.repeatEvery}/{r.repeatCount}</td>
              <td>{r.background?.kind === 'image' ? 'Image' : 'Gradient'}</td>
              <td>{r.enabled ? 'Yes' : 'No'}</td>
              <td>
                <Link to={`/spotlights/sections/${r._id}`}>Edit</Link>{' '}
                <Link to={`/spotlights/entries?sectionId=${r._id}`}>Entries</Link>{' '}
                <button className="danger" onClick={() => del(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="7">No sections yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
