const PRICE_FORMAT = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(cents: number): string {
  return PRICE_FORMAT.format(cents / 100);
}
