import React, { useEffect, useState } from 'react';
import { listSections, deleteSection } from '../api/sections';
import { Link } from 'react-router-dom';
import api from '../api';

export default function SectionsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const items = await listSections();
    setRows(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    await deleteSection(id);
    load();
  };

  return (
    <div className="p-4">
      <h2>Sections</h2>
      <div className="mb-3">
        <Link to="/sections/new" className="btn btn-primary">+ New Section</Link>
      </div>
      {loading ? <div>Loading…</div> : (
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Name</th><th>Slug</th><th>Enabled</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id}>
                <td>{r.order}</td>
                <td><Link to={`/sections/${r._id}`}>{r.name}</Link></td>
                <td>{r.slug}</td>
                <td>{r.enabled ? 'Yes' : 'No'}</td>
                <td>
                  <Link to={`/sections/${r._id}`} className="btn btn-sm btn-outline-secondary">Edit</Link>{' '}
                  <button onClick={() => onDelete(r._id)} className="btn btn-sm btn-outline-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 alert alert-info">
        Tip: Add RSS URLs to a section from the <b>Feeds</b> page using <code>category = section.slug</code>.
      </div>
    </div>
  );
}
