import { getStockStatus } from "./getStockStatus";

const LABEL = {
  "in-stock": "Op voorraad",
  low: "Bijna uitverkocht",
  "sold-out": "Uitverkocht",
} as const;

interface StockBadgeProps {
  available: number;
}

export function StockBadge({ available }: StockBadgeProps) {
  const status = getStockStatus(available);
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}
