// Minimal API client using fetch and the Authorization header from localStorage
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

function headers(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function request(path, { method = 'GET', body, json = true } = {}) {
  const opts = {
    method,
    headers: headers(json),
  };
  if (body) opts.body = json ? JSON.stringify(body) : body;
  const res = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data && data.error ? data.error : res.statusText);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};