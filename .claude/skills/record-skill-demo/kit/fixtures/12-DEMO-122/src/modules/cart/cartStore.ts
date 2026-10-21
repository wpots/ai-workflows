import type { Cart, CartLine } from "./types";

const cart: Cart = { lines: [] };

export function getCart(): Cart {
  return cart;
}

export function addLine(line: CartLine): void {
  const existing = cart.lines.find((l) => l.productId === line.productId);
  if (existing) {
    existing.quantity += line.quantity;
    return;
  }
  cart.lines.push(line);
}

export function removeLine(productId: string): void {
  cart.lines = cart.lines.filter((l) => l.productId !== productId);
}

export function itemCount(): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}
