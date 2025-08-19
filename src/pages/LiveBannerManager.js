import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LiveBannerManager() {
  const [imageUrl, setImageUrl] = useState('');
  const [position, setPosition] = useState(1);
  const [banners, setBanners] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL + '/live-banners';

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const res = await axios.get(API_BASE);
    setBanners(res.data);
  };

  const addBanner = async () => {
    await axios.post(API_BASE, { imageUrl, position });
    setImageUrl('');
    setPosition(1);
    fetchBanners();
  };

  const deleteBanner = async (id) => {
    await axios.delete(`${API_BASE}/${id}`);
    fetchBanners();
  };

  return (
    <div>
      <h2>Live Banner Manager</h2>
      <input 
        type="text" 
        placeholder="Image URL" 
        value={imageUrl} 
        onChange={(e) => setImageUrl(e.target.value)} 
      />
      <input 
        type="number" 
        placeholder="Position" 
        value={position} 
        onChange={(e) => setPosition(e.target.value)} 
      />
      <button onClick={addBanner}>Add Banner</button>

      <ul>
        {banners.map(b => (
          <li key={b._id}>
            <img src={b.imageUrl} alt="banner" width="120" />
            <span>Position: {b.position}</span>
            <button onClick={() => deleteBanner(b._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LiveBannerManager;
