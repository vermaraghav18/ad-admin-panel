import React, { useState, useEffect } from "react";
import axios from "axios";

function LiveBannerManager() {
  const [file, setFile] = useState(null);
  const [headline, setHeadline] = useState("");
  const [articles, setArticles] = useState([]);
  const [banners, setBanners] = useState([]);

  const API_BASE =
    (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "") +
    "/api/live-banners";

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(API_BASE);
      setBanners(res.data);
    } catch (err) {
      console.error("Error fetching live banners:", err);
      alert("Failed to load live banners");
    }
  };

  const addArticle = () => {
    setArticles([
      ...articles,
      { title: "", description: "", sourceName: "", sourceLink: "" },
    ]);
  };

  const updateArticle = (index, field, value) => {
    const updated = [...articles];
    updated[index][field] = value;
    setArticles(updated);
  };

  const removeArticle = (index) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const addBanner = async () => {
    if (!file) return alert("Please select a banner image");

    try {
      const formData = new FormData();
      formData.append("image", file); // banner image only
      formData.append("headline", headline);
      formData.append("articles", JSON.stringify(articles));

      await axios.post(API_BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setHeadline("");
      setArticles([]);
      fetchBanners();
    } catch (err) {
      console.error("Error adding banner:", err);
      alert("Upload failed");
    }
  };

  const deleteBanner = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchBanners();
    } catch (err) {
      console.error("Error deleting banner:", err);
      alert("Delete failed");
    }
  };

  return (
    <div>
      <h2>Live Banner Manager</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <input
        type="text"
        placeholder="Headline"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        style={{ marginLeft: 8 }}
      />

      <h3>Articles</h3>
      {articles.map((a, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: 12,
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={a.title}
            onChange={(e) => updateArticle(idx, "title", e.target.value)}
            style={{ display: "block", marginBottom: 6 }}
          />
          <textarea
            placeholder="Description"
            value={a.description}
            onChange={(e) => updateArticle(idx, "description", e.target.value)}
            style={{ display: "block", marginBottom: 6, width: "100%" }}
          />
          <input
            type="text"
            placeholder="Source Name"
            value={a.sourceName}
            onChange={(e) => updateArticle(idx, "sourceName", e.target.value)}
            style={{ display: "block", marginBottom: 6 }}
          />
          <input
            type="text"
            placeholder="Source Link"
            value={a.sourceLink}
            onChange={(e) => updateArticle(idx, "sourceLink", e.target.value)}
            style={{ display: "block", marginBottom: 6 }}
          />
          <button onClick={() => removeArticle(idx)}>Remove Article</button>
        </div>
      ))}

      <button onClick={addArticle} style={{ marginTop: 8 }}>
        + Add Another Article
      </button>

      <br />
      <button onClick={addBanner} style={{ marginTop: 12 }}>
        Upload Banner
      </button>

      <ul style={{ marginTop: 20 }}>
        {banners.map((b) => (
          <li key={b._id} style={{ marginBottom: 12 }}>
            <img
              src={b.mediaUrl}
              alt="banner"
              width="200"
              style={{ display: "block", marginBottom: 6 }}
            />
            <strong>{b.headline}</strong>
            <button
              onClick={() => deleteBanner(b._id)}
              style={{ marginLeft: 8 }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LiveBannerManager;
