# Backend task: vendor "list all my menu items" endpoint (Inventory)

## Why
`GET /api/v1/menu?vendor_id=…` is **customer-facing** and returns **only available
items**. The vendor **Inventory** screen needs to see *all* its items — including
**sold-out** ones — otherwise marking an item sold-out makes it disappear from the
list with no way to re-enable it. The frontend already calls the endpoint below and
**falls back** to the available-only list until it exists (so sold-out items are just
temporarily hidden, never a crash).

## Endpoint
```
GET /api/v1/vendors/me/menu
Authorization: Bearer <vendor access token>   # vendorId from the token
```

### Behaviour
- Resolve `vendorId` from the JWT (role `vendor`); `403` otherwise.
- Return **every** menu item owned by this vendor — available **and** unavailable —
  ordered stably (e.g. by `name` or `createdAt`).

### Response — `200 OK`
Same item shape as `GET /menu`, just unfiltered:
```jsonc
{
  "items": [
    { "id": "uuid", "vendorId": "uuid", "name": "Masala Dosa", "pricePaise": "9000",
      "prepMinutes": 8, "isAvailable": true,  "createdAt": "…", "updatedAt": "…" },
    { "id": "uuid", "vendorId": "uuid", "name": "Veg Thali",   "pricePaise": "15000",
      "prepMinutes": 12, "isAvailable": false, "createdAt": "…", "updatedAt": "…" }
  ]
}
```

### Notes
- Reuse the existing menu repository read, minus the `is_available = true` filter,
  scoped to the token's vendor. Add a contract test asserting a sold-out item is
  included here but absent from `GET /menu`.
- Once shipped, the Inventory list shows sold-out items and the availability toggle
  becomes fully round-trippable (hide ⇄ show) with no frontend changes — the client
  already prefers this endpoint (`src/api/endpoints.ts → getVendorMenu`).
