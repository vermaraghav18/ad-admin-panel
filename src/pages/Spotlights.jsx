// ad-admin-panel/src/pages/Spotlights.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SpotlightApi } from '../services/spotlightApi';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function Spotlights() {
  const q = useQuery();
  const initialSectionId = q.get('sectionId') || '';
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [rows, setRows] = useState([]);

  const load = async (sid = sectionId) => {
    const s = await SpotlightApi.listSections();
    setSections(s);
    setRows(await SpotlightApi.listEntries(sid ? { sectionId: sid } : {}));

  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(sectionId); }, [sectionId]);

  const del = async (id) => {
    if (!window.confirm('Delete entry?')) return;
    await SpotlightApi.deleteEntry(id);
    load(sectionId);
  };

  return (
    <div className="page">
      <h2>Spotlight Entries</h2>

      <div className="row">
        <label>Section</label>
        <select value={sectionId} onChange={e => setSectionId(e.target.value)}>
          <option value="">(All)</option>
          {sections.map(s => <option key={s._id} value={s._id}>{s.title} — {s.sectionType}:{s.sectionValue}</option>)}
        </select>
        <Link to="/spotlights/entries/new" style={{ marginLeft: 12 }}>+ New Entry</Link>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Title</th>
            <th>Section</th>
            <th>Status</th>
            <th>Order</th>
            <th>Variants</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td>{r.title}</td>
              <td>{sections.find(s => s._id === r.sectionId)?.title || '—'}</td>
              <td>{r.enabled ? 'live' : 'off'}</td>
              <td>{r.order}</td>
              <td>{(r.variants || []).map(v => v.aspect).join(', ') || '-'}</td>
              <td>
                <Link to={`/spotlights/entries/${r._id}`}>Edit</Link>{' '}
                <button className="danger" onClick={() => del(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="6">No entries yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
