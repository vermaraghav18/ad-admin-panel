// src/services/spotlightApi.js
const API_BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '');

async function j(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  }
  return res.json();
}

/* ----------------------- Sections ----------------------- */
export function listSpotlightSections() {
  return j('GET', '/api/spotlights/sections');
}
export function getSpotlightSection(id) {
  return j('GET', `/api/spotlights/sections/${id}`);
}
export function createSpotlightSection(payload) {
  return j('POST', '/api/spotlights/sections', payload);
}
export function updateSpotlightSection(id, payload) {
  return j('PUT', `/api/spotlights/sections/${id}`, payload);
}
export function deleteSpotlightSection(id) {
  return j('DELETE', `/api/spotlights/sections/${id}`);
}

/* ------------------------ Entries ----------------------- */
export function listSpotlights() {
  return j('GET', '/api/spotlights/entries');
}
export function getSpotlight(id) {
  return j('GET', `/api/spotlights/entries/${id}`);
}
export function createSpotlight(payload) {
  return j('POST', '/api/spotlights/entries', payload);
}
export function updateSpotlight(id, payload) {
  return j('PUT', `/api/spotlights/entries/${id}`, payload);
}
export function deleteSpotlight(id) {
  return j('DELETE', `/api/spotlights/entries/${id}`);
}

/* ------------- Convenience named + default -------------- */
export const SpotlightApi = {
  // sections
  listSections: listSpotlightSections,
  getSection: getSpotlightSection,
  createSection: createSpotlightSection,
  updateSection: updateSpotlightSection,
  deleteSection: deleteSpotlightSection,
  // entries
  list: listSpotlights,
  get: getSpotlight,
  create: createSpotlight,
  update: updateSpotlight,
  delete: deleteSpotlight,
};

export default SpotlightApi;
