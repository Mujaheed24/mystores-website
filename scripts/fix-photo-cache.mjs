// One-off: gives photos uploaded BEFORE the speed update the same one-year browser cache as new ones.
// Usage: node scripts/fix-photo-cache.mjs your-bucket-name     (needs GOOGLE_APPLICATION_CREDENTIALS)
// The bucket name is NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local, for example mystores-workspace.firebasestorage.app
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
initializeApp({ credential: applicationDefault(), storageBucket: process.argv[2] });
const [files] = await getStorage().bucket().getFiles({ prefix: "shops/" });
let n = 0;
for (const f of files) {
  if (f.metadata.cacheControl === "public,max-age=31536000,immutable") continue;
  await f.setMetadata({ cacheControl: "public,max-age=31536000,immutable" });
  n++;
}
console.log(`Updated ${n} of ${files.length} photos.`);
