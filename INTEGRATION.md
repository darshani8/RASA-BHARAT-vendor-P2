# INTEGRATION.md — RASA-BHARAT Vendor Dashboard Backend Wiring

## Environment variable

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:3000/api/v1` | Base URL of the RASAP2 backend REST API |

Copy `.env.example` to `.env` and set `VITE_API_BASE` to your backend origin.

## How `window.RasaAPI` reaches the embedded script

The design-component script (`<script type="text/x-dc" data-dc-script>`) is not processed by
Vite — it runs in global scope after the dc-runtime Babel-transforms and evaluates it at boot.
Therefore it cannot use `import`.

`src/main.ts` (which IS bundled by Vite) dynamically imports `src/api.js` and assigns the
module's exports to `window.RasaAPI` before booting the dc-runtime.  The embedded `Component`
class then calls `window.RasaAPI.*` directly.

`src/main.ts` also sets `window.__API_BASE__` from `import.meta.env.VITE_API_BASE` so the
bundled `src/api.js` uses the correct origin at runtime.

```
Vite build
  └─ src/main.ts  ──imports──►  src/api.js
                                  sets window.RasaAPI
                                  sets window.__API_BASE__
                                  if !authenticated → renders login gate (plain DOM)
                                  if authenticated → import('./dc-runtime.js')
                                       └─ evaluates <script data-dc-script>
                                               └─ Component calls window.RasaAPI.*
```

## Screen → backend endpoint mapping

| Screen | Read endpoints | Write endpoints |
|---|---|---|
| Login gate | POST `/vendors/login` | POST `/vendors/refresh` on 401 |
| Dashboard | GET `/vendors/me/orders` (board rows), GET `/vendor/analytics?date=today`, GET `/queue?vendor_id=` | — |
| Orders | GET `/vendors/me/orders` (poll every 10s) | POST `/orders/:id/ready`, POST `/orders/:id/complete`, POST `/orders/:id/reject` |
| Queue | GET `/queue?vendor_id=` | POST `/queue/advance?vendor_id=` |
| Inventory | GET `/menu?vendor_id=` | POST `/menu`, PUT `/menu/:id`, DELETE `/menu/:id` |
| Analytics | GET `/vendor/analytics?date=today` | — |
| Reports | GET `/ratings/vendor/:vendorId` (rating summary) | — (reviews list is mock) |
| Sidebar | — | PATCH `/vendors/:id/accepting-orders` (Sign Out clears localStorage) |

## Status mapping (design display → backend wire)

| Backend status | Display label | Action buttons shown |
|---|---|---|
| `created` / `paid` | Pending | Accept (local-only), Reject |
| `ready` | Ready | Collect Order |
| `collected` | Collected | Mark Completed |
| `completed` | Completed | (none — shows more icon) |
| `cancelled` | Rejected | (none — shows more icon) |

Note: `preparing` is a local-only optimistic state set by the "Accept" button.  There is no
corresponding backend transition — the order is already queued and paid when it arrives.

## Polling fallback

On `componentDidMount`, if authenticated, `_fetchAll()` is called once (after 120 ms delay)
and then every 10 seconds via `setInterval`.  This covers the case where Socket.io is not
connected.  If/when Socket.io events fire (`OrderCreated`, `PaymentConfirmed`, `OrderReady`,
`QueueUpdated`), those can call `_fetchAll()` as well — see dc-runtime for the event bridge.

## Known gaps / mismatches

1. **POS checkout not wired — no backend endpoint.**  The Point of Sale screen (cart +
   charge button) is demo-only.  The backend has no vendor-side "create sale" endpoint; orders
   arrive from the customer app via Razorpay.  A visible note is displayed on the charge button.

2. **Board rows lack customer name and line items.**  `GET /vendors/me/orders` returns
   `OrderReadModelRow` which has `orderId`, `orderNumber`, `status`, `totalPaise`, `channel`,
   `lane`, timestamps — but NO customer name and NO item list.  The Orders and Dashboard
   screens display `—` in the Customer and Items columns when live data is loaded.

3. **No backend `accept`/`preparing` step.**  The "Accept" button is a local-only optimistic
   state change (`status: 'preparing'` in component state).  The order is already paid and
   queued server-side before it appears on the board.

4. **Inventory: no stock, category, description, or image fields.**  `GET /menu` returns
   `MenuItem` with `{ id, vendorId, name, pricePaise, prepMinutes, isAvailable }` only.
   The Stock and Category columns display `—` for live menu items.  The add-item form collects
   Category, Description, and Initial Stock but these fields are not sent to the backend.

5. **Queue "terminal/counter" concept not in backend.**  The backend queue is a single sorted
   set per vendor with `{ nowServingOrderId, entries:[{orderId, orderNumber, position}] }`.
   There is no concept of multiple cashier terminals or counters.  The Terminal Queue table
   is populated with queue entries mapped to position numbers.

6. **Reviews / reports are mock data.**  `GET /ratings/vendor/:id` returns a summary
   (averageRating, totalReviews) which drives the header KPIs, but the individual review cards
   remain hardcoded demo data because the backend ratings endpoint returns aggregate statistics
   only, not per-order comment text.

7. **Analytics chart is static SVG.**  The chart shapes on Dashboard and Analytics screens
   use hardcoded SVG paths.  The KPI numbers (`todayRevenue`, `todayOrders`) are driven from
   `GET /vendor/analytics`, but the chart shape itself is not regenerated from hourly data.

## CORS

The backend must include the dev origin in `CORS_ALLOWED_ORIGINS`.  For local development with
`npm run dev` (default port 8080):

```
CORS_ALLOWED_ORIGINS=http://localhost:8080
```

For production, set it to the deployed PWA origin.
