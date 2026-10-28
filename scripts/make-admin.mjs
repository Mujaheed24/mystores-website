// Usage: node scripts/make-admin.mjs you@example.com   (needs GOOGLE_APPLICATION_CREDENTIALS)
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUserByEmail(process.argv[2]);
await getAuth().setCustomUserClaims(user.uid, { admin: true });
console.log("Admin claim set for", user.email, "- sign out and in again to refresh the token.");
