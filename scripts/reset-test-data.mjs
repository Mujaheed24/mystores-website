// Wipes TEST data from the development Firebase project (mystores-workspace).
//
// Removes:  every shop (with its products, stats and orders), every address (slugs),
//           every owners record, every report, and all photos under shops/ in Storage.
// Optional: --auth also deletes sign-in accounts, EXCEPT administrators (admin claim).
// Keeps:    your administrator account(s), the rules, and all code.
//
// Usage (PowerShell, from C:\Dev\mystores):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Dev\keys\<your-key>.json"
//   node scripts/reset-test-data.mjs <storage-bucket> [--auth]
//   (bucket looks like mystores-workspace.firebasestorage.app, copy it from .env.local)
//
// Safety: it refuses to run on any project other than mystores-workspace, shows what it
// will do, and makes you type the project name before deleting anything. NEVER point it at the live project.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

const ALLOWED_PROJECT = "mystores-workspace";
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const bucketName = process.argv[2];
const wipeAuth = process.argv.includes("--auth");

if (!keyPath || !bucketName || bucketName.startsWith("--")) {
  console.error("Missing details. Usage: node scripts/reset-test-data.mjs <storage-bucket> [--auth]");
  console.error("Also set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file first.");
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, "utf8"));
if (key.project_id !== ALLOWED_PROJECT) {
  console.error(`Refusing to run: this key belongs to "${key.project_id}", not "${ALLOWED_PROJECT}".`);
  process.exit(1);
}
if (!bucketName.startsWith(ALLOWED_PROJECT)) {
  console.error(`Refusing to run: bucket "${bucketName}" does not look like the ${ALLOWED_PROJECT} bucket.`);
  process.exit(1);
}

initializeApp({ credential: cert(key), storageBucket: bucketName });
const db = getFirestore();
const bucket = getStorage().bucket();

// Count first, so you see what is about to disappear.
const count = async (name) => (await db.collection(name).count().get()).data().count;
const [shops, slugs, owners, reports] = await Promise.all([count("shops"), count("slugs"), count("owners"), count("reports")]);
const [files] = await bucket.getFiles({ prefix: "shops/" });
let authTargets = [];
if (wipeAuth) {
  let token;
  do {
    const page = await getAuth().listUsers(1000, token);
    authTargets.push(...page.users.filter((u) => !(u.customClaims && u.customClaims.admin === true)));
    token = page.pageToken;
  } while (token);
}

console.log(`\nProject: ${ALLOWED_PROJECT}`);
console.log(`Shops: ${shops} (their products, stats and orders go too)`);
console.log(`Addresses (slugs): ${slugs}   Owners records: ${owners}   Reports: ${reports}`);
console.log(`Storage files under shops/: ${files.length}`);
console.log(wipeAuth ? `Sign-in accounts to delete (admins are kept): ${authTargets.length}` : "Sign-in accounts: kept (add --auth to remove non-admin accounts)");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`\nType ${ALLOWED_PROJECT} to delete all of this, anything else to cancel: `);
rl.close();
if (answer.trim() !== ALLOWED_PROJECT) {
  console.log("Cancelled. Nothing was deleted.");
  process.exit(0);
}

// Shops first (recursiveDelete also removes products, stats and orders underneath).
await db.recursiveDelete(db.collection("shops"));
console.log("Deleted shops, products, stats and orders.");
for (const name of ["slugs", "owners", "reports"]) {
  await db.recursiveDelete(db.collection(name));
  console.log(`Deleted ${name}.`);
}
await bucket.deleteFiles({ prefix: "shops/", force: true });
console.log("Deleted photos under shops/.");

if (wipeAuth && authTargets.length) {
  for (let i = 0; i < authTargets.length; i += 1000) {
    await getAuth().deleteUsers(authTargets.slice(i, i + 1000).map((u) => u.uid));
  }
  console.log(`Deleted ${authTargets.length} sign-in accounts.`);
}
console.log("\nDone. The site is empty again. Wait about a minute (page cache) before checking the home page.");
