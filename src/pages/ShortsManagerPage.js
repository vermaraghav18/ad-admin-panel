// ad-admin-panel/src/pages/ShortsManagerPage.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ShortsForm from "../components/ShortsForm";
import ShortsList from "../components/ShortsList";

// ✅ Env first; fallback to Render URL
const API_BASE = process.env.REACT_APP_API_BASE || "https://ad-server-qx62.onrender.com";

const DEFAULT_SECTIONS = [
  "Top News",
  "India",
  "Entertainment",
  "Movies",
  "All",
];

export default function ShortsManagerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterSection, setFilterSection] = useState("");
  const [error, setError] = useState("");

  // ---- Import UI state ----
  const [rssUrl, setRssUrl] = useState("");
  const [importSourceName, setImportSourceName] = useState("Brut");
  const [importSections, setImportSections] = useState(["Top News"]);
  const [importShowInNews, setImportShowInNews] = useState(true);
  const [importShowInMovies, setImportShowInMovies] = useState(false);
  const [importN, setImportN] = useState(5);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const sections = useMemo(() => DEFAULT_SECTIONS, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filterSection) params.section = filterSection;
      const res = await axios.get(`${API_BASE}/api/shorts`, { params });
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load shorts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSection]);

  const handleCreate = async (payload) => {
    await axios.post(`${API_BASE}/api/shorts`, payload);
    setEditing(null);
    await fetchData();
  };

  const handleUpdate = async (id, payload) => {
    await axios.put(`${API_BASE}/api/shorts/${id}`, payload);
    setEditing(null);
    await fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this short item?")) return;
    await axios.delete(`${API_BASE}/api/shorts/${id}`);
    await fetchData();
  };

  const handleToggleEnabled = async (id, enabled) => {
    await axios.put(`${API_BASE}/api/shorts/${id}`, { enabled });
    await fetchData();
  };

  const handleBumpSort = async (id, delta) => {
    const found = items.find((x) => x._id === id);
    if (!found) return;
    const nextIndex = (found.sortIndex || 0) + delta;
    await axios.put(`${API_BASE}/api/shorts/${id}`, { sortIndex: nextIndex });
    await fetchData();
  };

  // ---- Import handler ----
  const doImport = async () => {
    try {
      setImporting(true);
      setImportMsg("");
      if (!rssUrl.trim()) {
        alert("Paste an RSS URL first.");
        return;
      }
      const payload = {
        rssUrl: rssUrl.trim(),
        sourceName: importSourceName.trim() || "RSS",
        sections: importSections,
        showInNews: importShowInNews,
        showInMovies: importShowInMovies,
        injectEveryNCards: Number(importN) || 5,
      };
      const res = await axios.post(`${API_BASE}/api/shorts/import-simple`, payload);
      setImportMsg(`Imported ${res.data?.count ?? 0} items.`);
      await fetchData();
    } catch (e) {
      console.error(e);
      setImportMsg("Import failed. Check the URL and try again.");
    } finally {
      setImporting(false);
    }
  };

  const toggleImportSection = (s) => {
    setImportSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.concat(s)
    );
  };

  return (
    <div style={{ padding: 20, color: "#eaeaea", background: "#121212", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 12 }}>Shorts Manager</h1>

      {/* ---- Import from RSS ---- */}
      <div style={{ marginBottom: 16, border: "1px solid #333", borderRadius: 8, padding: 12, background: "#0b1220" }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Import from RSS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="text"
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            placeholder="https://rss.app/feeds/xxxx.xml"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
          <input
            type="text"
            value={importSourceName}
            onChange={(e) => setImportSourceName(e.target.value)}
            placeholder="Source name (e.g., Brut)"
            style={{ padding: 8, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={importShowInNews} onChange={(e) => setImportShowInNews(e.target.checked)} />
              <span>Show in News</span>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={importShowInMovies} onChange={(e) => setImportShowInMovies(e.target.checked)} />
              <span>Show in Movies</span>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>Inject N</span>
              <input
                type="number"
                value={importN}
                onChange={(e) => setImportN(e.target.value)}
                min="1"
                style={{ width: 70, padding: 6, background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
              />
            </label>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Sections</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEFAULT_SECTIONS.map((s) => {
                const active = importSections.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleImportSection(s)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #333",
                      background: active ? "#334155" : "#1f2937",
                      color: "#fff",
                      cursor: "pointer",
                      borderRadius: 6,
                    }}
                  >
                    {active ? "✓ " : ""}{s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={doImport}
            disabled={importing}
            style={{ padding: "8px 12px", border: "1px solid #333", background: "#2563eb", color: "#fff", cursor: "pointer" }}
          >
            {importing ? "Importing…" : "Import"}
          </button>
          {importMsg && <span style={{ color: "#a3e635" }}>{importMsg}</span>}
        </div>
      </div>

      {/* Filters + Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <label>
          <span style={{ marginRight: 8 }}>Filter by section:</span>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            style={{ padding: "6px 10px", background: "#1e1e1e", color: "#fff", border: "1px solid #333" }}
          >
            <option value="">All</option>
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setEditing({})}
          style={{ padding: "8px 12px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
        >
          + Add Short
        </button>

        <button
          onClick={fetchData}
          style={{ padding: "8px 12px", border: "1px solid #333", background: "#1f2937", color: "#fff", cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      {/* Create/Edit form */}
      {editing && (
        <div style={{ marginBottom: 16, border: "1px solid #333", borderRadius: 8, padding: 12, background: "#0f172a" }}>
          <ShortsForm
            baseSections={sections}
            initialValue={editing._id ? editing : null}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              if (editing._id) {
                await handleUpdate(editing._id, data);
              } else {
                await handleCreate(data);
              }
            }}
          />
        </div>
      )}

      {error && <div style={{ color: "#ff6b6b", marginBottom: 12 }}>{error}</div>}

      {/* List */}
      <ShortsList
        items={items}
        loading={loading}
        onEdit={(row) => setEditing(row)}
        onDelete={handleDelete}
        onToggleEnabled={handleToggleEnabled}
        onBumpSort={handleBumpSort}
      />
    </div>
  );
}
