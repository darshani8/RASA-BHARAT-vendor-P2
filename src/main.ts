// Entry point: expose React 18 globally, then boot the Design-Component runtime, which renders the
// embedded <x-dc> template (the Zenith Retail Cloud design) into the page using React.createRoot.
import React from 'react';
import * as ReactDOMLegacy from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';

// Expose the VITE_API_BASE env variable to the runtime-evaluated embedded script.  The script
// cannot use import.meta.env directly (it is not processed by Vite).
declare const __API_BASE__: string | undefined;

// The dc-runtime expects window.React / window.ReactDOM (it normally loads them from a CDN, but
// skips that when they're already present). We bundle them locally so the app works fully offline.
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: unknown;
    __API_BASE__: string;
    RasaAPI: RasaAPIType;
  }
}

interface RasaAPIType {
  paiseToRupees: (p: string | number) => string;
  rupeesToPaise: (r: number | string) => string;
  isAuthenticated: () => boolean;
  vendorId: () => string;
  login: (phone: string, password: string) => Promise<unknown>;
  refresh: () => Promise<void>;
  logout: () => void;
  getBoard: (opts?: { limit?: number; cursor?: string }) => Promise<unknown>;
  getMyOrders: (opts?: { limit?: number; cursor?: string; status?: string }) => Promise<unknown>;
  getAnalytics: (date: string) => Promise<unknown>;
  getQueue: () => Promise<unknown>;
  advanceQueue: () => Promise<unknown>;
  ratingSummary: () => Promise<unknown>;
  markReady: (id: string) => Promise<unknown>;
  markComplete: (id: string) => Promise<unknown>;
  rejectOrder: (id: string) => Promise<unknown>;
  listMenu: () => Promise<unknown>;
  createMenuItem: (item: {
    name: string;
    pricePaise: string;
    prepMinutes?: number;
    isAvailable?: boolean;
  }) => Promise<unknown>;
  updateMenuItem: (
    menuId: string,
    patch: {
      name?: string;
      pricePaise?: string;
      prepMinutes?: number;
      isAvailable?: boolean;
    },
  ) => Promise<unknown>;
  deleteMenuItem: (menuId: string) => Promise<unknown>;
  setAcceptingOrders: (accepting: boolean) => Promise<unknown>;
}

// -- Set globals before the runtime loads so the embedded script can access them immediately.
window.React = React;
window.ReactDOM = Object.assign({}, ReactDOMLegacy, { createRoot, hydrateRoot });

// Expose the API base URL so the embedded Component can read window.__API_BASE__.
window.__API_BASE__ = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000/api/v1';

// Expose the API client.  We use a dynamic import so the globals above are set before api.js runs.
// The embedded Component calls window.RasaAPI.* directly.
import(
  /* @vite-ignore */
  './api.js'
).then((api) => {
  window.RasaAPI = api as RasaAPIType;

  // Once the API module is loaded, decide whether to show the login gate or boot the dashboard.
  if (!api.isAuthenticated()) {
    renderLoginGate(api as RasaAPIType);
  } else {
    // Already authenticated — boot the dashboard directly.
    void import('./dc-runtime.js');
  }
});

// ------------------------------------------------------------------ Login gate
// A minimal plain-DOM login form rendered over the page.  Kept outside the React+Runtime tree so
// it has zero dependency on the dc-runtime timing.  Styled to match the dark maroon/ink palette.

