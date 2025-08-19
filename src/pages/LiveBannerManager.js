import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://ad-server-qx62.onrender.com";

/* ---------------- Helpers & factories ---------------- */

const emptyArticle = () => ({
  type: "news",
  title: "",
  description: "",
  sourceName: "",
  link: "",
  // image handled via <input type="file">
});

const emptySection = () => ({
  heading: "",
  articles: [],
});

const emptyBanner = () => ({
  enabled: false,
  placementIndex: 1,
  headline: "",
  // media handled via <input type="file">
});

/* ---------------- Page: LiveBannerManager ---------------- */

export default function LiveBannerManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBanner, setNewBanner] = useState(emptyBanner());
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

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

  // Create banner (JSON), then optional media upload
  async function createBanner(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/live-banners`, newBanner);
      const created = data; // { _id, ... }

      if (newMediaFile) {
        const fd = new FormData();
        fd.append("media", newMediaFile);
        await axios.post(`${API_BASE}/api/live-banners/${created._id}/media`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setNewBanner(emptyBanner());
      setNewMediaFile(null);
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

  async function uploadBannerMedia(id, file) {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("media", file);
      await axios.post(`${API_BASE}/api/live-banners/${id}/media`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Media upload failed");
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
      await axios.patch(`${API_BASE}/api/live-banners/${id}/sections/${sIdx}`, {
        heading,
      });
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

  // ---- Article helpers (JSON or multipart if image provided) ----
  async function addArticle(id, sIdx, fields, imageFile) {
    try {
      if (imageFile) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v ?? ""));
        fd.append("image", imageFile);
        await axios.post(
          `${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(
          `${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles`,
          fields
        );
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Add article failed");
    }
  }

  async function updateArticle(id, sIdx, aIdx, fields, imageFile) {
    try {
      if (imageFile) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v ?? ""));
        fd.append("image", imageFile);
        await axios.patch(
          `${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles/${aIdx}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.patch(
          `${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles/${aIdx}`,
          fields
        );
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Update article failed");
    }
  }

  async function deleteArticle(id, sIdx, aIdx) {
    if (!window.confirm("Delete this article?")) return;
    try {
      await axios.delete(
        `${API_BASE}/api/live-banners/${id}/sections/${sIdx}/articles/${aIdx}`
      );
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Delete article failed");
    }
  }

  /* ------------- UI ------------- */

  return (
    <div style={{ padding: 16 }}>
      <h2>📡 Live Banners</h2>

      {/* Create form */}
      <form
        onSubmit={createBanner}
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h3 style={{ marginTop: 0 }}>➕ Create Live Banner</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            Headline
            <input
              type="text"
              value={newBanner.headline}
              onChange={(e) =>
                setNewBanner({ ...newBanner, headline: e.target.value })
              }
              placeholder="Banner headline"
            />
          </label>

          <label>
            Placement Index (after Nth article)
            <input
              type="number"
              min={1}
              value={newBanner.placementIndex}
              onChange={(e) =>
                setNewBanner({
                  ...newBanner,
                  placementIndex: Number(e.target.value || 1),
                })
              }
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={newBanner.enabled}
              onChange={(e) =>
                setNewBanner({ ...newBanner, enabled: e.target.checked })
              }
            />
            Enabled
          </label>

          <label>
            Media (image/video)
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Banner"}
          </button>
        </div>
      </form>

      {/* List existing banners */}
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
            onUploadMedia={uploadBannerMedia}
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
  onUploadMedia,
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
    placementIndex: Number(banner.placementIndex || 1),
    enabled: !!banner.enabled,
  });

  const [newHeading, setNewHeading] = useState("");
  const [newArticleIdx, setNewArticleIdx] = useState(-1); // section index adding new article
  const [editArticle, setEditArticle] = useState(null); // {sIdx, aIdx, data, imageFile}

  function saveBasics() {
    onSavePartial(banner._id, {
      headline: local.headline,
      placementIndex: local.placementIndex,
      enabled: local.enabled,
    });
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        marginBottom: 18,
        padding: 12,
      }}
    >
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
              setLocal({
                ...local,
                placementIndex: Number(e.target.value || 1),
              })
            }
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={local.enabled}
            onChange={(e) => setLocal({ ...local, enabled: e.target.checked })}
          />
          Enabled
        </label>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
            Media (image/video)
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) =>
              onUploadMedia(banner._id, e.target.files?.[0] || null)
            }
          />
          {banner.mediaUrl ? (
            <div style={{ marginTop: 6 }}>
              <small>Current:</small>{" "}
              <a href={banner.mediaUrl} target="_blank" rel="noreferrer">
                open
              </a>
            </div>
          ) : (
            <div style={{ marginTop: 6, opacity: 0.6 }}>
              <small>No media uploaded</small>
            </div>
          )}
        </div>
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

        {banner.sections && banner.sections.length > 0 ? (
          banner.sections.map((sec, sIdx) => (
            <div
              key={sIdx}
              style={{
                border: "1px dashed #ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  defaultValue={sec.heading}
                  onBlur={(e) => onUpdateSection(banner._id, sIdx, e.target.value)}
                />
                <button
                  onClick={() =>
                    setNewArticleIdx(newArticleIdx === sIdx ? -1 : sIdx)
                  }
                >
                  {newArticleIdx === sIdx ? "Close" : "➕ Add Article"}
                </button>
                <button
                  onClick={() => onDeleteSection(banner._id, sIdx)}
                  style={{ color: "crimson" }}
                >
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
                    {editArticle &&
                    editArticle.sIdx === sIdx &&
                    editArticle.aIdx === aIdx ? (
                      <ArticleForm
                        data={editArticle.data}
                        imageFile={editArticle.imageFile || null}
                        onChange={(d) =>
                          setEditArticle({ ...editArticle, data: d })
                        }
                        onImageChange={(f) =>
                          setEditArticle({ ...editArticle, imageFile: f })
                        }
                      />
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {a.sourceName} • {a.link}
                        </div>
                      </div>
                    )}

                    {editArticle &&
                    editArticle.sIdx === sIdx &&
                    editArticle.aIdx === aIdx ? (
                      <>
                        <button
                          onClick={() => {
                            onUpdateArticle(
                              banner._id,
                              sIdx,
                              aIdx,
                              editArticle.data,
                              editArticle.imageFile || null
                            );
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
                                type: a.type || "news",
                                title: a.title || "",
                                description: a.description || "",
                                sourceName: a.sourceName || "",
                                link: a.link || "",
                              },
                              imageFile: null,
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
                  onSubmit={(fields, file) => {
                    onAddArticle(banner._id, sIdx, fields, file);
                    setNewArticleIdx(-1);
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <p style={{ opacity: 0.7 }}>No sections yet.</p>
        )}

        {/* Add section */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            placeholder="New section heading"
            value={newHeading}
            onChange={(e) => setNewHeading(e.target.value)}
          />
          <button
            onClick={() => {
              onAddSection(banner._id, newHeading.trim()); // ✅ use prop
              setNewHeading("");
            }}
          >
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small subcomponents ---------------- */

function InlineAddArticleForm({ onSubmit }) {
  const [data, setData] = useState(emptyArticle());
  const [file, setFile] = useState(null);

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        border: "1px dashed #ccc",
        borderRadius: 6,
        background: "#fbfbfb",
      }}
    >
      <ArticleForm
        data={data}
        imageFile={file}
        onChange={setData}
        onImageChange={setFile}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSubmit(data, file)}>Add Article</button>
      </div>
    </div>
  );
}

function ArticleForm({ data, onChange, imageFile, onImageChange }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        type="text"
        placeholder="Title"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />
      <input
        type="text"
        placeholder="Link"
        value={data.link}
        onChange={(e) => onChange({ ...data, link: e.target.value })}
      />
      <input
        type="text"
        placeholder="Source name"
        value={data.sourceName}
        onChange={(e) => onChange({ ...data, sourceName: e.target.value })}
      />
      <textarea
        rows={3}
        placeholder="Description"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
      />
      <select
        value={data.type}
        onChange={(e) => onChange({ ...data, type: e.target.value })}
      >
        <option value="news">news</option>
        <option value="update">update</option>
        <option value="alert">alert</option>
      </select>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
          Article Image
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
        />
        {imageFile ? (
          <div style={{ marginTop: 6, fontSize: 12 }}>
            Selected: <em>{imageFile.name}</em>
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
            No new image selected
          </div>
        )}
      </div>
    </div>
  );
}
