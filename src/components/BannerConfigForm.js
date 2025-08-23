import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');
const modes = ['ad', 'news', 'empty'];

export default function BannerConfigForm({ initial, onSaved, onCancel }) {
  const [mode, setMode] = useState(initial?.mode ?? 'empty');
  const [startAfter, setStartAfter] = useState(initial?.startAfter ?? 0);
  const [repeatEvery, setRepeatEvery] = useState(
    initial?.repeatEvery === null || initial?.repeatEvery === undefined ? '' : String(initial?.repeatEvery)
  );
  const [priority, setPriority] = useState(initial?.priority ?? 100);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [activeFrom, setActiveFrom] = useState(initial?.activeFrom ? isoLocal(initial.activeFrom) : '');
  const [activeTo, setActiveTo] = useState(initial?.activeTo ? isoLocal(initial.activeTo) : '');

  // content
  const [imageFile, setImageFile] = useState(null);            // AD file
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || ''); // optional URL fallback
  const [customNewsId, setCustomNewsId] = useState(initial?.customNewsId || ''); // NEWS
  const [message, setMessage] = useState(initial?.message || 'Tap to read more'); // EMPTY

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
      } catch {
        if (!cancelled) setNewsOptions([]);
      } finally {
        if (!cancelled) setLoadingNews(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const preview = useMemo(() => ({ mode, imageUrl, message, customNewsId }), [mode, imageUrl, message, customNewsId]);

  function validate() {
    if (!modes.includes(mode)) return 'Invalid mode';
    if (startAfter < 0) return 'startAfter must be ≥ 0';
    if (repeatEvery !== '' && Number(repeatEvery) < 1) return 'repeatEvery must be ≥ 1 or blank';
    if (mode === 'ad' && !imageFile && !imageUrl) return 'Please upload an image or provide imageUrl';
    if (mode === 'news' && !customNewsId) return 'Please choose a Custom News item';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setSaving(true);

    try {
      const isEdit = !!initial?._id;
      const url = isEdit ? `${API_BASE}/api/banner-configs/${initial._id}` : `${API_BASE}/api/banner-configs`;
      let res;

      if (mode === 'ad' && imageFile) {
        // multipart for Cloudinary upload
        const form = new FormData();
        form.append('mode', mode);
        form.append('startAfter', String(startAfter));
        form.append('repeatEvery', repeatEvery === '' ? '' : String(repeatEvery));
        form.append('priority', String(priority));
        form.append('isActive', String(isActive));
        if (activeFrom) form.append('activeFrom', activeFrom);
        if (activeTo)   form.append('activeTo', activeTo);
        form.append('image', imageFile);

        const method = isEdit ? 'PUT' : 'POST';
        res = await fetch(url, { method, body: form });
      } else {
        // JSON
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
        const method = isEdit ? 'PUT' : 'POST';
        res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }

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
        <div className="max-w-xl space-y-2">
          <label className="flex flex-col">
            <span className="text-sm">Upload Ad image (Cloudinary)</span>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <span className="text-xs opacity-70 mt-1">
              If you don’t upload a file, you may provide an image URL instead.
            </span>
          </label>

          {!imageFile && (
            <label className="flex flex-col">
              <span className="text-sm">Or imageUrl (optional)</span>
              <input
                type="url"
                className="input"
                placeholder="https://…"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </label>
          )}

          {(imageFile || imageUrl) && (
            <div className="mt-2">
              <div className="text-xs opacity-70 mb-1">Preview</div>
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                alt=""
                style={{ maxWidth: 320, maxHeight: 120, objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'news' && (
        <div className="max-w-xl">
          <label className="flex flex-col">
            <span className="text-sm">Custom News item</span>
            <select className="input" value={customNewsId} onChange={e => setCustomNewsId(e.target.value)} disabled={loadingNews}>
              <option value="">Select…</option>
              {newsOptions.map(n => <option key={n._id} value={n._id}>{n.title}</option>)}
            </select>
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

      {/* 16:4 preview */}
      <div className="mt-2">
        <div className="text-sm mb-1">Preview (16:4)</div>
        <div className="p-3 border rounded max-w-3xl">
          <div style={{ aspectRatio: '16 / 4' }} className="w-full">
            <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: '#222' }}>
              {preview.mode === 'ad' && (imageFile || preview.imageUrl) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : preview.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
              <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="text-white text-sm font-semibold text-center line-clamp-2">
                  {preview.mode === 'ad' && 'Ad banner (tap opens Custom News)'}
                  {preview.mode === 'news' && 'News banner (tap opens Custom News)'}
                  {preview.mode === 'empty' && (preview.message || 'Tap to read more')}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-70 mt-2">Aspect ratio locked at 16:4</div>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <div className="flex gap-2 mt-3">
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : (initial?._id ? 'Update' : 'Create')}</button>
        <button type="button" className="btn border" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function toInt(v) { const n = typeof v === 'string' ? parseInt(v, 10) : v; return Number.isNaN(n) ? null : n; }
function isoLocal(d) { const dt = typeof d === 'string' ? new Date(d) : d; if (isNaN(+dt)) return ''; const p=(x)=>String(x).padStart(2,'0'); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`; }
