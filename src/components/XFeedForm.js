import React, { useState } from "react";

// 🔁 uses your env var
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function XFeedForm({ onCreated }) {
  const [name, setName] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!rssUrl.trim()) {
      setError("RSS URL is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/xfeeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "X Feed",
          rssUrl: rssUrl.trim(),
          enabled,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setRssUrl("");
      setEnabled(true);
      onCreated && onCreated();
    } catch (err) {
      setError(err.message || "Failed to create feed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={styles.card}>
      <h3 style={styles.h3}>Add X Feed</h3>

      <label style={styles.label}>Display Name (optional)</label>
      <input
        style={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., @OpenAI"
      />

      <label style={styles.label}>RSS URL *</label>
      <input
        style={styles.input}
        value={rssUrl}
        onChange={(e) => setRssUrl(e.target.value)}
        placeholder="https://nitter.net/username/rss  or  your proxy URL"
        required
      />

      <label style={{ ...styles.label, display: "inline-flex", gap: 8 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enabled
      </label>

      {error && <div style={styles.error}>{error}</div>}

      <button type="submit" disabled={saving} style={styles.button}>
        {saving ? "Saving..." : "Add Feed"}
      </button>
    </form>
  );
}

const styles = {
  card: { background: "#111", border: "1px solid #333", borderRadius: 12, padding: 16, marginBottom: 16, color: "#eee" },
  h3: { marginTop: 0 },
  label: { fontSize: 13, color: "#aaa", marginTop: 8, display: "block" },
  input: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#1a1a1a", color: "#eee" },
  button: { marginTop: 12, padding: "10px 14px", borderRadius: 8, border: 0, background: "#3b82f6", color: "#fff", cursor: "pointer" },
  error: { marginTop: 8, color: "#ff6b6b", fontSize: 13 },
};
