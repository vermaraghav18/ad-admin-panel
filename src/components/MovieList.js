import React from 'react';
import axios from 'axios';

// ✅ Env first; fallback to Render URL
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';
const MOVIES_API = `${API_BASE}/api/movies`;

const MovieList = ({ movies, onRefresh }) => {
  const toggleEnabled = async (movie) => {
    try {
      await axios.put(`${MOVIES_API}/${movie._id}`, {
        enabled: !movie.enabled,
      });
      onRefresh();
    } catch (err) {
      console.error('❌ Failed to toggle movie:', err);
      alert('Failed to update movie.');
    }
  };

  const deleteMovie = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await axios.delete(`${MOVIES_API}/${id}`);
        onRefresh();
      } catch (err) {
        console.error('❌ Failed to delete movie:', err);
        alert('Failed to delete movie.');
      }
    }
  };

  return (
    <div>
      <h2>All Movies & Trailers</h2>
      {movies.map((movie) => (
        <div
          key={movie._id}
          style={{
            background: '#1E1E1E',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: 8,
            color: 'white',
          }}
        >
          {/* ✅ If posterUrl is already a full http(s) URL (Cloudinary), use it directly.
              Otherwise, prefix with API_BASE for any server-hosted relative paths. */}
          <img
            src={movie.posterUrl?.startsWith('http') ? movie.posterUrl : `${API_BASE}${movie.posterUrl}`}
            alt={movie.title}
            style={{ height: 100 }}
          />

          <div>
            <strong>{movie.title}</strong> ({movie.type})
          </div>
          <div>
            {movie.releaseDate} | {movie.genres?.join(', ')}
          </div>
          <div>
            Month: {movie.month || '—'} | Language: {movie.language || '—'}
          </div>
          <div>Platform: {movie.platform || '—'}</div>
          <div>Sort Index: {movie.sortIndex}</div>
          <div>Status: {movie.enabled ? '✅ Enabled' : '❌ Disabled'}</div>

          {movie.summary && (
            <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
              Summary: {movie.summary}
            </div>
          )}

          {movie.cast?.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Cast:</strong>
              <ul style={{ marginTop: 4, marginBottom: 4 }}>
                {movie.cast.map((actor, idx) => (
                  <li key={idx}>
                    {actor.name} as <em>{actor.role}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {movie.songs?.length > 0 && (
            <div>
              <strong>Songs:</strong>
              <ul style={{ marginTop: 4 }}>
                {movie.songs.map((song, idx) => (
                  <li key={idx}>
                    {song.title} – {song.artist}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => toggleEnabled(movie)}>
              {movie.enabled ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => deleteMovie(movie._id)} style={{ marginLeft: 8 }}>
              🗑 Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovieList;
