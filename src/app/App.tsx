import { StoreProvider, useStore } from './store';
import { Shell } from './components/Shell';
import type { HeaderProps } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { OrdersView } from './views/OrdersView';
import { QueueView } from './views/QueueView';
import { InventoryView } from './views/InventoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportsView } from './views/ReportsView';
import type { ReactNode } from 'react';

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
    case 'queue':
      header = { title: 'Operations Hub', search: 'Search tokens…', searchMaxWidth: 340, pill: 'live' };
      view = <QueueView />;
      break;
    case 'inventory':
      header = { title: 'Inventory Catalog' };
      view = <InventoryView />;
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
