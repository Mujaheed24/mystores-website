import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StorefrontView from "@/components/StorefrontView";
import { getProducts, getShop } from "@/lib/cached";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ shop: string }> }): Promise<Metadata> {
  const shop = await getShop((await params).shop);
  if (!shop) return { title: "Shop unavailable" };
  const description = shop.description || `Shop ${shop.name} on MyStores.`, img = shop.bannerUrl || shop.logoUrl;
  return { title: shop.name, description,
    openGraph: { title: shop.name, description, url: `/${shop.slug}`, images: img ? [img] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title: shop.name, description, images: img ? [img] : undefined } };
}

export default async function Storefront({ params }: { params: Promise<{ shop: string }> }) {
  const shop = await getShop((await params).shop);
  if (!shop) notFound();
  return <StorefrontView shop={shop} products={await getProducts(shop.id)} />;
}
