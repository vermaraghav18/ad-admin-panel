import React, { useState } from 'react';
import axios from 'axios';

// ✅ Centralized base URL: env first, then Render fallback
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

const MovieForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    releaseDate: '',
    genres: '',
    type: 'theatre',
    trailerUrl: '',
    sortIndex: 0,
    month: '',
    language: '',
    platform: '',
    summary: '',
    rating: '', // ✅ New field
  });

  const [poster, setPoster] = useState(null);
  const [cast, setCast] = useState([{ name: '', role: '', avatar: '' }]);
  const [songs, setSongs] = useState([{ title: '', artist: '' }]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poster) return alert('Poster is required');

    const data = new FormData();

    // Safely handle genres
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'genres') {
        data.append('genres', JSON.stringify(value.split(',').map((g) => g.trim()).filter(Boolean)));
      } else {
        data.append(key, value);
      }
    });

    data.append('poster', poster);
    data.append('cast', JSON.stringify(cast));
    data.append('songs', JSON.stringify(songs));

    try {
      await axios.post(`${API_BASE}/api/movies`, data);
      setForm({
        title: '',
        releaseDate: '',
        genres: '',
        type: 'theatre',
        trailerUrl: '',
        sortIndex: 0,
        month: '',
        language: '',
        platform: '',
        summary: '',
        rating: '', // ✅ Reset
      });
      setPoster(null);
      setCast([{ name: '', role: '', avatar: '' }]);
      setSongs([{ title: '', artist: '' }]);
      onSuccess && onSuccess();
    } catch (err) {
      console.error('❌ Failed to upload movie:', err);
      alert('Upload failed');
    }
  };

  const updateArrayField = (setter, index, field, value) => {
    setter((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <h2>Add Movie/Trailer</h2>

      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input name="releaseDate" placeholder="Release Date" value={form.releaseDate} onChange={handleChange} required />
      <input name="genres" placeholder="Genres (comma separated)" value={form.genres} onChange={handleChange} />
      <input name="month" placeholder="Month" value={form.month} onChange={handleChange} />
      <input name="language" placeholder="Language" value={form.language} onChange={handleChange} />
      <input name="platform" placeholder="Platform (e.g. Netflix, Theatre)" value={form.platform} onChange={handleChange} />
      <input name="summary" placeholder="Short Summary" value={form.summary} onChange={handleChange} />

      <input
        name="rating"
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="Rating (out of 10)"
        value={form.rating}
        onChange={handleChange}
      />

      <select name="type" value={form.type} onChange={handleChange}>
        <option value="theatre">Theatre</option>
        <option value="trailer">Trailer</option>
      </select>

      {form.type === 'trailer' && (
        <input name="trailerUrl" placeholder="YouTube Trailer URL" value={form.trailerUrl} onChange={handleChange} />
      )}

      <input name="sortIndex" type="number" placeholder="Sort Index" value={form.sortIndex} onChange={handleChange} />
      <input type="file" onChange={(e) => setPoster(e.target.files[0])} accept="image/*" />

      <h4>Cast</h4>
      {cast.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input placeholder="Name" value={c.name} onChange={(e) => updateArrayField(setCast, i, 'name', e.target.value)} />
          <input placeholder="Role" value={c.role} onChange={(e) => updateArrayField(setCast, i, 'role', e.target.value)} />
          <input placeholder="Avatar URL" value={c.avatar} onChange={(e) => updateArrayField(setCast, i, 'avatar', e.target.value)} />
        </div>
      ))}
      <button type="button" onClick={() => setCast([...cast, { name: '', role: '', avatar: '' }])}>+ Add Cast</button>

      <h4>Songs</h4>
      {songs.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input placeholder="Title" value={s.title} onChange={(e) => updateArrayField(setSongs, i, 'title', e.target.value)} />
          <input placeholder="Artist" value={s.artist} onChange={(e) => updateArrayField(setSongs, i, 'artist', e.target.value)} />
        </div>
      ))}
      <button type="button" onClick={() => setSongs([...songs, { title: '', artist: '' }])}>+ Add Song</button>

      <br /><br />
      <button type="submit">Upload Movie</button>
    </form>
  );
};

export default MovieForm;
