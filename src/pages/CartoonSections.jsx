import React, { useEffect, useState } from 'react';
import { CartoonApi } from '../services/cartoonApi';

export default function CartoonSections() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await CartoonApi.getSections();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm('Delete section and its entries?')) return;
    await CartoonApi.deleteSection(id);
    load();
  };

  return (
    <div className="p-4">
      <h2>Cartoon Sections</h2>
      <div className="mb-2">
        <a className="btn btn-primary" href="#/cartoons/sections/new">+ New Section</a>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th><th>Scope</th><th>Placement</th><th>After/Every/Count</th><th>Enabled</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s._id}>
                <td>{s.title}</td>
                <td>{s.scopeType}{s.scopeType!=='global' ? `:${s.scopeValue}` : ''}</td>
                <td>{s.placement}</td>
                <td>{s.injection?.afterNth}/{s.injection?.repeatEvery}/{s.injection?.repeatCount}</td>
                <td>{s.enabled ? 'Yes' : 'No'}</td>
                <td>
                  <a href={`#/cartoons/sections/${s._id}`} className="btn btn-sm btn-outline-secondary">Edit</a>{' '}
                  <a href={`#/cartoons/entries?sectionId=${s._id}`} className="btn btn-sm btn-outline-primary">Entries</a>{' '}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => del(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
