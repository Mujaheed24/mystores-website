# MyStores – project briefing

Last updated: 30 October 2026 (after Tier 1 and Tier 2 items 8 and 9: seller statistics, shop and account deletion). Paste or upload this file at the start of a new chat, together with `docs/blueprint-v1.2.txt` and a zip of the project (without `node_modules`).

## 1. What we are building
A multi-shop platform for Nigerians. Sellers create their own store at `mystores.com.ng/<shop-address>`. Each shop has its own branding, products and (later) orders, and shops never mix. Visitors browse and order from a seller on WhatsApp (Stage A). Website checkout with online payment is planned (Stage B).

- Brand: **MyStores**. Domain: `mystores.com.ng` (availability not yet confirmed; consider also `mystores.ng`).
- Market: Nigeria. Currency: Naira (₦), whole numbers. Phone numbers stored as `+234XXXXXXXXXX`.
- Source of truth for requirements: `docs/blueprint-v1.2.txt` (sections 1 to 20). Visual reference: `docs/preview.html` (clickable mockup).

## 2. Who I am working with
Non-developer owner working on **Windows with PowerShell**, project at `C:\Dev\mystores`. Needs step-by-step commands, plain explanations, and exact error-message help. Service-account key is kept **outside** the project in `C:\Dev\keys\` (never commit it, never paste its contents).

## 3. Stack and accounts
- Next.js 15 (App Router) + React 19 + TypeScript, Firebase JS SDK 11. Node 20+ (owner runs Node 24).
- Firebase project ID: `mystores-workspace`.
- Firestore: database `(default)`, region **africa-south1**, production mode (it was first created in `nam5` by mistake, deleted and recreated).
- Storage: owner reported choosing africa-south1; verify in the console. Storage rules use a cross-service IAM role (already granted).
- Auth: **Google sign-in only**. Administrator = user with custom claim `admin: true`, set with `npm run make-admin <email>`.
- Config: web keys in `.env.local` (`NEXT_PUBLIC_FIREBASE_*`), project ID in `.firebaserc`. These two files are on the owner's machine only. **Never overwrite them** when sending update zips.
- Public contact details come from two more `.env.local` keys: `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_CONTACT_WHATSAPP` (owner has set them; `.env.example` lists them). Read in `src/lib/contact.ts`; if empty the contact buttons are hidden and the legal pages keep their `[email]` brackets.
- Not yet decided or set up: hosting/deployment, payment provider, Cloud Functions, billing plan (Blaze).

## 4. How we deliver code
Claude builds in a sandbox, type-checks and runs `next build`, then sends a **zip of only the changed files**. The owner unzips over `C:\Dev\mystores` and replaces files. If `firestore.rules` or `storage.rules` changed, redeploy: `npx firebase-tools deploy --only firestore:rules,storage`. Claude's sandbox has Java but cannot download the Firestore emulator, so **the owner runs the rules tests on his own machine**: `npm run test:rules` (script fixed for Node 24: `firebase emulators:exec --only firestore "node --test tests/rules.test.mjs"`). Status: 23 of 23 passed on 30 Oct. Since then 5 tests were added (admin counts, 4 for reports), so the file had 28 tests, and item 8 added 7 and item 9 added 4, so it now has **39 tests; run `npm run test:rules` and expect 39 passing** (items 8 tests passed on the owner machine; item 9 tests not run yet). Expect harmless "Property admin is undefined" lines in the output (non-admin users checked against the admin condition). Storage rules have no tests yet.

Tip for Claude: when zipping paths that contain `[shop]` use `zip -nw` (no wildcards). Send each zip with only the changed files; mention whether rules must be redeployed.

## 5. What is built and confirmed working (owner tested)
Routes:
- `/` landing page: address checker, directory of active shops (shops only, no mixed products).
- `/[shop]` storefront: 2-second branded entry banner (skippable), stacked 3D "Recommended" carousel (auto-advance, pauses on hover, up to 5 in-stock featured products, hidden if fewer than 2), then "All products" with search, sort, category chips. Logo and banner images supported.
- `/[shop]/p/[productId]` product page with photo gallery and Order on WhatsApp button.
- `/sell` Google sign-in, then a 3-step shop setup wizard (name, address with live availability check, category, description, Nigerian WhatsApp number, colour).
- `/dashboard` seller area: Products (add, edit, delete, publish/draft, recommend max 5), Shop profile (name, description, WhatsApp, colour, logo, banner), Orders tab (placeholder: orders happen on WhatsApp for now).
- `/admin` administrators only: approve, suspend, reactivate shops. New shops start **pending**.
- `/terms` and `/privacy`: **draft** legal pages with bracketed gaps. A Nigerian lawyer must review and complete them before launch.
- Share previews and search basics: per-shop and per-product titles, descriptions and images (WhatsApp/social cards), product structured data, `sitemap.xml`, `robots.txt`, favicon, footer links, dashboard/admin set to noindex. Needs `NEXT_PUBLIC_SITE_URL` in `.env.local` (defaults to localhost).
- `/help`: FAQ for sellers and customers (native open/close answers, FAQ structured data), contact card (WhatsApp + email from env), linked in footer and sitemap. Component styles in `src/app/help/help.module.css`.
- WhatsApp number: the dashboard "My shop" form validates and normalises with `normalizeNgPhone` (same helper as the wizard), saved as `+234XXXXXXXXXX`. The Firestore rules do **not** yet check the number format (small hardening, do together with rules work).
- Shop info (all optional): `state` (dropdown of 36 states + "FCT Abuja"), `city`, `openingHours` (max 120), `deliveryNotes` (max 300). Edited in My shop; shown on the storefront as a location pill and an info card (`ShopInfo`). Home directory (`ShopDirectory`, client component, plain data only) shows city/state and a state filter when shops from 2+ states exist. Dashboard checklist has an item for it. The sign-up wizard does NOT ask for state.
- Admin (`/admin`): stat tiles (total/waiting/active/suspended), new this week, product totals, search (name, address, category, city, state, number), status chips with counts, state filter, per-shop product counts (counted one shop at a time, never a cross-shop product query), location, number, opened date, "View shop" link. Styles in `src/app/admin/admin.module.css`.
- Reports: visitors (no sign-in) use "Report this shop" (bottom of storefront, hidden in dashboard preview) and "Report this product" (product page). Component `ReportButton` (native `<dialog>`), reasons in `src/lib/reports.ts`. Client limit: 1 report per target per day and 5 per day per device (localStorage `ms-reports`, only stops honest repeats). Admin list at `/admin/reports` (filter new/reviewed/dismissed/all; mark reviewed, dismiss, reopen, suspend shop). `/admin` shows a "Reports (N new)" button.
- Caching (`src/lib/cached.ts`): public pages read Firestore through `unstable_cache` with a 60 s TTL (sitemap 1 h); errors are not cached; product lookups are still per shop. Pages themselves stay `force-dynamic`. Effect: seller edits appear on public pages within about a minute, and a shop opened while still pending can show "not found" for up to a minute after approval. Full-page caching (ISR/CDN) waits for the hosting decision. `src/lib/shops.ts` now drops Firestore `createdAt`/`updatedAt` Timestamps so only plain data reaches client components (this removed the "Only plain objects" warnings).
- **Seller statistics (item 8):** `shops/{shopId}/stats/{productId or "_shop"}` = `{views, taps, updatedAt}`. Visitors (no sign-in) add exactly 1 to one counter per write (rules: active shop, published product, only `views`/`taps`/`updatedAt`, never lower, never read). Owner/admin read and delete. Client code in `src/lib/stats.ts`; `Track` (page view) and `TapLink` (WhatsApp tap) in `src/components/Track.tsx`. Counted once per product per browser session; the owner's own visits are skipped; dashboard preview is not counted. Shown in the dashboard Home ("Your visitors": shop visits, product views, WhatsApp taps, top 5 products) and on each product card. A product's counter is deleted with the product. Counts can be inflated by bots (same App Check issue as reports, item 11).
- **Shop and account deletion (item 9):** dashboard My shop, bottom "Delete my shop and account" (`src/components/dash/DeleteShop.tsx`, logic in `src/lib/deleteShop.ts`). Seller types the shop address, signs in with Google again (Firebase needs a recent sign-in), then: all Storage files under `shops/{id}` are removed, products and stats docs are deleted, then shop + slug + owners record are deleted in ONE batch (rules refuse partial deletes, so nobody can keep a shop and open a second one, or release an address while keeping the shop), then the Firebase Auth user is deleted. Failures before the batch leave the shop intact and the seller can retry. The address becomes free for anyone. Reports about the shop are kept (admin only; the reports page shows "Shop no longer exists"). **Not covered yet:** `orders` documents (no deletes allowed by rules; none exist until Stage B, so item 17 must handle orders when deleting a shop); admin deleting a shop on a seller's behalf; a signed-in account that never created a shop. `/help` and `/privacy` mention self-service deletion (lawyer must review the privacy text).
- Product page zoom viewer (`ZoomViewer`, portal): pinch, double-tap/click, wheel, +/- buttons, drag to pan, swipe/arrows between photos, Esc, focus trap. Opened from the main photo or an always-visible expand button in `Gallery`.
- `docs/LAUNCH.md`: step-by-step launch checklist (domain, separate production Firebase project, hosting options, pre-launch checks).
- Reserved addresses: admin, dashboard, home, login, signup, api, shops, help, support, terms, privacy, sell. List lives in **two places** that must stay in sync: `src/lib/slug.ts` and `firestore.rules`.
- Other lists that must stay in sync between code and rules: the Nigerian states (`NG_STATES` in `src/lib/options.ts` and `validExtras` in `firestore.rules`) and the report reasons (`src/lib/reports.ts` and `validReport` in `firestore.rules`).

## Design system (added in the UI/UX pass)
- Font: **Plus Jakarta Sans** (variable), self-hosted via the npm package `@fontsource-variable/plus-jakarta-sans` (no Google Fonts request). One family for everything.
- Built for small WhatsApp sellers on phones: 18px base text, 58px buttons, 60px inputs, pill buttons, 44px+ tap targets everywhere, one question per screen in the sign-up wizard, bottom tab bar in the dashboard.
- Tokens live at the top of `src/app/globals.css` (brand green, accent yellow, WhatsApp green, radii, easing). Each shop sets its own `--sa` colour.
- Motion: scroll-reveal (`Reveal`), curtain-lift entry banner (`Splash`), swipeable 3D `Carousel`, typing hero phone (`HeroPhone`), count-up dashboard numbers, skeleton loaders, press/hover micro-interactions. All respect `prefers-reduced-motion`.
- **Gotcha:** never put a `transform` animation (or `filter`/`will-change`) on `.wrap` or any ancestor of `position: fixed` elements (splash, bottom nav, toasts, WhatsApp button). It traps them. `.wrap` uses an opacity-only animation for this reason.
- Landing page, storefront and product page: WhatsApp chat button floating on storefronts, sticky "Order on WhatsApp" bar on product pages, share buttons.
- Dashboard: Home (share link, stats, setup checklist), Products (card list with visible/recommend/edit/delete), Add, My shop (profile, logo, banner).

## Image-first products, themes and home photos (latest pass)
- Products no longer need a name or a price. A product needs **a name OR at least one photo**. No price shows "Ask for price". Rules updated (`firestore.rules`) and tested in `tests/rules.test.mjs` (tests not yet run).
- Dashboard: "Many photos" mode turns each selected photo (up to 20) into its own product. Storefront cards are image-first (photo with a price tag; name only if present).
- WhatsApp orders now include the product link so the seller sees which photo the customer means.
- Light/dark mode: toggle button (nav and storefront top row), choice saved in `localStorage` key `ms-theme`, first visit follows the phone setting. No-flash script is in `src/app/layout.tsx`. Shop colours are lightened automatically in dark mode via `--keep`.
- Home page photo slots (hero-1..3, step-1..3, seller-1..6, cta-bg, og) live in `public/images/home/`. Missing files are simply not shown. Guide with sizes, search words and AI prompts: `docs/HOME_IMAGES.md`.

## Latest UI pass: expand viewer, adaptive carousel, hero photos
- **Expand viewer:** small expand button on every product photo (hover on desktop, always visible on touch). Opens the full, uncropped photo in a viewer with swipe/arrows/Esc, plus Details and Order buttons. Component: `src/components/ExpandButton.tsx` (uses a React portal; needs `@types/react-dom` dev dependency, so run `npm install` after unzipping).
- **Carousel:** now edge to edge (full viewport width), bigger on large screens (photo height scales up to 580px), and each card's width follows its photo's shape (tall, square or wide). Layout maths lives in `src/components/Carousel.tsx`.
- **Hero phone** example shops can show optional banner and product photos (`demo-N-banner.jpg`, `demo-N-1..6.jpg`). Guide: `docs/HOME_IMAGES.md`.
- A background video in the hero was considered and skipped on purpose: autoplay video uses a lot of mobile data for sellers and customers.

## 6. Data model (Firestore)
- `slugs/{slug}`: `{ shopId, ownerUid }`. The address is the document ID, so it is unique.
- `owners/{uid}`: `{ shopId }`. One shop per account. Created in the same batch as the shop.
- `shops/{shopId}`: `ownerUid, name, slug, category, description, themeColor, whatsappNumber, logoUrl?, bannerUrl?, state?, city?, openingHours?, deliveryNotes?, status (pending|active|suspended), subscriptionPlan ("basic" at creation), createdAt, updatedAt`.
- `shops/{shopId}/products/{productId}`: `shopId, sellerUid, name, description, category, price (int ₦ or null), stockQuantity (int), status (draft|published), featured (bool), emoji, imageUrls[], createdAt, updatedAt`.
- `reports/{reportId}`: `shopId, productId?, reason (scam|illegal|adult|copied|other), details (<=500), contact (<=100), status (new|reviewed|dismissed), createdAt, reviewedAt?`. Anyone may create (only for an ACTIVE shop; productId must exist in that shop; status must be `new`; createdAt = server time). Only the administrator reads, deletes, or changes `status`/`reviewedAt`.
- `shops/{shopId}/orders/{orderId}`: rules exist (owner/admin read, owner can change only `orderStatus`/`updatedAt`, **no client creates**). No order code yet.
- Storage: `shops/{shopId}/products/{productId}/...webp` and `shops/{shopId}/branding/...webp`. Owner-only writes, JPEG/PNG/WebP, under 5 MB. Browser compresses to WebP before upload.
- Shop creation = one batched write of shop + slug + owner record. The rules reject the whole batch if the address exists, the account already has a shop, or the status is not `pending`.

## 7. Non-negotiable rules for any new code
1. Never build an "all products from all shops" query or page. Every product query is scoped to one shop ID.
2. Security lives in `firestore.rules` and `storage.rules`, not only in the UI. Every data feature needs a rules change **and** a test.
3. Sellers cannot change `ownerUid`, `slug`, `status` or `subscriptionPlan`. Only the administrator changes status.
4. Orders are created by trusted server code only; payments are verified server-side; no secrets in frontend code.
5. Public visitors see only `active` shops and `published` products.
6. Accessibility and mobile first: 44px touch targets, labels, visible focus, respects reduced motion.

## 8. Known gaps and small to-dos
- Not built: website checkout and orders, payments, subscription plans and billing, Cloud Functions, email/WhatsApp notifications, custom shop domains, a help page, platform-wide analytics, customer accounts, seller sign-up with email/password.
- Seller product limit by plan is not enforced. The "₦2,000 Basic plan" shown in the early preview was a placeholder, not a decision.
- The recommended-product limit of 5 is enforced in the UI and storefront only, not in the rules.
- **Report spam:** reports need no sign-in, so a bot could flood them. Size limits exist, volume limits do not. Firebase App Check and rate limits (item 11) are the real fix; do before launch.
- Storage rules are untested; the rules do not check the WhatsApp number format.
- Delivered but not yet confirmed by the owner: reports, caching and zoom zips, and the 5 new rules tests (run `npm run test:rules`, expect 28 passing). The owner had once missed `src/app/admin/admin.module.css`; it was re-sent in the caching zip.
- Missing optional home photos in `public/images/home/` only cause harmless 404 lines in the dev log.
- The first preview link (https://claude.ai/artifact/VAT1WGMzNRPk6TUM1JCgS3) still says "Multi-Shop Platform" and `platform.com`; `docs/preview.html` is the rebranded copy.
- Hosting is still undecided (Vercel or Firebase App Hosting; see `docs/LAUNCH.md`). The domain is not bought, and no production Firebase project exists yet.

## 9. Remaining build, easiest first
Work top to bottom. Tier 1 is finished. **Next up: item 10.** Tiers 1 and 2 need no outside accounts or decisions.

**Tier 1: DONE (items 1 to 7 built, 30 Oct 2026)**
1. Help page (`/help`) and a visible contact route (email or WhatsApp). Add the contact details into `/terms` and `/privacy` brackets.
2. Validate and normalise the WhatsApp number when a seller edits it in the dashboard (the sign-up wizard already does this).
3. Shop info fields: state/city, opening hours, delivery notes. Show them on the storefront; add a state/city filter to the shops directory (shops only, never mixed products).
4. Admin: search and filter shops, show product counts, simple platform statistics.
5. "Report this shop / product" button and an admin list of reports (new `reports` collection, rules, tests).
6. Cache storefront pages (they are rebuilt on every visit now) for speed and lower cost.
7. Zoom/lightbox on the product page gallery (the shop page viewer already exists).

**Tier 2: medium (more moving parts, still no decisions needed)**
8. DONE (30 Oct 2026): seller statistics, see section 5. Rules changed, redeploy needed.
9. DONE (31 Oct 2026): account and shop deletion, see section 5. Rules changed, redeploy needed.
10. Email verification for sellers, plus email/password sign-in as an alternative to Google.
11. Abuse protection: Firebase App Check, upload limits, rate limits on shop creation.
12. Image moderation approach for illegal or adult content (policy first, tooling second).
13. Rules tests: the owner runs `npm run test:rules` (23/23 passed). Still to do: run the newest tests (expect 39 passing), write Storage rules tests (Storage emulator is already downloaded on his machine), and add the WhatsApp number format check to the rules.
14. Recommended-products limit of 5 enforced on the server side.

**Tier 3: needs decisions or accounts**
15. Launch setup using `docs/LAUNCH.md`: buy the domain, create the live Firebase project, choose hosting (Vercel or Firebase App Hosting), fill the legal text with a lawyer.
16. Notifications (email or WhatsApp messages for approvals and orders): needs a provider choice.
17. Checkout, orders and payments (Stage B): needs Paystack or Flutterwave, Firebase Blaze plan, Cloud Functions, webhook verification, stock reduction, seller order list.
18. Subscription plans and billing: plan names, prices, limits enforced on the server.
19. Custom domains for shops, PWA install, reviews and ratings, language options (later ideas).

## 10. Starter message for a new chat
> I'm building MyStores, a multi-shop platform for Nigerians (Next.js + Firebase). I've attached the briefing, the blueprint and the project zip. Tier 1 of section 9 is finished and tested. Please read the briefing first, then start on Tier 2, item 10 (email verification and email/password sign-in), one item at a time. I'm on Windows with PowerShell, so give me exact commands, and send changed files as a zip I can unzip over the project without touching `.env.local` or `.firebaserc`. Tell me whenever the rules changed and I must redeploy.
