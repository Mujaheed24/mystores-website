// Run with: npm run test:rules   (needs firebase-tools and Java for the emulators)
import { test, before, after } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDocs, getCountFromServer, addDoc, serverTimestamp, increment, query, where } from "firebase/firestore";

const WA = "+2348031234567";
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-mystores",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "shops/sA"), { whatsappNumber: WA, ownerUid: "A", slug: "alpha", name: "Alpha", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "shops/sB"), { whatsappNumber: WA, ownerUid: "B", slug: "bravo", name: "Bravo", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "slugs/alpha"), { shopId: "sA", ownerUid: "A" });
    await setDoc(doc(db, "shops/sA/products/pub"), prod("sA", "A", "published"));
    await setDoc(doc(db, "shops/sA/products/dr"), prod("sA", "A", "draft"));
    await setDoc(doc(db, "shops/sX"), { whatsappNumber: WA, ownerUid: "X", slug: "xray", name: "Xray", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "slugs/xray"), { shopId: "sX", ownerUid: "X" });
    await setDoc(doc(db, "owners/X"), { shopId: "sX" });
    await setDoc(doc(db, "shops/sS"), { whatsappNumber: WA, ownerUid: "S", slug: "sus", name: "Sus", status: "suspended", subscriptionPlan: "basic" });
    await setDoc(doc(db, "shops/sS/products/sp"), prod("sS", "S", "published"));
    await setDoc(doc(db, "shops/sA/orders/o1"), { orderStatus: "pending", customer: "x" });
  });
});
after(() => env.cleanup());
const prod = (shopId, sellerUid, status) => ({ shopId, sellerUid, name: "Thing", price: 100, stockQuantity: 1, status, featured: false });
const as = (uid) => env.authenticatedContext(uid, { email_verified: true }).firestore();
const asUnverified = (uid) => env.authenticatedContext(uid, { email_verified: false }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test("seller can create a shop and claim a new address in one batch", async () => {
  const db = as("C"), b = writeBatch(db);
  b.set(doc(db, "shops/sC"), { whatsappNumber: WA, ownerUid: "C", slug: "charlie", name: "Charlie", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/charlie"), { shopId: "sC", ownerUid: "C" });
  b.set(doc(db, "owners/C"), { shopId: "sC" });
  await assertSucceeds(b.commit());
});
test("second seller cannot claim an address that is taken", async () => {
  const db = as("D"), b = writeBatch(db);
  b.set(doc(db, "shops/sD"), { whatsappNumber: WA, ownerUid: "D", slug: "alpha", name: "Copy", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/alpha"), { shopId: "sD", ownerUid: "D" });
  b.set(doc(db, "owners/D"), { shopId: "sD" });
  await assertFails(b.commit());
});
test("reserved addresses are refused", async () => {
  const db = as("E"), b = writeBatch(db);
  b.set(doc(db, "shops/sE"), { whatsappNumber: WA, ownerUid: "E", slug: "admin", name: "Fake", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/admin"), { shopId: "sE", ownerUid: "E" });
  b.set(doc(db, "owners/E"), { shopId: "sE" });
  await assertFails(b.commit());
});
test("seller cannot create an already-active shop", async () => {
  const db = as("F"), b = writeBatch(db);
  b.set(doc(db, "shops/sF"), { whatsappNumber: WA, ownerUid: "F", slug: "foxtrot", name: "Fox", status: "active", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/foxtrot"), { shopId: "sF", ownerUid: "F" });
  b.set(doc(db, "owners/F"), { shopId: "sF" });
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
  for (const patch of [{ whatsappNumber: WA, ownerUid: "B" }, { slug: "bravo" }, { status: "suspended" }, { subscriptionPlan: "premium" }])
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

test("the new /sell page address is reserved", async () => {
  const db = as("G"), b = writeBatch(db);
  b.set(doc(db, "shops/sG"), { whatsappNumber: WA, ownerUid: "G", slug: "sell", name: "Sell", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/sell"), { shopId: "sG", ownerUid: "G" });
  b.set(doc(db, "owners/G"), { shopId: "sG" });
  await assertFails(b.commit());
});
test("products with a negative price, bad status or fractional stock are refused", async () => {
  const db = as("A");
  await assertFails(setDoc(doc(db, "shops/sA/products/bad1"), { ...prod("sA", "A", "published"), price: -5 }));
  await assertFails(setDoc(doc(db, "shops/sA/products/bad2"), { ...prod("sA", "A", "live") }));
  await assertFails(setDoc(doc(db, "shops/sA/products/bad3"), { ...prod("sA", "A", "published"), stockQuantity: 1.5 }));
});
test("a seller can read their own drafts but not another shop's drafts", async () => {
  await assertSucceeds(getDoc(doc(as("A"), "shops/sA/products/dr")));
  await assertFails(getDoc(doc(as("B"), "shops/sA/products/dr")));
});
test("a suspended shop and its products are hidden from visitors", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "shops/sS"), { whatsappNumber: WA, ownerUid: "S", slug: "sleepy", name: "Sleepy", status: "suspended", subscriptionPlan: "basic" });
    await setDoc(doc(ctx.firestore(), "shops/sS/products/p"), prod("sS", "S", "published"));
  });
  await assertFails(getDoc(doc(anon(), "shops/sS")));
  await assertFails(getDoc(doc(anon(), "shops/sS/products/p")));
  await assertSucceeds(getDoc(doc(as("S"), "shops/sS")));
});

test("one shop per account: a second shop by the same seller is refused", async () => {
  const db = as("C"), b = writeBatch(db);
  b.set(doc(db, "shops/sC2"), { whatsappNumber: WA, ownerUid: "C", slug: "charlie-two", name: "Second", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/charlie-two"), { shopId: "sC2", ownerUid: "C" });
  b.set(doc(db, "owners/C"), { shopId: "sC2" });
  await assertFails(b.commit());
});
test("a shop cannot be created without its owner record", async () => {
  const db = as("H"), b = writeBatch(db);
  b.set(doc(db, "shops/sH"), { whatsappNumber: WA, ownerUid: "H", slug: "hotel", name: "Hotel", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/hotel"), { shopId: "sH", ownerUid: "H" });
  await assertFails(b.commit());
});
test("owner records are private and cannot be edited by the seller", async () => {
  await assertFails(getDoc(doc(as("B"), "owners/C")));
  await assertSucceeds(getDoc(doc(as("C"), "owners/C")));
  await assertFails(updateDoc(doc(as("C"), "owners/C"), { shopId: "sB" }));
});

test("image-only products (no name, no price) are allowed when they have a photo", async () => {
  const db = as("A");
  await assertSucceeds(setDoc(doc(db, "shops/sA/products/imgonly"), { ...prod("sA", "A", "published"), name: "", price: null, imageUrls: ["https://x/y.webp"] }));
  await assertFails(setDoc(doc(db, "shops/sA/products/empty"), { ...prod("sA", "A", "published"), name: "", price: null, imageUrls: [] }));
  await assertFails(setDoc(doc(db, "shops/sA/products/toomany"), { ...prod("sA", "A", "published"), imageUrls: Array(7).fill("https://x/y.webp") }));
});

test("seller can set location, opening hours and delivery notes on their own shop", () =>
  assertSucceeds(updateDoc(doc(as("A"), "shops/sA"), { state: "Lagos", city: "Ikeja", openingHours: "Mon–Sat, 9am–6pm", deliveryNotes: "We deliver within Lagos in 1–2 days." })));
test("shop info fields are checked: unknown state, too-long or wrong-type values are refused", async () => {
  const db = as("A");
  await assertFails(updateDoc(doc(db, "shops/sA"), { state: "Atlantis" }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { state: 5 }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { city: "x".repeat(61) }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { openingHours: "x".repeat(121) }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { deliveryNotes: "x".repeat(301) }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { deliveryNotes: ["a"] }));
  await assertSucceeds(updateDoc(doc(db, "shops/sA"), { state: "", city: "", openingHours: "", deliveryNotes: "" }));
});
test("a shop can have up to 5 categories and 4 extra places, a custom colour, and not more", async () => {
  const db = as("A");
  await assertSucceeds(updateDoc(doc(db, "shops/sA"), { categories: ["Fashion", "Beauty and hair care", "Other"], locations: [{ state: "Lagos", city: "Ikeja" }, { state: "Oyo", city: "Ibadan" }], themeColor: "#12ab9f" }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { categories: ["a", "b", "c", "d", "e", "f"] }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { locations: Array(5).fill({ state: "Lagos", city: "Ikeja" }) }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { categories: "Fashion" }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { themeColor: "red" }));
  await assertFails(updateDoc(doc(db, "shops/sA"), { themeColor: "#fff" }));
  await assertFails(updateDoc(doc(as("B"), "shops/sA"), { categories: ["Fashion"] }));
});
test("another seller cannot change shop A's location or hours", () =>
  assertFails(updateDoc(doc(as("B"), "shops/sA"), { state: "Kano", openingHours: "never" })));
test("a new shop can include a valid state and city, but not an invalid one", async () => {
  const ok = as("J"), b1 = writeBatch(ok);
  b1.set(doc(ok, "shops/sJ"), { whatsappNumber: WA, ownerUid: "J", slug: "juliet", name: "Juliet", status: "pending", subscriptionPlan: "basic", state: "Oyo", city: "Ibadan" });
  b1.set(doc(ok, "slugs/juliet"), { shopId: "sJ", ownerUid: "J" });
  b1.set(doc(ok, "owners/J"), { shopId: "sJ" });
  await assertSucceeds(b1.commit());
  const bad = as("K"), b2 = writeBatch(bad);
  b2.set(doc(bad, "shops/sK"), { whatsappNumber: WA, ownerUid: "K", slug: "kilo", name: "Kilo", status: "pending", subscriptionPlan: "basic", state: "Mars" });
  b2.set(doc(bad, "slugs/kilo"), { shopId: "sK", ownerUid: "K" });
  b2.set(doc(bad, "owners/K"), { shopId: "sK" });
  await assertFails(b2.commit());
});

test("the administrator can count and read any shop's products; other sellers and visitors cannot", async () => {
  const admin = env.authenticatedContext("root", { admin: true }).firestore();
  const all = (db) => collection(db, "shops/sA/products");
  const n = await assertSucceeds(getCountFromServer(all(admin)));
  if (n.data().count < 2) throw new Error("expected at least the published and the draft product");
  await assertSucceeds(getCountFromServer(query(all(admin), where("status", "==", "published"))));
  await assertFails(getCountFromServer(all(as("B"))));
  await assertFails(getCountFromServer(all(anon())));
});

const rep = (extra = {}) => ({ shopId: "sA", reason: "scam", details: "Took my money", status: "new", createdAt: serverTimestamp(), ...extra });
test("anyone can report an active shop or one of its products", async () => {
  await assertSucceeds(addDoc(collection(anon(), "reports"), rep()));
  await assertSucceeds(addDoc(collection(anon(), "reports"), rep({ productId: "pub", contact: "0803 123 4567" })));
  await assertSucceeds(addDoc(collection(as("B"), "reports"), rep({ reason: "other", details: "" })));
});
test("bad reports are refused: unknown shop or product, bad reason, too long, wrong status, extra fields", async () => {
  const col = collection(anon(), "reports");
  await assertFails(addDoc(col, rep({ shopId: "nope" })));
  await assertFails(addDoc(col, rep({ productId: "nope" })));
  await assertFails(addDoc(col, rep({ productId: 5 })));
  await assertFails(addDoc(col, rep({ reason: "spam" })));
  await assertFails(addDoc(col, rep({ details: "x".repeat(501) })));
  await assertFails(addDoc(col, rep({ contact: "x".repeat(101) })));
  await assertFails(addDoc(col, rep({ status: "reviewed" })));
  await assertFails(addDoc(col, rep({ createdAt: new Date("2020-01-01") })));
  await assertFails(addDoc(col, rep({ isAdmin: true })));
  await assertFails(addDoc(col, { shopId: "sA", status: "new", createdAt: serverTimestamp() })); // reason missing
});
test("a suspended shop cannot be reported by visitors (only active shops)", async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "shops/sSus"), { whatsappNumber: WA, ownerUid: "S", slug: "sus", name: "Sus", status: "suspended", subscriptionPlan: "basic" }));
  await assertFails(addDoc(collection(anon(), "reports"), rep({ shopId: "sSus" })));
});
test("only the administrator can read, handle or delete reports", async () => {
  let id;
  await env.withSecurityRulesDisabled(async (ctx) => { id = (await addDoc(collection(ctx.firestore(), "reports"), rep())).id; });
  const admin = env.authenticatedContext("root", { admin: true }).firestore();
  await assertFails(getDoc(doc(anon(), "reports", id)));
  await assertFails(getDoc(doc(as("A"), "reports", id)));
  await assertFails(getDocs(collection(as("A"), "reports")));
  await assertFails(updateDoc(doc(as("A"), "reports", id), { status: "dismissed" }));
  await assertFails(deleteDoc(doc(as("A"), "reports", id)));
  await assertSucceeds(getDoc(doc(admin, "reports", id)));
  await assertSucceeds(getDocs(collection(admin, "reports")));
  await assertSucceeds(updateDoc(doc(admin, "reports", id), { status: "reviewed", reviewedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(admin, "reports", id), { status: "bogus" }));
  await assertFails(updateDoc(doc(admin, "reports", id), { details: "rewritten" })); // admin cannot rewrite what was reported
  await assertSucceeds(deleteDoc(doc(admin, "reports", id)));
});

// ---- Seller statistics (views and WhatsApp taps) ----
const hit = (db, shop, id, v, t) => setDoc(doc(db, `shops/${shop}/stats/${id}`),
  { views: increment(v), taps: increment(t), updatedAt: serverTimestamp() }, { merge: true });
test("stats: a visitor (no sign-in) can count one view, then one tap, on a published product", async () => {
  await assertSucceeds(hit(anon(), "sA", "pub", 1, 0));
  await assertSucceeds(hit(anon(), "sA", "pub", 1, 0));
  await assertSucceeds(hit(anon(), "sA", "pub", 0, 1));
});
test("stats: the shop page itself can be counted", () => assertSucceeds(hit(anon(), "sA", "_shop", 1, 0)));
test("stats: a visitor cannot add more than 1 per write, add nothing, or go down", async () => {
  await assertFails(hit(anon(), "sA", "pub", 5, 0));
  await assertFails(hit(anon(), "sA", "pub", 1, 1));
  await assertFails(hit(anon(), "sA", "pub", 0, 0));
  await assertFails(hit(anon(), "sA", "pub", -1, 0));
});
test("stats: a visitor cannot set numbers directly or add extra fields", async () => {
  await assertFails(setDoc(doc(anon(), "shops/sA/stats/pub"), { views: 9999, taps: 0, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(anon(), "shops/sA/stats/_shop"), { views: 1, taps: 0, extra: "x", updatedAt: serverTimestamp() }, { merge: true }));
});
test("stats: no counting for draft products, missing products, or suspended shops", async () => {
  await assertFails(hit(anon(), "sA", "dr", 1, 0));
  await assertFails(hit(anon(), "sA", "doesnotexist", 1, 0));
  await assertFails(hit(anon(), "sS", "sp", 1, 0));
  await assertFails(hit(anon(), "sS", "_shop", 1, 0));
});
test("stats: only the shop owner (and admin) can read the numbers", async () => {
  await assertSucceeds(getDoc(doc(as("A"), "shops/sA/stats/pub")));
  await assertSucceeds(getDocs(collection(as("A"), "shops/sA/stats")));
  await assertSucceeds(getDocs(collection(env.authenticatedContext("X", { admin: true }).firestore(), "shops/sA/stats")));
  await assertFails(getDoc(doc(as("B"), "shops/sA/stats/pub")));
  await assertFails(getDocs(collection(as("B"), "shops/sA/stats")));
  await assertFails(getDoc(doc(anon(), "shops/sA/stats/pub")));
});
test("stats: only the owner or admin can delete counters; the owner cannot edit them", async () => {
  await assertFails(deleteDoc(doc(anon(), "shops/sA/stats/pub")));
  await assertFails(deleteDoc(doc(as("B"), "shops/sA/stats/pub")));
  await assertFails(updateDoc(doc(as("A"), "shops/sA/stats/pub"), { views: 1 }));
  await assertSucceeds(deleteDoc(doc(as("A"), "shops/sA/stats/pub")));
});

// ---- Shop and account deletion (item 9) ----
const wipe = (db, parts = ["shop", "slug", "owner"]) => {
  const b = writeBatch(db);
  if (parts.includes("shop")) b.delete(doc(db, "shops/sX"));
  if (parts.includes("slug")) b.delete(doc(db, "slugs/xray"));
  if (parts.includes("owner")) b.delete(doc(db, "owners/X"));
  return b.commit();
};
test("delete: nobody but the owner can delete a shop with its address and owner record", async () => {
  await assertFails(wipe(as("B")));
  await assertFails(wipe(anon()));
});
test("delete: the owner cannot delete only part of it (no second shop, no orphaned address)", async () => {
  await assertFails(wipe(as("X"), ["shop"]));
  await assertFails(wipe(as("X"), ["slug"]));
  await assertFails(wipe(as("X"), ["owner"]));
  await assertFails(wipe(as("X"), ["shop", "slug"]));
  await assertFails(wipe(as("X"), ["shop", "owner"]));
  await assertFails(wipe(as("X"), ["slug", "owner"]));
});
test("delete: the owner can delete shop, address and owner record together", () => assertSucceeds(wipe(as("X"))));
test("delete: afterwards the address is free for another seller", async () => {
  const db = as("Y"), b = writeBatch(db);
  b.set(doc(db, "shops/sY"), { whatsappNumber: WA, ownerUid: "Y", slug: "xray", name: "New Xray", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/xray"), { shopId: "sY", ownerUid: "Y" });
  b.set(doc(db, "owners/Y"), { shopId: "sY" });
  await assertSucceeds(b.commit());
});

test("email not verified: cannot create a shop", async () => {
  const db = asUnverified("U1"), b = writeBatch(db);
  b.set(doc(db, "shops/sU1"), { whatsappNumber: WA, ownerUid: "U1", slug: "unverified-one", name: "Unverified", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/unverified-one"), { shopId: "sU1", ownerUid: "U1" });
  b.set(doc(db, "owners/U1"), { shopId: "sU1" });
  await assertFails(b.commit());
});
test("email verified: can create a shop", async () => {
  const db = as("U2"), b = writeBatch(db);
  b.set(doc(db, "shops/sU2"), { whatsappNumber: WA, ownerUid: "U2", slug: "verified-two", name: "Verified", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/verified-two"), { shopId: "sU2", ownerUid: "U2" });
  b.set(doc(db, "owners/U2"), { shopId: "sU2" });
  await assertSucceeds(b.commit());
});
test("email not verified: a seller who already has a shop can still edit it", () =>
  assertSucceeds(updateDoc(doc(env.authenticatedContext("A", { email_verified: false }).firestore(), "shops/sA"), { name: "Alpha 2" })));

test("whatsapp number: a badly formatted number cannot create a shop", async () => {
  const db = as("W1"), b = writeBatch(db);
  b.set(doc(db, "shops/sW1"), { whatsappNumber: "08031234567", ownerUid: "W1", slug: "whisky", name: "Whisky", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/whisky"), { shopId: "sW1", ownerUid: "W1" });
  b.set(doc(db, "owners/W1"), { shopId: "sW1" });
  await assertFails(b.commit());
});
test("whatsapp number: owner cannot save a bad number, can save a good one", async () => {
  await assertFails(updateDoc(doc(as("A"), "shops/sA"), { whatsappNumber: "hello" }));
  await assertSucceeds(updateDoc(doc(as("A"), "shops/sA"), { whatsappNumber: "+2348099999999" }));
});

test("admin can delete a whole shop (shop, address, owner record); a seller cannot delete another seller's address", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "shops/sDel"), { whatsappNumber: WA, ownerUid: "DEL", slug: "to-delete", name: "Del", status: "active", subscriptionPlan: "basic" });
    await setDoc(doc(db, "slugs/to-delete"), { shopId: "sDel", ownerUid: "DEL" });
    await setDoc(doc(db, "owners/DEL"), { shopId: "sDel" });
    await setDoc(doc(db, "shops/sDel/orders/o1"), { orderStatus: "pending" });
  });
  await assertFails(deleteDoc(doc(as("B"), "slugs/to-delete")));
  const admin = env.authenticatedContext("root", { admin: true }).firestore();
  await assertSucceeds(deleteDoc(doc(admin, "shops/sDel/orders/o1")));
  const b = writeBatch(admin);
  b.delete(doc(admin, "slugs/to-delete")); b.delete(doc(admin, "owners/DEL")); b.delete(doc(admin, "shops/sDel"));
  await assertSucceeds(b.commit());
});

test("product small photo copy: a link is allowed, a non-text value is refused", async () => {
  const db = as("A");
  await assertSucceeds(setDoc(doc(db, "shops/sA/products/thumbok"), { ...prod("sA", "A", "published"), imageUrls: ["https://x/a.webp"], thumbUrl: "https://x/a-t.webp" }));
  await assertFails(setDoc(doc(db, "shops/sA/products/thumbbad"), { ...prod("sA", "A", "published"), imageUrls: ["https://x/a.webp"], thumbUrl: 123 }));
  await assertSucceeds(setDoc(doc(db, "shops/sA/products/videook"), { ...prod("sA", "A", "published"), videoUrl: "https://x/v.mp4", videoPoster: "https://x/v-p.webp" }));
  await assertFails(setDoc(doc(db, "shops/sA/products/videobad"), { ...prod("sA", "A", "published"), videoUrl: 123 }));
  await assertFails(setDoc(doc(db, "shops/sA/products/videolong"), { ...prod("sA", "A", "published"), videoUrl: "https://x/" + "a".repeat(800) }));
});

// ---------------- Team: invited helpers ("editors") ----------------
before(async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "shops/sP"), { whatsappNumber: WA, ownerUid: "P", slug: "papa", name: "Papa", status: "pending", subscriptionPlan: "basic" });
    await setDoc(doc(db, "owners/A"), { shopId: "sA" });
    await setDoc(doc(db, "members/M1"), { shopId: "sA", ownerUid: "A", email: "m1@x.com" });          // helper of shop A
    await setDoc(doc(db, "members/M2"), { shopId: "sP", ownerUid: "P", email: "m2@x.com" });          // helper of the pending shop P
    await setDoc(doc(db, "shops/sA/invites/new@x.com"), { email: "new@x.com", shopName: "Alpha" });
    await setDoc(doc(db, "shops/sB/invites/other@x.com"), { email: "other@x.com", shopName: "Bravo" });
    await setDoc(doc(db, "shops/sA/stats/_shop"), { views: 3, taps: 1 });
  });
});
const mail = (uid, email, verified = true) => env.authenticatedContext(uid, { email_verified: verified, email }).firestore();
const helper = () => mail("M1", "m1@x.com");

test("helper can add a product to the shop (sellerUid stays the owner), edit it and delete it", async () => {
  const db = helper();
  await assertSucceeds(setDoc(doc(db, "shops/sA/products/h1"), prod("sA", "A", "published")));
  await assertSucceeds(updateDoc(doc(db, "shops/sA/products/h1"), { price: 250 }));
  await assertSucceeds(deleteDoc(doc(db, "shops/sA/products/h1")));
});
test("helper cannot put their own id as sellerUid", async () =>
  assertFails(setDoc(doc(helper(), "shops/sA/products/h2"), prod("sA", "M1", "published"))));
test("helper can read drafts and numbers of their shop, and the shop while it is pending", async () => {
  await assertSucceeds(getDoc(doc(helper(), "shops/sA/products/dr")));
  await assertSucceeds(getDoc(doc(helper(), "shops/sA/stats/_shop")));
  await assertSucceeds(getDoc(doc(mail("M2", "m2@x.com"), "shops/sP")));
});
test("helper cannot touch another shop", async () => {
  const db = helper();
  await assertFails(setDoc(doc(db, "shops/sB/products/x"), prod("sB", "B", "published")));
  await assertFails(getDoc(doc(db, "shops/sP")));
});
test("helper cannot change shop settings, delete the shop or invite people", async () => {
  const db = helper();
  await assertFails(updateDoc(doc(db, "shops/sA"), { name: "Hacked" }));
  await assertFails(deleteDoc(doc(db, "shops/sA")));
  await assertFails(setDoc(doc(db, "shops/sA/invites/friend@x.com"), { email: "friend@x.com", shopName: "Alpha", createdAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, "shops/sA/orders/o1"), { orderStatus: "confirmed", updatedAt: serverTimestamp() }));
});
test("a helper with an unverified email gets no access", async () =>
  assertFails(setDoc(doc(mail("M1", "m1@x.com", false), "shops/sA/products/h3"), prod("sA", "A", "published"))));
test("a stranger cannot read drafts or numbers", async () => {
  await assertFails(getDoc(doc(as("Z"), "shops/sA/products/dr")));
  await assertFails(getDoc(doc(as("Z"), "shops/sA/stats/_shop")));
});

test("owner can invite by email; bad addresses, other people and mismatched ids are refused", async () => {
  await assertSucceeds(setDoc(doc(as("A"), "shops/sA/invites/ok@x.com"), { email: "ok@x.com", shopName: "Alpha", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(as("A"), "shops/sA/invites/notanemail"), { email: "notanemail", shopName: "Alpha", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(as("A"), "shops/sA/invites/Cap@x.com"), { email: "Cap@x.com", shopName: "Alpha", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(as("A"), "shops/sA/invites/a@x.com"), { email: "b@x.com", shopName: "Alpha", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(as("B"), "shops/sA/invites/b@x.com"), { email: "b@x.com", shopName: "Alpha", createdAt: serverTimestamp() }));
});
test("only the owner and the invited person can read an invitation", async () => {
  await assertSucceeds(getDoc(doc(as("A"), "shops/sA/invites/new@x.com")));
  await assertSucceeds(getDoc(doc(mail("N", "New@X.com"), "shops/sA/invites/new@x.com")));
  await assertFails(getDoc(doc(mail("Z", "z@x.com"), "shops/sA/invites/new@x.com")));
  await assertFails(getDoc(doc(mail("N", "new@x.com", false), "shops/sA/invites/new@x.com")));
});
test("invited person can accept: joins and the invitation is removed in one batch", async () => {
  const db = mail("N", "new@x.com"), b = writeBatch(db);
  b.set(doc(db, "members/N"), { shopId: "sA", ownerUid: "A", email: "new@x.com", createdAt: serverTimestamp() });
  b.delete(doc(db, "shops/sA/invites/new@x.com"));
  await assertSucceeds(b.commit());
  await assertSucceeds(setDoc(doc(db, "shops/sA/products/byN"), prod("sA", "A", "draft")));
});
test("nobody can join without an invitation, with someone else's email, or for another shop", async () => {
  await assertFails(setDoc(doc(mail("Q", "q@x.com"), "members/Q"), { shopId: "sA", ownerUid: "A", email: "q@x.com", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(mail("R", "r@x.com"), "members/R"), { shopId: "sB", ownerUid: "B", email: "new@x.com", createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(mail("R", "other@x.com"), "members/R"), { shopId: "sA", ownerUid: "A", email: "other@x.com", createdAt: serverTimestamp() })); // the invite is for shop B
  await assertFails(setDoc(doc(mail("S2", "other@x.com"), "members/R"), { shopId: "sB", ownerUid: "B", email: "other@x.com", createdAt: serverTimestamp() })); // someone else's uid
});
test("a shop owner cannot also become a helper, and a helper cannot open a shop", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "shops/sA/invites/a@x.com"), { email: "a@x.com", shopName: "Alpha" }); });
  await assertFails(setDoc(doc(mail("A", "a@x.com"), "members/A"), { shopId: "sA", ownerUid: "A", email: "a@x.com", createdAt: serverTimestamp() }));
  const db = mail("M1", "m1@x.com"), b = writeBatch(db);
  b.set(doc(db, "shops/sM"), { whatsappNumber: WA, ownerUid: "M1", slug: "mike", name: "Mike", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/mike"), { shopId: "sM", ownerUid: "M1" });
  b.set(doc(db, "owners/M1"), { shopId: "sM" });
  await assertFails(b.commit());
});
test("owner can list and remove helpers; a helper can leave; others cannot", async () => {
  await assertSucceeds(getDocs(query(collection(as("A"), "members"), where("ownerUid", "==", "A"))));
  await assertFails(getDocs(query(collection(as("B"), "members"), where("ownerUid", "==", "A"))));
  await assertFails(deleteDoc(doc(as("B"), "members/M1")));
  await assertFails(updateDoc(doc(helper(), "members/M1"), { shopId: "sB" }));
  await assertFails(setDoc(doc(mail("R", "new@x.com"), "members/R"), { shopId: "sA", ownerUid: "R", email: "new@x.com", createdAt: serverTimestamp() })); // cannot claim to be the owner
  await assertSucceeds(deleteDoc(doc(as("A"), "members/M1")));
  await assertFails(setDoc(doc(helper(), "shops/sA/products/after"), prod("sA", "A", "published"))); // access ends at once
  await assertSucceeds(deleteDoc(doc(mail("M2", "m2@x.com"), "members/M2")));                       // leaving
});
test("the address 'join' is reserved", async () => {
  const db = as("J"), b = writeBatch(db);
  b.set(doc(db, "shops/sJ"), { whatsappNumber: WA, ownerUid: "J", slug: "join", name: "Join", status: "pending", subscriptionPlan: "basic" });
  b.set(doc(db, "slugs/join"), { shopId: "sJ", ownerUid: "J" });
  b.set(doc(db, "owners/J"), { shopId: "sJ" });
  await assertFails(b.commit());
});
