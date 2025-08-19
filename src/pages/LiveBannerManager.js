import React, { useState, useEffect } from "react";
import axios from "axios";

function LiveBannerManager() {
  const [file, setFile] = useState(null);
  const [headline, setHeadline] = useState("");
  const [articles, setArticles] = useState([
    { title: "", description: "", image: "", sourceName: "", sourceLink: "" },
  ]);
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

  const handleArticleChange = (index, field, value) => {
    const updated = [...articles];
    updated[index][field] = value;
    setArticles(updated);
  };

  const addArticleField = () => {
    setArticles([
      ...articles,
      { title: "", description: "", image: "", sourceName: "", sourceLink: "" },
    ]);
  };

  const removeArticleField = (index) => {
    const updated = [...articles];
    updated.splice(index, 1);
    setArticles(updated);
  };

  const addBanner = async () => {
    if (!file) return alert("Please select an image file");
    if (!headline.trim()) return alert("Headline is required");

    try {
      const formData = new FormData();
      formData.append("image", file); // multer field name
      formData.append("headline", headline);
      formData.append("articles", JSON.stringify(articles));

      await axios.post(API_BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setHeadline("");
      setArticles([
        { title: "", description: "", image: "", sourceName: "", sourceLink: "" },
      ]);
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

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input
        type="text"
        placeholder="Headline"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        style={{ marginLeft: 8 }}
      />

      <h3 style={{ marginTop: 16 }}>Articles</h3>
      {articles.map((article, idx) => (
        <div
          key={idx}
          style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}
        >
          <input
            type="text"
            placeholder="Title"
            value={article.title}
            onChange={(e) => handleArticleChange(idx, "title", e.target.value)}
            style={{ display: "block", marginBottom: 6 }}
          />
          <textarea
            placeholder="Description"
            value={article.description}
            onChange={(e) =>
              handleArticleChange(idx, "description", e.target.value)
            }
            style={{ display: "block", marginBottom: 6, width: "100%" }}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={article.image}
            onChange={(e) => handleArticleChange(idx, "image", e.target.value)}
            style={{ display: "block", marginBottom: 6 }}
          />
          <input
            type="text"
            placeholder="Source Name"
            value={article.sourceName}
            onChange={(e) =>
              handleArticleChange(idx, "sourceName", e.target.value)
            }
            style={{ display: "block", marginBottom: 6 }}
          />
          <input
            type="text"
            placeholder="Source Link"
            value={article.sourceLink}
            onChange={(e) =>
              handleArticleChange(idx, "sourceLink", e.target.value)
            }
            style={{ display: "block", marginBottom: 6 }}
          />
          <button onClick={() => removeArticleField(idx)}>Remove Article</button>
        </div>
      ))}

      <button onClick={addArticleField} style={{ marginTop: 8 }}>
        + Add Another Article
      </button>
      <br />
      <button onClick={addBanner} style={{ marginTop: 12 }}>
        Upload Banner
      </button>

      <h3 style={{ marginTop: 24 }}>Existing Banners</h3>
      <ul style={{ marginTop: 16 }}>
        {banners.map((b) => (
          <li key={b._id} style={{ marginBottom: 12 }}>
            <img
              src={b.mediaUrl}
              alt="banner"
              width="180"
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
