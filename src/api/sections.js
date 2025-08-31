// src/api/sections.js
import api from './index';

export const listSections = (params = {}) =>
  api.get('/sections', { params }).then(r => r.data.items);

export const createSection = (payload) =>
  api.post('/sections', payload).then(r => r.data);

export const updateSection = (id, payload) =>
  api.patch(`/sections/${id}`, payload).then(r => r.data);

export const deleteSection = (id) =>
  api.delete(`/sections/${id}`).then(r => r.data);
