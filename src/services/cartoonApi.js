// src/services/cartoonApi.js
const BASE = process.env.REACT_APP_ADSERVER_BASE || 'https://ad-server-qx62.onrender.com';

export const CartoonApi = {
  async getSections() {
    const r = await fetch(`${BASE}/api/cartoons/sections`);
    return r.json();
  },
  async createSection(payload) {
    const r = await fetch(`${BASE}/api/cartoons/sections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.json();
  },
  async updateSection(id, payload) {
    const r = await fetch(`${BASE}/api/cartoons/sections/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.json();
  },
  async deleteSection(id) {
    const r = await fetch(`${BASE}/api/cartoons/sections/${id}`, { method: 'DELETE' });
    return r.json();
  },

  async getEntries(sectionId) {
    const qs = sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : '';
    const r = await fetch(`${BASE}/api/cartoons/entries${qs}`);
    return r.json();
  },
  async createEntry(payload) {
    const r = await fetch(`${BASE}/api/cartoons/entries`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.json();
  },
  async updateEntry(id, payload) {
    const r = await fetch(`${BASE}/api/cartoons/entries/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.json();
  },
  async deleteEntry(id) {
    const r = await fetch(`${BASE}/api/cartoons/entries/${id}`, { method: 'DELETE' });
    return r.json();
  },

  async getPlan(params = {}) {
    const usp = new URLSearchParams(params);
    const r = await fetch(`${BASE}/api/cartoons/plan?${usp.toString()}`);
    return r.json();
  },

  async getSectionFull(id) {
    const r = await fetch(`${BASE}/api/cartoons/sections/${id}`);
    return r.json();
  },
};
