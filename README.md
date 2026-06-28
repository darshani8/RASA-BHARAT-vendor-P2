# RASAP2 Vendor — Flutter PWA

A vendor dashboard for the [RASAP2](https://github.com/darshani8/Rasap2) food-queue backend,
built as a Flutter **PWA** (installable web app, mobile-first). It reuses the "Zenith" brand
(ink + emerald, Manrope) and talks to the backend's real `/api/v1` vendor endpoints over REST,
with **live updates over Socket.IO**.

## What's here

```
lib/
  main.dart                 app entry — routes to Login or Home based on a stored session
  theme.dart                Zenith palette + Material 3 theme + order status pill styles
  api/rasap_api.dart        RASAP2 REST client: login + silent token refresh, keyset-paginated
                            board/orders, menu CRUD, lifecycle, analytics
  realtime/realtime_client.dart  Socket.IO v4 client — auto-joins the vendor room, surfaces
                                 order/menu events as refresh "ticks"
  widgets.dart              OrderBoard (keyset-paginated, pull-to-refresh, live-refresh) + card + pills
  screens/
    login_screen.dart      API base URL + vendor phone/password sign-in
    home_shell.dart        bottom-nav shell (Queue · Orders · Menu · Settings) + Live/Offline badge
    queue_screen.dart      KDS board (GET /vendor/board) + "Advance" (POST /queue/advance)
    orders_screen.dart     incoming orders w/ status filter (GET /vendors/me/orders)
    menu_screen.dart       vendor menu CRUD (list all incl. sold-out, add/edit/delete, toggle)
    settings_screen.dart   accepting-orders toggle, daily analytics, sign out
web/                       PWA shell (index.html + manifest.json + generated brand icons)
pubspec.yaml
```

> Only `lib/`, `web/`, and `pubspec.yaml` are hand-authored here (the brand PWA icons in
> `web/icons/` + `web/favicon.png` are committed). Run `flutter create .` once (below) to generate
> the remaining platform scaffolding (`.metadata`, web bootstrap) around them.

## What it does (wired to the real backend)

- **Sign in** with vendor phone + password → `POST /api/v1/vendors/login`. The access token is
  refreshed **silently** with the rotating refresh token on any `401`, so sessions don't drop
  mid-shift.
- **Live Queue (KDS):** `GET /api/v1/vendor/board`, **keyset-paginated** (infinite scroll via
  `page.nextCursor`) and **refreshed live** whenever the backend pushes an order event.
- **Orders:** `GET /api/v1/vendors/me/orders` with a status filter
  (New / Ready / Collected / Completed / Cancelled), same pagination + live refresh.
- **Order lifecycle:** Mark Ready / Complete / Reject (`POST /api/v1/orders/:id/{ready,complete,reject}`).
- **Menu:** lists **every** item incl. sold-out (`GET /api/v1/menu?available_only=false`), with
  add / edit / delete and an availability toggle; live-updates on `MenuItemAvailabilityChanged`.
- **Settings:** open/close the shop (`PATCH /api/v1/vendors/:id/accepting-orders`) and today's
  analytics (`GET /api/v1/vendor/analytics`).
- A **Live / Offline** badge in the app bar reflects the Socket.IO connection.

## 1. Make it a runnable Flutter project

```bash
cd RASA-BHARAT-vendor-P2
flutter create . --platforms=web --project-name rasap2_vendor   # fills in missing scaffolding
flutter pub get
```

`flutter create .` will not overwrite the `lib/` files, `pubspec.yaml`, or the committed
`web/icons/` already here; it only adds what's missing.

## 2. Run it

```bash
flutter run -d chrome --web-port 8080     # dev — fixed port so it matches the backend CORS allow-list
flutter build web --release               # production PWA in build/web (service worker auto-generated)
```

> Pin the dev port (`--web-port 8080`) so the origin matches `CORS_ALLOWED_ORIGINS` on the backend
> (see below). `flutter run` otherwise picks a random port that CORS will reject.

## 3. Connect to the RASAP2 backend

1. Start the backend (from the Rasap2 repo): `docker compose -f infra/docker-compose.yml up -d`
   — it serves on `http://localhost:3000`.
2. In the app's **Sign in** screen, set **API base URL** to the backend origin
   (e.g. `http://localhost:3000`) and sign in with a vendor phone + password.
   - The base URL is the **origin only** — the client appends `/api/v1` itself, and Socket.IO
     connects to that origin on its default `/socket.io` path.
   - Health is checked at `/health` and `/ready` (server root).
3. **CORS:** the backend must allow this web app's origin for BOTH HTTP and the Socket.IO
   handshake. RASAP2 reads a single env var, `CORS_ALLOWED_ORIGINS` (comma-separated, exact
   scheme+host+port), used by `corsPolicy(config)` and the realtime gateway. The backend's
   `infra/docker-compose.yml` now defaults it to `http://localhost:8080,http://127.0.0.1:8080`;
   set it to your real origin in production. Without this the browser blocks every request.
4. A vendor account must be **approved/active** to log in (admin approves an application, or is
   created active). See the Rasap2 README "Run it" + the vendors module.

## 4. This repo

This frontend lives in its **own** repo, separate from the backend:
<https://github.com/darshani8/RASA-BHARAT-vendor-P2>. The matching backend wiring (the
`available_only=false` menu list + the CORS default) is on the same-named branch in
<https://github.com/darshani8/Rasap2>.

## Endpoints used (vendor role)

| Action | Call |
|---|---|
| Sign in | `POST /api/v1/vendors/login` → `{token, expiresIn, refreshToken, vendorId}` |
| Refresh (silent) | `POST /api/v1/vendors/refresh` → rotated `{token, refreshToken, …}` |
| KDS board | `GET /api/v1/vendor/board?limit=&cursor=` → `{data, page:{nextCursor}}` |
| Incoming orders | `GET /api/v1/vendors/me/orders?status=&limit=&cursor=` |
| Mark ready / complete / reject | `POST /api/v1/orders/:id/{ready,complete,reject}` |
| Advance queue | `POST /api/v1/queue/advance?vendor_id=` → `{nowServingOrderId}` |
| Menu (management list) | `GET /api/v1/menu?vendor_id=&available_only=false` → `{items}` |
| Menu create / update / delete | `POST·PUT·DELETE /api/v1/menu` (prices = positive integer **paise** strings) |
| Open/close shop | `PATCH /api/v1/vendors/:id/accepting-orders` `{accepting}` |
| Daily analytics | `GET /api/v1/vendor/analytics?date=YYYY-MM-DD` |
| Live updates | Socket.IO at the origin; handshake `auth:{token}`; vendor room events `OrderPaid`/`OrderReady`/… |

## Notes

- Money is **integer paise as a string** everywhere (matches the backend BIGINT contract); the UI
  converts to/from ₹ only for display and validates a positive integer before sending.
- This scaffold was authored as source without a Flutter toolchain in the build environment, so it
  has not been run through `flutter analyze` here — run it after `flutter pub get` and fix any
  version drift for your installed Flutter SDK. `CLAUDE_CODE_HANDOFF.md` records the original task.
