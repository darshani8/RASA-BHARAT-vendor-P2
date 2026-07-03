import { StoreProvider, useStore } from './store';
import { css } from './css';
import { Shell } from './components/Shell';
import type { HeaderProps } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { OrdersView } from './views/OrdersView';
import { InventoryView } from './views/InventoryView';
import { SlotsView } from './views/SlotsView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportsView } from './views/ReportsView';
import type { ReactNode } from 'react';

// A dismissable error toast. Previously every action error was written to state.loadErr but never
// rendered — so a failed "Take Cash" (confirm-offline) or reject looked like a silent no-op. This
// surfaces them visibly. (C1 / C7)
function ErrorToast() {
  const { state, clearError } = useStore();
  if (!state.loadErr) return null;
  return (
    <div
      style={css(
        'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147482000;' +
          'display:flex;align-items:center;gap:12px;max-width:min(560px,92vw);' +
          'background:var(--card);border:1px solid var(--neg);color:var(--neg);' +
          'font-family:inherit;font-size:13px;font-weight:600;padding:11px 14px;border-radius:11px;box-shadow:var(--shadow-md)',
      )}
      role="alert"
    >
      <span className="ms" style={css('font-size:18px;color:var(--neg);flex-shrink:0')}>error</span>
      <span style={css('flex:1')}>{state.loadErr}</span>
      <button
        onClick={clearError}
        className="zbtn"
        style={css('border:none;background:transparent;cursor:pointer;color:var(--muted);width:26px;height:26px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0')}
        aria-label="Dismiss"
      >
        <span className="ms" style={css('font-size:18px')}>close</span>
      </button>
    </div>
  );
}

function Router() {
  const { state, clear } = useStore();
  const route = state.route;

  let header: HeaderProps;
  let view: ReactNode;
  switch (route) {
    case 'pos':
      header = { title: 'Point of Sale', search: 'Search products, SKU…', searchMaxWidth: 340, onNewOrder: clear };
      view = <PosView />;
      break;
    case 'orders':
      header = { title: 'Orders', search: 'Search orders, tokens, customers…' };
      view = <OrdersView />;
      break;
    case 'inventory':
      header = { title: 'Inventory Catalog' };
      view = <InventoryView />;
      break;
    case 'slots':
      header = { title: 'Slots Management' };
      view = <SlotsView />;
      break;
    case 'analytics':
      header = { title: 'Business Intelligence', search: 'Search analytics…', searchMaxWidth: 340 };
      view = <AnalyticsView />;
      break;
    case 'reports':
      header = { title: 'Customer Reports', search: 'Search orders, customers…', searchMaxWidth: 340 };
      view = <ReportsView />;
      break;
    default:
      header = { title: 'Dashboard', search: 'Search orders, items, customers…' };
      view = <DashboardView />;
  }

  return (
    <Shell active={route} header={header}>
      {view}
      <ErrorToast />
    </Shell>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
