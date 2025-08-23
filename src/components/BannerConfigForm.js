import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

const modes = ['ad', 'news', 'empty'];

export default function BannerConfigForm({ initial, onSaved, onCancel }) {
  const [mode, setMode] = useState(initial?.mode ?? 'empty');
  const [startAfter, setStartAfter] = useState(initial?.startAfter ?? 0);
  const [repeatEvery, setRepeatEvery] = useState(
    initial?.repeatEvery === null || initial?.repeatEvery === undefined
      ? ''
      : String(initial?.repeatEvery)
  );
  const [priority, setPriority] = useState(initial?.priority ?? 100);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [activeFrom, setActiveFrom] = useState(initial?.activeFrom ? isoLocal(initial.activeFrom) : '');
  const [activeTo, setActiveTo] = useState(initial?.activeTo ? isoLocal(initial.activeTo) : '');

  // content fields
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [customNewsId, setCustomNewsId] = useState(initial?.customNewsId || '');
  const [message, setMessage] = useState(initial?.message || 'Tap to read more');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [newsOptions, setNewsOptions] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (mode !== 'news') return;
    let cancelled = false;
    (async () => {
      setLoadingNews(true);
      try {
        const res = await fetch(`${API_BASE}/api/custom-news`);
        const ct = res.headers.get('content-type') || '';
        const txt = await res.text();
        const data = ct.includes('application/json') ? JSON.parse(txt) : { error: txt };
        if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
        if (!cancelled) setNewsOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setNewsOptions([]);
      } finally {
        if (!cancelled) setLoadingNews(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const preview = useMemo(() => {
    // minimal preview content for 16:4
    return { mode, imageUrl, message, customNewsId };
  }, [mode, imageUrl, message, customNewsId]);

  function validate() {
    if (!modes.includes(mode)) return 'Invalid mode';
    if (startAfter < 0) return 'startAfter must be ≥ 0';
    if (repeatEvery !== '' && Number(repeatEvery) < 1) return 'repeatEvery must be ≥ 1 or blank';
    if (mode === 'ad' && !imageUrl) return 'imageUrl is required for Ad mode';
    if (mode === 'news' && !customNewsId) return 'Please choose a Custom News item';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr('');
    setSaving(true);
    try {
      const body = {
        mode,
        startAfter: toInt(startAfter),
        repeatEvery: repeatEvery === '' ? null : toInt(repeatEvery),
        priority: toInt(priority),
        isActive,
        activeFrom: activeFrom || null,
        activeTo: activeTo || null,
        imageUrl: mode === 'ad' ? imageUrl : undefined,
        customNewsId: mode === 'news' ? customNewsId : undefined,
        message: mode === 'empty' ? message : undefined,
      };

      const isEdit = !!initial?._id;
      const url = isEdit
        ? `${API_BASE}/api/banner-configs/${initial._id}`
        : `${API_BASE}/api/banner-configs`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const ct = res.headers.get('content-type') || '';
      const txt = await res.text();
      const data = ct.includes('application/json') ? JSON.parse(txt) : { error: txt };
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      onSaved?.(data);
    } catch (e) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {modes.map(m => (
          <label key={m} className="flex items-center gap-1">
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
            <span className="capitalize">{m}</span>
          </label>
        ))}
        <label className="ml-4 flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>

      {/* Placement */}
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        <label className="flex flex-col">
          <span className="text-sm">startAfter (≥ 0)</span>
          <input type="number" className="input" min={0} value={startAfter} onChange={e => setStartAfter(toInt(e.target.value) ?? 0)} />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">repeatEvery (blank = once)</span>
          <input type="number" className="input" min={1} value={repeatEvery} onChange={e => setRepeatEvery(e.target.value)} placeholder="(blank = once)" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">priority (lower wins)</span>
          <input type="number" className="input" value={priority} onChange={e => setPriority(toInt(e.target.value) ?? 100)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm">activeFrom (optional)</span>
            <input type="datetime-local" className="input" value={activeFrom} onChange={e => setActiveFrom(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">activeTo (optional)</span>
            <input type="datetime-local" className="input" value={activeTo} onChange={e => setActiveTo(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Content by mode */}
      {mode === 'ad' && (
        <div className="max-w-xl">
          <label className="flex flex-col">
            <span className="text-sm">Ad imageUrl (required)</span>
            <input type="url" className="input" placeholder="https://…" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
          </label>
        </div>
      )}

      {mode === 'news' && (
        <div className="max-w-xl">
          <label className="flex flex-col">
            <span className="text-sm">Custom News item</span>
            <select
              className="input"
              value={customNewsId}
              onChange={e => setCustomNewsId(e.target.value)}
              disabled={loadingNews}
            >
              <option value="">Select…</option>
              {newsOptions.map(n => (
                <option key={n._id} value={n._id}>{n.title}</option>
              ))}
            </select>
            <span className="text-xs opacity-70 mt-1">
              List comes from /api/custom-news (active items).
            </span>
          </label>
        </div>
      )}

      {mode === 'empty' && (
        <div className="max-w-xl">
          <label className="flex flex-col">
            <span className="text-sm">Message (optional)</span>
            <input type="text" className="input" value={message} onChange={e => setMessage(e.target.value)} />
          </label>
        </div>
      )}

      {/* Preview (16:4) */}
      <div className="mt-2">
        <div className="text-sm mb-1">Preview</div>
        <div className="p-3 border rounded max-w-3xl">
          <div style={{ aspectRatio: '16 / 4' }} className="w-full">
            <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: '#222' }}>
              {/* bg image for ad */}
              {preview.mode === 'ad' && preview.imageUrl && (
                <img src={preview.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}
              {/* overlay */}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
              {/* text */}
              <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="text-white text-sm font-semibold text-center line-clamp-2">
                  {preview.mode === 'ad' && 'Ad banner (taps open Custom News)'}
                  {preview.mode === 'news' && 'News banner (taps open Custom News)'}
                  {preview.mode === 'empty' && (message || 'Tap to read more')}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-70 mt-2">Aspect ratio locked at 16:4</div>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <div className="flex gap-2 mt-3">
        <button className="btn" disabled={saving}>
          {saving ? 'Saving…' : (initial?._id ? 'Update' : 'Create')}
        </button>
        <button type="button" className="btn border" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function toInt(v) {
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return Number.isNaN(n) ? null : n;
}
function isoLocal(d) {
  // handles both Date objects and ISO strings
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(+dt)) return '';
  const pad = (x) => String(x).padStart(2, '0');
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mi = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
