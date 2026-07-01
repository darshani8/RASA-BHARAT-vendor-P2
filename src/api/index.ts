// Single public surface for the bundled API client. main.ts attaches this to
// window.ZenithAPI so the inline dashboard (in index.html, eval'd at runtime and
// thus outside the Vite module graph) can call it.

import * as endpoints from './endpoints';
import * as auth from './auth';
import * as realtime from './realtime';
import { formatPaise, toPaise, rupeesToPaise, sumPaise } from './money';
import { ApiError, uuid } from './http';
import { getVendorId, isAuthed, onSessionChange } from './tokens';
import { DEFAULT_VENDOR_ID, RAZORPAY_KEY_ID, API_BASE } from './config';

export const ZenithAPI = {
  // config
  config: { apiBase: API_BASE, razorpayKeyId: RAZORPAY_KEY_ID, defaultVendorId: DEFAULT_VENDOR_ID },

  // session
  isAuthed,
  getVendorId,
  onSessionChange,
  login: auth.vendorLogin,
  apply: auth.vendorApply,
  logout: auth.logout,

  // realtime
  realtime,

  // money
  money: { formatPaise, toPaise, rupeesToPaise, sumPaise },

  // errors
  ApiError,
  uuid,

  // endpoints (flat for easy inline use)
  ...endpoints,
};

export type ZenithAPIType = typeof ZenithAPI;

declare global {
  interface Window {
    ZenithAPI: ZenithAPIType;
  }
}
