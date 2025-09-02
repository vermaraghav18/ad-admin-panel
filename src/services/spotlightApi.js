// src/services/spotlightApi.js
import axios from 'axios';

const ROOT = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const api = axios.create({
  baseURL: `${ROOT}/api/spotlights`,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = async p => {
  try {
    const { data } = await p;
    return data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Request failed';
    throw new Error(msg);
  }
};

const normalizeParams = p => {
  if (!p) return {};
  if (typeof p === 'string') return { sectionId: p };
  return p;
};

/* -------- Sections -------- */
const listSections  = (params = {}) => unwrap(api.get('/sections', { params }));
const getSection    = id => unwrap(api.get(`/sections/${id}`));
const createSection = body => unwrap(api.post('/sections', body));
const updateSection = (id, body) =>
  unwrap(api.patch(`/sections/${id}`, body).catch(() => api.put(`/sections/${id}`, body)));
const deleteSection = id => unwrap(api.delete(`/sections/${id}`));

/* -------- Entries --------- */
const listEntries   = params => unwrap(api.get('/entries', { params: normalizeParams(params) }));
const getEntry      = id => unwrap(api.get(`/entries/${id}`));
const createEntry   = body => unwrap(api.post('/entries', body));
const updateEntry   = (id, body) =>
  unwrap(api.patch(`/entries/${id}`, body).catch(() => api.put(`/entries/${id}`, body)));
const deleteEntry   = id => unwrap(api.delete(`/entries/${id}`));

/* -------- Exports --------- */
const SpotlightApi = {
  listSections, getSection, createSection, updateSection, deleteSection,
  listEntries,  getEntry,   createEntry,   updateEntry,   deleteEntry,
};
export default SpotlightApi;
