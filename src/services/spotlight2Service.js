// src/services/spotlight2Service.js
const API_BASE = process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com';
const BASE = `${API_BASE}/api/spotlight-2`;

async function http(method, url, body, isForm = false) {
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  const resp = await fetch(url, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }
  return resp.json();
}

// Sections
export const listSections = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return http('GET', `${BASE}/sections${q ? `?${q}` : ''}`);
};
export const createSection = (payload) => http('POST', `${BASE}/sections`, payload);
export const updateSection = (id, payload) => http('PATCH', `${BASE}/sections/${id}`, payload);
export const deleteSection = (id) => http('DELETE', `${BASE}/sections/${id}`);

// Items
export const listItems = (sectionId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return http('GET', `${BASE}/sections/${sectionId}/items${q ? `?${q}` : ''}`);
};
export const createItem = (sectionId, payload) => http('POST', `${BASE}/sections/${sectionId}/items`, payload);
export const updateItem = (id, payload) => http('PATCH', `${BASE}/items/${id}`, payload);
export const deleteItem = (id) => http('DELETE', `${BASE}/items/${id}`);

// Auto-extract
export const extractFromUrlOrXml = (payload) => http('POST', `${BASE}/extract`, payload);

// Upload image via existing backend uploader
export async function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  // Note: your backend already exposes /api/upload/image
  const resp = await fetch(`${API_BASE}/api/upload/image`, { method: 'POST', body: form });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json(); // expect { url: '...' }
}

export const plan = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return http('GET', `${BASE}/plan${q ? `?${q}` : ''}`);
};
