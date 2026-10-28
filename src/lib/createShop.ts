import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

// Creates the shop and claims its address in ONE batch. Security rules reject the whole batch
// if the address already exists, so two sellers can never get the same address.
export async function createShop(uid: string, input: { name: string; slug: string; category: string; description: string; whatsappNumber: string }) {
  const shopRef = doc(db, "shops", crypto.randomUUID());
  const batch = writeBatch(db);
  batch.set(shopRef, {
    ownerUid: uid, ...input, themeColor: "#0c6b58", status: "pending", subscriptionPlan: "basic",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "slugs", input.slug), { shopId: shopRef.id, ownerUid: uid });
  await batch.commit();
  return shopRef.id;
}
