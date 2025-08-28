// src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || '';

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// Cartoon sections
export const CartoonAPI = {
  listSections: () => request('/api/cartoons/sections'),
  getSection: (id) => request(`/api/cartoons/sections/${id}`),
  createSection: (payload) => request('/api/cartoons/sections', { method: 'POST', body: payload }),
  updateSection: (id, payload) => request(`/api/cartoons/sections/${id}`, { method: 'PATCH', body: payload }),
  deleteSection: (id) => request(`/api/cartoons/sections/${id}`, { method: 'DELETE' }),

  addItem: (sectionId, payload) => request(`/api/cartoons/sections/${sectionId}/items`, { method: 'POST', body: payload }),
  listItems: (sectionId, activeOnly = false) =>
    request(`/api/cartoons/sections/${sectionId}/items?active=${activeOnly ? 'true' : 'false'}`),
  updateItem: (itemId, payload) => request(`/api/cartoons/items/${itemId}`, { method: 'PATCH', body: payload }),
  deleteItem: (itemId) => request(`/api/cartoons/items/${itemId}`, { method: 'DELETE' }),
  reorderItems: (sectionId, order) =>
    request(`/api/cartoons/sections/${sectionId}/reorder-items`, { method: 'POST', body: { order } }),

  feedPlan: (feed = 'home') => request(`/api/cartoons/feed-plan?feed=${encodeURIComponent(feed)}`),
};

export { API_BASE, request };
