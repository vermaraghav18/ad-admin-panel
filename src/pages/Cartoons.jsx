import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CartoonApi } from '../services/cartoonApi';

export default function Cartoons() {
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('sectionId') || '';
  const [rows, setRows] = useState([]);
  const [sections, setSections] = useState([]);

  const load = async () => {
    const [r, s] = await Promise.all([
      CartoonApi.getEntries(sectionId),
      CartoonApi.getSections(),
    ]);
    setRows(r);
    setSections(s);
  };

  useEffect(() => { load(); }, [sectionId]);

  const del = async (id) => {
    if (!window.confirm('Delete entry?')) return;
    await CartoonApi.deleteEntry(id);
    load();
  };

  const secName = (id) => sections.find(s=>s._id===id)?.title || id;

  return (
    <div className="p-4">
      <h2>Cartoon Entries</h2>
      <div className="mb-2">
        <Link className="btn btn-primary"
              to={`/cartoons/entries/new${sectionId ? `?sectionId=${sectionId}` : ''}`}>+ New Entry</Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th><th>Section</th><th>Status</th><th>Published</th><th>Variants</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e=>(
            <tr key={e._id}>
              <td>{e.title}</td>
              <td>{secName(e.sectionId)}</td>
              <td>{e.status}</td>
              <td>{e.publishedAt ? new Date(e.publishedAt).toLocaleString() : '-'}</td>
              <td>{(e.variants||[]).map(v=>v.aspect).join(', ')}</td>
              <td>
                <Link className="btn btn-sm btn-outline-secondary" to={`/cartoons/entries/${e._id}`}>Edit</Link>{' '}
                <button className="btn btn-sm btn-outline-danger" onClick={()=>del(e._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
