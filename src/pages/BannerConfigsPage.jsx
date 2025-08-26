import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');

const emptyForm = {
  // what to render
  mode: 'ad', // 'ad' | 'news' | 'empty'

  // where to render
  anchorKind: 'slot', // 'slot' | 'article' | 'category'
  nth: 10,            // for 'slot'
  repeatEvery: '',    // optional
  articleKey: '',     // for 'article'
  category: '',       // for 'category' (lowercase)

  // content payload (modern way)
  headline: '',
  imageUrl: '',
  clickUrl: '',
  deeplinkUrl: '',
  customNewsId: '',

  // meta
  priority: 100,
  isActive: true,
  activeFrom: '',
  activeTo: '',
  message: '',
};

export default function BannerConfigsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [customNews, setCustomNews] = useState([]);
  const [filterMode, setFilterMode] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(
    () => list.filter((x) => !filterMode || x.mode === filterMode),
    [list, filterMode]
  );

  useEffect(() => {
    fetchAll();
    fetchCustomNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/banner-configs`, { headers: { 'Cache-Control': 'no-cache' } });
      setList(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message || 'Failed to load banner configs');
      alert('Failed to load Banner Configs.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomNews() {
    try {
      const res = await axios.get(`${API_BASE}/api/custom-news`);
      setCustomNews(res.data || []);
    } catch {
      // ignore; dropdown will just be empty
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  function loadForEdit(doc) {
    setEditingId(doc._id);
    setForm({
      mode: doc.mode || 'ad',

      anchorKind: doc.anchor?.kind || (doc.startAfter ? 'slot' : 'slot'),
      nth: doc.anchor?.nth ?? doc.startAfter ?? 10,
      repeatEvery: doc.repeatEvery ?? '',
      articleKey: doc.anchor?.articleKey || '',
      category: doc.anchor?.category || '',

      headline: doc.payload?.headline || doc.message || '',
      imageUrl: doc.payload?.imageUrl || doc.imageUrl || '',
      clickUrl: doc.payload?.clickUrl || '',
      deeplinkUrl: doc.payload?.deeplinkUrl || '',
      customNewsId: doc.payload?.customNewsId || doc.customNewsId || '',

      priority: doc.priority ?? 100,
      isActive: !!doc.isActive,
      activeFrom: doc.activeFrom ? String(doc.activeFrom).slice(0, 10) : '',
      activeTo: doc.activeTo ? String(doc.activeTo).slice(0, 10) : '',
      message: doc.message || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : (name === 'category' ? value.toLowerCase() : value),
    }));
  }

  function buildRequestBody() {
    const anchor = {
      kind: form.anchorKind,
      articleKey: form.anchorKind === 'article' ? (form.articleKey || undefined) : undefined,
      category: form.anchorKind === 'category' ? (form.category || undefined) : undefined,
      nth: form.anchorKind === 'slot' ? Number(form.nth || 10) : undefined,
    };

    const payload = {
      headline: form.headline || undefined,
      imageUrl: form.imageUrl || undefined, // required for ad mode
      clickUrl: form.clickUrl || undefined,
      deeplinkUrl: form.deeplinkUrl || undefined,
      customNewsId: form.mode === 'news' ? (form.customNewsId || undefined) : undefined,
    };

    const body = {
      mode: form.mode,
      anchor,
      payload,
      // legacy-compatible knobs (optional)
      startAfter: form.anchorKind === 'slot' ? Number(form.nth || 10) : undefined,
      repeatEvery:
        form.anchorKind === 'slot' && form.repeatEvery !== ''
          ? Number(form.repeatEvery)
          : undefined,
      priority: Number(form.priority || 100),
      isActive: !!form.isActive,
      activeFrom: form.activeFrom || undefined,
      activeTo: form.activeTo || undefined,
      message: form.message || undefined,
    };

    return body;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const body = buildRequestBody();

    // quick client-side validation
    if (body.mode === 'ad' && !body.payload?.imageUrl) {
      return alert('For AD mode, imageUrl is required.');
    }
    if (body.mode === 'news') {
      const hasNewsId = !!body.payload?.customNewsId;
      const hasInline = !!(body.payload?.headline && (body.payload?.clickUrl || body.payload?.deeplinkUrl));
      if (!hasNewsId && !hasInline) {
        return alert('For NEWS mode, provide customNewsId or (headline + click/deeplink URL).');
      }
    }

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(`${API_BASE}/api/banner-configs/${editingId}`, body);
      } else {
        await axios.post(`${API_BASE}/api/banner-configs`, body);
      }
      resetForm();
      await fetchAll();
      alert('Saved!');
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message || 'Save failed');
      alert(`Save failed: ${e?.response?.data?.error || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteOne(id) {
    if (!window.confirm('Delete this banner config?')) return;
    try {
      await axios.delete(`${API_BASE}/api/banner-configs/${id}`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  async function toggleActive(id, next) {
    try {
      await axios.put(`${API_BASE}/api/banner-configs/${id}`, { isActive: next });
      setList((xs) => xs.map((x) => (x._id === id ? { ...x, isActive: next } : x)));
    } catch (e) {
      console.error(e);
      alert('Toggle failed');
    }
  }

  return (
    <div className="container">
      <h2>🧲 Banner Configs (article-anchored)</h2>

      {/* --------- Form --------- */}
      <form
        onSubmit={onSubmit}
        style={{
          background: 'var(--card)',
          color: 'var(--fg)',
          padding: 12,
          borderRadius: 12,
          border: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <label>Mode</label>
            <select name="mode" value={form.mode} onChange={onChange}>
              <option value="ad">ad</option>
              <option value="news">news</option>
              <option value="empty">empty</option>
            </select>
          </div>

          <div>
            <label>Anchor kind</label>
            <select name="anchorKind" value={form.anchorKind} onChange={onChange}>
              <option value="slot">slot (Nth & every)</option>
              <option value="article">article (after articleKey)</option>
              <option value="category">category (top story of category)</option>
            </select>
          </div>

          {form.anchorKind === 'slot' && (
            <>
              <div>
                <label>Nth (1 = after first)</label>
                <input name="nth" type="number" value={form.nth} onChange={onChange} />
              </div>
              <div>
                <label>Repeat every (optional)</label>
                <input
                  name="repeatEvery"
                  type="number"
                  value={form.repeatEvery}
                  onChange={onChange}
                  placeholder="e.g. 5"
                />
              </div>
            </>
          )}

          {form.anchorKind === 'article' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Article Key (must match `id` from /api/rss-agg)</label>
              <input
                name="articleKey"
                value={form.articleKey}
                onChange={onChange}
                placeholder="sha1 id or link-based id"
              />
            </div>
          )}

          {form.anchorKind === 'category' && (
            <div>
              <label>Category (lowercase)</label>
              <input
                name="category"
                value={form.category}
                onChange={onChange}
                placeholder="e.g. finance, sports"
              />
            </div>
          )}

          <div>
            <label>Priority (higher wins)</label>
            <input name="priority" type="number" value={form.priority} onChange={onChange} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="isActive" name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
            <label htmlFor="isActive">Active</label>
          </div>

          <div>
            <label>Active From (optional)</label>
            <input name="activeFrom" type="date" value={form.activeFrom} onChange={onChange} />
          </div>
          <div>
            <label>Active To (optional)</label>
            <input name="activeTo" type="date" value={form.activeTo} onChange={onChange} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label>Message / Headline (optional)</label>
            <input name="message" value={form.message} onChange={onChange} placeholder="CTA text" />
          </div>

          {/* --------- Payload fields --------- */}
          <div style={{ gridColumn: '1 / -1', marginTop: 4, opacity: 0.85 }}>
            <strong>Payload</strong> — For <em>ad</em>: imageUrl (required), click/deeplink optional. For{' '}
            <em>news</em>: customNewsId or (headline + click/deeplink).
          </div>

          <div>
            <label>Headline</label>
            <input name="headline" value={form.headline} onChange={onChange} placeholder="Shown on news banners" />
          </div>

          <div>
            <label>Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="Cloudinary or full URL" />
          </div>

          <div>
            <label>Click URL (web)</label>
            <input name="clickUrl" value={form.clickUrl} onChange={onChange} placeholder="https://..." />
          </div>

          <div>
            <label>Deeplink URL (app)</label>
            <input name="deeplinkUrl" value={form.deeplinkUrl} onChange={onChange} placeholder="myapp://..." />
          </div>

          <div>
            <label>Custom News (optional)</label>
            <select name="customNewsId" value={form.customNewsId} onChange={onChange}>
              <option value="">— none —</option>
              {customNews.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title?.slice(0, 50) || n._id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit" disabled={saving} style={{ padding: '8px 12px' }}>
            {saving ? 'Saving…' : editingId ? 'Update Banner' : 'Create Banner'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error ? <div style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div> : null}
      </form>

      {/* --------- Filter + list --------- */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label>Filter:</label>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
          <option value="">All</option>
          <option value="ad">ad</option>
          <option value="news">news</option>
          <option value="empty">empty</option>
        </select>
        <button onClick={fetchAll} style={{ marginLeft: 8 }}>Reload</button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p>No configs yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {filtered.map((x) => (
            <Card
              key={x._id}
              doc={x}
              onEdit={() => loadForEdit(x)}
              onDelete={() => deleteOne(x._id)}
              onToggle={(next) => toggleActive(x._id, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ doc, onEdit, onDelete, onToggle }) {
  const anchor = doc.anchor || {};
  const p = doc.payload || {};
  return (
    <div
      className="card"
      style={{
        background: 'var(--card)',
        color: 'var(--fg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{doc.mode?.toUpperCase() || '—'}</strong>
        <span style={{ fontSize: 12, opacity: 0.8 }}>prio: {doc.priority ?? 100}</span>
      </div>

      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
        <div>
          <span style={{ opacity: 0.7 }}>Active:</span> {doc.isActive ? '✅ yes' : '❌ no'}
        </div>
        <div>
          <span style={{ opacity: 0.7 }}>Anchor:</span> {anchor.kind || 'slot'}
          {anchor.kind === 'slot' && (
            <>
              {' '}| nth: {anchor.nth ?? doc.startAfter ?? 10} | every: {doc.repeatEvery || '—'}
            </>
          )}
          {anchor.kind === 'article' && (
            <>
              {' '}| articleKey: <code>{anchor.articleKey}</code>
            </>
          )}
          {anchor.kind === 'category' && (
            <>
              {' '}| category: <code>{anchor.category}</code>
            </>
          )}
        </div>
        {doc.message ? (
          <div>
            <span style={{ opacity: 0.7 }}>Message:</span> {doc.message}
          </div>
        ) : null}

        {/* payload preview */}
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          <div>
            <span style={{ opacity: 0.7 }}>Headline:</span> {p.headline || '—'}
          </div>
          {doc.mode === 'news' && (
            <div>
              <span style={{ opacity: 0.7 }}>customNewsId:</span> {p.customNewsId || doc.customNewsId || '—'}
            </div>
          )}
          {doc.mode === 'ad' && (
            <div>
              <span style={{ opacity: 0.7 }}>imageUrl:</span> {p.imageUrl || doc.imageUrl || '—'}
            </div>
          )}
          <div>
            <span style={{ opacity: 0.7 }}>clickUrl:</span> {p.clickUrl || '—'}
          </div>
          <div>
            <span style={{ opacity: 0.7 }}>deeplinkUrl:</span> {p.deeplinkUrl || '—'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onEdit}>Edit</button>
        <button onClick={() => onToggle(!doc.isActive)}>
          {doc.isActive ? 'Disable' : 'Enable'}
        </button>
        <button onClick={onDelete} style={{ background: '#7f1d1d', color: '#fff' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
