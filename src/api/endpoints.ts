// Typed wrappers for every vendor-dashboard endpoint. Thin: each maps 1:1 to a
// path in the contract and returns the documented shape.

import { request, uuid } from './http';
import type {
  Vendor,
  MenuItem,
  OrderRow,
  OrderDetail,
  Payment,
  Queue,
  VendorAnalytics,
  Page,
} from './types';

// ── Vendor profile / open-close ─────────────────────────────────────────────
export const getVendor = (id: string) => request<Vendor>(`/vendors/${id}`);

export const setAcceptingOrders = (id: string, accepting: boolean) =>
  request<Vendor>(`/vendors/${id}/accepting-orders`, {
    method: 'PATCH',
    body: { accepting },
  });

// ── Menu ────────────────────────────────────────────────────────────────────
// Customer-facing: returns ONLY available items.
export const getMenu = (vendorId: string) =>
  request<{ items: MenuItem[] }>('/menu', { query: { vendor_id: vendorId } }).then((r) => r.items);

// Vendor inventory: ALL items incl. sold-out. Needs the backend endpoint in
// docs/INVENTORY_LIST_BACKEND_PROMPT.md; falls back to the available-only list
// until that ships (so sold-out items are temporarily hidden, never crash).
export const getVendorMenu = (vendorId: string) =>
  request<{ items: MenuItem[] }>('/vendors/me/menu').then((r) => r.items);

export const createMenuItem = (input: {
  vendorId: string;
  name: string;
  pricePaise: string;
  prepMinutes?: number;
  isAvailable?: boolean;
  category?: string;
}) => request<MenuItem>('/menu', { method: 'POST', body: input });

export const updateMenuItem = (
  id: string,
  patch: Partial<{
    name: string;
    pricePaise: string;
    prepMinutes: number;
    isAvailable: boolean;
    category: string;
  }>,
) => request<MenuItem>(`/menu/${id}`, { method: 'PUT', body: patch });

export const deleteMenuItem = (id: string) =>
  request<void>(`/menu/${id}`, { method: 'DELETE' });

/** Convenience for the inventory toggle: flip a single item's availability. */
export const setItemAvailability = (id: string, isAvailable: boolean) =>
  updateMenuItem(id, { isAvailable });

// ── Order board / lists / queue ─────────────────────────────────────────────
export const getBoard = (limit = 50, cursor?: string) =>
  request<Page<OrderRow>>('/vendor/board', { query: { limit, cursor } });

export const getVendorOrders = (
  opts: { status?: string; lane?: 'active' | 'scheduled'; limit?: number; cursor?: string } = {},
) =>
  request<Page<OrderRow>>('/vendors/me/orders', {
    query: { status: opts.status, lane: opts.lane, limit: opts.limit ?? 50, cursor: opts.cursor },
  });

// Parked / scheduled orders: customers who reserved a future pickup slot (lane='scheduled'), kept
// off the live board until their cook-start time. Uses the backend lane filter on the vendor list.
export const getScheduledOrders = (limit = 20, cursor?: string) =>
  getVendorOrders({ lane: 'scheduled', limit, cursor });

export const getQueue = (vendorId: string) =>
  request<Queue>('/queue', { query: { vendor_id: vendorId } });

// ── Park-order slots (vendor rules) ─────────────────────────────────────────
// Sets the live per-vendor slot windows the customer app books against
// (slotMinutes <= 120, capacityPerSlot >= 1, lookaheadMinutes <= 1440).
export const setSlotConfig = (config: {
  vendorId: string;
  slotMinutes: number;
  capacityPerSlot: number;
  lookaheadMinutes: number;
  enabled: boolean;
}) => request<{ ok: boolean }>('/slots/config', { method: 'PUT', body: config });

export const getAnalytics = (date: string) =>
  request<VendorAnalytics>('/vendor/analytics', { query: { date } });

export const getOrder = (orderId: string) => request<OrderDetail>(`/orders/${orderId}`);

// ── Order lifecycle (vendor actions) ────────────────────────────────────────
export const markReady = (orderId: string) =>
  request<{ status: 'ready' }>(`/orders/${orderId}/ready`, { method: 'POST' });

// The backend responds { status } (NOT { verdict }) with 'invalid_or_expired' for a bad/forged code.
export const verifyPickup = (orderId: string, qrToken: string) =>
  request<{ status: 'collected' | 'already_collected' | 'invalid_or_expired' }>(
    `/orders/${orderId}/verify-pickup`,
    { method: 'POST', body: { qrToken } },
  );

export const completeOrder = (orderId: string) =>
  request<{ status: 'completed' }>(`/orders/${orderId}/complete`, { method: 'POST' });

export const rejectOrder = (orderId: string) =>
  request<{ accepted: boolean; message: string }>(`/orders/${orderId}/reject`, { method: 'POST' });

// ── Payments ────────────────────────────────────────────────────────────────
export const confirmOffline = (orderId: string, method: 'cash' | 'vendor_upi' | 'offline') =>
  request<{ status: 'confirmed' | 'already_confirmed' | 'not_payable' }>(
    `/payments/${orderId}/confirm-offline`,
    { method: 'POST', body: { method } },
  );

export const getPaymentByOrder = (orderId: string) =>
  request<Payment>(`/payments/by-order/${orderId}`);

// ── Ratings ─────────────────────────────────────────────────────────────────
// A vendor's aggregate rating. The contract is { vendorId, averageStars, count }
// (NOT averageRating/totalReviews — an earlier client read the wrong field names).
export type RatingSummary = { vendorId: string; averageStars: number | null; count: number };
export const getRatingSummary = (vendorId: string) =>
  request<RatingSummary>(`/ratings/vendor/${vendorId}`);

// ── Vendor walk-in / counter order (POS "Charge") ───────────────────────────
// NOT YET IN THE BACKEND — see docs/POS_CHARGE_BACKEND_PROMPT.md for the spec to
// implement. The frontend is already wired to this contract, so the POS Charge
// button works the moment the endpoint exists.
export const createWalkInOrder = (
  input: {
    items: Array<{ menuItemId: string; quantity: number }>;
    paymentMethod: 'cash' | 'vendor_upi';
    customerPhone?: string;
  },
  idempotencyKey: string = uuid(),
) =>
  request<OrderDetail>('/vendors/me/orders', { method: 'POST', body: input, idempotencyKey });

// ── Order creation (customer-side) ──────────────────────────────────────────
// The board is customer-driven, but a vendor POS can place a walk-in order on a
// customer's behalf. Requires an Idempotency-Key; reuse the same key on retry.
export const createOrder = (
  input: {
    vendorId: string;
    channel?: 'online' | 'offline' | 'cash';
    paymentIntent?: 'pay_in_app' | 'pay_at_truck';
    currency?: string;
    customerLocation?: { lat: number; lng: number };
    items: Array<{ menuItemId: string; quantity: number }>;
  },
  idempotencyKey: string = uuid(),
) =>
  request<OrderDetail>('/orders', {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
