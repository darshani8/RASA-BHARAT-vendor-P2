/**
 * RasaAPI — fetch-based API client for the RASAP2 vendor dashboard.
 *
 * Exposed as window.RasaAPI by src/main.ts so the embedded Component class
 * (which runs in global scope after Babel transform) can call it without import.
 *
 * Auth strategy: JWT Bearer stored in localStorage.
 *   - Every authenticated request adds Authorization: Bearer <token>.
 *   - On 401 a single refresh is attempted; on refresh failure tokens are
 *     cleared and the page reloads to the login gate.
 *   - Tokens are never sent to any origin other than VITE_API_BASE.
 */

const BASE = (typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : 'http://localhost:3000/api/v1');

const LS_TOKEN        = 'rasa_access_token';
const LS_REFRESH      = 'rasa_refresh_token';
const LS_EXPIRES_AT   = 'rasa_expires_at';   // unix ms
const LS_VENDOR_ID    = 'rasa_vendor_id';

// ------------------------------------------------------------------ helpers

export function paiseToRupees(paise) {
  const n = Number(paise);
  if (Number.isNaN(n)) return '0.00';
  return (n / 100).toFixed(2);
}

export function rupeesToPaise(rupees) {
  const n = parseFloat(rupees);
  if (Number.isNaN(n)) return '0';
  return String(Math.round(n * 100));
}

function saveTokens({ token, refreshToken, expiresIn, vendorId }) {
  localStorage.setItem(LS_TOKEN, token);
  localStorage.setItem(LS_REFRESH, refreshToken);
  localStorage.setItem(LS_EXPIRES_AT, String(Date.now() + expiresIn * 1000));
  localStorage.setItem(LS_VENDOR_ID, vendorId);
}

function clearTokens() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_REFRESH);
  localStorage.removeItem(LS_EXPIRES_AT);
  localStorage.removeItem(LS_VENDOR_ID);
}

export function isAuthenticated() {
  return !!localStorage.getItem(LS_TOKEN);
}

export function vendorId() {
  return localStorage.getItem(LS_VENDOR_ID) || '';
}

// ------------------------------------------------------------------ request core

let _refreshing = null; // singleton promise while a refresh is in flight

async function doRefresh() {
  const rt = localStorage.getItem(LS_REFRESH);
  if (!rt) throw new Error('no refresh token');
  const res = await fetch(`${BASE}/vendors/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) throw new Error('refresh failed');
  const data = await res.json();
  saveTokens(data);
}

/**
 * Core request wrapper.
 *   - Attaches Bearer token.
 *   - Parses JSON; throws on non-2xx (message from error.message in envelope).
 *   - On 401 tries ONE refresh then retries; on failure clears tokens + reloads.
 */
async function request(method, path, body, opts = {}) {
  const token = localStorage.getItem(LS_TOKEN);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const init = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);

  const url = `${BASE}${path}`;
  let res = await fetch(url, init);

  if (res.status === 401 && !opts._retried) {
    // Single refresh attempt — guard against parallel refresh storms.
    if (!_refreshing) {
      _refreshing = doRefresh().finally(() => { _refreshing = null; });
    }
    try {
      await _refreshing;
    } catch {
      clearTokens();
      window.location.reload();
      return;
    }
    return request(method, path, body, { ...(opts || {}), _retried: true });
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    err.status = res.status;
    throw err;
  }

  return data;
}

// ------------------------------------------------------------------ auth

export async function login(phone, password) {
  const data = await request('POST', '/vendors/login', { phone, password });
  saveTokens(data);
  return data;
}

export async function refresh() {
  await doRefresh();
}

export function logout() {
  clearTokens();
}

// ------------------------------------------------------------------ vendor board / orders

/** GET /vendor/board — KDS board (paid/ready, not-yet-collected, sorted by ready-time) */
export async function getBoard({ limit = 50, cursor } = {}) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor) qs.set('cursor', cursor);
  return request('GET', `/vendor/board?${qs}`);
}

/** GET /vendors/me/orders — vendor's full incoming order list */
export async function getMyOrders({ limit = 50, cursor, status } = {}) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor) qs.set('cursor', cursor);
  if (status) qs.set('status', status);
  return request('GET', `/vendors/me/orders?${qs}`);
}

/** GET /vendor/analytics?date=YYYY-MM-DD */
export async function getAnalytics(date) {
  return request('GET', `/vendor/analytics?date=${date}`);
}

// ------------------------------------------------------------------ queue

/** GET /queue?vendor_id=<uuid> */
export async function getQueue() {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  return request('GET', `/queue?vendor_id=${encodeURIComponent(id)}`);
}

/** POST /queue/advance?vendor_id=<uuid> */
export async function advanceQueue() {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  return request('POST', `/queue/advance?vendor_id=${encodeURIComponent(id)}`);
}

// ------------------------------------------------------------------ ratings

/** GET /ratings/vendor/:vendorId */
export async function ratingSummary() {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  return request('GET', `/ratings/vendor/${encodeURIComponent(id)}`);
}

// ------------------------------------------------------------------ order actions

/** POST /orders/:id/ready */
export async function markReady(id) {
  return request('POST', `/orders/${encodeURIComponent(id)}/ready`);
}

/** POST /orders/:id/complete */
export async function markComplete(id) {
  return request('POST', `/orders/${encodeURIComponent(id)}/complete`);
}

/** POST /orders/:id/reject  → refund saga */
export async function rejectOrder(id) {
  return request('POST', `/orders/${encodeURIComponent(id)}/reject`);
}

// ------------------------------------------------------------------ menu / inventory

/** GET /menu?vendor_id=<uuid> — available items only */
export async function listMenu() {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  return request('GET', `/menu?vendor_id=${encodeURIComponent(id)}`);
}

/**
 * POST /menu
 * @param {{ name:string, pricePaise:string, prepMinutes?:number, isAvailable?:boolean }} item
 */
export async function createMenuItem({ name, pricePaise, prepMinutes, isAvailable }) {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  const body = { vendorId: id, name, pricePaise: String(pricePaise) };
  if (prepMinutes !== undefined) body.prepMinutes = prepMinutes;
  if (isAvailable !== undefined) body.isAvailable = isAvailable;
  return request('POST', '/menu', body);
}

/** PUT /menu/:id */
export async function updateMenuItem(menuId, patch) {
  const body = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.pricePaise !== undefined) body.pricePaise = String(patch.pricePaise);
  if (patch.prepMinutes !== undefined) body.prepMinutes = patch.prepMinutes;
  if (patch.isAvailable !== undefined) body.isAvailable = patch.isAvailable;
  return request('PUT', `/menu/${encodeURIComponent(menuId)}`, body);
}

/** DELETE /menu/:id */
export async function deleteMenuItem(menuId) {
  return request('DELETE', `/menu/${encodeURIComponent(menuId)}`);
}

// ------------------------------------------------------------------ accepting orders toggle

/** PATCH /vendors/:id/accepting-orders */
export async function setAcceptingOrders(accepting) {
  const id = vendorId();
  if (!id) throw new Error('not authenticated');
  return request('PATCH', `/vendors/${encodeURIComponent(id)}/accepting-orders`, { accepting });
}
