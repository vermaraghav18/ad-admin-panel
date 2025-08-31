// src/api/sections.js
import { request } from '../api';

export const listSections = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/sections${qs ? `?${qs}` : ''}`).then(r => r.items || r); // supports {items:[...]} or [...]
};

export const createSection = (payload) =>
  request('/api/sections', { method: 'POST', body: payload });

export const updateSection = (id, payload) =>
  request(`/api/sections/${id}`, { method: 'PATCH', body: payload });

export const deleteSection = (id) =>
  request(`/api/sections/${id}`, { method: 'DELETE' });
