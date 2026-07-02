# Build task: vendor "Scheduled / Parked Orders" view

## Why
RASAP2 supports **"park your order"** — a far‑away customer reserves a future pickup **time slot**
instead of joining the live queue (see `DECISIONS.md` D61/D62 and `PARK_ORDER_AND_SLOTS_DESIGN.md`).
A parked order is placed on the **`scheduled` lane**: it is deliberately kept **off the live KDS
board** until its computed **cook‑start time**, when it moves to the `active` lane and appears on the
board like any order.

Today the vendor has **no way to see parked orders before then** — there is no "Scheduled/Parked"
screen, and the board (`GET /vendor/board`) returns only active orders. The vendor can't see what's
coming, when to expect it, or how many places are booked. Build a vendor **Scheduled / Parked
Orders** view so the vendor can see upcoming parked orders with their cook‑start countdown.

## Current state (what already exists — reuse it)
- **Data:** a parked order is an `orders` row with `lane = 'scheduled'` (and `status = 'paid'`), plus
  an `order_slot` row (order → slot) and `slot_bookings` (per‑window counter). The CQRS projection
  `order_read_model` already carries `lane`, `cook_start_at`, `ready_at`, `prep_minutes`,
  `total_paise`, `order_number`, `channel`, `status`, `created_at`.
- **Backend list:** `GET /api/v1/vendors/me/orders` (vendor‑token, IDOR‑scoped to the token's
  vendor) returns the vendor's orders from the read‑model as `{ data: OrderRow[], page }`, keyset
  paginated. It currently filters by `status` only — **not by `lane`**.
- **Frontend:** the vendor UI (`RASA-BHARAT-vendor-P2`, React) has an Orders screen
  (`src/app/views/OrdersView.tsx`) driven by `src/app/store.tsx`; the API client is `src/api/`
  (`ZenithAPI`, `endpoints.ts`, `types.ts`), money via `formatPaise` / `inr`.

## Scope

### 1. Backend — add a `lane` filter to the vendor orders list (small, additive)
Reuse the existing endpoint; do **not** invent a new one.

- `backend/src/read-model/adapters/read-model.controller.ts` → `meListQuerySchema` (used by
  `vendorList`): add an optional `lane` param:
  ```ts
  lane: z.enum(['active', 'scheduled']).optional(),
  ```
  and pass it into the `ListOrdersInput` for `vendorList` (like `status` is).
- `backend/src/read-model/ports/read-model.ports.ts` → `ListFilter`: add `lane?: Lane`.
- `backend/src/read-model/read-model.query-service.ts` and the repository `list(...)` SQL: when
  `lane` is present, add `AND lane = $n` to the WHERE (keep it a constant/parameterized predicate —
  no string interpolation, per the golden rules).
- Result: `GET /api/v1/vendors/me/orders?lane=scheduled&limit=50` returns the vendor's parked orders.
- **Keep IDOR intact:** `vendorId` still comes from the token, never the query.
- **(Optional, nicer) expose the pickup window:** the projection has `cook_start_at` but not the
  slot start. Either (a) show `cookStartAt` as "starts cooking at" (no projection change — preferred
  for v1), or (b) add `slot_start_ms` to `order_read_model` (project it from the park‑order linkage)
  and return it as `slotStartMs` so the UI can show the exact pickup window. Do (a) for v1.

Tests (`backend/src/read-model.int.test.ts` or a new `vendor-parked.int.test.ts`): seed a paid order,
force it onto the `scheduled` lane, assert `GET /vendors/me/orders?lane=scheduled` returns it and
`?lane=active` does not; assert the lane filter is still vendor‑IDOR‑scoped.

### 2. Frontend — the "Scheduled" view/tab
- `src/api/types.ts` → `OrderRow`: ensure it includes `lane`, `cookStartAt`, `prepMinutes` (add if
  missing; they exist on the backend row).
- `src/api/endpoints.ts` → add `getScheduledOrders = (limit = 50, cursor?) =>
  request<Page<OrderRow>>('/vendors/me/orders', { query: { lane: 'scheduled', limit, cursor } })`.
- `src/app/store.tsx` → load scheduled orders (on a poll, like the board) into state, e.g.
  `state.scheduled: OrderRow[]`.
- **UI:** add a **"Scheduled"** tab to the Orders screen (next to All/Active/Completed) **or** a new
  sidebar item "Parked". It lists parked orders sorted by `cookStartAt` ascending, each row showing:
  - order number, amount (`inr(totalPaise)`), channel,
  - **cook‑start time** and a live **countdown** ("cooks in 34 min" / "cooking now"),
  - a `Scheduled` status pill.
  - Empty state: "No parked orders — customers who reserve a pickup slot appear here."
- No new actions are required (parked orders auto‑move to the board at cook‑time). Optionally a
  read‑only "view details" is fine.

## Endpoint contract (after step 1)
```
GET /api/v1/vendors/me/orders?lane=scheduled&limit=50[&cursor=…]
Authorization: Bearer <vendor access token>
→ 200 { "data": [ {
    "orderId": "uuid", "orderNumber": "R2-000123", "vendorId": "uuid",
    "channel": "online", "status": "paid", "lane": "scheduled",
    "totalPaise": "24000", "currency": "INR",
    "cookStartAt": "2026-07-01T13:30:00.000Z", "readyAt": null,
    "prepMinutes": 8, "createdAt": "…", "updatedAt": "…"
  } ], "page": { "limit": 50, "nextCursor": null } }
```

## Acceptance criteria
- A parked order (customer booked a future slot) shows in the vendor's **Scheduled** view with the
  correct cook‑start countdown, and is **absent** from the live board until cook‑time.
- When cook‑start fires, the order **leaves** the Scheduled view and **appears** on the live board
  (existing behaviour — just verify).
- The list is vendor‑scoped (a vendor never sees another vendor's parked orders).
- Money shown as ₹ from integer paise (never float).
- Gate: backend `tsc + lint + build + unit + integration` green; UI builds; manual check against the
  running stack.

## How to test it manually (there are no parked orders by default)
Parking is a **customer** action, so to create one against the pilot vendor
(`vendorId c55eb2e7-…`, login `+910000000002` / `Pilot@12345`):
1. Enable slots for the vendor:
   `PUT /api/v1/slots/config` (vendor token) body
   `{ "vendorId": "<vendorId>", "slotMinutes": 15, "capacityPerSlot": 4, "lookaheadMinutes": 120, "enabled": true }`.
2. As a **customer** (login `+910000000001` / `Pilot@12345`), find a bookable window:
   `GET /api/v1/slots?vendor_id=<vendorId>&prep_minutes=8` → pick a `startMs` with `status` bookable.
3. Place a parked order: `POST /api/v1/orders` with `Idempotency-Key`, body
   `{ "vendorId": "<vendorId>", "channel": "online", "customerLocation": {"lat":.., "lng":..},
      "items": [{"menuItemId":"<id>","quantity":1}], "slotStartMs": <startMs> }`
   → the order is created, reserved into the slot, and lands on the `scheduled` lane.
4. Confirm in the DB (Adminer): `orders.lane = 'scheduled'`, an `order_slot` row, a `slot_bookings`
   row. Then it should appear in the new vendor **Scheduled** view.

## Gotchas / rules
- **Modules own their tables**; go through `index.ts`/events, not cross‑module joins. The lane filter
  lives in the read‑model module.
- **Idempotency‑Key required** on `POST /orders`; money is integer paise as a string.
- Keep the lane predicate parameterized (no SQL string interpolation).
- Don't add actions to parked orders in v1 — they transition automatically at cook‑start.
