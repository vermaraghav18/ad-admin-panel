// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import axios from 'axios';

// Existing pages
import MovieManagerPage from './pages/MovieManagerPage';
import MoviePromoBannerManager from './pages/MoviePromoBannerManager';
import FeedManager from './components/FeedManager';          // ✅ Feeds
import ShortsManagerPage from './pages/ShortsManagerPage';   // ✅ Shorts
import TweetsManagerPage from './pages/TweetsManagerPage';   // ✅ Tweets
import CustomNewsManagerPage from './pages/CustomNewsManagerPage'; // ✅ Custom News
import LiveBannerManager from './pages/LiveBannerManager';
import BannerWithArticleManager from './pages/BannerWithArticleManager';
import LiveUpdateHubManager from './pages/LiveUpdateHubManager';
import BannerManagerPage from './pages/BannerManagerPage';

// ✅ Small Ads & News Hub
import SmallAdsManager from './pages/SmallAdsManager';
import NewsHubManager from './pages/NewsHubManager';

// ✅ NEW: X Feeds admin (single-page manager)
import XFeedsManager from './pages/XFeedsManager';

// ✅ NEW: Banner Configs (article-anchored injections)
import BannerConfigsPage from './pages/BannerConfigsPage';

// ✅ NEW: Feature Banner Groups (grouped, category-scoped feature banners)
import FeatureBannerGroupsManager from './pages/FeatureBannerGroupsManager';

// ✅ NEW: Cartoon Hub (this replaces the old CartoonSectionsList/CartoonSectionEdit)
import CartoonHubManager from './pages/CartoonHubManager';

import SectionsList from './pages/SectionsList';
import SectionEdit from './pages/SectionEdit';

import './App.css';

// ✅ Centralized API base (env first, then Render fallback) with trailing-slash normalization
const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com').replace(/\/$/, '');

