// One-time: creates owners/{uid} records for shops made before the one-shop-per-account rule.
// Usage (PowerShell): $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Dev\keys\your-key.json"; node scripts/backfill-owners.mjs
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
for (const s of (await db.collection("shops").get()).docs) {
  const { ownerUid, name } = s.data();
  await db.collection("owners").doc(ownerUid).set({ shopId: s.id });
  console.log("Owner record set for", name);
}
