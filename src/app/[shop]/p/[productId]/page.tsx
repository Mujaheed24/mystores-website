import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getShopBySlug } from "@/lib/shops";
import { naira } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ shop: string; productId: string }> }) {
  const { shop: slug, productId } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const p = await getProduct(shop.id, productId); // looked up under THIS shop only
  if (!p) notFound();
  const wa = `https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${shop.name}, I want to order: ${p.name} (${naira(p.price)})`)}`;
  return (
    <main className="wrap" style={{ ["--sa" as string]: shop.themeColor }}>
      <div className="addr">🔒 mystores.com.ng/<b>{shop.slug}</b>/product</div>
      <Link className="btn alt sm" href={`/${shop.slug}`}>Back to {shop.name}</Link>
      <div className="detail" style={{ marginTop: 14 }}>
        <div className="ph">{p.emoji}</div>
        <div>
          <span className="pill">{p.category}</span>
          <h1 style={{ fontSize: 34, margin: "10px 0" }}>{p.name}</h1>
          <div className="price" style={{ fontSize: 26 }}>{naira(p.price)}</div>
          <p className={p.stockQuantity ? "ok" : "out"}>{p.stockQuantity ? (p.stockQuantity < 5 ? `Only ${p.stockQuantity} left` : "In stock") : "Out of stock"}</p>
          <p className="muted">{p.description}</p>
          {shop.whatsappNumber && <a className="btn" style={{ background: "var(--sa)", display: "inline-block" }} href={wa}>Order on WhatsApp</a>}
        </div>
      </div>
    </main>
  );
}
