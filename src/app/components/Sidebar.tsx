import { css } from '../css';
import type { Route } from '../store';

function NavItem({ icon, label, href, active, badge }: {
  icon: string; label: string; href: string; active: boolean; badge?: string;
}) {
  const base = 'display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:9px;font-size:13.5px;font-weight:600;text-decoration:none;';
  const style = active
    ? base + 'background:var(--nav-active);color:var(--side-active-text);position:relative'
    : base + 'color:var(--side-text)';
  return (
    <a href={href} className="znav" style={css(style)}>
      {active && (
        <span style={css('position:absolute;left:-16px;top:50%;transform:translateY(-50%);width:3px;height:18px;border-radius:0 3px 3px 0;background:var(--accent)')} />
      )}
      <span className="ms" style={css('font-size:20px' + (active ? ';color:var(--accent)' : ''))}>{icon}</span>{label}
      {badge && (
        <span style={css('margin-left:auto;font-size:11px;font-weight:700;color:var(--side-active-text);background:rgba(255,255,255,' + (active ? '.1' : '.08') + ');padding:2px 7px;border-radius:6px')}>{badge}</span>
      )}
    </a>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={css('margin-top:18px;display:flex;flex-direction:column;gap:2px')}>
      <div style={css('color:var(--side-text);opacity:.55;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:0 10px 8px')}>{title}</div>
      {children}
    </div>
  );
}

export function Sidebar({ active }: { active: Route }) {
  return (
    <aside style={css('width:256px;flex-shrink:0;background:var(--side-bg);border-right:1px solid var(--side-border);display:flex;flex-direction:column;padding:22px 16px 18px')}>
      <div style={css('display:flex;align-items:center;gap:11px;padding:6px 8px 0')}>
        <div style={css('width:34px;height:34px;border-radius:9px;background:linear-gradient(145deg,#1BA576,#0C6347);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(18,138,99,.35)')}>
          <span style={css('color:#fff;font-weight:800;font-size:17px;letter-spacing:-.04em')}>Z</span>
        </div>
        <div>
          <div style={css('color:#fff;font-weight:800;font-size:15px;letter-spacing:-.01em')}>Zenith</div>
          <div style={css('color:var(--faint);font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase')}>Retail Cloud</div>
        </div>
      </div>

      <div style={css('margin-top:26px;display:flex;flex-direction:column;gap:2px')}>
        <div style={css('color:var(--side-text);opacity:.55;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:0 10px 8px')}>Overview</div>
        <NavItem icon="space_dashboard" label="Dashboard" href="#/dashboard" active={active === 'dashboard'} />
      </div>

      <Group title="Operations">
        <NavItem icon="point_of_sale" label="Point of Sale" href="#/pos" active={active === 'pos'} />
        <NavItem icon="receipt_long" label="Orders" href="#/orders" active={active === 'orders'} badge="12" />
        <NavItem icon="pending_actions" label="Queue" href="#/queue" active={active === 'queue'} />
        <NavItem icon="inventory_2" label="Inventory" href="#/inventory" active={active === 'inventory'} />
      </Group>

      <Group title="Insights">
        <NavItem icon="monitoring" label="Analytics" href="#/analytics" active={active === 'analytics'} />
        <NavItem icon="workspace_premium" label="Reports" href="#/reports" active={active === 'reports'} />
      </Group>

      <div style={css('margin-top:auto;padding-top:16px;border-top:1px solid var(--side-border);display:flex;flex-direction:column;gap:2px')}>
        <a href="#" className="znav" style={css('display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:9px;font-size:13.5px;font-weight:600;text-decoration:none;color:var(--side-text)')}>
          <span className="ms" style={css('font-size:20px')}>help</span>Support
        </a>
        <div style={css('display:flex;align-items:center;gap:11px;padding:10px;margin-top:6px;border-radius:11px;background:var(--side-bg-2);border:1px solid var(--side-border)')}>
          <div style={css('width:32px;height:32px;border-radius:50%;background:linear-gradient(145deg,#2A3340,#171C24);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0')}>AD</div>
          <div style={css('min-width:0;flex:1')}>
            <div style={css('color:#fff;font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>Avery Donovan</div>
            <div style={css('color:var(--faint);font-size:11px;font-weight:500')}>Store Manager</div>
          </div>
          <span className="ms" style={css('font-size:18px;color:var(--side-text)')}>unfold_more</span>
        </div>
      </div>
    </aside>
  );
}
