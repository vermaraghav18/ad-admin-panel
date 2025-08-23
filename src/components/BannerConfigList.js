import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

export default function BannerConfigList({ items, onEdit, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  async function handleDelete(id) {
    if (!window.confirm('Delete this banner config?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/banner-configs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt)?.error || msg; } catch {}
        throw new Error(msg || 'Delete failed');
      }
      onChanged?.();
    } catch (e) {
      alert(e.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {items.map(it => (
        <li key={it._id} className="border p-3 rounded">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm opacity-70">Mode</div>
              <div className="font-semibold capitalize">{it.mode}</div>
            </div>
            <div>
              <div className="text-sm opacity-70">Placement</div>
              <div className="text-sm">
                startAfter: <b>{it.startAfter}</b>, repeatEvery:{' '}
                <b>{it.repeatEvery == null ? 'once' : it.repeatEvery}</b>
              </div>
            </div>
            <div>
              <div className="text-sm opacity-70">Priority</div>
              <div className="text-sm"><b>{it.priority ?? 100}</b></div>
            </div>
            <div>
              <div className="text-sm opacity-70">Active</div>
              <div className="text-sm"><b>{it.isActive ? 'Yes' : 'No'}</b></div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={() => onEdit?.(it)}
              >
                Edit
              </button>
              <button
                className={`px-3 py-1 rounded text-white text-sm ${busyId === it._id ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => handleDelete(it._id)}
                disabled={busyId === it._id}
              >
                {busyId === it._id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {/* small mode-specific summary */}
          <div className="mt-3 text-sm">
            {it.mode === 'ad' && (
              <div className="flex items-center gap-3">
                <span className="opacity-70">imageUrl:</span>
                <a className="text-blue-600 underline" href={it.imageUrl} target="_blank" rel="noreferrer">{it.imageUrl}</a>
              </div>
            )}
            {it.mode === 'news' && (
              <div className="opacity-80">customNewsId: <code>{it.customNewsId}</code></div>
            )}
            {it.mode === 'empty' && (
              <div className="opacity-80">message: <em>{it.message || 'Tap to read more'}</em></div>
            )}
          </div>
        </li>
      ))}
      {items.length === 0 && <li>No banner configs yet.</li>}
    </ul>
  );
}
