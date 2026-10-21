import { describe, expect, it } from "vitest";

import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats cents as euros", () => {
    expect(formatPrice(1250)).toBe("€12.50");
  });
});
