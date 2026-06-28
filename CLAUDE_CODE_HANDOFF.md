# Claude Code handoff — finish the RASAP2 Vendor Flutter PWA

This repo is a hand-authored scaffold (written in a design tool with no Flutter toolchain).
Your job: make it build, run, and match the RASAP2 backend exactly.

## Context
- Backend: the **Rasap2** repo (modular monolith, `/api/v1`, JWT vendor auth). Read its
  `README.md` and `backend/src/app.ts` for the route map, and the controllers under
  `backend/src/{vendors,read-model,menu,queue,orders}/adapters/*.ts` for exact request/response shapes.
- This app is the **vendor** side only (role `vendor`).

## Tasks
1. `cd rasap2-vendor-flutter && flutter create . --platforms=web --project-name rasap2_vendor && flutter pub get`
2. `flutter analyze` — fix any API/version drift (this was authored blind). Then `flutter run -d chrome`.
3. Verify each call in `lib/api/rasap_api.dart` against the backend controllers and correct any
   field-name mismatches:
   - login response: `{token, expiresIn, refreshToken, vendorId}` (vendor-auth.service.ts) ✓
   - board/orders: list envelope `{data, page:{limit,nextCursor}}`; rows are `OrderReadModelRow`
     (`read-model/ports/read-model.ports.ts`): `orderId, orderNumber, status, totalPaise, readyAt, prepMinutes…`
   - menu list: `{items:[…]}`; item fields `{id, name, pricePaise, prepMinutes, isAvailable}`
   - `acceptingOrders` flag name on the vendor entity — confirm in `vendors/domain/vendor.types.ts`.
4. Add keyset pagination (use `page.nextCursor`) to the board/orders lists.
5. Add Socket.io live updates (backend `realtime/` module) so the board refreshes on `OrderPaid`/`OrderReady`.
6. Wire CORS on the backend to allow this web origin; document the env in the README.
7. Generate real PWA icons in `web/icons/`.

## Design language
Match the HTML "Zenith" suite: ink sidebar/nav (#0E1116), emerald accent (#128A63), Manrope,
white hairline cards (1px #E9EBEE, radius 16), generous spacing. `lib/theme.dart` already encodes it.

## Status — done (verified against the live backend source)

All tasks above are implemented; the API client was reconciled field-by-field against the backend
controllers/zod schemas:

1. ✅ Project is ready for `flutter create . --platforms=web && flutter pub get` (scaffolding-only).
2. ⚠️ `flutter analyze` / `flutter run` not executed — no Flutter toolchain in this environment.
   Run them on a real SDK and fix any version drift; the Dart was reviewed instead.
3. ✅ Every call reconciled with the backend: `login → {token,expiresIn,refreshToken,vendorId}`;
   board/orders use the `{data, page:{nextCursor}}` envelope; `acceptingOrders` (camelCase, the
   `isAcceptingOrders` fallback was dropped); `prepMinutes`/`readyAt` treated as nullable; vendor
   `reject` (not customer `cancel`); `DELETE /menu/:id` handled as 204; menu prices kept as
   positive-integer paise strings. Added **silent token refresh** on 401 via `/vendors/refresh`.
4. ✅ Keyset pagination (`page.nextCursor`, infinite scroll) on the board + orders lists.
5. ✅ Socket.IO live updates (`lib/realtime/realtime_client.dart`): handshake `auth:{token}`, the
   vendor auto-joins `vendor:{vendorId}`, and `OrderCreated/Paid/Ready/Completed/Collected` +
   `MenuItemAvailabilityChanged` trigger live list refreshes; app-bar Live/Offline badge.
6. ✅ CORS: `CORS_ALLOWED_ORIGINS` documented in both READMEs and defaulted in the backend
   `infra/docker-compose.yml` (one var drives HTTP + Socket.IO).
7. ✅ Real brand PWA icons generated in `web/icons/` (192/512 + maskable) + `web/favicon.png`.

**Backend wiring (companion change in the Rasap2 repo, same branch):** `GET /api/v1/menu` gained an
owner-scoped `available_only=false` option so the vendor menu screen can list and re-enable
sold-out items (the public catalogue stays available-only). Recorded in the backend `DECISIONS.md`
(D58/D59) with unit tests.
