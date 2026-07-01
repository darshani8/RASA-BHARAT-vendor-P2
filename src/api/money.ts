// The backend sends money as integer paise (₹1 = 100 paise) and never as a
// float — see FRONTEND_MVP_HANDOFF §6. Do all display formatting here so no
// float math ever touches a currency value.

// The backend serialises money as an integer STRING ("5000" = ₹50.00) to keep
// BIGINT precision over JSON, so every helper accepts string | number.
type Paise = number | string | null | undefined;

/** Format integer paise as a ₹ string, e.g. "2450" -> "₹24.50". */
export function formatPaise(paise: Paise): string {
  const p = Math.round(Number(paise) || 0);
  const rupees = Math.trunc(p / 100);
  const frac = Math.abs(p % 100);
  const rupeesStr = rupees.toLocaleString('en-IN');
  return `₹${rupeesStr}.${String(frac).padStart(2, '0')}`;
}

/** Sum line items priced in paise. */
export function sumPaise(items: Array<{ pricePaise: Paise; qty: number }>): number {
  return items.reduce((acc, x) => acc + Math.round(Number(x.pricePaise) || 0) * (x.qty || 0), 0);
}

/** Parse an integer-string/number paise value to a JS number. */
export function toPaise(paise: Paise): number {
  return Math.round(Number(paise) || 0);
}

/** Rupees (float, e.g. from a form) -> integer paise. Avoids fp drift. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(Number(rupees) * 100);
}
