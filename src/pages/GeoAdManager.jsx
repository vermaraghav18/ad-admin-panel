import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

function GeoAdManager() {
  const [ads, setAds] = useState([]);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('normal');
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [afterNth, setAfterNth] = useState(0);
  const [repeatEvery, setRepeatEvery] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const availableCities = ['Top News','Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad','Jalandhar'];
  const availableStates = ['Top News','Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana','West Bengal','Punjab'];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/geo-ads`);
      setAds(res.data);
    } catch (err) {
      console.error('Failed to fetch geo ads:', err);
      alert('Could not load geo ads.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image || !link) return alert('Image and link are required.');

    const formData = new FormData();
    formData.append('image', image);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('link', link);
    formData.append('type', type);
    formData.append('cities', JSON.stringify(cities));
    formData.append('states', JSON.stringify(states));
    formData.append('afterNth', afterNth);
    formData.append('repeatEvery', repeatEvery);
    formData.append('repeatCount', repeatCount);

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/geo-ads`, formData);
      setImage(null);
      setTitle('');
      setDescription('');
      setLink('');
      setType('normal');
      setCities([]);
      setStates([]);
      setAfterNth(0);
      setRepeatEvery(0);
      setRepeatCount(0);
      fetchAds();
    } catch (err) {
      console.error('Geo Ad upload failed:', err);
      alert('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Geo Ad?')) return;
    try {
      await axios.delete(`${API_BASE}/api/geo-ads/${id}`);
      fetchAds();
    } catch (err) {
      console.error('Failed to delete geo ad:', err);
      alert('Delete failed.');
    }
  };

  return (
    <div>
      <h2>🌍 City/State Targeted Ads</h2>

      <form onSubmit={handleUpload} className="form" style={{ maxWidth: 720, display: 'grid', gap: 12 }}>
        <div>
          <label>📸 Image</label><br />
          <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} />
        </div>

        <div>
          <label>🔗 Link</label><br />
          <input type="text" value={link} onChange={e => setLink(e.target.value)} required />
        </div>

        <div>
          <label>📝 Title</label><br />
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label>🗒 Description</label><br />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div>
          <label>📐 Type</label><br />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="fullpage">Fullpage</option>
          </select>
        </div>

        <div>
          <label>🏙 Target Cities</label><br />
          <select multiple value={cities} onChange={e => setCities([...e.target.selectedOptions].map(o => o.value))}>
            {availableCities.map(city => <option key={city}>{city}</option>)}
          </select>
        </div>

        <div>
          <label>🏞 Target States</label><br />
          <select multiple value={states} onChange={e => setStates([...e.target.selectedOptions].map(o => o.value))}>
            {availableStates.map(state => <option key={state}>{state}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <label>After Nth</label><br />
            <input type="number" min="0" value={afterNth} onChange={e => setAfterNth(e.target.value)} />
          </div>
          <div>
            <label>Repeat Every</label><br />
            <input type="number" min="0" value={repeatEvery} onChange={e => setRepeatEvery(e.target.value)} />
          </div>
          <div>
            <label>Max Repeats</label><br />
            <input type="number" min="0" value={repeatCount} onChange={e => setRepeatCount(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload Geo Ad'}</button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <div>
        <h3>📋 Existing Geo Ads</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          {ads.map(ad => (
            <div key={ad._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <img src={ad.imageUrl} alt="ad" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6 }} />
                <div>
                  <h4>{ad.title || 'Untitled'}</h4>
                  <p>{ad.description}</p>
                  <p><strong>Link:</strong> {ad.link}</p>
                  <p><strong>Type:</strong> {ad.type}</p>
                  <p><strong>Cities:</strong> {ad.cities?.join(', ') || '—'}</p>
                  <p><strong>States:</strong> {ad.states?.join(', ') || '—'}</p>
                  <p><strong>After N:</strong> {ad.afterNth}</p>
                  <p><strong>Repeat Every:</strong> {ad.repeatEvery}</p>
                  <p><strong>Max Repeats:</strong> {ad.repeatCount}</p>
                  <p><strong>Enabled:</strong> {String(ad.enabled)}</p>
                  <button onClick={() => handleDelete(ad._id)}>❌ Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GeoAdManager;
