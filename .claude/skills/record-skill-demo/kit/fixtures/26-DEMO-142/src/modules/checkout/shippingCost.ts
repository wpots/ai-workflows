export type Country = "NL" | "BE";

// WIP DEMO-142: België toegevoegd, test volgt
const SHIPPING_IN_CENTS: Partial<Record<Country, number>> = {
  NL: 495,
  BE: 695,
};

export function shippingCost(country: Country): number {
  return SHIPPING_IN_CENTS[country] ?? 0;
}
