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

  const addArticle = () => {
    setArticles([
      ...articles,
      { title: "", description: "", image: "", sourceName: "", sourceLink: "" },
    ]);
  };

  const removeArticle = (index) => {
    const updated = articles.filter((_, i) => i !== index);
    setArticles(updated);
  };

  const addBanner = async () => {
    if (!file) return alert("Please select an image file");
    if (!headline.trim()) return alert("Please enter a headline");

    try {
      const formData = new FormData();
      formData.append("image", file); // multer field
      formData.append("headline", headline);
      formData.append("articles", JSON.stringify(articles)); // stringify array

      await axios.post(API_BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset state
      setFile(null);
      setHeadline("");
      setArticles([
        {
          title: "",
          description: "",
          image: "",
          sourceName: "",
          sourceLink: "",
        },
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
    <div style={{ padding: 20 }}>
      <h2>Live Banner Manager</h2>

      {/* Upload Image + Headline */}
      <div>
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
      </div>

      {/* Articles Section */}
      <h3 style={{ marginTop: 20 }}>Articles</h3>
      {articles.map((a, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={a.title}
            onChange={(e) => handleArticleChange(i, "title", e.target.value)}
          />
          <br />
          <textarea
            placeholder="Description"
            value={a.description}
            onChange={(e) =>
              handleArticleChange(i, "description", e.target.value)
            }
            style={{ width: "100%", marginTop: 4 }}
          />
          <br />
          <input
            type="text"
            placeholder="Image URL"
            value={a.image}
            onChange={(e) => handleArticleChange(i, "image", e.target.value)}
          />
          <br />
          <input
            type="text"
            placeholder="Source Name"
            value={a.sourceName}
            onChange={(e) =>
              handleArticleChange(i, "sourceName", e.target.value)
            }
          />
          <br />
          <input
            type="text"
            placeholder="Source Link"
            value={a.sourceLink}
            onChange={(e) =>
              handleArticleChange(i, "sourceLink", e.target.value)
            }
          />
          <br />
          <button
            onClick={() => removeArticle(i)}
            style={{ marginTop: 6, color: "red" }}
          >
            Remove Article
          </button>
        </div>
      ))}

      <button onClick={addArticle} style={{ marginTop: 10 }}>
        + Add Another Article
      </button>
      <br />

      <button onClick={addBanner} style={{ marginTop: 20 }}>
        Upload Banner
      </button>

      {/* Banner List */}
      <ul style={{ marginTop: 30 }}>
        {banners.map((b) => (
          <li key={b._id} style={{ marginBottom: 16 }}>
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
