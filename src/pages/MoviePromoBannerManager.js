import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function MoviePromoBannerManager() {
  const [banners, setBanners] = useState([]);
  const [poster, setPoster] = useState(null);
  const [rating, setRating] = useState('');
  const [votes, setVotes] = useState('');
  const [category, setCategory] = useState('Trending Now'); // ✅ New state

  const fetchBanners = async () => {
    try {
      const res = await axios.get('/api/movie-banners');
      setBanners(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch banners:", error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!poster || !rating || !votes || !category) {
      alert('Please fill all fields and upload a poster.');
      return;
    }

    const formData = new FormData();
    formData.append('poster', poster);
    formData.append('rating', parseFloat(rating));
    formData.append('votes', votes);
    formData.append('enabled', true);
    formData.append('sortIndex', 0);
    formData.append('category', category); // ✅ Include category

    try {
      await axios.post('/api/movie-banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset form
      setPoster(null);
      setRating('');
      setVotes('');
      setCategory('Trending Now');
      fetchBanners();
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Upload failed: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/movie-banners/${id}`);
      fetchBanners();
    } catch (error) {
      console.error("❌ Failed to delete banner:", error);
    }
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
          placeholder="Rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          type="number"
          step="0.1"
        />
        <input
          className="p-2 bg-gray-700"
          placeholder="Votes (e.g. 122K)"
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
        <button className="bg-blue-500 px-4 py-2 rounded">Add</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {banners.map((b) => (
          <div key={b._id} className="bg-black rounded p-2">
            <img src={b.posterUrl} alt="Banner" className="rounded" />
            <p className="text-sm mt-2">⭐ {b.rating} • {b.votes}</p>
            <p className="text-xs text-gray-400 italic">{b.category}</p> {/* ✅ Show category */}
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
