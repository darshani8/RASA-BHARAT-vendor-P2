// Token storage for the JWT access/refresh pair. localStorage so the session
// survives reloads/PWA relaunch. (For an MVP this is the pragmatic choice; a
// hardened build would move these to httpOnly cookies — tracked as a TODO.)

const ACCESS_KEY = 'zenith.access';
const REFRESH_KEY = 'zenith.refresh';
const VENDOR_KEY = 'zenith.vendorId';

type Session = { accessToken: string; refreshToken: string; vendorId?: string };

let listeners: Array<() => void> = [];

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getVendorId(): string | null {
  return localStorage.getItem(VENDOR_KEY);
}

export function isAuthed(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

export function setSession(s: Session): void {
  localStorage.setItem(ACCESS_KEY, s.accessToken);
  localStorage.setItem(REFRESH_KEY, s.refreshToken);
  if (s.vendorId) localStorage.setItem(VENDOR_KEY, s.vendorId);
  emit();
}

/** Replace just the tokens after a refresh, keeping the vendor id. */
export function updateTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  emit();
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(VENDOR_KEY);
  emit();
}

/** Subscribe to login/logout/refresh changes (e.g. to re-render the app). */
export function onSessionChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function emit() {
  for (const l of listeners) l();
}
