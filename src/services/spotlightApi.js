// src/services/spotlightApi.js
import axios from 'axios';

const ROOT = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const api = axios.create({
  baseURL: `${ROOT}/api/spotlights`,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = async (p) => {
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

const normalizeParams = (p) => {
  if (!p) return {};
  if (typeof p === 'string') return { sectionId: p };
  return p;
};

// Fallback helper: try PATCH first, then PUT (covers different backends)
const patchThenPut = async (url, body) => {
  try {
    const { data } = await api.patch(url, body);
    return data;
  } catch (e) {
    // On method mismatch (405/404/etc), try PUT
    try {
      const { data } = await api.put(url, body);
      return data;
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        'Request failed';
      throw new Error(msg);
    }
  }
};

/* ---------------- Sections ---------------- */
const listSections   = (params = {})        => unwrap(api.get('/sections', { params }));
const getSection     = (id)                 => unwrap(api.get(`/sections/${id}`));
const createSection  = (body)               => unwrap(api.post('/sections', body));
const updateSection  = (id, body)           => patchThenPut(`/sections/${id}`, body);
const deleteSection  = (id)                 => unwrap(api.delete(`/sections/${id}`));
// keep upsert for callers that used it
const upsertSection  = (section) => {
  const id = section?._id || section?.id;
  return id ? updateSection(id, section) : createSection(section);
};

/* ---------------- Entries ----------------- */
const listEntries    = (params)             => unwrap(api.get('/entries', { params: normalizeParams(params) }));
const getEntry       = (id)                 => unwrap(api.get(`/entries/${id}`));
const createEntry    = (body)               => unwrap(api.post('/entries', body));
const updateEntry    = (id, body)           => patchThenPut(`/entries/${id}`, body);
const deleteEntry    = (id)                 => unwrap(api.delete(`/entries/${id}`));
const upsertEntry    = (entry) => {
  const id = entry?._id || entry?.id;
  return id ? updateEntry(id, entry) : createEntry(entry);
};

/* --------------- Exports ------------------ */
export {
  listSections, getSection, createSection, updateSection, deleteSection, upsertSection,
  listEntries,  getEntry,  createEntry,  updateEntry,  deleteEntry,  upsertEntry,
};

const SpotlightApi = {
  listSections, getSection, createSection, updateSection, deleteSection, upsertSection,
  listEntries,  getEntry,  createEntry,  updateEntry,  deleteEntry,  upsertEntry,
};
export default SpotlightApi;

// (optional) export axios instance for debugging:
// export const __spotlightAxiosInstance = api;
