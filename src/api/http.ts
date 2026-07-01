// The single HTTP entry point for every API call. Responsibilities (see
// FRONTEND_MVP_HANDOFF §2):
//   - prefix the versioned base URL
//   - attach the Bearer access token
//   - parse the consistent error envelope { error: { code, message, details } }
//   - on 401: refresh the access token once, then retry the original request
//   - honour 429 Retry-After with a single backoff+retry
//   - support Idempotency-Key on writes that need it
//
// The refresh step is injected (setRefreshHandler) so this module stays free of
// the auth endpoint's exact request/response shape.

import { API_BASE } from './config';
import { getAccessToken } from './tokens';

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;
  retryAfter?: number;
  constructor(status: number, code: string, message: string, details?: unknown, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export type ReqOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** UUID for POST /orders and refunds; reuse on retry so a flaky net never dupes. */
  idempotencyKey?: string;
  /** Skip the auth header (login/register/refresh). */
  anonymous?: boolean;
  signal?: AbortSignal;
  /** internal: prevents infinite refresh recursion */
  _isRetry?: boolean;
};

// --- pluggable refresh, wired by auth.ts to avoid a circular import ----------
type RefreshFn = () => Promise<boolean>;
let refreshHandler: RefreshFn | null = null;
let onAuthFailure: (() => void) | null = null;
let inFlightRefresh: Promise<boolean> | null = null;

export function setRefreshHandler(fn: RefreshFn) {
  refreshHandler = fn;
}
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

function buildUrl(path: string, query?: ReqOpts['query']): string {
  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function request<T = unknown>(path: string, opts: ReqOpts = {}): Promise<T> {
  const method = opts.method || 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (!opts.anonymous) {
    const tok = getAccessToken();
    if (tok) headers.Authorization = `Bearer ${tok}`;
  }
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  let payload: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body: payload,
    signal: opts.signal,
  });

  // 401 -> refresh once -> retry the original request once.
  if (res.status === 401 && !opts.anonymous && !opts._isRetry && refreshHandler) {
    inFlightRefresh = inFlightRefresh || refreshHandler().finally(() => (inFlightRefresh = null));
    const ok = await inFlightRefresh;
    if (ok) return request<T>(path, { ...opts, _isRetry: true });
    onAuthFailure?.();
    throw await toApiError(res);
  }

  // 429 -> honour Retry-After once.
  if (res.status === 429 && !opts._isRetry) {
    const wait = Number(res.headers.get('Retry-After')) || 1;
    await sleep(Math.min(wait, 10) * 1000);
    return request<T>(path, { ...opts, _isRetry: true });
  }

  if (!res.ok) throw await toApiError(res);

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = `HTTP_${res.status}`;
  let message = res.statusText || 'Request failed';
  let details: unknown;
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code || code;
      message = body.error.message || message;
      details = body.error.details;
    }
  } catch {
    /* non-JSON error body */
  }
  const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
  return new ApiError(res.status, code, message, details, retryAfter);
}

/** RFC4122 v4 UUID for Idempotency-Key (crypto.randomUUID where available). */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
