import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BannerWithArticleManager() {
  const [bannerFile, setBannerFile] = useState(null);
  const [articleFile, setArticleFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [position, setPosition] = useState(1);
  const [banners, setBanners] = useState([]);

  const API_BASE =
    (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') + '/api/banners';

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(API_BASE);
      setBanners(res.data);
    } catch (err) {
      console.error('Error fetching banners:', err);
      alert('Failed to load banners');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bannerFile || !articleFile) return alert('Please select both images');

    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      formData.append('articleImage', articleFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('source', source);
      formData.append('position', position);

      await axios.post(API_BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Banner created successfully');
      setBannerFile(null);
      setArticleFile(null);
      setTitle('');
      setDescription('');
      setSource('');
      setPosition(1);
      fetchBanners();
    } catch (err) {
      console.error('Error creating banner:', err);
      alert('Failed to create banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert('Failed to delete banner');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📢 Banner With Article Manager</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div>
          <label>Banner Image: </label>
          <input type="file" onChange={(e) => setBannerFile(e.target.files[0])} required />
        </div>
        <div>
          <label>Article Image: </label>
          <input type="file" onChange={(e) => setArticleFile(e.target.files[0])} required />
        </div>
        <div>
          <label>Title: </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description: </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div>
          <label>Source: </label>
          <input value={source} onChange={(e) => setSource(e.target.value)} required />
        </div>
        <div>
          <label>Position (nth card): </label>
          <input
            type="number"
            value={position}
            min="1"
            onChange={(e) => setPosition(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Banner</button>
      </form>

      {/* Banner List */}
      <h3>Existing Banners</h3>
      <ul>
        {banners.map((b) => (
          <li key={b._id} style={{ marginBottom: '20px' }}>
            <img src={b.bannerUrl} alt="banner" width="200" /><br />
            <strong>{b.article.title}</strong> (after card {b.position})<br />
            <em>{b.article.source}</em><br />
            <button onClick={() => handleDelete(b._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BannerWithArticleManager;
