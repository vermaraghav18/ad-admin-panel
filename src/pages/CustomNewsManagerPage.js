import React, { useEffect, useState, useCallback } from 'react';
import CustomNewsForm from '../components/CustomNewsForm';

// use the same API base pattern as App.js / CustomNewsForm.js
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

export default function CustomNewsManagerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/custom-news`);
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      const data = ct.includes('application/json') ? JSON.parse(text) : { error: text };
      if (!res.ok) throw new Error(data.error || `Failed to fetch (${res.status})`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load custom news');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const normalizeImg = (url) =>
    /^https?:\/\//i.test(url) ? url : `${API_BASE}${url || ''}`;

  return (
    <div className="p-4">
      <h1>Custom News</h1>

      {/* Form; on save, refresh the list */}
      <CustomNewsForm onSaved={load} />

      <hr className="my-6" />
      <h2 className="mb-2">Existing</h2>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it._id || it.id} className="border p-3 rounded">
              <div className="flex gap-3">
                <img
                  src={normalizeImg(it.imageUrl)}
                  alt=""
                  width={96}
                  height={96}
                  style={{ objectFit: 'cover' }}
                />
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm opacity-80">{it.source}</div>
                  <div className="text-sm">{it.description}</div>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && <li>No custom news yet.</li>}
        </ul>
      )}
    </div>
  );
}
