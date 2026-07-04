// Wire types — exact shapes from the RASAP2 OpenAPI contract. Money fields are
// integer strings of paise (see ./money).

export type Paise = string; // integer paise, e.g. "5000" = ₹50.00

export type Vendor = {
  id: string;
  name: string;
  location: { lat: number; lng: number } | null;
  defaultPrepMinutes: number;
  isActive: boolean;
  status: 'pending' | 'active' | 'rejected';
  maxActiveOrders: number | null;
  maxReadyOrders: number | null;
  acceptingOrders: boolean;
};

export type MenuItem = {
  id: string;
  vendorId: string;
  name: string;
  pricePaise: Paise;
  prepMinutes: number;
  isAvailable: boolean;
  // Food category (e.g. 'Breakfast', 'Mains', 'Beverages', 'Sweets'); null = uncategorised.
  category: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'created' | 'paid' | 'ready' | 'collected' | 'completed' | 'cancelled';

/** Row returned by the board / orders-list endpoints (no items, no PII). */
export type OrderRow = {
  orderId: string;
  orderNumber: string;
  /** Per-vendor daily queue token ("A-07") — the same number the customer's queue page shows. */
  queueToken?: string | null;
  customerId: string;
  vendorId: string;
  channel: 'online' | 'offline' | 'cash';
  status: OrderStatus;
  totalPaise: Paise;
  currency: string;
  lane: 'active' | 'scheduled';
  collectedAt: string | null;
  readyAt: string | null;
  cookStartAt: string | null;
  prepMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  name: string;
  unitPricePaise: Paise;
  quantity: number;
  prepMinutes: number;
};

/** Full order with items, from GET /orders/{id}. */
export type OrderDetail = OrderRow & {
  id: string;
  paymentIntent: 'pay_in_app' | 'pay_at_truck';
  position: number | null;
  qrExpiresAt: string | null;
  items: OrderItem[];
};

export type Payment = {
  id: string;
  orderId: string;
  provider: 'stub' | 'razorpay';
  providerOrderId: string | null;
  providerPaymentId: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'refunding' | 'refunded';
  method: 'gateway' | 'cash' | 'vendor_upi' | 'offline';
  amountPaise: Paise;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type QueueEntry = { orderId: string; orderNumber: string; position: number };
export type Queue = {
  vendorId: string;
  nowServingOrderId: string | null;
  entries: QueueEntry[];
};

export type VendorAnalytics = {
  vendorId: string;
  date: string;
  orderCount: number;
  grossRevenuePaise: Paise;
  hourly: Array<{ hour: number; orderCount: number; revenuePaise: Paise }>;
  // Rolling out on the backend alongside this client — absent on an older server, so both are
  // optional. `completedCount`: orders that reached completed/collected today. `avgHandleMinutes`:
  // mean minutes from payment to ready today, or null with no completions yet.
  completedCount?: number;
  avgHandleMinutes?: number | null;
};

/** A single customer review for one of this vendor's orders, from GET /ratings/vendor/{id}/reviews. */
export type VendorReview = {
  id: string;
  orderId: string;
  orderNumber: string;
  queueToken: string | null;
  stars: number;
  comment: string | null;
  createdAt: string;
};

export type Page<T> = { data: T[]; page: { limit: number; nextCursor: string | null } };
