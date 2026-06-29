# Zenith Retail Cloud — Vendor PWA (React)

**Live:** https://darshani8.github.io/RASA-BHARAT-vendor-P2/ — deployed to GitHub Pages on every
push (`.github/workflows/deploy-pages.yml`).

A vendor point-of-sale & operations dashboard, built as a **React 18 + Vite PWA**. This replaces
the previous Flutter app. It reproduces the "Zenith Retail Cloud" design exactly — a dark ink
sidebar (Dashboard · Point of Sale · Orders · Queue · Inventory · Analytics · Reports) with a
light, hairline-card content area, the Manrope typeface, and Material Symbols icons.

## Stack
- **React 18** (`createRoot`) + **Vite 5**, TypeScript entry.
- **vite-plugin-pwa** — installable, offline-capable (service worker + manifest + icons).
- Manrope + Material Symbols fonts are **bundled** (`public/fonts`) — no runtime CDN fetch.
- Renders the design via a small design-component runtime (`src/dc-runtime.js`) that compiles the
  embedded template (`index.html` `<x-dc>`) and logic (`<script data-dc-script>`) into
  `React.createElement` calls. All UI state (routing, cart, orders, queue, reviews) lives in that
  React component.

## Run it
```bash
npm install
npm run dev        # http://localhost:8080  (hot reload)
npm run build      # production build → dist/
npm run preview    # serve the production build on http://localhost:8080
```

## Structure
```
index.html              the Zenith design — <x-dc> template + <script data-dc-script> logic
src/main.ts             exposes React/ReactDOM globally, then boots the runtime
src/dc-runtime.js       design-component runtime (template → React)
src/styles.css          theme tokens, component styles, @font-face (local fonts)
public/fonts/*.woff2     Manrope (6 ranges) + Material Symbols
public/icons/*           PWA icons
vite.config.ts          Vite + PWA config
```

## Routes
Hash-routed: `#/dashboard` (default) · `#/pos` · `#/orders` · `#/queue` · `#/inventory` ·
`#/analytics` · `#/reports`. Light/dark theme + accent + density are configurable via the
component props in `index.html` and persist to `localStorage`.

## Backend wiring

This PWA is wired to the RASAP2 backend via `src/api.js` (a plain `fetch`-based client with
JWT bearer auth + refresh-token retry). Copy `.env.example` to `.env` and set:

```
VITE_API_BASE=http://localhost:3000/api/v1
```

The backend must allow the dev origin in `CORS_ALLOWED_ORIGINS` (e.g. `http://localhost:8080`).

A vendor login gate is rendered before the dashboard when no valid token is stored in
`localStorage`. After login, orders, queue, menu, and analytics are fetched from the RASAP2
REST API and drive the live screens. A 10-second poll acts as a Socket.io fallback.

See `INTEGRATION.md` for the full screen-to-endpoint mapping, status mapping, and known gaps.
