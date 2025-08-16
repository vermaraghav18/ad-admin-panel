// ad-admin-panel/src/pages/SmallAdsManager.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';
const api = axios.create({ baseURL: API_BASE });

function isVideo(file) {
  return file?.type === 'video/mp4';
}

export default function SmallAdsManager() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [placementIndex, setPlacementIndex] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/api/small-ads');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ fetch small ads failed:', err);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchAll();
    return () => previewUrl && URL.revokeObjectURL(previewUrl);
    // eslint-disable-next-line
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) return setError('Please choose an image or an MP4 video.');
    if (!(file.type.startsWith('image/') || file.type === 'video/mp4')) {
      return setError('Only images and MP4 videos are supported.');
    }
    const n = parseInt(String(placementIndex), 10);
    if (!n || n < 1) return setError('Enter a valid placement index (>= 1).');

    const fd = new FormData();
    fd.append('media', file);
    fd.append('placementIndex', String(n));
    fd.append('targetUrl', targetUrl.trim());
    fd.append('enabled', String(enabled));

    try {
      setBusy(true);
      await api.post('/api/small-ads', fd);
      setFile(null);
      setPlacementIndex('');
      setTargetUrl('');
      setEnabled(true);
      await fetchAll();
    } catch (err) {
      console.error('❌ upload small ad failed:', err?.response?.data || err);
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this small ad?')) return;
    try {
      await api.delete(`/api/small-ads/${id}`);
      await fetchAll();
    } catch (err) {
      console.error('❌ delete small ad failed:', err);
    }
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">🧩 Small Ads</h2>

      <form onSubmit={onSubmit} className="mb-4 flex gap-2 flex-wrap items-center">
        <input
          type="file"
          accept="image/*,video/mp4"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="p-2 bg-gray-700"
        />
        <input
          className="p-2 bg-gray-700 w-32"
          placeholder="Placement (e.g. 5)"
          value={placementIndex}
          onChange={(e) => setPlacementIndex(e.target.value)}
          type="number"
          min={1}
        />
        <input
          className="p-2 bg-gray-700 min-w-[280px]"
          placeholder="Target URL (optional)"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <button disabled={busy} className="bg-blue-500 px-4 py-2 rounded">
          {busy ? 'Uploading…' : 'Add'}
        </button>
      </form>

      {error && <div className="mb-3 text-red-400">{error}</div>}

      {/* preview */}
      {file && (
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Preview:</p>
          <div className="bg-black p-2 rounded w-[320px]">
            {isVideo(file) ? (
              <video src={previewUrl} controls muted playsInline className="rounded" />
            ) : (
              <img src={previewUrl} alt="preview" className="rounded" />
            )}
          </div>
        </div>
      )}

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it._id} className="bg-black rounded p-3">
            <div className="text-xs text-gray-400 mb-1">
              #{it.placementIndex} • {it.mediaType.toUpperCase()}
            </div>
            <div className="mb-2">
              {it.mediaType === 'video' ? (
                <video src={it.mediaUrl?.startsWith('http') ? it.mediaUrl : `${API_BASE}${it.mediaUrl}`} controls muted playsInline className="rounded" />
              ) : (
                <img src={it.mediaUrl?.startsWith('http') ? it.mediaUrl : `${API_BASE}${it.mediaUrl}`} alt="ad" className="rounded" />
              )}
            </div>
            {it.targetUrl && (
              <div className="text-xs text-blue-300 break-all mb-2">{it.targetUrl}</div>
            )}
            <button onClick={() => onDelete(it._id)} className="text-red-400 text-xs">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
