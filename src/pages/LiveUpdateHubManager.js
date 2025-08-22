import React, { useEffect, useMemo, useState } from "react";

// Base API URL: uses env when present, otherwise falls back to your Render URL.
const API_BASE =
  process.env.REACT_APP_API_BASE?.replace(/\/$/, "") ||
  "https://ad-server-qx62.onrender.com";

// Helpers
const jsonHeaders = { "Content-Type": "application/json" };
const pretty = (v) => JSON.stringify(v, null, 2);

export default function LiveUpdateHubManager() {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]); // [{...section, entries: [...]}, ...]
  const [error, setError] = useState("");

  // Section form state
  const [name, setName] = useState("");
  const [heading, setHeading] = useState("");
  const [placementIndex, setPlacementIndex] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const [enabled, setEnabled] = useState(true);

  // Edit section state (inline)
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSection, setEditSection] = useState({
    name: "",
    heading: "",
    placementIndex: "",
    sortIndex: 0,
    enabled: true,
  });

  // Entry form state (per section)
  const initialEntryForm = {
    title: "",
    description: "",
    targetUrl: "",
    sortIndex: 0,
    enabled: true,
    media: null,
    source: "", // ✅ include source in initial form state
  };
  const [entryForms, setEntryForms] = useState({}); // { [sectionId]: { ...fields } }

  const grouped = useMemo(() => {
    // Group sections by placementIndex for display
    const map = new Map();
    for (const s of sections) {
      const key = s.placementIndex || 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    // Sort each placement by sortIndex
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [sections]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/live-update-hub`);
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -------- Sections --------
  async function createSection(e) {
    e.preventDefault();
    setError("");
    try {
      const body = {
        name: name.trim(),
        heading: heading.trim(),
        placementIndex: Number(placementIndex),
        sortIndex: Number(sortIndex) || 0,
        enabled: !!enabled,
      };
      const res = await fetch(`${API_BASE}/api/live-update-hub/sections`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create section failed: ${res.status} ${txt}`);
      }
      // reset form
      setName("");
      setHeading("");
      setPlacementIndex("");
      setSortIndex(0);
      setEnabled(true);
      await load();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  function beginEditSection(s) {
    setEditingSectionId(s._id);
    setEditSection({
      name: s.name || "",
      heading: s.heading || "",
      placementIndex: s.placementIndex ?? "",
      sortIndex: s.sortIndex ?? 0,
      enabled: !!s.enabled,
    });
  }

  async function saveEditSection(id) {
    setError("");
    try {
      const body = {
        name: editSection.name.trim(),
        heading: editSection.heading.trim(),
        placementIndex: Number(editSection.placementIndex),
        sortIndex: Number(editSection.sortIndex) || 0,
        enabled: !!editSection.enabled,
      };
      const res = await fetch(`${API_BASE}/api/live-update-hub/sections/${id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Update section failed: ${res.status} ${txt}`);
      }
      setEditingSectionId(null);
      await load();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function deleteSection(id) {
    if (!window.confirm("Delete this section and all its entries?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/live-update-hub/sections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete section failed: ${res.status} ${txt}`);
      }
      await load();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  // -------- Entries --------
  function onEntryField(sectionId, field, value) {
    setEntryForms((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || initialEntryForm), [field]: value },
    }));
  }

  function resetEntryForm(sectionId) {
    setEntryForms((prev) => ({ ...prev, [sectionId]: { ...initialEntryForm } }));
  }

  async function createEntry(sectionId, e) {
    e.preventDefault();
    const form = entryForms[sectionId] || initialEntryForm;
    if (!form.media) {
      alert("Please choose an image.");
      return;
    }
    setError("");
    try {
      // IMPORTANT: the backend expects field name **media** for the file
      const fd = new FormData();
      fd.append("media", form.media);
      fd.append("title", (form.title || "").trim());
      fd.append("description", (form.description || "").trim());
      if (form.targetUrl) fd.append("targetUrl", form.targetUrl.trim());
      if (form.source) fd.append("source", form.source.trim()); // ✅ send source
      fd.append("sortIndex", String(Number(form.sortIndex) || 0));
      fd.append("enabled", String(!!form.enabled));

      const res = await fetch(`${API_BASE}/api/live-update-hub/sections/${sectionId}/entries`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create entry failed: ${res.status} ${txt}`);
      }
      resetEntryForm(sectionId);
      await load();
    } catch (e2) {
      setError(String(e2.message || e2));
    }
  }

  async function toggleEntryEnabled(entryId, current) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/live-update-hub/entries/${entryId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ enabled: !current }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Toggle entry failed: ${res.status} ${txt}`);
      }
      await load();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function deleteEntry(entryId) {
    if (!window.confirm("Delete this entry?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/live-update-hub/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete entry failed: ${res.status} ${txt}`);
      }
      await load();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">⚡ Live Update Hub</h1>
      <p className="text-sm text-gray-500 mb-4">
        Manage sections and entries. Images are uploaded to Cloudinary. Entries appear in the app if the section and the entry are <b>enabled</b>.
      </p>

      {error ? (
        <div className="p-2 mb-4 bg-red-100 text-red-700 rounded">Error: {error}</div>
      ) : null}

      {/* Create Section */}
      <div className="border rounded p-3 mb-6">
        <h2 className="font-semibold mb-2">Create Section</h2>
        <form onSubmit={createSection} className="grid gap-2 md:grid-cols-2">
          <label className="flex flex-col">
            <span className="text-sm">Name (slug)</span>
            <input className="border p-2 rounded" value={name} onChange={(e) => setName(e.target.value)} placeholder="breaking" required />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Heading (display)</span>
            <input className="border p-2 rounded" value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="More Updates For You" required />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Placement Index</span>
            <input className="border p-2 rounded" value={placementIndex} onChange={(e) => setPlacementIndex(e.target.value)} placeholder="1" required />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Sort Index</span>
            <input className="border p-2 rounded" type="number" value={sortIndex} onChange={(e) => setSortIndex(e.target.value)} placeholder="0" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Enabled</span>
          </label>
          <div className="md:col-span-2">
            <button className="bg-black text-white px-4 py-2 rounded">Create</button>
          </div>
        </form>
      </div>

      {/* Sections & Entries */}
      <div className="space-y-6">
        {loading ? <div className="italic">Loading…</div> : null}
        {!loading && sections.length === 0 ? <div className="text-gray-500">No sections yet.</div> : null}

        {grouped.map(([placement, list]) => (
          <div key={placement} className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Placement {placement}</h3>
              <span className="text-xs text-gray-500">{list.length} section(s)</span>
            </div>

            <div className="space-y-4">
              {list.map((s) => (
                <div key={s._id} className="border rounded p-3 bg-gray-50">
                  {/* Section header / edit */}
                  {editingSectionId === s._id ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="flex flex-col">
                        <span className="text-sm">Name</span>
                        <input className="border p-2 rounded" value={editSection.name} onChange={(e) => setEditSection({ ...editSection, name: e.target.value })} />
                      </label>
                      <label className="flex flex-col">
                        <span className="text-sm">Heading</span>
                        <input className="border p-2 rounded" value={editSection.heading} onChange={(e) => setEditSection({ ...editSection, heading: e.target.value })} />
                      </label>
                      <label className="flex flex-col">
                        <span className="text-sm">Placement Index</span>
                        <input className="border p-2 rounded" value={editSection.placementIndex} onChange={(e) => setEditSection({ ...editSection, placementIndex: e.target.value })} />
                      </label>
                      <label className="flex flex-col">
                        <span className="text-sm">Sort Index</span>
                        <input className="border p-2 rounded" type="number" value={editSection.sortIndex} onChange={(e) => setEditSection({ ...editSection, sortIndex: e.target.value })} />
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editSection.enabled} onChange={(e) => setEditSection({ ...editSection, enabled: e.target.checked })} />
                        <span>Enabled</span>
                      </label>
                      <div className="md:col-span-2 flex gap-2">
                        <button className="bg-black text-white px-3 py-2 rounded" onClick={() => saveEditSection(s._id)}>Save</button>
                        <button className="px-3 py-2 rounded border" onClick={() => setEditingSectionId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">
                          {s.heading} <span className="text-xs text-gray-500">({s.name})</span>
                          {!s.enabled ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-300">disabled</span> : null}
                        </div>
                        <div className="text-xs text-gray-600">
                          placementIndex: {s.placementIndex} • sortIndex: {s.sortIndex}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded border" onClick={() => beginEditSection(s)}>Edit</button>
                        <button className="px-3 py-1 rounded border border-red-500 text-red-600" onClick={() => deleteSection(s._id)}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Entries list */}
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Entries ({s.entries?.length || 0})</div>
                    <div className="grid gap-2">
                      {(s.entries || []).map((e) => (
                        <div key={e._id} className="flex items-center justify-between p-2 rounded border bg-white">
                          <div className="flex items-center gap-3">
                            <img
                              src={e.imageUrl}
                              alt=""
                              style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 6 }}
                              onError={(ev) => (ev.currentTarget.style.visibility = "hidden")}
                            />
                            <div>
                              <div className="font-medium">
                                {e.title} {!e.enabled ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-300">disabled</span> : null}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-1">{e.description}</div>
                              <div className="text-xs text-gray-600">
                                sortIndex: {e.sortIndex}
                                {e.targetUrl ? <> • <a href={e.targetUrl} target="_blank" rel="noreferrer" className="underline">link</a></> : null}
                                {e.source ? <> • source: <span className="italic">{e.source}</span></> : null} {/* ✅ show source */}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-1 rounded border" onClick={() => toggleEntryEnabled(e._id, e.enabled)}>
                              {e.enabled ? "Disable" : "Enable"}
                            </button>
                            <button className="px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => deleteEntry(e._id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create entry form */}
                  <form className="mt-3 grid gap-2 md:grid-cols-3" onSubmit={(ev) => createEntry(s._id, ev)}>
                    <label className="flex flex-col">
                      <span className="text-sm">Title</span>
                      <input
                        className="border p-2 rounded"
                        value={entryForms[s._id]?.title || ""}
                        onChange={(e) => onEntryField(s._id, "title", e.target.value)}
                        required
                      />
                    </label>
                    <label className="flex flex-col md:col-span-2">
                      <span className="text-sm">Description</span>
                      <input
                        className="border p-2 rounded"
                        value={entryForms[s._id]?.description || ""}
                        onChange={(e) => onEntryField(s._id, "description", e.target.value)}
                        required
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-sm">Target URL (optional)</span>
                      <input
                        className="border p-2 rounded"
                        value={entryForms[s._id]?.targetUrl || ""}
                        onChange={(e) => onEntryField(s._id, "targetUrl", e.target.value)}
                        placeholder="https://example.com"
                      />
                    </label>

                    {/* ✅ NEW: Source */}
                    <label className="flex flex-col">
                      <span className="text-sm">Source (e.g., Reuters)</span>
                      <input
                        className="border p-2 rounded"
                        value={entryForms[s._id]?.source || ""}
                        onChange={(e) => onEntryField(s._id, "source", e.target.value)}
                        placeholder="BBC, Reuters, ANI, etc."
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-sm">Sort Index</span>
                      <input
                        type="number"
                        className="border p-2 rounded"
                        value={entryForms[s._id]?.sortIndex ?? 0}
                        onChange={(e) => onEntryField(s._id, "sortIndex", e.target.value)}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={entryForms[s._id]?.enabled ?? true}
                        onChange={(e) => onEntryField(s._id, "enabled", e.target.checked)}
                      />
                      <span>Enabled</span>
                    </label>
                    <label className="flex flex-col md:col-span-2">
                      <span className="text-sm">Image (field name must be <b>media</b>)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="border p-2 rounded"
                        onChange={(e) => onEntryField(s._id, "media", e.target.files?.[0] || null)}
                        required
                      />
                    </label>
                    <div className="md:col-span-3">
                      <button className="bg-black text-white px-4 py-2 rounded">Add Entry</button>
                    </div>
                  </form>
                </div>
              ))}
            </div>

            {/* Raw JSON (debug) */}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-gray-500">Debug: JSON payload for this placement</summary>
              <pre className="text-xs bg-white p-2 border rounded overflow-auto">{pretty(list)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
