export interface CartLine {
  productId: string;
  name: string;
  priceInCents: number;
  quantity: number;
  vatRate: 0.09 | 0.21;
}

export interface Cart {
  lines: CartLine[];
}
