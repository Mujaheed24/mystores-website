// Usage: node scripts/delete-user.mjs seller@example.com   (needs GOOGLE_APPLICATION_CREDENTIALS)
// Removes the sign-in account only. Delete the shop first at /admin. Do NOT use this to punish a seller:
// a deleted account can sign up again with the same email, while a suspended shop stays blocked.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUserByEmail(process.argv[2]);
await getAuth().deleteUser(user.uid);
console.log("Deleted sign-in account", user.email);
