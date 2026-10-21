import { describe, expect, it } from "vitest";

import { calculateTotals } from "./calculateTotals";

const pan = { productId: "pan", name: "Koekenpan", priceInCents: 2995, quantity: 1, vatRate: 0.21 } as const;
const koffie = { productId: "koffie", name: "Koffiebonen", priceInCents: 1250, quantity: 2, vatRate: 0.09 } as const;

describe("calculateTotals", () => {
  it("splits VAT per rate", () => {
    expect(calculateTotals([pan, koffie])).toEqual({
      excludingVat: 4769,
      vat: 726,
      includingVat: 5495,
    });
  });

  it("adds shipping to the total", () => {
    expect(calculateTotals([pan], 495).includingVat).toBe(3490);
  });
});
