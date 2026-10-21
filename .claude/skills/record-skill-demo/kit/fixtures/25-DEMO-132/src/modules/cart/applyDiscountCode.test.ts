import { describe, expect, it } from "vitest";

import { applyDiscountCode } from "./applyDiscountCode";

const lines = [
  { productId: "pan", name: "Koekenpan", priceInCents: 2995, quantity: 2, vatRate: 0.21 },
] as const;

describe("applyDiscountCode", () => {
  it("applies a percentage code", () => {
    const result = applyDiscountCode([...lines], "ZOMER10", new Date("2026-12-01"));
    expect(result?.amountInCents).toBeCloseTo(599);
  });
});
