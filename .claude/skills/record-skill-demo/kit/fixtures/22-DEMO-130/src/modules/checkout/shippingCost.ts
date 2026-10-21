export type Country = "NL" | "BE";

const SHIPPING_IN_CENTS: Partial<Record<Country, number>> = {
  NL: 495,
};

export function shippingCost(country: Country): number {
  return SHIPPING_IN_CENTS[country] ?? 0;
}
