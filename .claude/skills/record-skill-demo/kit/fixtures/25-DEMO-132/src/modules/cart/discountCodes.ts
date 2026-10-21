export interface DiscountCode {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiresAt: string;
}

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: "ZOMER10", type: "percentage", value: 10, expiresAt: "2026-09-30" },
  { code: "WELKOM5", type: "fixed", value: 500, expiresAt: "2026-12-31" },
];
