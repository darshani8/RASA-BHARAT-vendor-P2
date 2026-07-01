# Zenith Retail Cloud — Vendor Dashboard PRD

## 1. Product Overview
Zenith Retail Cloud is a **vendor-facing point-of-sale & operations dashboard** (React 18 PWA, served on `http://localhost:8080`). It is wired to the RASAP2 food-truck ordering backend (Node + Express, REST under `/api/v1`). A vendor signs in and manages their live menu, incoming orders, pickup queue, inventory, and daily performance from a single dashboard.

All money is handled as integer paise (string), e.g. `"5000"` = ₹50.00, and always formatted for display — never floating-point math.

## 2. Authentication
- The whole app is behind a **vendor auth gate**; unauthenticated users see a login screen.
- Login is by **phone number + password**. On success a session token is stored and the dashboard loads; the token auto-refreshes.
- **Logout** is available from the avatar menu on every route and returns the user to the login screen.
- Test (pilot) vendor account: phone `+910000000002` (staging-only; password provided out-of-band, not committed).

## 3. Core Features / Screens

### 3.1 POS / Charge
- Product grid populated from the vendor's **live, available** menu.
- **Category chips** (Breakfast / Mains / Beverages / Sweets / Other) filter the grid.
- Tapping products builds a cart; the vendor can place a **walk-in order** and take cash/offline payment.

### 3.2 Orders Board
- Lists incoming orders with **order number, total, status, and channel** (order rows intentionally carry no customer name or item lines — privacy by design).
- **Tabs:** All / Active / Completed, with cursor-based pagination ("load more").
- **Lifecycle actions:** mark order Ready, Complete, or Reject; confirm an offline/cash payment.
- Status values: pending → preparing → ready → collected → completed (plus rejected/cancelled).

### 3.3 Queue
- Shows the live pickup queue of orders awaiting collection.

### 3.4 Inventory
- Lists **all** menu items (including sold-out), with a **Category** column and category filter.
- **Add / Edit / Delete** menu items and toggle **availability** (sold-out).
- Categories are remembered per item.

### 3.5 Dashboard (Home)
- Greeting + current date.
- KPIs: **today's revenue** and **order count**.
- **Hourly orders bar chart** (CSS bars).
- **Live Queue** panel and **Recent Transactions** list.

### 3.6 Header / Global Controls
- **Register Open** toggle (vendor starts/stops accepting orders).
- Avatar menu with **Logout**.
- Left sidebar navigation: Dashboard, POS/Charge, Orders, Queue, Inventory.

## 4. Out of Scope (cosmetic / no backend yet)
Reports & reviews/ratings, Razorpay online payment (offline/cash works), inventory stock-level KPIs, dashboard Avg-Handle-Time / Completion-Rate / week-month toggles / Export / Pause / Announce, and the notifications bell. These render but are not expected to be functionally tested.

## 5. Test Environment Notes
- Frontend dev/preview server: `http://localhost:8080` (root path `/`).
- The backend (RASAP2) must be running on `http://localhost:3000` and the frontend `.env` must set `VITE_API_BASE_URL=http://localhost:3000` for login-gated flows to succeed.
- An order placed by a customer only appears on the vendor board after its payment is confirmed (async, ~1s).
