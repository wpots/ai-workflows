import type { CartLine } from "@/modules/cart/types";

export interface Totals {
  excludingVat: number;
  vat: number;
  includingVat: number;
}

/** Prices are entered including VAT; all amounts are whole cents. */
export function calculateTotals(lines: CartLine[], shippingInCents = 0): Totals {
  let includingVat = 0;
  let vat = 0;
  for (const line of lines) {
    const lineTotal = line.priceInCents * line.quantity;
    includingVat += lineTotal;
    vat += Math.round(lineTotal - lineTotal / (1 + line.vatRate));
  }
  includingVat += shippingInCents;
  return { excludingVat: includingVat - vat, vat, includingVat };
}
