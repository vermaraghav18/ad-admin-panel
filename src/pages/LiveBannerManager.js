// src/pages/LiveBannerManager.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ad-server-qx62.onrender.com/api/live-banners';

export default function LiveBannerManager() {
  const [banners, setBanners] = useState([]);
  const [headline, setHeadline] = useState('');
  const [placementIndex, setPlacementIndex] = useState(1);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(API_URL);
      setBanners(res.data);
    } catch (err) {
      console.error('Error fetching banners', err);
    }
  };

  const createBanner = async () => {
    try {
      const newBanner = {
        headline,
        placementIndex,
        enabled,
        sections: [],
      };
      await axios.post(API_URL, newBanner);
      fetchBanners();
      setHeadline('');
      setPlacementIndex(1);
      setEnabled(false);
    } catch (err) {
      alert('Failed to create banner');
    }
  };

  const updateBanner = async (id, updatedBanner) => {
    try {
      await axios.put(`${API_URL}/${id}`, updatedBanner);
      fetchBanners();
    } catch (err) {
      alert('Failed to update banner');
    }
  };

  const deleteBanner = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete banner');
    }
  };

  const addSection = (banner, heading) => {
    const updated = {
      ...banner,
      sections: [...banner.sections, { heading, articles: [] }],
    };
    updateBanner(banner._id, updated);
  };

  const addArticle = (banner, sectionIndex, article) => {
    const updatedSections = [...banner.sections];
    updatedSections[sectionIndex].articles.push(article);
    updateBanner(banner._id, { ...banner, sections: updatedSections });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📢 Live Banner Manager</h2>

      <div style={{ marginBottom: 20 }}>
        <h3>Create Live Banner</h3>
        <input
          placeholder="Banner headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
        <input
          type="number"
          placeholder="Placement Index"
          value={placementIndex}
          onChange={(e) => setPlacementIndex(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <button onClick={createBanner}>Create Banner</button>
      </div>

      {banners.map((banner, bIndex) => (
        <div key={banner._id} style={{ border: '1px solid #ccc', marginBottom: 15, padding: 10 }}>
          <h4>{banner.headline}</h4>
          <p>Placement Index: {banner.placementIndex}</p>
          <label>
            <input
              type="checkbox"
              checked={banner.enabled}
              onChange={(e) =>
                updateBanner(banner._id, { ...banner, enabled: e.target.checked })
              }
            />
            Enabled
          </label>
          <button onClick={() => deleteBanner(banner._id)}>Delete</button>

          <div>
            <h5>Sections</h5>
            {banner.sections.map((section, sIndex) => (
              <div key={sIndex} style={{ marginBottom: 10 }}>
                <strong>{section.heading}</strong>
                <ul>
                  {section.articles.map((article, aIndex) => (
                    <li key={aIndex}>
                      {article.title || 'Untitled'} - {article.url || 'No URL'}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    addArticle(banner, sIndex, {
                      title: prompt('Enter article title (optional)') || '',
                      url: prompt('Enter article URL (optional)') || '',
                    })
                  }
                >
                  Add Article
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                addSection(banner, prompt('Enter section heading') || 'Untitled')
              }
            >
              Add Section
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
