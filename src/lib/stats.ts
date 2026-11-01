import { collection, doc, getDocs, increment, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// Seller statistics: one small counter document per product, plus one for the whole shop ("_shop").
// Path: shops/{shopId}/stats/{productId | "_shop"}  =>  { views, taps, updatedAt }
// Visitors may only add exactly 1 to one counter per write (enforced in firestore.rules).
import { SHOP_STAT } from "./statKeys";
export { SHOP_STAT };
export type Stat = { views: number; taps: number };
export type StatMap = Record<string, Stat>;

export async function bump(shopId: string, statId: string, kind: "views" | "taps") {
  await setDoc(
    doc(db, "shops", shopId, "stats", statId),
    { views: increment(kind === "views" ? 1 : 0), taps: increment(kind === "taps" ? 1 : 0), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Seller/admin only (rules). Scoped to ONE shop.
export async function getStats(shopId: string): Promise<StatMap> {
  const s = await getDocs(collection(db, "shops", shopId, "stats"));
  const out: StatMap = {};
  s.docs.forEach((d) => { const x = d.data(); out[d.id] = { views: Number(x.views) || 0, taps: Number(x.taps) || 0 }; });
  return out;
}

// Called when a product is deleted. Best effort: a failure here must never block the delete.
export async function deleteStat(shopId: string, productId: string) {
  try { await deleteDoc(doc(db, "shops", shopId, "stats", productId)); } catch { /* ignore */ }
}
