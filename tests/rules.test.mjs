// Run with: npm run test:rules   (needs firebase-tools and Java for the emulators)
import { test, before, after } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDocs, query, where } from "firebase/firestore";

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-mystores",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "shops/sA"), { ownerUid: "A", slug: "alpha", name: "Alpha", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "shops/sB"), { ownerUid: "B", slug: "bravo", name: "Bravo", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "slugs/alpha"), { shopId: "sA", ownerUid: "A" });
    await setDoc(doc(db, "shops/sA/products/pub"), prod("sA", "A", "published"));
    await setDoc(doc(db, "shops/sA/products/dr"), prod("sA", "A", "draft"));
    await setDoc(doc(db, "shops/sA/orders/o1"), { orderStatus: "pending", customer: "x" });
  });
});
after(() => env.cleanup());
const prod = (shopId, sellerUid, status) => ({ shopId, sellerUid, name: "Thing", price: 100, stockQuantity: 1, status, featured: false });
const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test("seller can create a shop and claim a new address in one batch", async () => {
  const b = writeBatch(as("C"));
  b.set(doc(as("C"), "shops/sC"), { ownerUid: "C", slug: "charlie", name: "Charlie", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(as("C"), "slugs/charlie"), { shopId: "sC", ownerUid: "C" });
  await assertSucceeds(b.commit());
});
test("second seller cannot claim an address that is taken", async () => {
  const db = as("D"), b = writeBatch(db);
  b.set(doc(db, "shops/sD"), { ownerUid: "D", slug: "alpha", name: "Copy", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/alpha"), { shopId: "sD", ownerUid: "D" });
  await assertFails(b.commit());
});
test("reserved addresses are refused", async () => {
  const db = as("E"), b = writeBatch(db);
  b.set(doc(db, "shops/sE"), { ownerUid: "E", slug: "admin", name: "Fake", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/admin"), { shopId: "sE", ownerUid: "E" });
  await assertFails(b.commit());
});
test("seller cannot create an already-active shop", async () => {
  const db = as("F"), b = writeBatch(db);
  b.set(doc(db, "shops/sF"), { ownerUid: "F", slug: "foxtrot", name: "Fox", status: "active", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/foxtrot"), { shopId: "sF", ownerUid: "F" });
  await assertFails(b.commit());
});
test("seller A can add a product to their own shop", () =>
  assertSucceeds(setDoc(doc(as("A"), "shops/sA/products/new"), prod("sA", "A", "published"))));
test("seller B cannot add, edit or delete products in shop A", async () => {
  await assertFails(setDoc(doc(as("B"), "shops/sA/products/hack"), prod("sA", "B", "published")));
  await assertFails(updateDoc(doc(as("B"), "shops/sA/products/pub"), { price: 1 }));
  await assertFails(deleteDoc(doc(as("B"), "shops/sA/products/pub")));
});
test("seller cannot move a product to another shop or change its owner", async () => {
  await assertFails(updateDoc(doc(as("A"), "shops/sA/products/pub"), { sellerUid: "B" }));
  await assertFails(updateDoc(doc(as("A"), "shops/sA/products/pub"), { shopId: "sB" }));
});
test("seller cannot change ownerUid, slug, status or plan of their shop", async () => {
  for (const patch of [{ ownerUid: "B" }, { slug: "bravo" }, { status: "suspended" }, { subscriptionPlan: "premium" }])
    await assertFails(updateDoc(doc(as("A"), "shops/sA"), patch));
  await assertSucceeds(updateDoc(doc(as("A"), "shops/sA"), { description: "New text" }));
});
test("visitors see published products only, not drafts", async () => {
  await assertSucceeds(getDoc(doc(anon(), "shops/sA/products/pub")));
  await assertFails(getDoc(doc(anon(), "shops/sA/products/dr")));
  await assertSucceeds(getDocs(query(collection(anon(), "shops/sA/products"), where("status", "==", "published"))));
});
test("seller B cannot read shop A's orders; seller A can", async () => {
  await assertFails(getDoc(doc(as("B"), "shops/sA/orders/o1")));
  await assertSucceeds(getDoc(doc(as("A"), "shops/sA/orders/o1")));
  await assertFails(setDoc(doc(as("B"), "shops/sB/orders/fake"), { orderStatus: "pending" }));
});
test("only the admin can suspend a shop", async () => {
  await assertFails(updateDoc(doc(as("B"), "shops/sA"), { status: "suspended" }));
  const admin = env.authenticatedContext("root", { admin: true }).firestore();
  await assertSucceeds(updateDoc(doc(admin, "shops/sB"), { status: "suspended" }));
});
