export interface ProductSummary {
  id: string;
  name: string;
}

export function searchProducts(
  products: ProductSummary[],
  query: string,
): ProductSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return products.filter((p) => p.name.toLowerCase().includes(needle));
}
