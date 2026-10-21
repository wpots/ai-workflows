import { DISCOUNT_CODES } from "./discountCodes";
import type { CartLine } from "./types";

export interface AppliedDiscount {
  code: string;
  amountInCents: number;
}

export function applyDiscountCode(
  lines: CartLine[],
  code: string,
  now: Date = new Date(),
): AppliedDiscount | null {
  const discount = DISCOUNT_CODES.find((d) => d.code === code);
  if (!discount) return null;
  if (new Date(discount.expiresAt) > now) return null;

  const subtotal = lines.reduce(
    (sum, line) => sum + line.priceInCents * line.quantity,
    0,
  );
  const amountInCents =
    discount.type === "percentage"
      ? subtotal * (discount.value / 100)
      : discount.value;

  return { code, amountInCents };
}
