import type { Product } from "@/lib/types";
// Shows the small copy of the first photo (fast), or the emoji placeholder when a product has none.
// Older products have no small copy yet, so they show the full photo. If the small copy ever fails, the full photo is used.
export default function ProductImage({ p, eager = false }: { p: Pick<Product, "imageUrls" | "emoji" | "name"> & { thumbUrl?: string | null }; eager?: boolean }) {
  const full = p.imageUrls?.[0];
  // eslint-disable-next-line @next/next/no-img-element
  return full ? <img src={p.thumbUrl || full} alt={p.name} loading={eager ? "eager" : "lazy"} decoding="async" onError={(e) => { if (e.currentTarget.src !== full) e.currentTarget.src = full; }} /> : <>{p.emoji}</>;
}
