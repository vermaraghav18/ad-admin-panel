// src/api/index.js
import axios from 'axios';

const base =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  'https://ad-server-qx62.onrender.com';

const api = axios.create({
  baseURL: `${base}/api`,
  timeout: 15000,
});

export default api;
