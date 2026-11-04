import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getActiveShops, getProduct, getPublishedProducts, getShopBySlug } from "./shops";
import type { Product, Shop } from "./types";

// Server-only. Public pages read Firestore through a short cache, so many visitors cost ONE read, not one each.
// Edits by a seller show up on the public pages within TTL seconds. Errors are never cached.
// Every product lookup is still scoped to a single shop ID.
const TTL = 60;
// "Not found" and "empty" answers must NEVER be cached: a shop that was pending (or a slow read) would otherwise look closed for minutes
// after it opened. unstable_cache never stores a thrown error, so a miss is thrown inside the cache and turned back into null/[] outside it.
class Miss extends Error {}
const orElse = <A extends unknown[], T, M>(fn: (...a: A) => Promise<T>, miss: M) => async (...a: A): Promise<T | M> => { try { return await fn(...a); } catch (e) { if (e instanceof Miss) return miss; throw e; } };
const found = <T,>(v: T | null): T => { if (v === null) throw new Miss(); return v; };
const nonEmpty = <T,>(v: T[]): T[] => { if (!v.length) throw new Miss(); return v; };
// Vercel keeps this cache BETWEEN deployments. The Firebase project id is part of every cache key, so switching to another Firebase project
// (for example test -> live) can never show the old project's shops from a leftover cache entry.
const PID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "default";
const opts = (tag: string, revalidate = TTL) => ({ revalidate, tags: [tag] });

const shopBySlug = unstable_cache(async (slug: string) => found(await getShopBySlug(slug)), ["shop-by-slug", PID], opts("shops"));
const products = unstable_cache(async (shopId: string) => nonEmpty(await getPublishedProducts(shopId)), ["shop-products", PID], opts("products"));
const product = unstable_cache(async (shopId: string, productId: string) => found(await getProduct(shopId, productId)), ["shop-product", PID], opts("products"));
const directory = unstable_cache(async () => nonEmpty(await getActiveShops()), ["active-shops", PID], opts("shops"));
const sitemapEntries = unstable_cache(async () => {
  const shops = await getActiveShops();
  const perShop = await Promise.all(shops.map(async (s) => ({ slug: s.slug, ids: (await getPublishedProducts(s.id)).map((p) => p.id) })));
  return perShop;
}, ["sitemap", PID], opts("sitemap", 3600));

// React's cache() also lets generateMetadata and the page share one lookup within a single request.
export const getShop = cache(orElse(shopBySlug, null as Shop | null));
export const getProducts = cache(orElse(products, [] as Product[]));
export const getOneProduct = cache(orElse(product, null as Product | null));
// If a read fails (a slow or interrupted connection to Firebase), show the last good list instead of an empty page.
let lastDirectory: Awaited<ReturnType<typeof getActiveShops>> | null = null;
export async function getDirectory() {
  try { const shops = await directory(); lastDirectory = shops; return shops; }
  catch (e) {
    if (e instanceof Miss) { lastDirectory = []; return []; } // really no shops yet
    console.error("getDirectory failed", e);
    if (lastDirectory) return lastDirectory;
    throw e;
  }
}
export const getSitemapData = sitemapEntries;
