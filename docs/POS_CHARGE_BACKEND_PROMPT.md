# Backend task: vendor "walk-in" / counter order endpoint (POS Charge)

## Why
The Zenith vendor dashboard has a **Point of Sale** screen where a vendor rings up a
walk-up customer at the counter and taps **Charge**. In RASAP2 today, orders can only be
created by a **customer** (`POST /api/v1/orders` with a customer token). A vendor token
gets `403` there. So the POS "Charge" needs a new **vendor-authenticated** endpoint that
creates an order on the vendor's own stall and settles it offline (cash/UPI) in one step.

The frontend is **already wired** to the contract below
(`src/api/endpoints.ts → createWalkInOrder`, POS Charge button). Implement this endpoint and
POS checkout starts working with no further frontend changes.

## Endpoint
```
POST /api/v1/vendors/me/orders
Authorization: Bearer <vendor access token>     # vendorId is taken FROM the token, never the body
Idempotency-Key: <uuid>                          # required; reuse on retry so a flaky network never double-charges
Content-Type: application/json
```

### Request body
```jsonc
{
  "items": [                         // 1..100 items, all must belong to THIS vendor's menu
    { "menuItemId": "uuid", "quantity": 2 }
  ],
  "paymentMethod": "cash",           // "cash" | "vendor_upi"
  "customerPhone": "+9198..."        // OPTIONAL; omit for an anonymous walk-in
}
```

### Behaviour
1. Resolve `vendorId` from the JWT (role must be `vendor`). Reject `403` otherwise.
2. Validate every `menuItemId` belongs to this vendor and `isAvailable`; compute `totalPaise`
   server-side from the menu (never trust a client price). Reject unknown fields (`400`).
3. Create the order bound to `vendorId` with `channel: "offline"`, then **settle payment
   offline immediately** with the given `paymentMethod` — i.e. do internally exactly what
   `POST /payments/{orderId}/confirm-offline` does, so the order ends up `status: "paid"`
   and shows on `GET /vendor/board`. Emit the usual `OrderCreated` + `OrderPaid` events.
4. Honour `Idempotency-Key` the same way `POST /orders` does (same key + same body ⇒ return
   the original order; same key + different body ⇒ `422`).

### Response — `201 Created`
Return the **same order shape** as `GET /orders/{id}` (so the client can reuse its types):
```jsonc
{
  "id": "uuid",
  "orderNumber": "R2-000123",
  "vendorId": "uuid",
  "channel": "offline",
  "status": "paid",
  "totalPaise": "24000",
  "currency": "INR",
  "items": [ { "id": "uuid", "name": "Masala Dosa", "unitPricePaise": "9000", "quantity": 2, "prepMinutes": 8 } ],
  "createdAt": "…", "updatedAt": "…"
}
```

### Errors (reuse the standard envelope `{ "error": { "code, message } }`)
- `400 VALIDATION_ERROR` — bad body, unknown field, quantity ≤ 0, empty items
- `400 IDEMPOTENCY_KEY_REQUIRED` / `IDEMPOTENCY_KEY_INVALID`
- `403 FORBIDDEN` — non-vendor token, or an item that isn't this vendor's
- `404 NOT_FOUND` — a `menuItemId` doesn't exist
- `409 CONFLICT` — item not available / stall not active
- `422` — idempotency key reused with a different body

### Implementation note
This is mostly composition of existing pieces: the order-creation use case + the
offline-payment confirm use case, wrapped in one transaction and scoped to the
token's vendor. No new domain concepts. Add a contract test mirroring the examples above.

---
Frontend contract reference: `src/api/endpoints.ts` (`createWalkInOrder`). Until this ships,
the POS Charge button shows: *"Counter checkout needs the backend endpoint."*
