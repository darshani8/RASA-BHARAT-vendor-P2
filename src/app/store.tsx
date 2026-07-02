// The application "brain", ported from the dc-runtime <script> in index.html.
// Holds all dashboard state, the live-data loaders, realtime wiring, the hash
// router and every action — exposed to the views via React context. setState()
// mirrors the original class component's merge semantics so the port is 1:1.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ZenithAPI } from '../api';
import type { MenuItem, OrderRow, Queue, Vendor, VendorAnalytics } from '../api/types';
import type { RatingSummary } from '../api/endpoints';
import { errMsg, todayISO } from './format';

export type Route = 'dashboard' | 'pos' | 'orders' | 'inventory' | 'analytics' | 'reports';
const VALID: Route[] = ['dashboard', 'pos', 'orders', 'inventory', 'analytics', 'reports'];

export function routeFromHash(): Route {
  const h = (location.hash || '').replace(/^#\/?/, '').trim();
  return (VALID as string[]).includes(h) ? (h as Route) : 'dashboard';
}

export type CartLine = { id: string; name: string; note: string; price: number; qty: number };

export interface State {
  route: Route;
  loading: boolean;
  loadErr: string;
  vendor: Vendor | null;
  menu: MenuItem[];
  board: OrderRow[];
  activeBoard: OrderRow[];
  queueData: Queue | null;
  analytics: VendorAnalytics | null;
  ratingSummary: RatingSummary | null;
  recent: OrderRow[];
  ordersTab: 'all' | 'active' | 'completed' | 'scheduled';
  ordersNextCursor: string | null;
  ordersPage: number; // 0-based page index, mirrored from the cursor ref for rendering
  cart: CartLine[];
  posCat: string;
  posMethod: 'cash' | 'card';
  chargeMsg: string;
  rejectingId: string | null;
  modalOpen: boolean;
  invEditId: string | null;
  invName: string;
  invPrice: string;
  invPrep: string;
  invAvail: boolean;
  invCat: string;
  invCatFilter: string;
  // reports (cosmetic, client-only)
  reviews: ReviewRow[];
  filter: string;
  sort: string;
  requested: Record<string, boolean>;
  replied: Record<string, boolean>;
  // queue payment toggle (cosmetic, client-only)
  method: 'cash' | 'card' | 'app';
}

export type ReviewRow = {
  num: string; customer: string; items: string; amount: string; date: string;
  reviewed: boolean; rating?: number; comment?: string;
};

function initialState(): State {
  return {
    route: routeFromHash(),
    loading: true,
    loadErr: '',
    vendor: null,
    menu: [],
    board: [],
    activeBoard: [],
    queueData: null,
    analytics: null,
    ratingSummary: null,
    recent: [],
    ordersTab: 'all',
    ordersNextCursor: null,
    ordersPage: 0,
    cart: [],
    posCat: 'All Items',
    posMethod: 'cash',
    chargeMsg: '',
    rejectingId: null,
    modalOpen: false,
    invEditId: null,
    invName: '',
    invPrice: '',
    invPrep: '5',
    invAvail: true,
    invCat: 'Other',
    invCatFilter: 'All',
    reviews: [],
    filter: 'all',
    sort: 'recent',
    requested: {},
    replied: {},
    method: 'cash',
  };
}

type Patch = Partial<State> | ((s: State) => Partial<State>);

export interface Store {
  state: State;
  // header
  onToggleOpen: () => void;
  onLogout: () => void;
  clearError: () => void;
  // orders
  setOrdersTab: (tab: 'all' | 'active' | 'completed' | 'scheduled') => void;
  ordersPrev: () => void;
  ordersNext: () => void;
  loadOrders: (tab?: 'all' | 'active' | 'completed' | 'scheduled', cursor?: string) => void;
  act: (orderId: string, fn: (id: string) => Promise<unknown>) => void;
  startReject: (id: string) => void;
  cancelReject: () => void;
  // pos
  add: (p: { id: string; name: string; cat: string; price: number }) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
  setPosCat: (c: string) => void;
  setPosMethod: (m: 'cash' | 'card') => void;
  onCharge: () => void;
  // inventory
  itemCategory: (m: MenuItem) => string;
  setInvCatFilter: (e: { target: { value: string } }) => void;
  openAddItem: () => void;
  openEditItem: (it: MenuItem) => void;
  closeItemModal: () => void;
  setInvName: (e: { target: { value: string } }) => void;
  setInvPrice: (e: { target: { value: string } }) => void;
  setInvPrep: (e: { target: { value: string } }) => void;
  setInvCat: (e: { target: { value: string } }) => void;
  toggleInvAvail: () => void;
  saveItem: () => void;
  deleteItem: (id: string) => void;
  toggleItemAvail: (it: MenuItem) => void;
  // reports (cosmetic)
  setFilter: (f: string) => void;
  setSort: (s: string) => void;
  request: (num: string) => void;
  reply: (num: string) => void;
  // queue (cosmetic)
  setMethod: (m: 'cash' | 'card' | 'app') => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within <StoreProvider>');
  return v;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setFull] = useState<State>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // non-reactive instance fields (mirror the original `this._*`)
  const catMap = useRef<Record<string, string>>({});
  const ordersCursors = useRef<(string | undefined)[]>([undefined]);
  const ordersPageIdx = useRef(0);
  const noOwnerMenu = useRef(false);

  const api = ZenithAPI;
  const setState = (patch: Patch) =>
    setFull((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  const get = () => stateRef.current;

  const vendorId = (): string => api.getVendorId() || api.config.defaultVendorId;

  // ── categories (localStorage-backed; prefers item.category once it ships) ──
  const loadCatMap = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem('zenith.menuCat') || '{}') || {}; } catch { return {}; }
  };
  const saveCatMap = () => {
    try { localStorage.setItem('zenith.menuCat', JSON.stringify(catMap.current || {})); } catch { /* ignore */ }
  };
  const itemCategory = (m: MenuItem): string => {
    const cat = (m as unknown as { category?: string }).category;
    if (cat) return cat;
    return catMap.current[m.id] || 'Other';
  };
  const setItemCategory = (id: string, cat: string) => { catMap.current[id] = cat; saveCatMap(); };

  // ── live data ──────────────────────────────────────────────────────────────
  const loadMenu = async (): Promise<MenuItem[]> => {
    if (!vendorId()) return [];
    if (!noOwnerMenu.current) {
      try { return await api.getVendorMenu(vendorId()); }
      catch (e) {
        const err = e as { status?: number; code?: string };
        if (err && (err.status === 404 || err.code === 'NOT_FOUND')) noOwnerMenu.current = true;
        else throw e;
      }
    }
    return api.getMenu(vendorId());
  };

  const loadOrders = async (tab?: 'all' | 'active' | 'completed' | 'scheduled', cursor?: string) => {
    const t = tab === undefined ? get().ordersTab || 'all' : tab;
    const vid = vendorId();
    try {
      let page;
      if (t === 'active') page = await api.getBoard(20, cursor);
      else if (t === 'completed') page = await api.getVendorOrders({ status: 'completed', limit: 20, cursor });
      else if (t === 'scheduled') page = await api.getScheduledOrders(20, cursor);
      else page = await api.getVendorOrders({ limit: 20, cursor });
      const activeBoard = (await api.getBoard(50).catch(() => ({ data: get().activeBoard || [] }))).data;
      const queueData = vid ? await api.getQueue(vid).catch(() => get().queueData) : get().queueData;
      setState({ board: page.data, ordersNextCursor: page.page ? page.page.nextCursor : null, activeBoard, queueData });
    } catch { /* keep last good state */ }
  };

  const loadAll = async () => {
    const vid = vendorId();
    setState({ loading: true, loadErr: '' });
    try {
      const menu = await loadMenu().catch(() => [] as MenuItem[]);
      setState({ menu, loading: false });
    } catch (e) { setState({ loading: false, loadErr: errMsg(e) }); }
    loadOrders();
    if (vid) api.getVendor(vid).then((vendor) => setState({ vendor })).catch(() => {});
    api.getAnalytics(todayISO()).then((analytics) => setState({ analytics })).catch(() => {});
    if (vid) api.getRatingSummary(vid).then((ratingSummary) => setState({ ratingSummary })).catch(() => {});
    api.getVendorOrders({ limit: 6 }).then((p) => setState({ recent: p.data })).catch(() => {});
  };

  const act = (orderId: string, fn: (id: string) => Promise<unknown>) => {
    if (!orderId) return;
    Promise.resolve()
      .then(() => fn(orderId))
      .catch((e) => setState({ loadErr: errMsg(e) }))
      .finally(() => loadOrders());
  };

  // ── header ──
  const onToggleOpen = () => {
    const v = get().vendor;
    const open = v ? v.acceptingOrders !== false : true;
    api.setAcceptingOrders(vendorId(), !open).then((vendor) => setState({ vendor })).catch((e) => setState({ loadErr: errMsg(e) }));
  };
  const onLogout = () => { api.logout(); };
  const clearError = () => setState({ loadErr: '' });

  // ── orders: tabs + cursor pagination ──
  const setOrdersTab = (tab: 'all' | 'active' | 'completed' | 'scheduled') => {
    ordersCursors.current = [undefined]; ordersPageIdx.current = 0;
    setState({ ordersTab: tab, ordersPage: 0 });
    loadOrders(tab, undefined);
  };
  const ordersPrev = () => {
    if (ordersPageIdx.current <= 0) return;
    ordersPageIdx.current--;
    setState({ ordersPage: ordersPageIdx.current });
    loadOrders(get().ordersTab, ordersCursors.current[ordersPageIdx.current]);
  };
  const ordersNext = () => {
    if (!get().ordersNextCursor) return;
    ordersPageIdx.current++;
    ordersCursors.current[ordersPageIdx.current] = get().ordersNextCursor || undefined;
    setState({ ordersPage: ordersPageIdx.current });
    loadOrders(get().ordersTab, get().ordersNextCursor || undefined);
  };
  const startReject = (id: string) => setState({ rejectingId: id });
  const cancelReject = () => setState({ rejectingId: null });

  // ── inventory CRUD ──
  const setInvCatFilter = (e: { target: { value: string } }) => setState({ invCatFilter: e.target.value });
  const openAddItem = () => setState({ modalOpen: true, invEditId: null, invName: '', invPrice: '', invPrep: '5', invAvail: true, invCat: 'Other' });
  const openEditItem = (it: MenuItem) => setState({
    modalOpen: true, invEditId: it.id, invName: it.name,
    invPrice: (api.money.toPaise(it.pricePaise) / 100).toString(),
    invPrep: String(it.prepMinutes != null ? it.prepMinutes : 5),
    invAvail: it.isAvailable !== false, invCat: itemCategory(it),
  });
  const closeItemModal = () => setState({ modalOpen: false });
  const setInvName = (e: { target: { value: string } }) => setState({ invName: e.target.value });
  const setInvPrice = (e: { target: { value: string } }) => setState({ invPrice: e.target.value });
  const setInvPrep = (e: { target: { value: string } }) => setState({ invPrep: e.target.value });
  const setInvCat = (e: { target: { value: string } }) => setState({ invCat: e.target.value });
  const toggleInvAvail = () => setState((s) => ({ invAvail: !s.invAvail }));
  const saveItem = () => {
    const s = get();
    const pricePaise = String(api.money.rupeesToPaise(parseFloat(s.invPrice) || 0));
    const prepMinutes = parseInt(s.invPrep, 10) || 0;
    const name = (s.invName || '').trim();
    if (!name || pricePaise === '0') { setState({ loadErr: 'Name and a non-zero price are required' }); return; }
    const cat = s.invCat || 'Other';
    const done = () => loadMenu().then((menu) => setState({ menu }));
    if (s.invEditId) {
      api.updateMenuItem(s.invEditId, { name, pricePaise, prepMinutes, isAvailable: !!s.invAvail })
        .then(() => { setItemCategory(s.invEditId as string, cat); setState({ modalOpen: false }); return done(); })
        .catch((e) => setState({ loadErr: errMsg(e) }));
    } else {
      api.createMenuItem({ vendorId: vendorId(), name, pricePaise, prepMinutes, isAvailable: !!s.invAvail })
        .then((created) => { setItemCategory(created.id, cat); setState({ modalOpen: false }); return done(); })
        .catch((e) => setState({ loadErr: errMsg(e) }));
    }
  };
  const deleteItem = (id: string) => {
    api.deleteMenuItem(id).then(() => loadMenu()).then((menu) => setState({ menu })).catch((e) => setState({ loadErr: errMsg(e) }));
  };
  const toggleItemAvail = (it: MenuItem) => {
    api.setItemAvailability(it.id, it.isAvailable === false).then(() => loadMenu()).then((menu) => setState({ menu })).catch((e) => setState({ loadErr: errMsg(e) }));
  };

  // ── POS ──
  const add = (p: { id: string; name: string; cat: string; price: number }) => setState((s) => {
    const c = [...s.cart];
    const i = c.findIndex((x) => x.id === p.id);
    if (i >= 0) c[i] = { ...c[i], qty: c[i].qty + 1 };
    else c.push({ id: p.id, name: p.name, note: p.cat, price: p.price, qty: 1 });
    return { cart: c };
  });
  const inc = (id: string) => setState((s) => ({ cart: s.cart.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)) }));
  const dec = (id: string) => setState((s) => ({ cart: s.cart.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0) }));
  const clear = () => setState({ cart: [] });
  const setPosCat = (c: string) => setState({ posCat: c });
  const setPosMethod = (m: 'cash' | 'card') => setState({ posMethod: m });
  const onCharge = () => {
    const cart = get().cart || [];
    if (cart.length === 0) { setState({ chargeMsg: 'Add items to the order first.' }); return; }
    const items = cart.map((x) => ({ menuItemId: x.id, quantity: x.qty }));
    const paymentMethod: 'cash' | 'vendor_upi' = get().posMethod === 'card' ? 'vendor_upi' : 'cash';
    setState({ chargeMsg: 'Charging…' });
    api.createWalkInOrder({ items, paymentMethod })
      .then(() => {
        setState({ cart: [], chargeMsg: 'Order charged ✓' });
        loadOrders();
        api.getAnalytics(todayISO()).then((analytics) => setState({ analytics })).catch(() => {});
      })
      .catch((e) => {
        const err = e as { code?: string; status?: number };
        const msg = err && (err.code === 'NOT_FOUND' || err.status === 404)
          ? 'Counter checkout needs the backend endpoint (see POS_CHARGE_BACKEND_PROMPT.md).'
          : errMsg(e);
        setState({ chargeMsg: msg });
      });
  };

  // ── reports (cosmetic, client-only) ──
  const setFilter = (f: string) => setState({ filter: f });
  const setSort = (s: string) => setState({ sort: s });
  const request = (num: string) => setState((s) => ({ requested: { ...s.requested, [num]: true } }));
  const reply = (num: string) => setState((s) => ({ replied: { ...s.replied, [num]: true } }));
  const setMethod = (m: 'cash' | 'card' | 'app') => setState({ method: m });

  // ── lifecycle: hash routing, first load, realtime ──
  useEffect(() => {
    catMap.current = loadCatMap();
    const onHash = () => setState({ route: routeFromHash() });
    window.addEventListener('hashchange', onHash);
    void loadAll();
    void api.realtime.start({ onRefresh: () => void loadOrders() });
    return () => {
      window.removeEventListener('hashchange', onHash);
      api.realtime.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const store: Store = {
    state,
    onToggleOpen, onLogout, clearError,
    setOrdersTab, ordersPrev, ordersNext, loadOrders, act, startReject, cancelReject,
    add, inc, dec, clear, setPosCat, setPosMethod, onCharge,
    itemCategory, setInvCatFilter, openAddItem, openEditItem, closeItemModal,
    setInvName, setInvPrice, setInvPrep, setInvCat, toggleInvAvail, saveItem, deleteItem, toggleItemAvail,
    setFilter, setSort, request, reply, setMethod,
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
