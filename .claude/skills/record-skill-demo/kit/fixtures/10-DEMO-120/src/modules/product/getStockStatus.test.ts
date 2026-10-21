import { describe, expect, it } from "vitest";

import { getStockStatus } from "./getStockStatus";

describe("getStockStatus", () => {
  it("is sold out at zero", () => {
    expect(getStockStatus(0)).toBe("sold-out");
  });

  it("is low below five", () => {
    expect(getStockStatus(4)).toBe("low");
  });

  it("is in stock from five", () => {
    expect(getStockStatus(5)).toBe("in-stock");
  });
});
