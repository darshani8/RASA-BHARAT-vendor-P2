import { css } from '../css';
import { useStore } from '../store';
import { initials } from '../format';

export type HeaderProps = {
  title: string;
  pill?: 'register' | 'live';
  onNewOrder?: () => void; // if set, "New Order" is a button (POS clear); else a link to #/pos
};

export function Header({ title, pill = 'register', onNewOrder }: HeaderProps) {
  const { state, onToggleOpen, onLogout } = useStore();
  const v = state.vendor;
  const avatarInitials = initials(v?.name || '') || 'V';
  const open = v ? v.acceptingOrders !== false : true;
  const pillBase = 'display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;cursor:pointer;border:1px solid ';
  const registerPillStyle = pillBase + (open ? 'rgba(125,21,53,.2);background:var(--accent-soft)' : 'rgba(197,65,58,.25);background:var(--neg-soft)');
  const registerInk = open ? 'var(--accent-ink)' : 'var(--neg)';
  const registerDot = open ? 'var(--accent)' : 'var(--neg)';
  const registerLabel = open ? 'Register Open' : 'Register Closed';

  const newOrderStyle = 'display:flex;align-items:center;gap:7px;border:none;cursor:pointer;background:var(--ink);color:#fff;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 15px;border-radius:10px;text-decoration:none';

  return (
    <header style={css('display:flex;align-items:center;gap:18px;padding:14px 28px;background:rgba(255,255,255,.78);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--border);flex-shrink:0;z-index:10')}>
      <div style={css('min-width:0')}>
        <div style={css('font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.02em')}>Terminal 01 · Main Counter</div>
        <div style={css('font-size:18px;font-weight:800;color:var(--ink);letter-spacing:-.02em')}>{title}</div>
      </div>

      <div style={css('margin-left:auto;display:flex;align-items:center;gap:14px')}>
        {pill === 'register' ? (
          <div onClick={onToggleOpen} title="Tap to open or close your stall" style={css(registerPillStyle)}>
            <span style={css(`width:7px;height:7px;border-radius:50%;background:${registerDot};animation:zpulse 2.4s infinite`)} />
            <span style={css(`font-size:12px;font-weight:700;color:${registerInk}`)}>{registerLabel}</span>
          </div>
        ) : (
          <div style={css('display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:var(--accent-soft);border:1px solid rgba(125,21,53,.2)')}>
            <span style={css('width:7px;height:7px;border-radius:50%;background:var(--accent);animation:zpulse 2.4s infinite')} />
            <span style={css('font-size:12px;font-weight:700;color:var(--accent-ink)')}>Live Updates</span>
          </div>
        )}

        {onNewOrder ? (
          <button onClick={onNewOrder} className="zbtn" style={css(newOrderStyle)}>
            <span className="ms" style={css('font-size:18px')}>add</span>New Order
          </button>
        ) : (
          <a href="#/pos" className="zbtn" style={css(newOrderStyle)}>
            <span className="ms" style={css('font-size:18px')}>add</span>New Order
          </a>
        )}

        <div style={css('display:flex;align-items:center;gap:4px;padding-left:12px;border-left:1px solid var(--border)')}>
          <div onClick={onLogout} title="Sign out" style={css('width:34px;height:34px;border-radius:50%;background:linear-gradient(145deg,#9E2A48,#5E0F27);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12.5px;cursor:pointer')}>{avatarInitials}</div>
        </div>
      </div>
    </header>
  );
}
