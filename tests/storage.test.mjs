// Run with: npm run test:rules   (starts the Firestore and Storage emulators)
import { test, before, after } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, getBytes } from "firebase/storage";

let env;
const png = new Uint8Array([137, 80, 78, 71]);
before(async () => {
  // The Storage emulator looks the shop owner up in the Firestore of the project the emulators were started with
  // (set by "firebase emulators:exec"), so the test must use that same project id or the lookup finds nothing.
  env = await initializeTestEnvironment({ projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "demo-mystores-storage",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "shops/sA"), { ownerUid: "A", slug: "alpha", name: "Alpha", status: "active" });
    await setDoc(doc(ctx.firestore(), "shops/sB"), { ownerUid: "B", slug: "bravo", name: "Bravo", status: "active" });
    await uploadBytes(ref(ctx.storage(), "shops/sA/products/p1/seed.webp"), png, { contentType: "image/webp" });
    await uploadBytes(ref(ctx.storage(), "shops/sA/products/p1/seed2.webp"), png, { contentType: "image/webp" });
  });
});
after(() => env.cleanup());
const owner = (uid, verified = true) => env.authenticatedContext(uid, { email_verified: verified }).storage();
const put = (st, path, bytes = png, contentType = "image/webp") => uploadBytes(ref(st, path), bytes, { contentType });

test("storage: owner can upload a product photo and a banner", async () => {
  await assertSucceeds(put(owner("A"), "shops/sA/products/p1/new-1.webp"));
  await assertSucceeds(put(owner("A"), "shops/sA/branding/banner-1.webp"));
});
test("storage: another seller cannot upload into my shop", () => assertFails(put(owner("B"), "shops/sA/products/p1/evil.webp")));
test("storage: not signed in cannot upload", () => assertFails(put(env.unauthenticatedContext().storage(), "shops/sA/products/p1/anon.webp")));
test("storage: unverified email cannot upload", () => assertFails(put(owner("A", false), "shops/sA/products/p1/unv.webp")));
test("storage: only images are accepted", () => assertFails(put(owner("A"), "shops/sA/products/p1/x.webp", png, "text/html")));
test("storage: files of 5 MB or more are refused", () => assertFails(put(owner("A"), "shops/sA/products/p1/big.webp", new Uint8Array(5 * 1024 * 1024 + 1))));
test("storage: odd file names and unknown folders are refused", async () => {
  await assertFails(put(owner("A"), "shops/sA/products/p1/a b$.webp"));
  await assertFails(put(owner("A"), "shops/sA/random/file.webp"));
  await assertFails(put(owner("A"), "other/file.webp"));
});
test("storage: anyone can view photos", () => assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), "shops/sA/products/p1/seed.webp"))));
test("storage: owner can delete a photo, others cannot", async () => {
  await assertFails(deleteObject(ref(owner("B"), "shops/sA/products/p1/seed.webp")));
  await assertSucceeds(deleteObject(ref(owner("A"), "shops/sA/products/p1/seed.webp")));
});
test("storage: the administrator can delete any shop's photo", () =>
  assertSucceeds(deleteObject(ref(env.authenticatedContext("root", { admin: true, email_verified: true }).storage(), "shops/sA/products/p1/seed2.webp"))));

test("storage: owner can upload a product video, others cannot, and wrong types or huge files are refused", async () => {
  const vid = new Uint8Array([0, 0, 0, 24]);
  await assertSucceeds(put(owner("A"), "shops/sA/products/p1/clip-1.mp4", vid, "video/mp4"));
  await assertSucceeds(put(owner("A"), "shops/sA/products/p1/clip-2.mov", vid, "video/quicktime"));
  await assertFails(put(owner("B"), "shops/sA/products/p1/evil.mp4", vid, "video/mp4"));
  await assertFails(put(owner("A"), "shops/sA/products/p1/clip-3.avi", vid, "video/x-msvideo"));
  await assertFails(put(owner("A"), "shops/sA/products/p1/clip-4.mp4", new Uint8Array(40 * 1024 * 1024 + 1), "video/mp4"));
  await assertFails(put(owner("A"), "shops/sA/branding/clip.mp4", vid, "video/mp4")); // videos are for products only
});