function renderLoginGate(api: RasaAPIType): void {
  const overlay = document.createElement('div');
  overlay.id = 'rasa-login-gate';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:#0B0E13',
    "font-family:'Manrope',system-ui,sans-serif",
  ].join(';');

  overlay.innerHTML = `
    <div style="width:100%;max-width:400px;padding:40px 36px;background:#12161D;border:1px solid #1F2630;border-radius:20px;box-shadow:0 30px 70px -20px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:32px">
        <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(145deg,#1BA576,#0C6347);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(18,138,99,.35)">
          <span style="color:#fff;font-weight:800;font-size:19px;letter-spacing:-.04em">Z</span>
        </div>
        <div>
          <div style="color:#fff;font-weight:800;font-size:16px;letter-spacing:-.01em">Zenith Retail Cloud</div>
          <div style="color:#5C6470;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase">Vendor Sign-In</div>
        </div>
      </div>

      <div id="rasa-login-err" style="display:none;background:rgba(197,65,58,.12);border:1px solid rgba(197,65,58,.3);border-radius:10px;padding:10px 14px;margin-bottom:18px;font-size:13px;color:#E57373;font-weight:600"></div>

      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:11.5px;font-weight:700;color:#838C98;letter-spacing:.04em">PHONE NUMBER</label>
          <input
            id="rasa-login-phone"
            type="tel"
            placeholder="+91 9876543210"
            autocomplete="tel"
            style="background:#0F1319;border:1px solid #1F2630;color:#F2F4F7;font-family:inherit;font-size:14px;border-radius:10px;padding:12px 14px;outline:none;transition:border .15s"
            onfocus="this.style.borderColor='#128A63'"
            onblur="this.style.borderColor='#1F2630'"
          />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:11.5px;font-weight:700;color:#838C98;letter-spacing:.04em">PASSWORD</label>
          <input
            id="rasa-login-pw"
            type="password"
            placeholder="Min 8 characters"
            autocomplete="current-password"
            style="background:#0F1319;border:1px solid #1F2630;color:#F2F4F7;font-family:inherit;font-size:14px;border-radius:10px;padding:12px 14px;outline:none;transition:border .15s"
            onfocus="this.style.borderColor='#128A63'"
            onblur="this.style.borderColor='#1F2630'"
          />
        </div>
        <button
          id="rasa-login-btn"
          style="margin-top:6px;width:100%;border:none;cursor:pointer;background:#128A63;color:#fff;font-family:inherit;font-size:14px;font-weight:800;padding:14px;border-radius:12px;letter-spacing:-.01em;transition:opacity .15s"
        >Sign In</button>
      </div>

      <p style="margin-top:22px;font-size:11.5px;color:#5C6470;text-align:center;font-weight:500;line-height:1.5">
        Only approved vendor accounts can log in.<br>Contact support if you cannot access your account.
      </p>
    </div>
  `;

  document.body.appendChild(overlay);

  const phoneEl  = overlay.querySelector<HTMLInputElement>('#rasa-login-phone')!;
  const pwEl     = overlay.querySelector<HTMLInputElement>('#rasa-login-pw')!;
  const btnEl    = overlay.querySelector<HTMLButtonElement>('#rasa-login-btn')!;
  const errEl    = overlay.querySelector<HTMLElement>('#rasa-login-err')!;

  function showErr(msg: string) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }
  function clearErr() {
    errEl.style.display = 'none';
  }

  async function handleSubmit() {
    clearErr();
    const phone    = phoneEl.value.trim();
    const password = pwEl.value;

    if (!phone) { showErr('Phone number is required.'); phoneEl.focus(); return; }
    if (password.length < 8) { showErr('Password must be at least 8 characters.'); pwEl.focus(); return; }

    btnEl.disabled    = true;
    btnEl.textContent = 'Signing in…';
    btnEl.style.opacity = '0.7';

    try {
      await api.login(phone, password);
      // Remove the gate and boot the dashboard runtime.
      overlay.remove();
      void import('./dc-runtime.js');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      showErr(msg);
      btnEl.disabled    = false;
      btnEl.textContent = 'Sign In';
      btnEl.style.opacity = '1';
    }
  }

  btnEl.addEventListener('click', handleSubmit);

  // Allow Enter key in both fields.
  [phoneEl, pwEl].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void handleSubmit();
    });
  });

  // Focus phone field on mount.
  setTimeout(() => phoneEl.focus(), 50);
}
