// Pure formatting / mapping helpers ported verbatim from the dc-runtime brain.
// These mirror inr(), iconFor(), mapStatus(), channelMeta(), statusMeta(),
// termMeta(), initials() and matches() exactly so the views render identically.
import { ZenithAPI } from '../api';

export function inr(paise: unknown): string {
  return ZenithAPI.money.formatPaise(paise as never);
}

export function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  );
}

export function errMsg(e: unknown): string {
  return e && (e as { message?: string }).message ? (e as { message: string }).message : 'Something went wrong';
}

// Map a menu item name to a Material Symbol, same lookup table as the original.
export function iconFor(name: string): string {
  const n = (name || '').toLowerCase();
  const map: Array<[string, string]> = [
    ['chai', 'emoji_food_beverage'], ['tea', 'emoji_food_beverage'], ['coffee', 'local_cafe'],
    ['latte', 'local_cafe'], ['samosa', 'lunch_dining'], ['wrap', 'lunch_dining'], ['roll', 'lunch_dining'],
    ['dosa', 'ramen_dining'], ['bowl', 'ramen_dining'], ['rice', 'ramen_dining'], ['biryani', 'ramen_dining'],
    ['cake', 'cake'], ['sweet', 'cake'], ['juice', 'local_bar'], ['lassi', 'local_bar'], ['soda', 'local_bar'],
    ['bread', 'bakery_dining'], ['bun', 'bakery_dining'],
  ];
  for (const [k, v] of map) if (n.includes(k)) return v;
  return 'restaurant';
}

// backend status -> the status vocabulary the pills understand
export function mapStatus(s: string): string {
  return (
    { created: 'pending', paid: 'preparing', ready: 'ready', collected: 'collected', completed: 'completed', cancelled: 'rejected' } as Record<string, string>
  )[s] || 'pending';
}

export function channelMeta(ch: string): { label: string; icon: string } {
  return (
    {
      online: { label: 'Online', icon: 'language' },
      cash: { label: 'Cash', icon: 'payments' },
      offline: { label: 'At truck', icon: 'storefront' },
    } as Record<string, { label: string; icon: string }>
  )[ch] || { label: 'Order', icon: 'receipt_long' };
}

export function statusMeta(s: string): { label: string; icon: string; style: string } {
  const base = 'display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:999px;';
  const M: Record<string, { label: string; icon: string; css: string }> = {
    pending: { label: 'Pending', icon: 'schedule', css: 'color:var(--amber);background:var(--amber-soft)' },
    preparing: { label: 'Preparing', icon: 'skillet', css: 'color:var(--amber);background:var(--amber-soft)' },
    ready: { label: 'Ready', icon: 'check_circle', css: 'color:var(--accent-ink);background:var(--accent-soft)' },
    collected: { label: 'Collected', icon: 'done_all', css: 'color:var(--accent-ink);background:var(--accent-soft)' },
    completed: { label: 'Completed', icon: 'check', css: 'color:var(--accent-ink);background:var(--accent-soft)' },
    rejected: { label: 'Rejected', icon: 'close', css: 'color:var(--neg);background:var(--neg-soft)' },
  };
  const m = M[s] || M.pending;
  return { label: m.label, icon: m.icon, style: base + m.css };
}

export function termMeta(s: string): { label: string; dot: string; style: string } {
  const base = 'display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:999px;';
  const M: Record<string, { label: string; dot: string; css: string }> = {
    serving: { label: 'Serving', dot: 'var(--accent)', css: 'color:var(--accent-ink);background:var(--accent-soft)' },
    open: { label: 'Open', dot: 'var(--faint)', css: 'color:var(--muted);background:var(--hover)' },
    payment: { label: 'Payment', dot: 'var(--amber)', css: 'color:var(--amber);background:var(--amber-soft)' },
  };
  const m = M[s] || M.open;
  return { label: m.label, dot: m.dot, style: base + m.css };
}

export function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function matches(o: { stars: number }, f: string): boolean {
  if (f === 'good') return o.stars >= 4;
  if (f === 'average') return o.stars === 3;
  if (f === 'bad') return o.stars <= 2;
  return true; // 'all'
}

// The exact light-theme CSS custom properties every view root carried inline.
// Setting them once on the shell root makes all descendants inherit them.
export const THEME_VARS =
  '--canvas:#FAF6F3;--card:#FFFFFF;--card-soft:#FBF8F5;--border:#ECE6DB;--border-strong:#DDD4C7;--hover:#F7F2EC;--ink:#2A1B22;--text:#3B2630;--muted:#6F6A7D;--faint:#9A93A6;--side-bg:#2A1B22;--side-bg-2:#3B2630;--side-text:#B8A8B0;--side-active-text:#FFFFFF;--nav-hover:rgba(255,255,255,.05);--nav-active:rgba(255,255,255,.08);--side-border:rgba(255,255,255,.07);--accent:#7D1535;--accent-ink:#5E0F27;--accent-soft:rgba(125,21,53,.10);--pos:#7D1535;--neg:#C0392B;--neg-soft:rgba(192,57,43,.10);--amber:#B7791F;--amber-soft:rgba(183,121,31,.12);--shadow-sm:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.04);--shadow-md:0 10px 34px -8px rgba(16,24,40,.14);--pad:22px';

export const CATEGORY_OPTIONS = ['Breakfast', 'Veg', 'Non-veg', 'Mains', 'Beverages', 'Sweets', 'Other'];
