import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { toProduct } from "./shops";
import type { Product, Shop } from "./types";

export async function getMyShop(uid: string): Promise<Shop | null> {
  const s = await getDocs(query(collection(db, "shops"), where("ownerUid", "==", uid), limit(1)));
  return s.empty ? null : ({ id: s.docs[0].id, ...s.docs[0].data() } as Shop);
}
// Owner can read drafts too (allowed by rules for the shop owner only).
export async function getAllProducts(shopId: string): Promise<Product[]> {
  const s = await getDocs(collection(db, "shops", shopId, "products"));
  return s.docs.map((d) => toProduct(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}
export { errText } from "./errText";
