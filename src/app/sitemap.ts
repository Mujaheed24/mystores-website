import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/cached";

export const dynamic = "force-dynamic";
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Lists the home page, every active shop and every published product. Revisit when there are thousands of products.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shops = await getSitemapData().catch(() => []);
  return [{ url: base }, { url: `${base}/sell` }, { url: `${base}/help` }, ...shops.map((s) => ({ url: `${base}/${s.slug}` })), ...shops.flatMap((s) => s.ids.map((id) => ({ url: `${base}/${s.slug}/p/${id}` })))];
}
