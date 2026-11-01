import { deleteUser, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { deleteObject, listAll, ref, type StorageReference } from "firebase/storage";
import { db, getStorageClient } from "./firebase";
import type { Shop } from "./types";

// Permanently deletes a seller's shop and account. Order matters, because the rules check the shop record:
//  1. sign in again with Google, or type the password for email accounts (Firebase requires a recent sign-in to delete an account) - done FIRST
//  2. photos in Storage   3. products and counters   4. shop + address + owner record in ONE batch   5. the sign-in account
// If anything fails before step 4 the shop still exists, and the seller can simply try again.
async function removeFolder(r: StorageReference): Promise<void> {
  const l = await listAll(r);
  await Promise.all([
    ...l.items.map((i) => deleteObject(i).catch((e) => { if (e?.code !== "storage/object-not-found") throw e; })),
    ...l.prefixes.map(removeFolder),
  ]);
}
async function removeCollection(path: string[]) {
  const [first, ...rest] = path;
  const snap = await getDocs(collection(db, first, ...rest));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
}

async function confirmIdentity(user: User, password?: string) {
  if (password !== undefined) await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", password));
  else await reauthenticateWithPopup(user, new GoogleAuthProvider());
}

// For a seller who signed up but never opened a shop: just remove the sign-in account.
export async function deleteAccountOnly(user: User, progress: (msg: string) => void, password?: string) {
  progress("Confirming it is you…");
  await confirmIdentity(user, password);
  progress("Deleting your account…");
  await deleteUser(user);
}

// Administrator only: removes a shop and everything in it (photos, products, counters, orders, address, owner record).
// The seller's sign-in account is not touched (use scripts/delete-user.mjs for that). To block someone, suspend instead.
export async function adminDeleteShop(shop: Shop, progress: (msg: string) => void) {
  progress("Deleting photos…");
  await removeFolder(ref(getStorageClient(), `shops/${shop.id}`));
  progress("Deleting products, numbers and orders…");
  for (const c of ["products", "stats", "orders"]) await removeCollection(["shops", shop.id, c]);
  progress("Deleting the shop…");
  const b = writeBatch(db);
  b.delete(doc(db, "slugs", shop.slug));
  b.delete(doc(db, "owners", shop.ownerUid));
  b.delete(doc(db, "shops", shop.id));
  await b.commit();
}

export async function deleteShopAndAccount(user: User, shop: Shop, progress: (msg: string) => void, password?: string) {
  progress("Confirming it is you…");
  await confirmIdentity(user, password);
  progress("Deleting photos…");
  await removeFolder(ref(getStorageClient(), `shops/${shop.id}`));
  progress("Deleting products and numbers…");
  await removeCollection(["shops", shop.id, "products"]);
  await removeCollection(["shops", shop.id, "stats"]);
  progress("Deleting your shop…");
  const [slug, owner] = await Promise.all([getDoc(doc(db, "slugs", shop.slug)), getDoc(doc(db, "owners", user.uid))]);
  const b = writeBatch(db);
  if (slug.exists()) b.delete(slug.ref);   // frees the address
  if (owner.exists()) b.delete(owner.ref);
  b.delete(doc(db, "shops", shop.id));
  await b.commit();
  progress("Deleting your account…");
  await deleteUser(user);
}
