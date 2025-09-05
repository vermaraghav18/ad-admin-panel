// admin/src/services/videosApi.js
const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '')
  .replace(/\/api$/, ''); // ensure no trailing /api

const BASE = `${API_BASE}/api/videos`;

export const listSections = () => fetch(`${BASE}/sections`).then(r => r.json());
export const getSection = (id) => fetch(`${BASE}/sections/${id}`).then(r => r.json());
export const createSection = (payload) =>
  fetch(`${BASE}/sections`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.json());
export const updateSection = (id, payload) =>
  fetch(`${BASE}/sections/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.json());
export const deleteSection = (id) =>
  fetch(`${BASE}/sections/${id}`, { method: 'DELETE' }).then(r => r.json());

export const listEntries = (sectionId) =>
  fetch(`${BASE}/entries?sectionId=${encodeURIComponent(sectionId)}`).then(r => r.json());
export const createEntry = (payload) =>
  fetch(`${BASE}/entries`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.json());
export const updateEntry = (id, payload) =>
  fetch(`${BASE}/entries/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.json());
export const deleteEntry = (id) =>
  fetch(`${BASE}/entries/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getPlan = (params) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/plan?${q}`).then(r => r.json());
};
