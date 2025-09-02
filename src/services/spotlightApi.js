// src/services/spotlightApi.js
import axios from 'axios';

/**
 * Build a stable ROOT so calls always hit `${ROOT}/api/spotlights/...`
 * Works locally and on Render/Vercel.
 */
const ROOT = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '')      // strip trailing slash(es)
  .replace(/\/api$/, '');   // strip a trailing /api if present (we add it below)

const api = axios.create({
  baseURL: `${ROOT}/api/spotlights`,
  // withCredentials: true, // enable if you add auth/cookies later
});

/* ---------------------------- helpers ---------------------------- */
function idOf(obj) {
  return obj && (obj._id || obj.id);
}

async function request(promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    // Surface a helpful error for the UI/console
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      String(err);
    console.error('[SpotlightApi] request failed:', msg, err?.response || '');
    throw new Error(msg);
  }
}

/* ------------------------------ API ------------------------------ */
const SpotlightApi = {
  // -------- Sections --------
  listSections(params = {}) {
    // params: { scope?, city?, state? }
    return request(api.get('/sections', { params }));
  },

  getSection(id) {
    return request(api.get(`/sections/${id}`));
  },

  upsertSection(section) {
    const id = idOf(section);
    return id
      ? request(api.put(`/sections/${id}`, section))
      : request(api.post('/sections', section));
  },

  deleteSection(id) {
    return request(api.delete(`/sections/${id}`));
  },

  // -------- Entries --------
  listEntries(params = {}) {
    // params: { sectionId?, status? ('live' | 'dead'), page?, limit? }
    return request(api.get('/entries', { params }));
  },

  getEntry(id) {
    return request(api.get(`/entries/${id}`));
  },

  createEntry(entry) {
    return request(api.post('/entries', entry));
  },

  upsertEntry(entry) {
    const id = idOf(entry);
    return id
      ? request(api.put(`/entries/${id}`, entry))
      : request(api.post('/entries', entry));
  },

  deleteEntry(id) {
    return request(api.delete(`/entries/${id}`));
  },
};

/* --------------------------- exports ----------------------------- */
// Default export (recommended): import SpotlightApi from '../services/spotlightApi'
export default SpotlightApi;

// Named export (for compatibility): import { SpotlightApi } from '../services/spotlightApi'
export { SpotlightApi };

// Optional extra named exports if you like calling functions directly:
export const listSections   = (...a) => SpotlightApi.listSections(...a);
export const getSection     = (...a) => SpotlightApi.getSection(...a);
export const upsertSection  = (...a) => SpotlightApi.upsertSection(...a);
export const deleteSection  = (...a) => SpotlightApi.deleteSection(...a);

export const listEntries    = (...a) => SpotlightApi.listEntries(...a);
export const getEntry       = (...a) => SpotlightApi.getEntry(...a);
export const createEntry    = (...a) => SpotlightApi.createEntry(...a);
export const upsertEntry    = (...a) => SpotlightApi.upsertEntry(...a);
export const deleteEntry    = (...a) => SpotlightApi.deleteEntry(...a);

// Axios instance export (handy for debugging in dev tools)
export const __spotlightAxiosInstance = api;
