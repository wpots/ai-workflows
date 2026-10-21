import { describe, expect, it } from "vitest";

import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats cents as euros in Dutch notation", () => {
    expect(formatPrice(1250)).toBe("€ 12,50");
  });

  it("groups thousands with a dot", () => {
    expect(formatPrice(123456)).toBe("€ 1.234,56");
  });
});
