// src/pages/CartoonSectionsList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartoonAPI } from '../api';

export default function CartoonSectionsList() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const d = await CartoonAPI.listSections();
      // Support both shapes: {items: [...] } or direct array
      const arr = Array.isArray(d) ? d : (d?.items ?? []);
      setSections(arr);
    } catch (e) {
      console.error(e);
      setError('Failed to load sections.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!window.confirm('Delete this section?')) return;
    try {
      await CartoonAPI.deleteSection(id);
      await load();
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartoon Sections</h1>
        <Link to="/cartoons/new" className="px-3 py-2 rounded bg-black text-white">New Section</Link>
      </div>

      {loading && <p className="mt-6">Loading…</p>}
      {error && !loading && <p className="mt-6 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 grid gap-4">
          {sections.length === 0 && (
            <div className="text-sm text-gray-500">
              No sections yet. <Link to="/cartoons/new" className="underline">Create one</Link>.
            </div>
          )}

          {sections.map((s) => (
            <div key={s._id} className="border rounded p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{s.title || 'Untitled'}</div>
                  <div className="text-sm text-gray-500 truncate">{s.slug}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(s.isActive ? 'Active' : 'Inactive')}
                    {s.createdAt ? ` • ${new Date(s.createdAt).toLocaleString()}` : null}
                  </div>

                  {/* Placements summary */}
                  {(s.placements && s.placements.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.placements.map((p, i) => (
                        <span
                          key={i}
                          className="text-xs border rounded px-2 py-1 bg-gray-50"
                          title={JSON.stringify(p)}
                        >
                          {p.enabled === false ? '⛔︎ ' : ''}
                          {p.target || 'any'} · after {p.afterNth ?? 0}
                          {p.repeatEvery ? ` · every ${p.repeatEvery}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
