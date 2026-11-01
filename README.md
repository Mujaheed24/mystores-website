# MyStores (Phase 1)

MyStores: one platform, many independent shops at `mystores.com.ng/<shop>`. Built with Next.js (App Router, TypeScript) and Firebase.

## What is in Phase 1
- Landing page with a live shop-address checker and a shop directory (shops only, no mixed products)
- Shop storefront at `/<slug>`: 2-second entry banner, Recommended 3D carousel, then all products with search, sort and filters
- Product page at `/<slug>/p/<id>` with an Order on WhatsApp button
- `firestore.rules` and `storage.rules` enforcing shop isolation, unique addresses, locked ownership/status/plan
- `tests/rules.test.mjs`: two-seller isolation tests for the security rules
- `src/lib/createShop.ts`: shop and address are claimed in a single batch

## Set up
1. Create a Firebase project. Turn on **Firestore**, **Authentication** (Email/Password) and **Storage**.
2. `cp .env.example .env.local` and fill in the web app keys (Project settings, Your apps).
3. `npm install`
4. Deploy the rules: `npx firebase-tools login`, then `npx firebase-tools deploy --only firestore:rules,storage --project <your-project-id>`
5. Add demo shops: download a service-account key, then `GOOGLE_APPLICATION_CREDENTIALS=key.json npm run seed`
6. `npm run dev` and open http://localhost:3000, then http://localhost:3000/oudpalace

## Test the rules (needs Java and firebase-tools)
`npm run test:rules`

## Make yourself the administrator
Create your account, then: `GOOGLE_APPLICATION_CREDENTIALS=key.json npm run make-admin you@example.com`

## Next
Seller sign-up and shop setup wizard, seller dashboard with product upload (images to Storage), admin area, order handling via a Cloud Function.

## Phase 2: sellers and admin
- `/sell` – Google sign-in, then the shop setup wizard (address check, category, WhatsApp number, colour)
- `/dashboard` – products (add, edit, publish/draft, recommend, delete), shop profile, photo upload (compressed to WebP in the browser)
- `/admin` – approve, suspend and reactivate shops (administrators only)
- New shops start as **pending**. Approve them at `/admin` before visitors can see them.
- Redeploy the rules after updating: `npx firebase-tools deploy --only firestore:rules,storage`

## Phase 2b
- One shop per account, enforced in the rules through `owners/{uid}`. For shops that existed before this change, run once: `node scripts/backfill-owners.mjs`
- Logo and banner uploads on the Shop profile tab; they show on the storefront, entry banner and directory cards
- Deleting a product, or removing/replacing a photo, now deletes the file from Storage
