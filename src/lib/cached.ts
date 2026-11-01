import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getActiveShops, getProduct, getPublishedProducts, getShopBySlug } from "./shops";

// Server-only. Public pages read Firestore through a short cache, so many visitors cost ONE read, not one each.
// Edits by a seller show up on the public pages within TTL seconds. Errors are never cached.
// Every product lookup is still scoped to a single shop ID.
const TTL = 60;
const opts = (tag: string, revalidate = TTL) => ({ revalidate, tags: [tag] });

const shopBySlug = unstable_cache(async (slug: string) => getShopBySlug(slug), ["shop-by-slug"], opts("shops"));
const products = unstable_cache(async (shopId: string) => getPublishedProducts(shopId), ["shop-products"], opts("products"));
const product = unstable_cache(async (shopId: string, productId: string) => getProduct(shopId, productId), ["shop-product"], opts("products"));
const directory = unstable_cache(async () => getActiveShops(), ["active-shops"], opts("shops"));
const sitemapEntries = unstable_cache(async () => {
  const shops = await getActiveShops();
  const perShop = await Promise.all(shops.map(async (s) => ({ slug: s.slug, ids: (await getPublishedProducts(s.id)).map((p) => p.id) })));
  return perShop;
}, ["sitemap"], opts("sitemap", 3600));

// React's cache() also lets generateMetadata and the page share one lookup within a single request.
export const getShop = cache(shopBySlug);
export const getProducts = cache(products);
export const getOneProduct = cache(product);
export const getDirectory = directory;
export const getSitemapData = sitemapEntries;
