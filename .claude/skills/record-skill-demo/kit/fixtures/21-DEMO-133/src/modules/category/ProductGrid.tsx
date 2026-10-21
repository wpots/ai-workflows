import Image from "next/image";

import { formatPrice } from "@/utils/formatPrice";

interface ProductCard {
  id: string;
  name: string;
  imageUrl: string;
  priceInCents: number;
}

interface ProductGridProps {
  products: ProductCard[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <Image src={product.imageUrl} alt={product.name} width={320} height={320} />
          <h3>{product.name}</h3>
          <p>{formatPrice(product.priceInCents)}</p>
        </li>
      ))}
    </ul>
  );
}
