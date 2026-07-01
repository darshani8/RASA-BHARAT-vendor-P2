// Vendor authentication against /api/v1/vendors/*. Token field names come from
// the contract: login/refresh return { token, expiresIn, refreshToken, vendorId }.

import { request, setRefreshHandler, setAuthFailureHandler } from './http';
import {
  setSession,
  updateTokens,
  clearSession,
  getRefreshToken,
  getVendorId,
  isAuthed,
} from './tokens';

type VendorTokenResponse = {
  token: string;
  expiresIn: number;
  refreshToken: string;
  vendorId: string;
};

/** Vendor login. Only approved/active vendors get tokens. */
export async function vendorLogin(phone: string, password: string): Promise<void> {
  const res = await request<VendorTokenResponse>('/vendors/login', {
    method: 'POST',
    anonymous: true,
    body: { phone, password },
  });
  setSession({
    accessToken: res.token,
    refreshToken: res.refreshToken,
    vendorId: res.vendorId,
  });
}

/** Self-onboarding: creates a pending vendor, awaits admin approval (no token). */
export async function vendorApply(input: {
  name: string;
  phone: string;
  password: string;
  defaultPrepMinutes?: number;
  location?: { lat: number; lng: number };
}): Promise<{ status: string; vendorId: string }> {
  return request('/vendors/apply', { method: 'POST', anonymous: true, body: input });
}

/** Rotate tokens. Returns false on failure so the interceptor can route to login. */
async function refresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await request<VendorTokenResponse>('/vendors/refresh', {
      method: 'POST',
      anonymous: true,
      body: { refreshToken },
    });
    updateTokens(res.token, res.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  // Best-effort server-side revoke; clear locally regardless.
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
  clearSession();
}

export { isAuthed, getVendorId };

// Wire the refresh + auth-failure hooks into the HTTP core (avoids a cycle).
setRefreshHandler(refresh);
setAuthFailureHandler(() => clearSession());
