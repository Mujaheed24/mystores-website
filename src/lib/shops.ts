import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Shop } from "./types";

// Firestore dates (createdAt/updatedAt) are not plain data, so they are dropped here. Cached and client-bound data must be plain.
const toShop = (id: string, d: any): Shop => { const { createdAt, updatedAt, ...rest } = d; void createdAt; void updatedAt; return { id, ...rest } as Shop; };

// Every product query is scoped to one shop ID. There is deliberately no "all products" query.
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const snap = await getDocs(query(collection(db, "shops"), where("slug", "==", slug), where("status", "==", "active"), limit(1)));
  return snap.empty ? null : toShop(snap.docs[0].id, snap.docs[0].data());
}
export async function getActiveShops(): Promise<Shop[]> {
  const snap = await getDocs(query(collection(db, "shops"), where("status", "==", "active")));
  return snap.docs.map((d) => toShop(d.id, d.data()));
}
export const toProduct = (id: string, d: any): Product => ({ ...d, updatedAt: undefined, id, name: d.name ?? "", price: d.price ?? null, category: d.category ?? "", imageUrls: d.imageUrls ?? [], createdAt: d.createdAt?.toMillis?.() ?? 0 });
export async function getPublishedProducts(shopId: string): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, "shops", shopId, "products"), where("status", "==", "published")));
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}
export async function getProduct(shopId: string, productId: string): Promise<Product | null> {
  const s = await getDoc(doc(db, "shops", shopId, "products", productId));
  return s.exists() && s.data().status === "published" ? toProduct(s.id, s.data()) : null;
}
export async function slugTaken(slug: string): Promise<boolean> {
  return (await getDoc(doc(db, "slugs", slug))).exists();
}
