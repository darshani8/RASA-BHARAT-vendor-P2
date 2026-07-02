// Runtime configuration, read once from Vite env vars at build time. The inline
// dashboard component (in index.html) can't read import.meta.env — it reaches
// these values through window.ZenithAPI instead (see ./index.ts).

const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

// A production build MUST be told where the backend is. A static Pages deploy has no same-origin
// API, so silently defaulting to '' (same-origin) ships a dashboard that 404s every call. Fail
// loudly at boot instead — the deploy workflow passes VITE_API_BASE_URL from a secret. (C2)
if (import.meta.env.PROD && !rawBase) {
  throw new Error(
    'VITE_API_BASE_URL is not set. A production build must be given the backend API base URL ' +
      '(configure it as a repository secret and pass it to the build step).',
  );
}

// Dev falls back to localhost; prod always has rawBase (guaranteed by the check above).
const fallbackBase = import.meta.env.DEV ? 'http://localhost:3000' : '';

/** Backend host, no trailing slash, no version suffix. */
export const API_HOST = (rawBase || fallbackBase).replace(/\/+$/, '');

/** All REST endpoints live under this prefix. */
export const API_PREFIX = '/api/v1';

/** Full REST base, e.g. https://host/api/v1 */
export const API_BASE = `${API_HOST}${API_PREFIX}`;

/** Socket.io origin — explicit var, else derived from the API host. */
export const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim() || API_HOST;

/** Public Razorpay key id (test mode for MVP). */
export const RAZORPAY_KEY_ID =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)?.trim() || '';

/** Optional default vendor for single-tenant / local testing. */
export const DEFAULT_VENDOR_ID =
  (import.meta.env.VITE_DEFAULT_VENDOR_ID as string | undefined)?.trim() || '';
