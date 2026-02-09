// test.js
// Quick API smoke tests for the TaskEr backend.
// Requires Node 18+ (for built-in fetch). Run from repository root:
// node test.js

const BASE = process.env.API_BASE || 'http://localhost:4000';

function log(...args) { console.log('[test]', ...args); }

async function fetchJSON(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const err = new Error(body && body.error ? body.error : res.statusText);
    err.status = res.status; err.body = body; throw err;
  }
  return body;
}

async function main() {
  if (typeof fetch !== 'function') {
    console.error('Node fetch API not found. Use Node 18+ or run with a fetch polyfill.');
    process.exit(1);
  }

  const name = 'Test User';
  const email = `test+${Date.now()}@example.com`;
  const password = 'Password123';

  log('Using API base:', BASE);

  // 1) Register
  try {
    log('Registering', email);
    const reg = await fetchJSON('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    log('Registered OK. User id:', reg.user?.id);
  } catch (err) {
    log('Register failed:', err.message || err);
  }

  // 2) Trigger invalid-password lock: 3 attempts
  for (let i = 1; i <= 3; i++) {
    try {
      log(`Login attempt (wrong) #${i}`);
      await fetchJSON('/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'wrongpass' })
      });
      log('Unexpected: wrong password accepted');
    } catch (err) {
      log(`Attempt #${i} response:`, err.status || 'ERR', err.body?.error || err.message);
    }
  }

  // 3) Try logging in with correct password (may be blocked by IP lock)
  let token = null;
  try {
    log('Login with correct password');
    const data = await fetchJSON('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    token = data.token;
    log('Login successful. Token length:', token?.length || 0);
  } catch (err) {
    log('Login failed:', err.status || 'ERR', err.body?.error || err.message);
    if (err.status === 429 && err.body && typeof err.body.error === 'string') {
      const m = err.body.error.match(/(\d+)\s*seconds?/);
      if (m) log(`IP locked for ~${m[1]} seconds`);
    }
  }

  // 4) If logged in, call a couple of endpoints
  if (token) {
    try {
      log('GET /projects');
      const projects = await fetchJSON('/projects', { headers: { Authorization: `Bearer ${token}` } });
      log('Projects count:', Array.isArray(projects) ? projects.length : typeof projects);
    } catch (err) {
      log('GET /projects failed:', err.body?.error || err.message);
    }

    try {
      log('GET /tasks/statuses');
      const statuses = await fetchJSON('/tasks/statuses', { headers: { Authorization: `Bearer ${token}` } });
      log('Statuses:', Array.isArray(statuses) ? statuses.map(s => s.name).join(', ') : statuses);
    } catch (err) {
      log('GET /tasks/statuses failed:', err.body?.error || err.message);
    }
  }

  log('Test run complete. Note: if lockout was triggered, wait the specified time before re-running.');
}

main().catch(e => { console.error(e); process.exit(1); });
