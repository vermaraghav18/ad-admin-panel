// src/services/featureBannerGroupsApi.js
const BASE = (process.env.REACT_APP_API_BASE || 'https://ad-server-qx62.onrender.com') + '/api/feature-banner-groups';

export async function listGroups() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to load groups');
  return res.json();
}
export async function listActive(category) {
  const u = new URL(BASE + '/active');
  if (category) u.searchParams.set('category', category);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error('Failed to load active groups');
  return res.json();
}
export async function createGroup(payload) {
  const res = await fetch(BASE, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}
export async function updateGroup(id, payload) {
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update group');
  return res.json();
}
export async function deleteGroup(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete group');
  return res.json();
}
