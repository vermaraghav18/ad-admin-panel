import React, { useEffect, useState, useCallback } from 'react';
import CustomNewsForm from '../components/CustomNewsForm';

// same base as the rest of the app
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

export default function CustomNewsManagerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null); // track which item is being deleted

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

  async function handleDelete(id) {
    if (!window.confirm('Delete this item?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/custom-news/${id}`, { method: 'DELETE' });
      // backend supports hard delete via ctrl.remove; if you changed to soft-delete it still works
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try { msg = JSON.parse(text)?.error || msg; } catch {}
        throw new Error(msg || 'Delete failed');
      }
      // optimistic remove from UI
      setItems(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      alert(e.message || 'Something went wrong while deleting');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4">
      <h1>Custom News</h1>

      {/* Form; on save, refresh the list */}
      <CustomNewsForm onSaved={load} />

      <hr className="my-6" />
      <div className="flex items-center justify-between">
        <h2 className="mb-2">Existing</h2>
        <button
          onClick={load}
          className="px-3 py-1 rounded border text-sm"
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <ul className="space-y-3">
          {items.map((it) => {
            const id = it._id || it.id;
            const isBusy = busyId === id;
            return (
              <li key={id} className="border p-3 rounded">
                <div className="flex gap-3 justify-between">
                  <div className="flex gap-3">
                    <img
                      src={normalizeImg(it.imageUrl)}
                      alt=""
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div>
                      <div className="font-semibold">{it.title}</div>
                      <div className="text-sm opacity-80">{it.source}</div>
                      <div className="text-sm">{it.description}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-8">
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={isBusy}
                      className={`px-3 py-1 rounded text-white text-sm ${
                        isBusy ? 'bg-red-300 cursor-wait' : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title="Delete"
                    >
                      {isBusy ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {items.length === 0 && <li>No custom news yet.</li>}
        </ul>
      )}
    </div>
  );
}
