import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieForm from '../components/MovieForm';
import MovieList from '../components/MovieList';

// ✅ Env first; fallback to Render
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';

const MovieManagerPage = () => {
  const [movies, setMovies] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [theatreRes, trailerRes] = await Promise.all([
          axios.get(`${API_BASE}/api/theatre-movies`),
          axios.get(`${API_BASE}/api/trailer-movies`)
        ]);
        setMovies([...theatreRes.data, ...trailerRes.data]);
      } catch (err) {
        console.error('❌ Failed to fetch movies:', err);
        alert('Could not load movies from server.');
      }
    }
    fetchAll();
  }, [refresh]);

  return (
    <div style={{ padding: '2rem', background: '#121212', color: 'white' }}>
      <h1>🎬 Movie Manager</h1>
      <MovieForm onSuccess={() => setRefresh(!refresh)} />
      <MovieList movies={movies} onRefresh={() => setRefresh(!refresh)} />
    </div>
  );
};

export default MovieManagerPage;
