// src/pages/MoviePromoBannerManager.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';
const api = axios.create({ baseURL: API_BASE });

export default function MoviePromoBannerManager() {
  const [banners, setBanners] = useState([]);
  const [poster, setPoster] = useState(null);
  const [rating, setRating] = useState('');
  const [votes, setVotes] = useState('');
  const [category, setCategory] = useState('Trending Now');
  const [placementIndex, setPlacementIndex] = useState(5); // free-form number
  const [heading, setHeading] = useState('');
  const [targetUrl, setTargetUrl] = useState(''); // NEW: click-through link

  const fetchBanners = async () => {
    try {
      const res = await api.get('/api/movie-banners');
      const json = res.data;
      const arr = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.banners)
        ? json.banners
        : [];
      setBanners(arr);
    } catch (error) {
      console.error('❌ Failed to fetch banners:', error);
      setBanners([]);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const parseVotes = (v) => {
    const s = String(v ?? '').trim().toLowerCase();
    if (!s) return 0;
    if (s.endsWith('k')) return Math.round(parseFloat(s) * 1_000);
    if (s.endsWith('m')) return Math.round(parseFloat(s) * 1_000_000);
    const n = parseInt(s.replace(/[, ]/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poster || !rating || !votes || !category) {
      alert('Please fill all fields and upload a poster.');
      return;
    }

    const ratingNum = Number(parseFloat(rating).toFixed(1));
    const votesNum = parseVotes(votes);

    // sanitize placementIndex: integer, >= 1
    const cleanPlacement = Math.max(1, parseInt(String(placementIndex).trim(), 10) || 5);

    const formData = new FormData();
    formData.append('poster', poster);
    formData.append('rating', String(ratingNum));
    formData.append('votes', String(votesNum));
    formData.append('enabled', 'true');
    formData.append('sortIndex', '0');
    formData.append('category', category);
    formData.append('placementIndex', String(cleanPlacement));
    formData.append('heading', heading);
    formData.append('targetUrl', targetUrl); // NEW: send link

    try {
      await api.post('/api/movie-banners', formData);
      setPoster(null);
      setRating('');
      setVotes('');
      setCategory('Trending Now');
      setPlacementIndex(5);
      setHeading('');
      setTargetUrl(''); // reset
      fetchBanners();
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('❌ Upload failed:', { status, data, error });
      alert(`Upload failed: ${status ?? 'network'} ${data?.message || data?.error || ''}`.trim());
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/movie-banners/${id}`);
      fetchBanners();
    } catch (error) {
      console.error('❌ Failed to delete banner:', error);
    }
  };

  const srcFor = (p) => (p?.startsWith('http') ? p : `${API_BASE}${p}`);

  const ordinal = (n) => {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">🎬 Movie Promo Banners</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2 flex-wrap items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPoster(e.target.files[0])}
          className="p-2 bg-gray-700"
        />
        <input
          className="p-2 bg-gray-700"
          placeholder="Rating (0–10)"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          type="number"
          step="0.1"
        />
        <input
          className="p-2 bg-gray-700"
          placeholder="Votes (e.g. 12k or 12000)"
          value={votes}
          onChange={(e) => setVotes(e.target.value)}
        />
        <select
          className="p-2 bg-gray-700"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Trending Now">Trending Now</option>
          <option value="Top Rated">Top Rated</option>
          <option value="Coming Soon">Coming Soon</option>
        </select>

        {/* FREE-FORM placement number */}
        <input
          className="p-2 bg-gray-700"
          type="number"
          min={1}
          step={1}
          value={placementIndex}
          onChange={(e) => setPlacementIndex(e.target.value)}
          placeholder="Insert after Nth news card (e.g., 7)"
          title="Insert promo after this many news cards"
        />

        {/* NEW: Click-through link */}
        <input
          className="p-2 bg-gray-700"
          placeholder="Link (https://example.com)"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          title="Users will be redirected here on click"
        />

        <input
          className="p-2 bg-gray-700"
          placeholder="Heading text (shown above list)"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
        />

        <button className="bg-blue-500 px-4 py-2 rounded">Add</button>
      </form>

      {/* Optional live preview of heading (admin-only visual) */}
      {heading && <h3 className="text-lg font-semibold mb-2">{heading}</h3>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Array.isArray(banners) ? banners : []).map((b) => (
          <div key={b._id} className="bg-black rounded p-2">
            <a
              href={b.targetUrl || '#'}
              target="_blank"
              rel="noreferrer"
              title={b.targetUrl ? `Open ${b.targetUrl}` : 'No link set'}
            >
              <img src={srcFor(b.posterUrl)} alt="Banner" className="rounded" />
            </a>
            <p className="text-sm mt-2">
              ⭐ {b.rating} • {b.votes?.toLocaleString?.() ?? b.votes}
            </p>
            <p className="text-xs text-gray-400 italic">{b.category}</p>
            {b.placementIndex !== undefined && (
              <p className="text-xs text-gray-400">
                Placement: after {b.placementIndex}
                <sup>{ordinal(Number(b.placementIndex))}</sup> card
              </p>
            )}
            {b.heading && (
              <p className="text-xs text-blue-400">Heading: {b.heading}</p>
            )}
            {b.targetUrl && (
              <p className="text-xs">
                <a className="text-blue-400 underline" href={b.targetUrl} target="_blank" rel="noreferrer">
                  Open link
                </a>
              </p>
            )}
            <button
              onClick={() => handleDelete(b._id)}
              className="text-red-500 text-xs mt-1"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
