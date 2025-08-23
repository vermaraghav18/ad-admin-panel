import React, { useEffect, useState, useCallback } from 'react';
import BannerConfigForm from '../components/BannerConfigForm';
import BannerConfigList from '../components/BannerConfigList';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

export default function BannerManagerPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // the config being edited
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/banner-configs`);
      const ct = res.headers.get('content-type') || '';
      const txt = await res.text();
      const data = ct.includes('application/json') ? JSON.parse(txt) : { error: txt };
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || 'Failed to load banner configs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Banner Manager</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded text-sm" onClick={load}>Refresh</button>
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={() => setEditing({ mode: 'empty', startAfter: 0, repeatEvery: null, priority: 100, isActive: true })}
          >
            + New Banner
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 border rounded p-3">
          <BannerConfigForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSaved={(doc) => {
              setEditing(null);
              // refresh
              load();
            }}
          />
        </div>
      )}

      <hr className="my-6" />
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Existing</h2>
        {!editing && (
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={() => setEditing({ mode: 'empty', startAfter: 0, repeatEvery: null, priority: 100, isActive: true })}
          >
            + New
          </button>
        )}
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600 mt-2">{err}</div>}

      {!loading && !err && (
        <BannerConfigList
          items={items}
          onEdit={(it) => setEditing(it)}
          onChanged={load}
        />
      )}
    </div>
  );
}
