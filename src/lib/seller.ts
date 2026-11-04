import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { toProduct } from "./shops";
import type { Product, Shop } from "./types";

export async function getMyShop(uid: string): Promise<Shop | null> {
  const s = await getDocs(query(collection(db, "shops"), where("ownerUid", "==", uid), limit(1)));
  return s.empty ? null : ({ id: s.docs[0].id, ...s.docs[0].data() } as Shop);
}
// The shop this person works on: their own (owner) or one they were invited to help with (editor).
export async function getWorkShop(uid: string): Promise<{ shop: Shop; role: "owner" | "editor" } | null> {
  const own = await getMyShop(uid);
  if (own) return { shop: own, role: "owner" };
  const m = await getDoc(doc(db, "members", uid));
  if (!m.exists()) return null;
  const s = await getDoc(doc(db, "shops", m.data().shopId));
  if (!s.exists()) { await deleteDoc(m.ref).catch(() => {}); return null; } // the shop was deleted: clear the leftover helper record
  return { shop: { id: s.id, ...s.data() } as Shop, role: "editor" };
}
// Owner can read drafts too (allowed by rules for the shop owner only).
export async function getAllProducts(shopId: string): Promise<Product[]> {
  const s = await getDocs(collection(db, "shops", shopId, "products"));
  return s.docs.map((d) => toProduct(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}
export { errText } from "./errText";
