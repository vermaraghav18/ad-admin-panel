import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LiveBannerManager() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState(1);
  const [banners, setBanners] = useState([]);

  const API_BASE =
    (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') + '/api/live-banners';

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(API_BASE);
      setBanners(res.data);
    } catch (err) {
      console.error('Error fetching live banners:', err);
      alert('Failed to load live banners');
    }
  };

  const addBanner = async () => {
    if (!file) return alert('Please select an image file');

    try {
      const formData = new FormData();
      formData.append('image', file);                // <-- matches multer field name
      formData.append('position', String(position)); // keep it a string

      await axios.post(API_BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFile(null);
      setPosition(1);
      fetchBanners();
    } catch (err) {
      console.error('Error adding banner:', err);
      alert('Upload failed');
    }
  };

  const deleteBanner = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert('Delete failed');
    }
  };

  return (
    <div>
      <h2>Live Banner Manager</h2>

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input
        type="number"
        min="1"
        step="1"
        placeholder="Position"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value) || 1)}
        style={{ marginLeft: 8 }}
      />
      <button onClick={addBanner} style={{ marginLeft: 8 }}>Upload Banner</button>

      <ul style={{ marginTop: 16 }}>
        {banners.map((b) => (
          <li key={b._id} style={{ marginBottom: 12 }}>
            <img src={b.imageUrl} alt="banner" width="180" style={{ display: 'block', marginBottom: 6 }} />
            <span>Position: {b.position}</span>
            <button onClick={() => deleteBanner(b._id)} style={{ marginLeft: 8 }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LiveBannerManager;
