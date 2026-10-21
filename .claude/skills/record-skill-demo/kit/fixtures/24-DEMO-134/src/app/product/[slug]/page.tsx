import dynamic from "next/dynamic";
import Image from "next/image";

import { StockBadge } from "@/modules/product/StockBadge";
import { formatPrice } from "@/utils/formatPrice";

const Reviews = dynamic(() => import("@/modules/product/Reviews"));

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetch(`${process.env.CATALOG_URL}/products/${slug}`, {
    next: { revalidate: 300 },
  }).then((res) => res.json());

  return (
    <main>
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={800}
        height={800}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
      />
      <h1>{product.name}</h1>
      <p>{formatPrice(product.priceInCents)}</p>
      <StockBadge available={product.available} />
      <Reviews productId={product.id} />
    </main>
  );
}
