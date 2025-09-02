// ad-admin-panel/src/services/spotlightApi.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/spotlights';

async function j(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const SpotlightApi = {
  // sections
  listSections: () => fetch(`${API_BASE}/sections`).then(j),
  getSection: (id) => fetch(`${API_BASE}/sections/${id}`).then(j),
  createSection: (payload) =>
    fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(j),
  updateSection: (id, payload) =>
    fetch(`${API_BASE}/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(j),
  deleteSection: (id) =>
    fetch(`${API_BASE}/sections/${id}`, { method: 'DELETE' }).then(j),

  // entries
  listEntries: (sectionId) =>
    fetch(`${API_BASE}/entries${sectionId ? `?sectionId=${sectionId}` : ''}`).then(j),
  getEntry: (id) => fetch(`${API_BASE}/entries/${id}`).then(j),
  createEntry: (payload) =>
    fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(j),
  updateEntry: (id, payload) =>
    fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(j),
  deleteEntry: (id) =>
    fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' }).then(j),
};
