import { notFound } from "next/navigation";
import Carousel from "@/components/Carousel";
import ProductGrid from "@/components/ProductGrid";
import Splash from "@/components/Splash";
import { getPublishedProducts, getShopBySlug } from "@/lib/shops";

export const dynamic = "force-dynamic";

export default async function Storefront({ params }: { params: Promise<{ shop: string }> }) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const products = await getPublishedProducts(shop.id);
  const inStock = products.filter((p) => p.stockQuantity > 0);
  const marked = inStock.filter((p) => p.featured);
  const recommended = (marked.length >= 2 ? marked : inStock).slice(0, 5);
  return (
    <main className="wrap" style={{ ["--sa" as string]: shop.themeColor }}>
      <Splash name={shop.name} category={shop.category} slug={shop.slug} color={shop.themeColor} />
      <div className="addr">🔒 mystores.com.ng/<b>{shop.slug}</b></div>
      <div className="banner">
        <div className="lg">{shop.name[0]}</div>
        <div><h1>{shop.name}</h1><p>{shop.description}</p>
          {shop.whatsappNumber && <p style={{ fontSize: 14 }}>WhatsApp {shop.whatsappNumber}</p>}</div>
      </div>
      <Carousel slug={shop.slug} items={recommended} />
      <ProductGrid slug={shop.slug} products={products} />
    </main>
  );
}
