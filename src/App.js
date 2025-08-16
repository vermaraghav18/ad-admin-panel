import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// Existing pages
import MovieManagerPage from './pages/MovieManagerPage';
import MoviePromoBannerManager from './pages/MoviePromoBannerManager';
import FeedManager from './components/FeedManager'; // ✅ Feeds
import ShortsManagerPage from './pages/ShortsManagerPage'; // ✅ Shorts
import TweetsManagerPage from './pages/TweetsManagerPage'; // ✅ Tweets
import CustomNewsManagerPage from './pages/CustomNewsManagerPage'; // ✅ Custom News

// ✅ NEW: Small Ads page
import SmallAdsManager from './pages/SmallAdsManager';

import './App.css';

// ✅ Centralized API base (env first, then Render fallback)
const API_BASE =
  process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

function AdManager() {
  const [ads, setAds] = useState([]);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [target, setTarget] = useState('All');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('normal');
  const [loading, setLoading] = useState(false);

  const newsCategories = [
    'All', 'Top News', 'World', 'Finance', 'Entertainment',
    'Sports', 'Technology', 'Health', 'Education', 'Politics'
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ads`);
      setAds(res.data);
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      alert('Could not load ads from server.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const isFullPage = type === 'fullpage';

    if (!image || !link || (!isFullPage && (!title || !description))) {
      return alert("All required fields must be filled");
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('link', link);
    formData.append('target', target);
    formData.append('type', type);

    if (!isFullPage) {
      formData.append('title', title);
      formData.append('description', description);
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/ads`, formData);
      setImage(null);
      setTitle('');
      setLink('');
      setTarget('All');
      setDescription('');
      setType('normal');
      fetchAds();
    } catch (err) {
      console.error("🔥 Upload failed:", err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/ads/${id}`);
      fetchAds();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete ad.');
    }
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="form">
        <input type="file" onChange={e => setImage(e.target.files[0])} />
        <input
          type="text"
          placeholder="Ad Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={type === 'fullpage'}
        />
        <input
          type="text"
          placeholder="Link"
          value={link}
          onChange={e => setLink(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={type === 'fullpage'}
        />

        <select value={target} onChange={e => setTarget(e.target.value)}>
          {newsCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="normal">Normal</option>
          <option value="fullpage">Fullpage</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Ad"}
        </button>
      </form>

      <div className="ads">
        {ads.map(ad => {
          const id = ad._id || ad.id; // ✅ normalize id for delete/key
          return (
            <div key={id} className="ad">
              <img
                src={ad.imageUrl?.startsWith('http') ? ad.imageUrl : `${API_BASE}${ad.imageUrl}`}
                alt={ad.title || 'Ad image'}
              />
              <h3>{ad.title || '—'}</h3>
              <p><em>{ad.description || '—'}</em></p>
              <p>{ad.link}</p>
              <p><strong>🎯 Target:</strong> {ad.target || 'All'}</p>
              <p><strong>📐 Type:</strong> {ad.type || 'normal'}</p>
              <button onClick={() => handleDelete(id)}>❌ Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <h1>🎯 Admin Panel</h1>

        <nav style={{ marginBottom: '2rem' }}>
          <Link to="/ads" style={{ marginRight: '1rem' }}>📢 Ads</Link>
          <Link to="/movies" style={{ marginRight: '1rem' }}>🎬 Movies</Link>
          <Link to="/promo-banners" style={{ marginRight: '1rem' }}>🖼 Promo Banners</Link>
          <Link to="/shorts" style={{ marginRight: '1rem' }}>▶️ Shorts</Link>
          <Link to="/tweets" style={{ marginRight: '1rem' }}>🐦 Tweets</Link>
          <Link to="/feeds" style={{ marginRight: '1rem' }}>📰 Feeds</Link>
          <Link to="/small-ads" style={{ marginRight: '1rem' }}>🧩 Small Ads</Link> {/* ✅ NEW */}
          <Link to="/custom-news">🧪 Custom News</Link>
        </nav>

        <Routes>
          <Route path="/ads" element={<AdManager />} />
          <Route path="/movies" element={<MovieManagerPage />} />
          <Route path="/promo-banners" element={<MoviePromoBannerManager />} />
          <Route path="/shorts" element={<ShortsManagerPage />} />
          <Route path="/tweets" element={<TweetsManagerPage />} />
          <Route path="/feeds" element={<FeedManager />} />
          <Route path="/small-ads" element={<SmallAdsManager />} /> {/* ✅ NEW */}
          <Route path="/custom-news" element={<CustomNewsManagerPage />} />
          <Route path="*" element={<AdManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
