import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import { AddToCart, CartButton, CartProvider } from "@/components/Cart";
import OwnerBar from "@/components/OwnerBar";
import { IconArrow, IconChat } from "@/components/Icons";
import ReportButton from "@/components/ReportButton";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";
import Track, { TapLink } from "@/components/Track";
import { getOneProduct, getShop } from "@/lib/cached";
import { naira, priceLabel } from "@/lib/types";

export const dynamic = "force-dynamic";
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ shop: string; productId: string }> }): Promise<Metadata> {
  const { shop: slug, productId } = await params;
  const shop = await getShop(slug), p = shop ? await getOneProduct(shop.id, productId) : null;
  if (!shop || !p) return { title: "Product unavailable" };
  const title = p.name || `${p.category || "Item"} at ${shop.name}`;
  const description = `${priceLabel(p.price)} at ${shop.name}. ${p.description || ""}`.trim().slice(0, 200), img = p.imageUrls[0];
  return { title: `${title} – ${shop.name}`, description,
    openGraph: { title, description, url: `/${shop.slug}/p/${p.id}`, images: img ? [img] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title, description, images: img ? [img] : undefined } };
}

export default async function ProductPage({ params }: { params: Promise<{ shop: string; productId: string }> }) {
  const { shop: slug, productId } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const p = await getOneProduct(shop.id, productId); // looked up under THIS shop only
  if (!p) notFound();
  const wa = shop.whatsappNumber.replace(/\D/g, ""), url = `${base}/${shop.slug}/p/${p.id}`;
  // The product link is included so the seller sees exactly which photo the customer means.
  const msg = `Hello ${shop.name}, I am interested in ${p.name || "this item"}${p.price !== null ? ` (${naira(p.price)})` : ""}: ${url}`;
  const link = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : "";
  const low = p.stockQuantity > 0 && p.stockQuantity < 5;
  return (
    <CartProvider shop={{ id: shop.id, slug: shop.slug, name: shop.name, whatsapp: shop.whatsappNumber, ownerUid: shop.ownerUid }}>
      <OwnerBar ownerUid={shop.ownerUid} />
      <main className="wrap" style={{ ["--sa" as string]: shop.themeColor, paddingBottom: 150 }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Product", name: p.name || `${p.category || "Item"} at ${shop.name}`, description: p.description || p.name || shop.name, image: p.imageUrls,
          ...(p.price !== null ? { offers: { "@type": "Offer", priceCurrency: "NGN", price: p.price, availability: p.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } } : {}),
        }).replace(/</g, "\\u003c") }} />
        <Track shopId={shop.id} ownerUid={shop.ownerUid} productId={p.id} />
        <div className="toprow"><div className="addr">🔒 mystores.com.ng/<b>{shop.slug}</b>/product</div><ThemeToggle /></div>
        <Link className="btn alt sm" href={`/${shop.slug}`}>← Back to {shop.name}</Link>
        <div className="pd">
          <Gallery p={p} />
          <div>
            {p.category && <span className="pill">{p.category}</span>}
            {p.name && <h1>{p.name}</h1>}
            <div className="big" style={p.name ? undefined : { marginTop: 14 }}>{priceLabel(p.price)}</div>
            <div className={`stock ${p.stockQuantity ? (low ? "bad" : "ok") : "bad"}`}>{p.stockQuantity ? (low ? `Only ${p.stockQuantity} left` : "In stock") : "Sold out"}</div>
            {p.description && <p className="desc">{p.description}</p>}
            <div className="row" style={{ marginTop: 20 }}><AddToCart p={p} className="btn alt" /><ShareButton title={p.name || shop.name} text={`${p.name || "Take a look"} at ${shop.name}`} /></div>
            <p className="muted" style={{ marginTop: 22, fontSize: 16 }}>Sold by <b>{shop.name}</b>. Chat with the seller to arrange price, payment and delivery.</p>
            <div style={{ marginTop: 6 }}><ReportButton shopId={shop.id} productId={p.id} label="Report this product" /></div>
          </div>
        </div>
      </main>
      <CartButton lift />
      {link && <div className="ctabar" style={{ ["--sa" as string]: shop.themeColor }}><span className="tot">{priceLabel(p.price)}</span><TapLink shopId={shop.id} ownerUid={shop.ownerUid} productId={p.id} className="btn wa" href={link}><IconChat /> {p.price === null ? "Ask on WhatsApp" : "Order on WhatsApp"} <IconArrow size={20} /></TapLink></div>}
    </CartProvider>
  );
}
