export type StockStatus = "in-stock" | "low" | "sold-out";

export function getStockStatus(available: number): StockStatus {
  if (available <= 0) return "sold-out";
  if (available < 5) return "low";
  return "in-stock";
}
