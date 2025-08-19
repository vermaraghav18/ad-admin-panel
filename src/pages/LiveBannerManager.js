import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://ad-server-qx62.onrender.com";

// ---------- helpers to create fresh objects ----------
const emptyArticle = () => ({
  imageUrl: "",
  type: "news",
  title: "",
  description: "",
  sourceName: "",
  link: "",
});

const emptySection = () => ({ heading: "", articles: [emptyArticle()] });

const emptyBanner = () => ({
  enabled: false,
  placementIndex: 1,
  headline: "",
  mediaUrl: "",        // will be filled by upload
  sections: [emptySection()],
});

// ---------- small uploader (Cloudinary via backend) ----------
async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await axios.post(`${API_BASE}/api/upload/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url; // secure_url
}

export default function LiveBannerManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBanner, setNewBanner] = useState(emptyBanner());
  const [error, setError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/api/live-banners`);
      setItems(data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load live banners");
    } finally {
      setLoading(false);
    }
  }

  async function createBanner(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API_BASE}/api/live-banners`, newBanner);
      setNewBanner(emptyBanner());
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function saveBannerPartial(id, patch) {
    try {
      await axios.patch(`${API_BASE}/api/live-banners/${id}`, patch);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  }

  async function deleteBanner(id) {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await axios.delete(`${API_BASE}/api/live-banners/${id}`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  // ---- Section (heading) helpers ----
  async function addSection(id, heading) {
    if (!heading.trim()) return alert("Heading required");
    try {
      await axios.post(`${API_BASE}/api/live-banners/${id}/sections`, { heading });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Add section failed");
    }
  }

  async function updateSection(id, sIdx, heading) {
    try {
      await axios.patch(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}`, { heading });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Update section failed");
    }
  }

  async function deleteSection(id, sIdx) {
    if (!window.confirm("Delete this section?")) return;
    try {
      await axios.delete(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Delete section failed");
    }
  }

  // ---- Article helpers ----
  async function addArticle(id, sIdx, article) {
    if (!article.title.trim()) return alert("Article title required");
    try {
      await axios.post(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles`, article);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Add article failed");
    }
  }

  async function updateArticle(id, sIdx, aIdx, articlePatch) {
    try {
      await axios.patch(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles/${aIdx}`, articlePatch);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Update article failed");
    }
  }

  async function deleteArticle(id, sIdx, aIdx) {
    if (!window.confirm("Delete this article?")) return;
    try {
      await axios.delete(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles/${aIdx}`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Delete article failed");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>📡 Live Banners</h2>

      {/* Create form */}
      <form
        onSubmit={createBanner}
        style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}
      >
        <h3 style={{ marginTop: 0 }}>➕ Create Live Banner</h3>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            Headline
            <input
              type="text"
              value={newBanner.headline}
              onChange={(e) => setNewBanner({ ...newBanner, headline: e.target.value })}
              placeholder="Banner headline"
            />
          </label>

          <label>
            Placement Index (after Nth article)
            <input
              type="number"
              value={newBanner.placementIndex}
              min={1}
              onChange={(e) =>
                setNewBanner({ ...newBanner, placementIndex: Number(e.target.value || 1) })
              }
            />
          </label>

          <label>
            Media (upload)
            <input
              type="file"
              accept="image/*,video/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadToCloudinary(f);
                setNewBanner({ ...newBanner, mediaUrl: url });
              }}
            />
            {newBanner.mediaUrl && (
              <div style={{ marginTop: 6 }}>
                <img src={newBanner.mediaUrl} alt="" style={{ maxHeight: 80, borderRadius: 6 }} />
              </div>
            )}
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={newBanner.enabled}
              onChange={(e) => setNewBanner({ ...newBanner, enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Banner"}
          </button>
        </div>
      </form>

      {/* Existing banners list */}
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>{error}</p>
      ) : items.length === 0 ? (
        <p>No live banners yet.</p>
      ) : (
        items.map((b) => (
          <BannerCard
            key={b._id}
            banner={b}
            onSavePartial={saveBannerPartial}
            onDelete={deleteBanner}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onAddArticle={addArticle}
            onUpdateArticle={updateArticle}
            onDeleteArticle={deleteArticle}
          />
        ))
      )}
    </div>
  );
}

/* ---------------- Banner Card ---------------- */

function BannerCard({
  banner,
  onSavePartial,
  onDelete,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
}) {
  const [local, setLocal] = useState({
    headline: banner.headline || "",
    mediaUrl: banner.mediaUrl || "",
    placementIndex: Number(banner.placementIndex || 1),
    enabled: !!banner.enabled,
  });

  const [newHeading, setNewHeading] = useState("");
  const [newArticleIdx, setNewArticleIdx] = useState(-1);
  const [editArticle, setEditArticle] = useState(null); // {sIdx, aIdx, data}

  function saveBasics() {
    onSavePartial(banner._id, {
      headline: local.headline,
      mediaUrl: local.mediaUrl,
      placementIndex: local.placementIndex,
      enabled: local.enabled,
    });
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, marginBottom: 18, padding: 12 }}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Headline
          <input
            type="text"
            value={local.headline}
            onChange={(e) => setLocal({ ...local, headline: e.target.value })}
          />
        </label>

        <label>
          Placement Index
          <input
            type="number"
            min={1}
            value={local.placementIndex}
            onChange={(e) =>
              setLocal({ ...local, placementIndex: Number(e.target.value || 1) })
            }
          />
        </label>

        <label>
          Media (upload)
          <input
            type="file"
            accept="image/*,video/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = await uploadToCloudinary(f);
              setLocal((s) => ({ ...s, mediaUrl: url }));
            }}
          />
          {local.mediaUrl && (
            <div style={{ marginTop: 6 }}>
              <img src={local.mediaUrl} alt="" style={{ maxHeight: 80, borderRadius: 6 }} />
            </div>
          )}
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={local.enabled}
            onChange={(e) => setLocal({ ...local, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button onClick={saveBasics}>Save</button>
        <button onClick={() => onDelete(banner._id)} style={{ color: "crimson" }}>
          Delete
        </button>
      </div>

      {/* Sections */}
      <div style={{ marginTop: 14 }}>
        <h4 style={{ margin: "8px 0" }}>Sections</h4>

        {banner.sections?.length ? (
          banner.sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ border: "1px dashed #ccc", borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto", alignItems: "center" }}>
                <input
                  type="text"
                  defaultValue={sec.heading}
                  onBlur={(e) => onUpdateSection(banner._id, sIdx, e.target.value)}
                />
                <button onClick={() => setNewArticleIdx(newArticleIdx === sIdx ? -1 : sIdx)}>
                  {newArticleIdx === sIdx ? "Close" : "➕ Add Article"}
                </button>
                <button onClick={() => onDeleteSection(banner._id, sIdx)} style={{ color: "crimson" }}>
                  Delete Section
                </button>
              </div>

              {/* Articles list */}
              <div style={{ marginTop: 8 }}>
                {(sec.articles || []).map((a, aIdx) => (
                  <div
                    key={aIdx}
                    style={{
                      display: "grid",
                      gap: 8,
                      gridTemplateColumns: "1fr auto auto",
                      padding: 8,
                      marginBottom: 6,
                      background: "#fafafa",
                      borderRadius: 6,
                    }}
                  >
                    {editArticle && editArticle.sIdx === sIdx && editArticle.aIdx === aIdx ? (
                      <ArticleForm
                        data={editArticle.data}
                        onChange={(d) => setEditArticle({ ...editArticle, data: d })}
                      />
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{a.sourceName} • {a.link}</div>
                        {a.imageUrl && <img src={a.imageUrl} alt="" style={{ height: 48, marginTop: 6, borderRadius: 4 }} />}
                      </div>
                    )}

                    {editArticle && editArticle.sIdx === sIdx && editArticle.aIdx === aIdx ? (
                      <>
                        <button
                          onClick={() => {
                            onUpdateArticle(banner._id, sIdx, aIdx, editArticle.data);
                            setEditArticle(null);
                          }}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditArticle(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setEditArticle({
                              sIdx,
                              aIdx,
                              data: {
                                imageUrl: a.imageUrl || "",
                                type: a.type || "news",
                                title: a.title || "",
                                description: a.description || "",
                                sourceName: a.sourceName || "",
                                link: a.link || "",
                              },
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteArticle(banner._id, sIdx, aIdx)}
                          style={{ color: "crimson" }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add article form */}
              {newArticleIdx === sIdx && (
                <InlineAddArticleForm
                  onSubmit={(article) => { onAddArticle(banner._id, sIdx, article); setNewArticleIdx(-1); }}
                />
              )}
            </div>
          ))
        ) : (
          <p style={{ opacity: 0.7 }}>No sections yet.</p>
        )}

        {/* Add section */}
        <AddSectionInput onAdd={(h) => addSection(banner._id, h)} />
      </div>
    </div>
  );
}

function AddSectionInput({ onAdd }) {
  const [heading, setHeading] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        type="text"
        placeholder="New section heading"
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
      />
      <button
        onClick={() => {
          const h = heading.trim();
          if (!h) return;
          onAdd(h);
          setHeading("");
        }}
      >
        Add Section
      </button>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function InlineAddArticleForm({ onSubmit }) {
  const [data, setData] = useState(emptyArticle());
  return (
    <div style={{ marginTop: 8, padding: 10, border: "1px dashed #ccc", borderRadius: 6, background: "#fbfbfb" }}>
      <ArticleForm data={data} onChange={setData} />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSubmit(data)}>Add Article</button>
      </div>
    </div>
  );
}

function ArticleForm({ data, onChange }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input type="text" placeholder="Title" value={data.title}
             onChange={(e) => onChange({ ...data, title: e.target.value })} />
      <input type="text" placeholder="Link" value={data.link}
             onChange={(e) => onChange({ ...data, link: e.target.value })} />

      {/* Upload instead of URL */}
      <label>
        Image (upload)
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await uploadToCloudinary(f);
            onChange({ ...data, imageUrl: url });
          }}
        />
      </label>
      {data.imageUrl && <img src={data.imageUrl} alt="" style={{ height: 56, borderRadius: 6 }} />}

      <input type="text" placeholder="Source name" value={data.sourceName}
             onChange={(e) => onChange({ ...data, sourceName: e.target.value })} />
      <textarea rows={3} placeholder="Description" value={data.description}
                onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <select value={data.type} onChange={(e) => onChange({ ...data, type: e.target.value })}>
        <option value="news">news</option>
        <option value="update">update</option>
        <option value="alert">alert</option>
      </select>
    </div>
  );
}
