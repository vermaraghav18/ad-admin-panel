// src/services/bannerConfigsApi.js
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "https://ad-server-qx62.onrender.com";

const BASE = `${API_BASE}/api/banner-configs`;

function buildURL(path = "", query = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function http(method, path = "", body, query) {
  const res = await fetch(buildURL(path, query), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || j.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function list(params = {}) {
  // supports: mode, activeOnly, sectionType, sectionValue
  return http("GET", "", undefined, params);
}

export function getOne(id) {
  if (!id) throw new Error("Missing id");
  return http("GET", `/${id}`);
}

export function create(payload) {
  return http("POST", "", payload);
}

export function update(id, payload) {
  if (!id) throw new Error("Missing id");
  return http("PUT", `/${id}`, payload);
}

export function remove(id) {
  if (!id) throw new Error("Missing id");
  return http("DELETE", `/${id}`);
}

export function meta() {
  // { categories:[], cities:[], states:[] }
  return http("GET", "/meta");
}
