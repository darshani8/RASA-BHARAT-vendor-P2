> **RESOLVED.** The backend persists `category` on menu items now (create/update accept it,
> reads return it). The client sends `category` on both `createMenuItem` and `updateMenuItem`
> and reads `item.category` first; the `localStorage` cache is only a fallback for items that
> predate this field. Kept for history only.

# Backend task: add `category` to menu items

## Why
The vendor **Inventory** and **POS** screens group/filter items by **category**, but the
RASAP2 menu item has no `category` field — and the API **rejects unknown fields**, so the
client can't send one. As an interim the frontend stores categories in the browser
(`localStorage`, per-device only). Adding the field below makes categories **persistent and
multi-device**, with **zero frontend changes** — `itemCategory()` already prefers
`item.category` when present.

## Change
Add an optional `category` string to the menu item.

### Schema / migration
- New nullable column `category text` on the menu items table (default `NULL`).
- Treat `NULL`/empty as "Other" (or your preferred default) when returning.

### Accept it on write
- `POST /api/v1/menu` and `PUT /api/v1/menu/{id}` — accept an optional
  `"category": "Beverages"` field (string, 1–40 chars). Validate against the allowed
  set if you want it constrained: `Breakfast | Mains | Beverages | Sweets | Other`
  (or allow free text). Do **not** reject the request when it's omitted.

### Return it on read
- Include `"category"` in the item shape from `GET /api/v1/menu`, the (planned)
  `GET /api/v1/vendors/me/menu`, and the create/update responses:
```jsonc
{ "id":"uuid", "vendorId":"uuid", "name":"Filter Coffee", "category":"Beverages",
  "pricePaise":"3000", "prepMinutes":3, "isAvailable":true, "createdAt":"…", "updatedAt":"…" }
```

### Notes
- Backfill existing rows to `"Other"` (or leave NULL and default on read).
- Optional nicety: `GET /api/v1/menu?vendor_id=…&category=Beverages` server-side filter
  (the client also filters locally, so this is not required).
- Once shipped, delete is needed nowhere on the client; `item.category` simply starts
  flowing through. The client's localStorage fallback can be removed later.

---
Frontend already wired: `index.html` → `itemCategory()` / category `<select>` in the
Add/Edit modal / inventory category filter / POS category chips.