function AdManager() {
  const [ads, setAds] = useState([]);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [target, setTarget] = useState('All');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('normal');
  const [placement, setPlacement] = useState('swipeOnly'); // 🆕 placement (swipeOnly|both)
  // 🆕 Scheduling (non-negative ints)
  const [afterNth, setAfterNth] = useState(0);
  const [repeatEvery, setRepeatEvery] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const newsCategories = [
    'All', 'Top News', 'World', 'Finance', 'Entertainment',
    'Sports', 'Technology', 'Health', 'Education', 'Politics'
  ];

  useEffect(() => { fetchAds(); }, []);

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
      return alert('All required fields must be filled');
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('link', link);
    formData.append('target', target);
    formData.append('type', type);
    formData.append('placement', placement);

    if (!isFullPage) {
      formData.append('title', title);
      formData.append('description', description);
    }

    formData.append('afterNth', String(isFullPage ? afterNth : 0));
    formData.append('repeatEvery', String(isFullPage ? repeatEvery : 0));
    formData.append('repeatCount', String(isFullPage ? repeatCount : 0));

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/ads`, formData);
      setImage(null);
      setTitle('');
      setLink('');
      setTarget('All');
      setDescription('');
      setType('normal');
      setPlacement('swipeOnly');
      setAfterNth(0);
      setRepeatEvery(0);
      setRepeatCount(0);
      fetchAds();
    } catch (err) {
      console.error('🔥 Upload failed:', err);
      alert('Upload failed');
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

  const isFullPage = type === 'fullpage';

  return (
    <div>
      <form onSubmit={handleUpload} className="form" style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <div>
          <label><strong>Image</strong></label><br />
          <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} />
        </div>

        <div>
          <label><strong>Ad Type</strong></label><br />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="fullpage">Fullpage</option>
          </select>
        </div>

        <div>
          <label><strong>Placement</strong> (where this ad can appear)</label><br />
          <select value={placement} onChange={e => setPlacement(e.target.value)}>
            <option value="swipeOnly">Swipe Only (recommended)</option>
            <option value="both">Swipe & Scroll (not recommended)</option>
          </select>
        </div>

        <div>
          <label><strong>Link</strong></label><br />
          <input
            type="text"
            placeholder="https://example.com"
            value={link}
            onChange={e => setLink(e.target.value)}
          />
        </div>

        <div>
          <label><strong>Target Category</strong></label><br />
          <select value={target} onChange={e => setTarget(e.target.value)}>
            {newsCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {!isFullPage && (
          <>
            <div>
              <label><strong>Title</strong></label><br />
              <input
                type="text"
                placeholder="Ad Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isFullPage}
              />
            </div>

            <div>
              <label><strong>Description</strong></label><br />
              <input
                type="text"
                placeholder="Short description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isFullPage}
              />
            </div>
          </>
        )}

        {isFullPage && (
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Scheduling (Fullpage Ads)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>After Nth Article</label><br />
                <input
                  type="number"
                  min="0"
                  value={afterNth}
                  onChange={e => setAfterNth(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  placeholder="e.g. 3"
                />
                <div style={{ fontSize: 12, opacity: 0.8 }}>1-based. 0 = disabled</div>
              </div>
              <div>
                <label>Repeat Every M</label><br />
                <input
                  type="number"
                  min="0"
                  value={repeatEvery}
                  onChange={e => setRepeatEvery(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  placeholder="e.g. 5"
                />
                <div style={{ fontSize: 12, opacity: 0.8 }}>0 = show only once</div>
              </div>
              <div>
                <label>Max Repeats</label><br />
                <input
                  type="number"
                  min="0"
                  value={repeatCount}
                  onChange={e => setRepeatCount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  placeholder="e.g. 2"
                />
                <div style={{ fontSize: 12, opacity: 0.8 }}>0 = unlimited</div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Ad'}
        </button>
      </form>

      <div className="ads" style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        {ads.map(ad => {
          const id = ad._id || ad.id;
          const imgSrc = ad.imageUrl?.startsWith('http')
            ? ad.imageUrl
            : `${API_BASE}${ad.imageUrl || ''}`;

          return (
            <div key={id} className="ad" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <img src={imgSrc} alt={ad.title || 'Ad image'} style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{ad.title || '—'}</h3>
                  <p style={{ margin: '4px 0' }}><em>{ad.description || '—'}</em></p>
                  <p style={{ margin: '4px 0' }}>{ad.link}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                    <div><strong>🎯 Target:</strong> {ad.target || 'All'}</div>
                    <div><strong>📐 Type:</strong> {ad.type || 'normal'}</div>
                    <div><strong>📍 Placement:</strong> {ad.placement || 'swipeOnly'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                    <div><strong>After N:</strong> {ad.afterNth ?? 0}</div>
                    <div><strong>Repeat Every:</strong> {ad.repeatEvery ?? 0}</div>
                    <div><strong>Max Repeats:</strong> {ad.repeatCount ?? 0}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Enabled:</strong> {String(ad.enabled ?? true)}
                  </div>

                  <button style={{ marginTop: 12 }} onClick={() => handleDelete(id)}>
                    ❌ Delete
                  </button>
                </div>
              </div>
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
          <Link to="/x-feeds" style={{ marginRight: '1rem' }}>𝕏 Feeds</Link>
          <Link to="/small-ads" style={{ marginRight: '1rem' }}>🧩 Small Ads</Link>
          <Link to="/live-banners" style={{ marginRight: '1rem' }}>📡 Live Banners</Link>
          <Link to="/news-hub" style={{ marginRight: '1rem' }}>🧱 News Hub</Link>
          <Link to="/banners" style={{ marginRight: '1rem' }}>📰 Banners w/ Article</Link>
          <Link to="/custom-news" style={{ marginRight: '1rem' }}>🧪 Custom News</Link>
          <Link to="/banner-manager" style={{ marginRight: '1rem' }}>🧲 Banner Manager</Link>
          <Link to="/banner-configs" style={{ marginRight: '1rem' }}>🧲 Banner Configs</Link>
          <Link to="/feature-banner-groups" style={{ marginRight: '1rem' }}>🎯 Feature Groups</Link>
          <Link to="/live-update-hub" style={{ marginRight: '1rem' }}>⚡ Live Update Hub</Link>

          {/* ✅ New single entry point for Cartoons */}
          <Link to="/cartoon-hub" style={{ marginLeft: '1rem', fontWeight: 600 }}>🎭 Cartoon Hub</Link>

          <NavLink to="/sections" style={{ marginLeft: '1rem', fontWeight: 600 }}>🧭 Sections</NavLink>
        </nav>

        <Routes>
          <Route path="/ads" element={<AdManager />} />
          <Route path="/movies" element={<MovieManagerPage />} />
          <Route path="/promo-banners" element={<MoviePromoBannerManager />} />
          <Route path="/shorts" element={<ShortsManagerPage />} />
          <Route path="/tweets" element={<TweetsManagerPage />} />
          <Route path="/feeds" element={<FeedManager />} />
          <Route path="/x-feeds" element={<XFeedsManager />} />
          <Route path="/small-ads" element={<SmallAdsManager />} />
          <Route path="/news-hub" element={<NewsHubManager />} />
          <Route path="/custom-news" element={<CustomNewsManagerPage />} />
          <Route path="/live-banners" element={<LiveBannerManager />} />
          <Route path="/banners" element={<BannerWithArticleManager />} />
          <Route path="/live-update-hub" element={<LiveUpdateHubManager />} />
          <Route path="/banner-manager" element={<BannerManagerPage />} />
          <Route path="/banner-configs" element={<BannerConfigsPage />} />
          <Route path="/feature-banner-groups" element={<FeatureBannerGroupsManager />} />

          {/* ✅ Cartoon Hub route */}
          <Route path="/cartoon-hub" element={<CartoonHubManager />} />

          {/* Sections (existing) */}
          <Route path="/sections" element={<SectionsList />} />
          <Route path="/sections/new" element={<SectionEdit />} />
          <Route path="/sections/:id" element={<SectionEdit />} />

          {/* Fallback */}
          <Route path="*" element={<AdManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
