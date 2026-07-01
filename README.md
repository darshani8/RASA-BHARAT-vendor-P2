# Zenith Retail Cloud — Vendor PWA (React)

**Live:** https://darshani8.github.io/RASA-BHARAT-vendor-P2/ — deployed to GitHub Pages on every
push (`.github/workflows/deploy-pages.yml`).

A vendor point-of-sale & operations dashboard, built as a **React 18 + Vite PWA**. This replaces
the previous Flutter app. It reproduces the "Zenith Retail Cloud" design exactly — a dark ink
sidebar (Dashboard · Point of Sale · Orders · Queue · Inventory · Analytics · Reports) with a
light, hairline-card content area, the Manrope typeface, and Material Symbols icons.

## Stack
- **React 18** (`createRoot`) + **Vite 5**, TypeScript.
- **vite-plugin-pwa** — installable, offline-capable (service worker + manifest + icons).
- Manrope + Material Symbols fonts are **bundled** (`public/fonts`) — no runtime CDN fetch.
- The UI is plain React components under `src/app/` (hash router + a small state store). All UI
  state (routing, cart, orders, queue, inventory) lives in `src/app/store.tsx`.

## Run it
```bash
npm install
npm run dev        # http://localhost:8080  (hot reload)
npm run build      # production build → dist/
npm run preview    # serve the production build on http://localhost:8080
```

## Structure
```
index.html              Vite entry (<div id="root">)
src/main.tsx            React login gate, then mounts <App/>
src/app/App.tsx         hash router → header config + active view
src/app/store.tsx       central state, live-data loaders, realtime, all actions
src/app/css.ts          parses verbatim CSS strings → React style objects
src/app/format.ts       formatting/mapping helpers + light-theme CSS vars
src/app/components/     Shell, Sidebar, Header (shared chrome)
src/app/views/          Dashboard, Pos, Orders, Queue, Inventory (+ItemModal), Analytics, Reports
src/api/                RASAP2 REST client (auth, http, endpoints, realtime, money, tokens)
src/styles.css          component styles + @font-face (local fonts)
public/fonts/*.woff2    Manrope (6 ranges) + Material Symbols
public/icons/*          PWA icons
vite.config.ts          Vite + PWA config
```

## Routes
Hash-routed: `#/dashboard` (default) · `#/pos` · `#/orders` · `#/queue` · `#/inventory` ·
`#/analytics` · `#/reports`.

## Backend wiring

This PWA is wired to the RASAP2 backend via the `src/api/` client (a `fetch`-based client with
JWT bearer auth + refresh-token retry). Copy `.env.example` to `.env` and set:

```
VITE_API_BASE_URL=http://localhost:3000
```

The client appends the `/api/v1` version prefix itself. The backend must allow the dev origin in
`CORS_ALLOWED_ORIGINS` (e.g. `http://localhost:8080`).

A vendor login gate is rendered before the dashboard when no valid token is stored in
`localStorage`. After login, menu, orders, queue, and analytics are fetched from the RASAP2 REST
API and drive the live screens. A 5-second poll acts as a Socket.io fallback.
