// src/components/BannerConfigForm.jsx
// Drop-in: matches new backend (anchor + payload + targets). No file upload.
// Props: { initial, onSaved, onCancel }

import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');
const MODES = ['ad', 'news', 'empty'];

export default function BannerConfigForm({ initial, onSaved, onCancel }) {
  // ------- core fields -------
  const [mode, setMode] = useState(initial?.mode ?? 'ad');

  // anchor
  const [anchorKind, setAnchorKind]   = useState(initial?.anchor?.kind || (initial?.startAfter !== undefined ? 'slot' : 'slot'));
  const [nth, setNth]                 = useState(initial?.anchor?.nth ?? initial?.startAfter ?? 10);
  const [repeatEvery, setRepeatEvery] = useState(
    initial?.repeatEvery === null || initial?.repeatEvery === undefined ? '' : String(initial?.repeatEvery)
  );
  const [articleKey, setArticleKey]   = useState(initial?.anchor?.articleKey || '');
  const [category, setCategory]       = useState(initial?.anchor?.category || '');

  // payload (modern fields)
  const [headline, setHeadline]       = useState(initial?.payload?.headline || initial?.message || '');
  const [imageUrl, setImageUrl]       = useState(initial?.payload?.imageUrl || initial?.imageUrl || '');
  const [clickUrl, setClickUrl]       = useState(initial?.payload?.clickUrl || '');
  const [deeplinkUrl, setDeeplinkUrl] = useState(initial?.payload?.deeplinkUrl || '');
  const [customNewsId, setCustomNewsId] = useState(initial?.payload?.customNewsId || initial?.customNewsId || '');
  const [topic, setTopic]             = useState((initial?.payload?.topic || '').toLowerCase());

  // NEW: per-section targeting
  const [targets, setTargets] = useState({
    includeAll: initial?.targets?.includeAll !== undefined ? !!initial.targets.includeAll : true,
    categories: initial?.targets?.categories || [],
    cities:     initial?.targets?.cities || [],
    states:     initial?.targets?.states || [],
  });

  // meta/flags
  const [priority, setPriority]   = useState(initial?.priority ?? 100);
  const [isActive, setIsActive]   = useState(initial?.isActive ?? true);
  const [activeFrom, setActiveFrom] = useState(initial?.activeFrom ? isoLocal(initial.activeFrom) : '');
  const [activeTo, setActiveTo]     = useState(initial?.activeTo ? isoLocal(initial.activeTo) : '');
  const [message, setMessage]     = useState(initial?.message || 'Tap to read more');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // fetch options
  const [newsOptions, setNewsOptions] = useState([]);
  const [meta, setMeta] = useState({ categories: ['top', 'finance'], cities: [], states: [] });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/banner-configs/meta`);
        if (r.ok) {
          const m = await r.json();
          if (!cancelled) setMeta(m || {});
        }
      } catch {}
    })();

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/custom-news`);
        if (r.ok) {
          const arr = await r.json();
          if (!cancelled) setNewsOptions(Array.isArray(arr) ? arr : []);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  const disableTargetSelectors = !!targets.includeAll;

  function updateTargets(path, value) {
    setTargets((t) => {
      const next = { ...t };
      if (path === 'includeAll') next.includeAll = !!value;
      if (path === 'categories') next.categories = value;
      if (path === 'cities')     next.cities     = value;
      if (path === 'states')     next.states     = value;
      return next;
    });
  }

  function onMultiChange(ev, which) {
    const values = Array.from(ev.target.selectedOptions).map(o => o.value);
    updateTargets(which, values);
  }

  // auto-topic when selecting a custom news (only if topic empty)
  function onSelectNews(id) {
    setCustomNewsId(id);
    if (!topic) {
      const sel = newsOptions.find(n => n._id === id);
      if (sel?.topic) setTopic(String(sel.topic).toLowerCase());
    }
  }

  const preview = useMemo(() => ({ mode, imageUrl, message }), [mode, imageUrl, message]);

  function validate() {
    if (!MODES.includes(mode)) return 'Invalid mode';
    if (anchorKind === 'slot' && (nth === null || Number(nth) < 1)) return 'Nth must be ≥ 1';
    if (anchorKind === 'article' && !articleKey) return 'Article key is required for anchor kind "article"';
    if (anchorKind === 'category' && !category) return 'Category is required for anchor kind "category"';

    if (mode === 'ad' && !imageUrl) return 'imageUrl is required for AD mode';
    if (mode === 'news') {
      const hasNewsId = !!customNewsId;
      const hasInline = !!(headline && (clickUrl || deeplinkUrl));
      if (!hasNewsId && !hasInline) {
        return 'For NEWS mode, provide customNewsId or (headline + click/deeplink URL).';
      }
    }
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

      const body = {
        mode,
        anchor: {
          kind: anchorKind,
          articleKey: anchorKind === 'article' ? (articleKey || undefined) : undefined,
          category: anchorKind === 'category' ? (category || undefined).toLowerCase() : undefined,
          nth: anchorKind === 'slot' ? Number(nth || 10) : undefined,
        },
        payload: {
          headline: headline || undefined,
          imageUrl: imageUrl || undefined,
          clickUrl: clickUrl || undefined,
          deeplinkUrl: deeplinkUrl || undefined,
          customNewsId: mode === 'news' ? (customNewsId || undefined) : undefined,
          topic: topic || undefined,
        },
        targets: {
          includeAll: !!targets.includeAll,
          categories: targets.includeAll ? [] : (targets.categories || []).map(c => String(c).toLowerCase()),
          cities: targets.includeAll ? [] : (targets.cities || []),
          states: targets.includeAll ? [] : (targets.states || []),
        },
        // legacy-compatible knobs
        startAfter: anchorKind === 'slot' ? Number(nth || 10) : undefined,
        repeatEvery:
          anchorKind === 'slot' && repeatEvery !== ''
            ? Number(repeatEvery)
            : undefined,
        priority: Number(priority || 100),
        isActive: !!isActive,
        activeFrom: activeFrom || undefined,
        activeTo: activeTo || undefined,
        message: message || undefined,
      };

      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text();
      const data = res.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { error: text };
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      onSaved?.(data);
    } catch (e2) {
      setErr(e2.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Mode + Active */}
      <div className="flex gap-3 flex-wrap">
        {MODES.map(m => (
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

      {/* Anchor */}
      <div className="grid gap-3 max-w-3xl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <label className="flex flex-col">
          <span className="text-sm">Anchor kind</span>
          <select value={anchorKind} onChange={(e) => setAnchorKind(e.target.value)}>
            <option value="slot">slot (Nth & every)</option>
            <option value="article">article (after articleKey)</option>
            <option value="category">category (top story of category)</option>
          </select>
        </label>

        {anchorKind === 'slot' && (
          <>
            <label className="flex flex-col">
              <span className="text-sm">Nth (1 = after first)</span>
              <input type="number" min={1} value={nth} onChange={(e) => setNth(toInt(e.target.value) ?? 10)} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm">Repeat every (blank = once)</span>
              <input type="number" min={1} value={repeatEvery} onChange={(e) => setRepeatEvery(e.target.value)} placeholder="e.g. 5" />
            </label>
          </>
        )}

        {anchorKind === 'article' && (
          <label className="flex flex-col" style={{ gridColumn: '1 / -1' }}>
            <span className="text-sm">Article Key (must match `id` from /api/rss-agg)</span>
            <input value={articleKey} onChange={(e) => setArticleKey(e.target.value)} placeholder="sha1 id or link-based id" />
          </label>
        )}

        {anchorKind === 'category' && (
          <label className="flex flex-col">
            <span className="text-sm">Category (lowercase)</span>
            <input value={category} onChange={(e) => setCategory(e.target.value.toLowerCase())} placeholder="e.g. finance, sports" />
          </label>
        )}
      </div>

      {/* Targeting */}
      <div className="space-y-2">
        <div className="font-medium">Show in (Sections)</div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!targets.includeAll}
            onChange={(e) => updateTargets('includeAll', e.target.checked)}
          />
          Include in <b>all</b> sections
        </label>

        <div className="grid gap-3 max-w-5xl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          <label className="flex flex-col">
            <span className="text-sm">Categories</span>
            <select
              multiple
              disabled={disableTargetSelectors}
              value={targets.categories}
              onChange={(e) => onMultiChange(e, 'categories')}
              size={Math.min(4, (meta.categories || []).length || 2)}
            >
              {(meta.categories || ['top', 'finance']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm">Cities</span>
            <select
              multiple
              disabled={disableTargetSelectors}
              value={targets.cities}
              onChange={(e) => onMultiChange(e, 'cities')}
              size={8}
            >
              {(meta.cities || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm">States</span>
            <select
              multiple
              disabled={disableTargetSelectors}
              value={targets.states}
              onChange={(e) => onMultiChange(e, 'states')}
              size={8}
            >
              {(meta.states || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="text-xs opacity-70">
          Tip: When <b>Include in all</b> is checked, the selects are ignored.
          Specificity order is <b>City</b> &gt; <b>State</b> &gt; <b>Category</b> &gt; All.
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-3 max-w-3xl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <label className="flex flex-col">
          <span className="text-sm">Headline</span>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Shown on news banners" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Image URL (ad)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Cloudinary or full URL" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Click URL (web)</span>
          <input value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Deeplink URL (app)</span>
          <input value={deeplinkUrl} onChange={(e) => setDeeplinkUrl(e.target.value)} placeholder="myapp://..." />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Custom News (optional)</span>
          <select value={customNewsId} onChange={(e) => onSelectNews(e.target.value)}>
            <option value="">— none —</option>
            {newsOptions.map((n) => (
              <option key={n._id} value={n._id}>
                {n.title?.slice(0, 50) || n._id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Custom News Topic (optional)</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value.toLowerCase())} placeholder="e.g. cricket, finance" />
          <small className="opacity-70">Used to filter the in-app Custom News page.</small>
        </label>
      </div>

      {/* Meta */}
      <div className="grid gap-3 max-w-3xl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <label className="flex flex-col">
          <span className="text-sm">Priority (higher wins)</span>
          <input type="number" value={priority} onChange={(e) => setPriority(toInt(e.target.value) ?? 100)} />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Active From (optional)</span>
          <input type="datetime-local" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Active To (optional)</span>
          <input type="datetime-local" value={activeTo} onChange={(e) => setActiveTo(e.target.value)} />
        </label>

        <label className="flex flex-col" style={{ gridColumn: '1 / -1' }}>
          <span className="text-sm">Message / Headline (optional)</span>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="CTA text" />
        </label>
      </div>

      {/* Preview */}
      <div className="mt-2">
        <div className="text-sm mb-1">Preview (16:4)</div>
        <div className="p-3 border rounded max-w-3xl">
          <div style={{ aspectRatio: '16 / 4' }} className="w-full">
            <div className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: '#222' }}>
              {preview.mode === 'ad' && preview.imageUrl && (
                <img
                  src={preview.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
              <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="text-white text-sm font-semibold text-center line-clamp-2">
                  {preview.mode === 'ad' && 'Ad banner'}
                  {preview.mode === 'news' && 'News banner'}
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
