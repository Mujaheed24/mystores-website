import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";

// Light part of Firebase (app + sign-in). Firestore and Storage live in firebase.ts so pages that do not need them stay small.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const app = getApps().length ? getApp() : initializeApp(config);
// App Check proves requests come from the real MyStores site, not a bot script. It is switched on by setting
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY (see docs/LAUNCH.md). Without the key the site works as before.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === "true") (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true; // local testing only
  try { initializeAppCheck(app, { provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true }); }
  catch { /* already started (hot reload) */ }
}
export const getAuthClient = () => getAuth(app);
