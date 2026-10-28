import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Shop } from "./types";

// Every product query is scoped to one shop ID. There is deliberately no "all products" query.
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const snap = await getDocs(query(collection(db, "shops"), where("slug", "==", slug), where("status", "==", "active"), limit(1)));
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Shop);
}
export async function getActiveShops(): Promise<Shop[]> {
  const snap = await getDocs(query(collection(db, "shops"), where("status", "==", "active")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shop);
}
const toProduct = (id: string, d: any): Product => ({ ...d, id, createdAt: d.createdAt?.toMillis?.() ?? 0 });
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
