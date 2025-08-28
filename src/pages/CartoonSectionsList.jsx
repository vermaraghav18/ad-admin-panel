// src/pages/CartoonSectionsList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartoonAPI } from '../api';

export default function CartoonSectionsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const d = await CartoonAPI.listSections();
      setItems(d.items || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    await CartoonAPI.deleteSection(id);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartoon Sections</h1>
        <Link to="/cartoons/new" className="px-3 py-2 rounded bg-black text-white">New Section</Link>
      </div>

      {loading ? <p className="mt-6">Loading…</p> : (
        <div className="mt-6 grid gap-4">
          {items.length === 0 && <p>No sections yet.</p>}
          {items.map((s) => (
            <div key={s._id} className="border rounded p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-gray-500">{s.slug}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.isActive ? 'Active' : 'Inactive'} • {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/cartoons/${s._id}`} className="px-3 py-1 border rounded">Edit</Link>
                  <button onClick={() => remove(s._id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
                </div>
              </div>
              {s.bannerImageUrl && (
                <div className="mt-3">
                  <img src={s.bannerImageUrl} alt="" className="h-16 object-contain" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
