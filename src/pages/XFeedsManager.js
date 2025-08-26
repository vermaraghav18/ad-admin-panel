// src/pages/XFeedsManager.js
import React, { useEffect, useMemo, useState } from "react";

/** API base: Vercel + CRA both supported */
const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "https://ad-server-qx62.onrender.com/api";

/** tiny helper */
async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
    body:
      opts.body && typeof opts.body !== "string"
        ? JSON.stringify(opts.body)
        : opts.body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return res.json();
}

export default function XFeedsManager() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // add/edit panel
  const [editing, setEditing] = useState(null); // null = closed, {} new, or feed object
  const [form, setForm] = useState({ name: "", url: "", enabled: true, lang: "en", order: 0 });

  // preview
  const [previewItems, setPreviewItems] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settings, setSettings] = useState({
    dropPureRT: true,
    maxHashtags: 2,
    langs: "en",
    minReadableWords: 8,
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api("/xfeeds");
        // ensure stable order field even if backend does not send it
        const withOrder = data.map((f, i) => ({ order: i, ...f }));
        setFeeds(withOrder);
        // try loading settings (optional)
        try {
          const s = await api("/xfeeds/settings");
          setSettings((x) => ({ ...x, ...s }));
        } catch {
          /* settings endpoint optional */
        }
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openCreate() {
    setEditing({});
    setForm({ name: "", url: "", enabled: true, lang: "en", order: feeds.length });
  }

  function openEdit(feed) {
    setEditing(feed);
    setForm({
      id: feed.id,
      name: feed.name || "",
      url: feed.url || "",
      enabled: !!feed.enabled,
      lang: feed.lang || "en",
      order: feed.order ?? 0,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ name: "", url: "", enabled: true, lang: "en", order: 0 });
  }

  async function saveFeed() {
    try {
      setBusy(true);
      if (!form.name.trim() || !form.url.trim()) throw new Error("Name & URL are required.");
      if (editing && editing.id) {
        const updated = await api(`/xfeeds/${editing.id}`, { method: "PUT", body: form });
        setFeeds((list) => list.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)));
        setToast("Feed updated");
      } else {
        const created = await api("/xfeeds", { method: "POST", body: form });
        setFeeds((list) => [...list, created]);
        setToast("Feed created");
      }
      cancelEdit();
    } catch (e) {
      setToast(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteFeed(id) {
    if (!window.confirm("Delete this feed?")) return;
    try {
      setBusy(true);
      await api(`/xfeeds/${id}`, { method: "DELETE" });
      setFeeds((list) => list.filter((f) => f.id !== id));
      setToast("Feed deleted");
    } catch (e) {
      setToast(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= feeds.length) return;
    const next = feeds.slice();
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    // re-number orders locally
    setFeeds(next.map((f, i) => ({ ...f, order: i })));
  }

  async function saveOrder() {
    try {
      setBusy(true);
      const ids = feeds.map((f) => f.id);
      // preferred: single endpoint
      try {
        await api("/xfeeds/reorder", { method: "PUT", body: { ids } });
      } catch {
        // fallback: PUT each row with order
        await Promise.all(
          feeds.map((f, i) =>
            api(`/xfeeds/${f.id}`, { method: "PUT", body: { order: i } })
          )
        );
      }
      setToast("Order saved");
    } catch (e) {
      setToast(`Error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadPreview() {
    try {
      setPreviewLoading(true);
      const qs = new URLSearchParams({
        limit: "30",
        page: "1",
        langs: settings.langs || "en",
        maxHashtags: String(settings.maxHashtags ?? 2),
        dropPureRT: settings.dropPureRT ? "1" : "0",
      }).toString();
      const data = await api(`/xfeeds/items?${qs}`);
      setPreviewItems(data.items || []);
      setPreviewOpen(true);
    } catch (e) {
      setToast(`Preview error: ${String(e.message || e)}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setBusy(true);
      await api("/xfeeds/settings", { method: "PUT", body: settings }); // optional endpoint
      setToast("Settings saved");
    } catch (e) {
      setToast(`Settings save error: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  const sortedFeeds = useMemo(
    () => [...feeds].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [feeds]
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>X Feeds Manager (v2)</h1>

      {/* toolbar */}
      <div style={styles.toolbar}>
        <button onClick={openCreate} disabled={busy}>+ Add Feed</button>
        <button onClick={saveOrder} disabled={busy || feeds.length < 2}>Save Order</button>
        <button onClick={loadPreview} disabled={previewLoading}>Preview</button>
        <span style={{marginLeft: 12, opacity: 0.8}}>API: {API_BASE}</span>
      </div>

      {error && <div style={styles.err}>{error}</div>}
      {loading ? (
        <div style={{padding: 16}}>Loading…</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>URL</th>
              <th style={styles.th}>Lang</th>
              <th style={styles.th}>Enabled</th>
              <th style={styles.th}>Order</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFeeds.map((f, i) => (
              <tr key={f.id || f._id}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{f.name}</td>
                <td style={styles.td}><code style={styles.code}>{f.url}</code></td>
                <td style={styles.td}>{f.lang || "en"}</td>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={!!f.enabled}
                    onChange={async (e) => {
                      try {
                        const enabled = e.target.checked;
                        setFeeds((list) =>
                          list.map((x) => (x.id === f.id ? { ...x, enabled } : x))
                        );
                        await api(`/xfeeds/${f.id}`, { method: "PUT", body: { enabled } });
                      } catch (err) {
                        setToast(`Toggle error: ${String(err.message || err)}`);
                      }
                    }}
                  />
                </td>
                <td style={styles.td}>{f.order ?? i}</td>
                <td style={styles.td}>
                  <button onClick={() => move(i, -1)} disabled={i === 0 || busy}>↑</button>{" "}
                  <button onClick={() => move(i, +1)} disabled={i === feeds.length - 1 || busy}>↓</button>{" "}
                  <button onClick={() => openEdit(f)} disabled={busy}>Edit</button>{" "}
                  <button onClick={() => deleteFeed(f.id)} disabled={busy} style={styles.danger}>Delete</button>
                </td>
              </tr>
            ))}
            {sortedFeeds.length === 0 && (
              <tr><td colSpan="7" style={{ padding: 16, opacity: 0.7 }}>No feeds yet. Click “Add Feed”.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Settings */}
      <section style={styles.card}>
        <h3>Global Filters (used by preview / app defaults)</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            Allowed languages (comma):
            <input
              type="text"
              value={settings.langs}
              onChange={(e) => setSettings((s) => ({ ...s, langs: e.target.value }))}
            />
          </label>
          <label style={styles.label}>
            Max hashtags:
            <input
              type="number"
              min="0"
              max="10"
              value={settings.maxHashtags}
              onChange={(e) => setSettings((s) => ({ ...s, maxHashtags: Number(e.target.value) }))}
            />
          </label>
          <label style={styles.label}>
            Drop pure RTs:
            <input
              type="checkbox"
              checked={settings.dropPureRT}
              onChange={(e) => setSettings((s) => ({ ...s, dropPureRT: e.target.checked }))}
            />
          </label>
          <label style={styles.label}>
            Min readable words:
            <input
              type="number"
              min="0"
              max="30"
              value={settings.minReadableWords}
              onChange={(e) => setSettings((s) => ({ ...s, minReadableWords: Number(e.target.value) }))}
            />
          </label>
          <button onClick={saveSettings} disabled={busy}>Save Settings</button>
        </div>
      </section>

     {/* Add/Edit Panel */}
{editing !== null && (
  <section style={styles.card}>
    <h3>{editing && editing.id ? "Edit Feed" : "Add Feed"}</h3>
    <div style={styles.row}>
      <label style={styles.label}>
        Name
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </label>

      {/* 👇 only one style prop here */}
      <label style={{ ...styles.label, flex: 2 }}>
        RSS URL
        <input
          type="text"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
      </label>

      <label style={styles.label}>
        Lang
        <input
          type="text"
          value={form.lang}
          onChange={(e) => setForm((f) => ({ ...f, lang: e.target.value }))}
        />
      </label>

      <label style={styles.label}>
        Enabled
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
        />
      </label>
    </div>

    <div>
      <button onClick={saveFeed} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>{" "}
      <button onClick={cancelEdit} disabled={busy}>Cancel</button>
    </div>
  </section>
)}


      {/* Preview Drawer */}
      {previewOpen && (
        <div style={styles.drawerBackdrop} onClick={() => setPreviewOpen(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <strong>Preview: cleaned items</strong>
              <button onClick={() => setPreviewOpen(false)}>✕</button>
            </div>
            <div style={styles.drawerBody}>
              {previewItems.length === 0 ? (
                <div style={{ padding: 16, opacity: 0.7 }}>
                  {previewLoading ? "Loading…" : "No items."}
                </div>
              ) : (
                previewItems.map((it) => (
                  <div key={it.id} style={styles.itemCard}>
                    <div style={{ fontWeight: 700 }}>{it.authorName || "Unknown"} · <span style={{opacity:.7}}>{timeAgo(it.createdAt)}</span></div>
                    <div style={{ marginTop: 6, lineHeight: 1.25 }}>{it.textClean}</div>
                    <div style={{ marginTop: 8, opacity: .75 }}>
                      {it.thumbUrl ? <img alt="" src={it.thumbUrl} style={{width:72,height:72,objectFit:"cover",borderRadius:8,marginRight:8}}/> : null}
                      <code style={styles.code}>{it.displayDomain}</code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={styles.toast} onAnimationEnd={() => setToast("")}>{toast}</div>}
    </div>
  );
}

/* ---- helpers & styles ---- */
function timeAgo(iso) {
  const dt = new Date(iso);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return dt.toISOString().slice(0, 10);
}

const styles = {
  page: { padding: 20, color: "#fff", background: "#0b0b0b", minHeight: "100vh", fontFamily: "Inter, system-ui, Arial" },
  h1: { marginTop: 0, marginBottom: 14 },
  toolbar: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  err: { background: "#3b1e1e", border: "1px solid #6b2b2b", padding: 12, borderRadius: 8, marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse", background: "#121212", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #232323", fontWeight: 600 },
  td: { padding: "10px 12px", borderBottom: "1px solid #1e1e1e", verticalAlign: "top" },
  code: { background: "#1a1a1a", padding: "2px 6px", borderRadius: 6 },
  card: { background: "#121212", border: "1px solid #222", borderRadius: 12, padding: 14, marginTop: 16 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  label: { display: "flex", flexDirection: "column", gap: 6, minWidth: 180 },
  danger: { background: "#3a1e1e", color: "#fff", border: 0, padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  drawerBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", justifyContent: "flex-end" },
  drawer: { width: "520px", height: "100%", background: "#0f0f0f", borderLeft: "1px solid #222", display: "flex", flexDirection: "column" },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #222" },
  drawerBody: { overflow: "auto", padding: 12 },
  itemCard: { border: "1px solid #1e1e1e", borderRadius: 10, padding: 12, marginBottom: 10, background: "#131313" },
  toast: { position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "#222", border: "1px solid #444", padding: "8px 12px", borderRadius: 8, animation: "fade 2.2s forwards", }
};
