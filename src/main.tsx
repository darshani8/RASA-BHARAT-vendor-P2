// Entry point: gate on auth — show the React login screen until a vendor is
// signed in, then mount the React dashboard (App). ZenithAPI is also exposed on
// window for debugging / console access.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { ZenithAPI } from './api';
import { App } from './app/App';

window.ZenithAPI = ZenithAPI;

function friendlyError(e: unknown): string {
  if (e instanceof ZenithAPI.ApiError) {
    if (e.code === 'UNAUTHORIZED' || e.status === 401) return 'Wrong phone number or password.';
    if (e.code === 'CONFLICT' || e.status === 409)
      return e.message || 'This vendor account isn’t active yet.';
    if (e.code === 'RATE_LIMITED') return 'Too many attempts — wait a moment and try again.';
    return e.message || 'Something went wrong. Please try again.';
  }
  return 'Can’t reach the server. Check your connection and try again.';
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mode, setMode] = useState<'login' | 'apply'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await ZenithAPI.login(phone.trim(), password);
        onLoggedIn();
      } else {
        await ZenithAPI.apply({ name: name.trim(), phone: phone.trim(), password });
        setApplied(true);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const wrap: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 2147483000,
    display: 'grid',
    placeItems: 'center',
    background: '#0E1116',
    fontFamily: "'Manrope', system-ui, sans-serif",
    padding: 20,
  };
  const card: React.CSSProperties = {
    width: 'min(400px, 100%)',
    background: '#fff',
    borderRadius: 18,
    padding: 32,
    boxShadow: '0 24px 60px -12px rgba(0,0,0,.5)',
  };
  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 700,
    color: '#3D434C',
    margin: '14px 0 6px',
  };
  const input: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #D8DCE1',
    borderRadius: 10,
    padding: '11px 13px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  };
  const button: React.CSSProperties = {
    width: '100%',
    marginTop: 22,
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    fontSize: 14.5,
    fontWeight: 800,
    fontFamily: 'inherit',
    color: '#fff',
    background: busy ? '#5b6b64' : '#0F1217',
    cursor: busy ? 'default' : 'pointer',
  };

  if (applied) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={brandMark}>Z</div>
          <h2 style={{ margin: '18px 0 8px', color: '#0F1217' }}>Application received</h2>
          <p style={{ color: '#7B828C', fontSize: 14, lineHeight: 1.5 }}>
            Your stall is awaiting approval. You’ll be able to sign in once an admin activates your
            account.
          </p>
          <button style={{ ...button, background: '#0F1217' }} onClick={() => { setApplied(false); setMode('login'); }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <form style={card} onSubmit={submit}>
        <div style={brandRow}>
          <div style={brandMark}>Z</div>
          <div>
            <div style={{ fontWeight: 800, color: '#0F1217', fontSize: 16, lineHeight: 1.1 }}>Zenith</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: '#9aa0a8' }}>
              RETAIL CLOUD
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, color: '#0F1217', margin: '22px 0 2px' }}>
          {mode === 'login' ? 'Vendor sign in' : 'Apply as a vendor'}
        </h1>
        <p style={{ color: '#7B828C', fontSize: 13, margin: 0 }}>
          {mode === 'login'
            ? 'Sign in to manage your stall.'
            : 'Create a stall — an admin approves it before you can sign in.'}
        </p>

        {mode === 'apply' && (
          <>
            <label style={label}>Stall name</label>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chai Stall #42" required />
          </>
        )}

        <label style={label}>Phone</label>
        <input
          style={input}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          autoComplete="username"
          required
        />

        <label style={label}>Password</label>
        <input
          style={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />

        {error && (
          <div style={{ marginTop: 14, color: '#B42318', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 9, padding: '9px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button style={button} type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Submit application'}
        </button>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#7B828C' }}>
          {mode === 'login' ? (
            <>New here?{' '}
              <a style={linkStyle} onClick={() => { setError(''); setMode('apply'); }}>Apply as a vendor</a>
            </>
          ) : (
            <>Already approved?{' '}
              <a style={linkStyle} onClick={() => { setError(''); setMode('login'); }}>Sign in</a>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

const brandMark: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 11,
  background: '#128A63',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 800,
  fontSize: 20,
  margin: '0 auto',
};
const brandRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const linkStyle: React.CSSProperties = { color: '#128A63', fontWeight: 700, cursor: 'pointer' };

// ── bootstrap ────────────────────────────────────────────────────────────────
const root = createRoot(document.getElementById('root') as HTMLElement);
const showApp = () => root.render(<App />);
const showLogin = () => root.render(<LoginScreen onLoggedIn={showApp} />);

// Return to the login gate if the session ends while the dashboard is open.
ZenithAPI.onSessionChange(() => {
  if (!ZenithAPI.isAuthed()) showLogin();
});

if (ZenithAPI.isAuthed()) showApp();
else showLogin();
