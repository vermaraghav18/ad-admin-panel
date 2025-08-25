import React, { useEffect, useState } from "react";

/* ✅ Use env base and normalize trailing slash */
const RAW_API_BASE = process.env.REACT_APP_API_BASE || "https://ad-server-qx62.onrender.com";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");
const XFEEDS_URL = `${API_BASE}/api/xfeeds`;

export default function XFeedsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(XFEEDS_URL);
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setErr(e.message || "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (it) => {
    try {
      const res = await fetch(`${XFEEDS_URL}/${it._id}`, {
        method: "PATCH",                           // ✅ matches router.patch('/:id'…)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !it.enabled }),
      });
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
        throw new Error(msg);
      }
      load();
    } catch (e) {
      alert(`Update failed: ${e.message || "Unknown error"}`);
    }
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.name || it.rssUrl}"?`)) return;
    try {
      const res = await fetch(`${XFEEDS_URL}/${it._id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
        throw new Error(msg);
      }
      load();
    } catch (e) {
      alert(`Delete failed: ${e.message || "Unknown error"}`);
    }
  };

  if (loading) return <div style={styles.muted}>Loading…</div>;
  if (err) return <div style={styles.error}>{err}</div>;
  if (!items.length) return <div style={styles.muted}>No X feeds yet.</div>;

  return (
    <div style={styles.card}>
      <h3 style={styles.h3}>Existing X Feeds</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>RSS URL</th>
            <th style={styles.th}>Enabled</th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td style={styles.td}>{it.name || "X Feed"}</td>
              <td
                style={{
                  ...styles.td,
                  maxWidth: 420,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={it.rssUrl}
              >
                <a href={it.rssUrl} target="_blank" rel="noreferrer">
                  {it.rssUrl}
                </a>
              </td>
              <td style={styles.td}>{it.enabled ? "Yes" : "No"}</td>
              <td style={styles.tdRight}>
                <button style={styles.smallBtn} onClick={() => toggle(it)}>
                  {it.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  style={{ ...styles.smallBtn, background: "#ef4444" }}
                  onClick={() => remove(it)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: { background: "#111", border: "1px solid #333", borderRadius: 12, padding: 16, color: "#eee" },
  h3: { marginTop: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", borderBottom: "1px solid #333", padding: "8px 6px", color: "#aaa", fontWeight: 600, fontSize: 13 },
  td: { borderBottom: "1px solid #222", padding: "8px 6px", fontSize: 14 },
  tdRight: { borderBottom: "1px solid #222", padding: "8px 6px", textAlign: "right", whiteSpace: "nowrap" },
  smallBtn: { marginLeft: 6, padding: "6px 10px", borderRadius: 8, border: 0, background: "#374151", color: "#fff", cursor: "pointer" },
  muted: { color: "#aaa" },
  error: { color: "#ff6b6b" },
};
