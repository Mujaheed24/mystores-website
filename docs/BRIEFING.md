# MyStores – project briefing

Last updated: 4 November 2026 (second update). Covers everything up to: the second feature round (several categories and places, custom colours, order list/cart, better search and filters, product videos, owner shortcuts), GitHub + Vercel deployment (working), the "shop not open" caching bug fix, the branded email-link page and the video switch. Owner decisions are recorded in section 11. Paste or upload this file at the start of a new chat, together with `docs/blueprint-v1.2.txt` and a zip of the project (without `node_modules`, `.next`, `.git`, `.env.local` and any key file).

## 1. What we are building
A multi-shop platform for Nigerians. Sellers create their own store at `mystores.com.ng/<shop-address>`. Each shop has its own branding, products and (later) orders, and shops never mix. Visitors browse and order from a seller on WhatsApp (Stage A). Website checkout with online payment is planned (Stage B).

- Brand: **MyStores**. Domain: `mystores.com.ng`, **bought at DomainKing** (not yet connected to Vercel). Consider also `mystores.ng`.
- Market: Nigeria. Currency: Naira (₦), whole numbers. Phone numbers stored as `+234XXXXXXXXXX`.
- Source of truth for requirements: `docs/blueprint-v1.2.txt`. Visual reference: `docs/preview.html`.

## 2. Who I am working with
Non-developer owner on **Windows with PowerShell**, project at `C:\Dev\mystores`. Needs step-by-step commands, plain explanations and exact error-message help. The service-account key lives **outside** the project in `C:\Dev\keys\` (never commit it, never paste its contents). Scripts that use it need this set in the SAME PowerShell window first: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Dev\keys\<key file name>.json"` (the variable is lost when the window closes; a typed placeholder like `<your-key>` is a common mistake).

## 3. Stack, accounts and environments
- Next.js 15 (App Router) + React 19 + TypeScript, Firebase JS SDK 11. Node 20+ (owner runs Node 24).
- Firebase project `mystores-workspace` is the **test/development project** (Firestore `(default)` in africa-south1, production mode; Storage bucket `mystores-workspace.firebasestorage.app`; confirm its region in the console). **No separate live project exists yet.**
- Auth: Google sign-in, or email + password (both must be enabled in Firebase console, Authentication, Sign-in method). Administrator = custom claim `admin: true`, set with `npm run make-admin <email>` (the account must already exist; a shop is NOT needed; sign out and in again afterwards). The owner's admin account is the Google account used on the test project.
- Config: web keys in `.env.local` (`NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, APP_ID`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_WHATSAPP`; also optional `NEXT_PUBLIC_BUSINESS_NAME`, `NEXT_PUBLIC_BUSINESS_ADDRESS`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_APPCHECK_DEBUG`) and project ID in `.firebaserc`. **Never overwrite `.env.local` or `.firebaserc` when sending zips.** Firebase web keys are public by design (safe to share); the service-account key never is.
- **GitHub:** private repo `mystores` (branch `main`), first push done (commit "MyStores first version", later "Clearer Google sign-in errors" and more). `.gitignore` blocks `.env.local`. Recommended extra lines (confirm added): `firestore-debug.log`, `ui-debug.log`, `*-firebase-adminsdk-*.json`, `*.pem`.
- **Hosting: Vercel** (connected to the GitHub repo; every `git push` redeploys). The site is **working**: Google sign-in and email sign-in both work on the Vercel address, the owner approved the shop in `/admin`. Environment variables (`NEXT_PUBLIC_*`, marked safe because they are public) were added in Vercel; the owner said they are set for **"Development"**. **Verify they are ticked for Production and Preview as well** (variables only apply to the environments ticked, and only after a new deployment). Optional switch: `NEXT_PUBLIC_ENABLE_VIDEO=true` turns on video upload (default off).
- Still to do: separate live Firebase project (agreed, suggested ID `mystores-live`, fallbacks `mystores-live-ng` or `mystores-prod`; project IDs are globally unique), connect `mystores.com.ng` (add the domain in Vercel, add the A record and `www` CNAME that Vercel shows in DomainKing's DNS page, remove parking records, then add both names to Firebase Authorized domains), mailbox `help@mystores.com.ng`, payment provider, Cloud Functions, Blaze plan.

## 4. How we deliver code
Claude builds in a sandbox, runs `tsc` and `next build`, then sends a **zip of the changed files** (`mystores-update.zip`; recent zips contain every file changed since the earlier uploaded copy, so unzipping one over the project is safe). The owner unzips over `C:\Dev\mystores`, then pushes: `git add .`, `git commit -m "..."`, `git push` (Vercel redeploys by itself; check Deployments shows **Ready**; old preview links keep old code). If `firestore.rules` or `storage.rules` changed, redeploy them: `npx firebase-tools deploy --only firestore:rules,storage`. Do this for the test project; the live project will need its own deploy with `--project`.

Claude's sandbox has Java but cannot download the Firestore/Storage emulators and has **no browser**, so visual and rules tests are done by the owner: `npm run test:rules` (starts both emulators; Node 24 compatible). Expected count now: **47 rules + 11 storage = 58 passing**. The owner reports **all tests passed** (before the latest small changes; exact number not given). Harmless "Property admin is undefined" lines are normal. Everything built in the second feature round was type-checked and built but **not seen in a browser by Claude**; the owner should test it (section 8).

Tips for Claude: when zipping paths containing `[shop]` use `zip -nw` or `zip -@`; keep `.env.local`, keys and `.git` out of zips. Screen recordings can be inspected with `ffmpeg` (extract frames, view contact sheets); this found three real bugs from one video.

## 5. What is built (all routes and features)
**Public**
- `/` landing page: address checker, directory of active shops with search (name, categories, places, description; forgiving spelling) and a state filter that matches any of a shop's places.
- `/[shop]` storefront: 2-second branded entry banner (skippable; long names break between whole words, font size is computed from the longest word, letters start within 0.7 s so the whole name is always visible), stacked 3D "Recommended" carousel (up to **10** in-stock featured products), then "All products": search, **category dropdown with counts** (case-insensitive, uncategorised grouped as "Other items"), a **Filters** panel (sort newest/price/name, price range, in-stock only), result count with "Clear all". Search bar is sticky only on screens 720px+, solid background, `top:0`. Only the first 8 cards fade in (`Reveal instant`), the rest show at once. Shop shows several category pills and several places.
- `/[shop]/p/[productId]`: gallery (**video first** when the product has one, thumbnails with ▶), zoom viewer for photos, Order on WhatsApp bar, **+ Add to order**.
- **Order list (cart)** (`src/components/Cart.tsx`): customers add products, set quantities (capped by stock and 99, max 20 lines) and send ONE prefilled WhatsApp message with the list, per-line product links (when 6 or fewer lines) and total. Stored in the customer's browser (`localStorage` key `ms-cart:{shopId}`), no payment, no server. Floating "🛒 Your order" button. Not an online checkout (that is Stage B).
- **Owner bar** (`OwnerBar`, only visible to the shop's owner on their own storefront and product pages): "← Dashboard", "⚙ Shop settings", and on a product page "✏ Edit this product" → `/dashboard?tab=Form&edit=<id>&back=/<shop>/p/<id>` (opens that product's form; after save or cancel returns to the product page; `back` only accepts a plain path on the site). Platform admins who do not own the shop do not get it (rules let only the owner change products).
- `/terms`, `/privacy` (draft legal text, lawyer must review), `/help` (FAQ, contact card), share previews, sitemap, robots, favicon, PWA install.
- Report buttons (shop and product) with client cooldown; admin list at `/admin/reports`.
- Light/dark toggle (`ms-theme`).

**Seller (`/sell`, `/dashboard`)**
- Wizard: name, address (live check), **what you sell (several, up to 5)**, description, WhatsApp number, **colour (presets or any custom colour; very light colours refused because the shop name is white)**. Google or email sign-in with a visible "Signing you in…" state; the sell page checks for an existing shop first (no flash of the wizard).
- Dashboard shows as soon as the shop is known; products and statistics fill in after (skeleton shown). Header buttons: "👁 View my shop" and "⚙ Shop settings". `?tab=Home|Products|Form|Profile` opens a tab.
- Home: share link, statistics, checklist (**disappears when every item is done**), top products. Products list with optimistic toggles (visible, recommend, delete update at once). Add: one product (photos up to 6, **one optional video**, name, price, **category dropdown** with "+ New category…", stock, status, recommend) or many photos at once (3 uploads at a time).
- **Shop settings** (`src/components/dash/Profile.tsx`) in four sections: About, What you sell (chips, up to 5), Where customers find you (state, city, **up to 4 extra places**, hours, delivery), How your shop looks (logo and banner pickers with previews, colour picker, live preview). Sticky save bar. Plus "Delete my shop and account".
- Pending/suspended shops see a note with **"Contact MyStores on WhatsApp / email"** buttons (prefilled with shop name and link).
- Loading feedback: any button with `aria-busy="true"` shows a spinner (CSS in `globals.css`); Google sign-in shows "Choose your Google account…" then "Signing you in…" (`signingIn` in `src/lib/auth.tsx`).

**Product video (one per product) — upload currently switched OFF by default** (`NEXT_PUBLIC_ENABLE_VIDEO` must be `"true"` to show the uploader; products that already have a video still play and can be edited; the Storage rules still accept videos, the switch is UI-only). The owner has not tried video upload and is leaning towards not allowing videos for now (not confirmed).
- Limits: MP4, WebM or MOV, under **40 MB** and **60 seconds** (checked in the browser by `inspectVideo` in `src/lib/images.ts`, and size/type in `storage.rules` `okVideo()`; **keep both in sync**). Not re-encoded: sellers must record small (720p). iPhone HEVC clips may not play on some Android/Windows browsers (advise "Most Compatible"). A still frame is made as the cover (`videoPoster`); with no photo, the cover becomes the product's first photo.
- Product fields `videoUrl`, `videoPoster` (strings up to 800 chars or null). Files live in `shops/{shopId}/products/{productId}/` and are deleted with the product, on replace/remove, and with the shop (folder delete). Videos are for products only (not branding). Cost warning: video storage and bandwidth are much bigger than photos; keep the billing alert on and plan for a paid plan.

**Email links page** (`src/app/auth/action/page.tsx`): a branded page for the link in Firebase emails: email confirmed (animated tick, "Continue to open my shop"), choose a new password, undo an email change, and friendly errors (expired/used link). It only takes effect after the owner sets it in Firebase console, Authentication, Templates, pencil icon, **Customize action URL** = `https://<site>/auth/action` (use the Vercel address now, `https://mystores.com.ng/auth/action` later; the domain must be in Authorized domains; do it in each Firebase project). The link inside the email stays long: Firebase puts a one-time code in it and plain-text templates cannot hide it; shortening needs custom-sent emails (Cloud Functions + an email service, later). Template wording can be edited in the same console screen.

**Admin (`/admin`)**: approve, suspend, reactivate, delete shops; stats, search, filters, product counts, "WhatsApp seller" buttons, reports.

**Search** (`src/lib/search.ts`, `searchScore`): ignores capitals/accents, every typed word must match (start of a word, inside a word, or one small typo for words of 4+ letters), name ranks above category above description. Not semantic ("shoes" will not find "sandals").

**Statistics, deletion, email sign-in, App Check code, moderation policy, WhatsApp number format, caching (60 s `unstable_cache`), speed pass (Firebase split `firebaseApp.ts` / `firebase.ts`; public-page components must NOT import `firebase.ts`)**: all as built earlier; details in `CLAUDE.md` and the code comments.

**Images**: new uploads are sharper: product full copy 1600 px (WebP quality 0.86), thumbnail 800 px (0.82), logo up to 800 px, banner up to 2000 px, one-year cache header. Photos uploaded before this change keep the old quality (re-upload to improve). Photos upload in parallel; logo and banner together.
- **Recommended sizes to tell sellers:** logo 800 × 800 square (centre the design, shown as a small circle); banner 1600 × 600 wide (cropped differently on phone vs desktop, keep key content near the centre); product photos at least 1200 × 1200, up to 6; JPG/PNG/WebP up to 15 MB (browser compresses).

**Design system and gotchas**: Plus Jakarta Sans, 18px base text, 44px+ tap targets, tokens at the top of `src/app/globals.css`, each shop sets `--sa`. Never put a `transform`/`filter`/`will-change` animation on `.wrap` or an ancestor of `position: fixed` elements. `.chip[aria-pressed="true"]` uses `--sa` (shop colour). `.ownerbar` is `position: relative` on purpose (a sticky one fought the sticky search bar).

**Lists that must stay in sync between code and rules**: reserved addresses (`src/lib/slug.ts` and `firestore.rules`); states (`NG_STATES` and `validExtras`); report reasons (`src/lib/reports.ts` and `validReport`); `MAX_CATEGORIES` (5) and `MAX_EXTRA_PLACES` (4) in `src/lib/options.ts` and `validExtras`; video limits (`MAX_VIDEO_MB`/`MAX_VIDEO_SECONDS` in `images.ts` and `okVideo()`); `themeColor` must be `#rrggbb`. `MAX_FEATURED` (10) is enforced in the UI only (rules cannot count other documents; true enforcement needs a Cloud Function).

## 6. Data model (Firestore and Storage)
- `slugs/{slug}`: `{ shopId, ownerUid }`. `owners/{uid}`: `{ shopId }`.
- `shops/{shopId}`: `ownerUid, name, slug, category` (first of `categories`, kept for older code), `categories[]` (≤5), `description, themeColor` (`#rrggbb`), `whatsappNumber, logoUrl?, bannerUrl?, state?, city?, locations[]` (extra places `{state, city}`, ≤4; the main place stays in `state`/`city`), `openingHours?, deliveryNotes?, status (pending|active|suspended), subscriptionPlan, createdAt, updatedAt`. Older shops only have `category`; code falls back through `shopCategories()` and `shopPlaces()` in `options.ts`.
- `shops/{shopId}/products/{productId}`: `shopId, sellerUid, name, description, category, price (int or null), stockQuantity, status, featured, emoji, imageUrls[] (≤6), thumbUrl?, videoUrl?, videoPoster?, createdAt, updatedAt`. A product needs a name OR a photo (a video's cover can serve as the photo).
- `shops/{shopId}/stats/{productId|_shop}`: `{views, taps, updatedAt}`. `reports/{reportId}`. `shops/{shopId}/orders/{orderId}`: rules exist, no code yet.
- Storage: `shops/{shopId}/products/{productId}/...` (images under 5 MB, videos under 40 MB) and `shops/{shopId}/branding/...` (images only). Owner-only writes (verified email), public reads.

## 7. Non-negotiable rules for any new code
1. Never build an "all products from all shops" query or page. Every product query is scoped to one shop ID.
2. Security lives in `firestore.rules` and `storage.rules`, not only in the UI. Every data feature needs a rules change **and** a test.
3. Sellers cannot change `ownerUid`, `slug`, `status` or `subscriptionPlan`. Only the administrator changes status.
4. Orders are created by trusted server code only; payments verified server-side; no secrets in frontend code.
5. Public visitors see only `active` shops and `published` products.
6. Accessibility and mobile first: 44px touch targets, labels, visible focus, reduced-motion respected.

## 8. Open items, in priority order
**A. Vercel site (mostly done)**
1. DONE: variables added, site working, sign-in works. TO CHECK: variables are ticked for Production, Preview and Development; `NEXT_PUBLIC_SITE_URL` is the Vercel address for now and becomes `https://mystores.com.ng` after the domain works.
2. DONE: Vercel address is in Authorized domains (Google sign-in only works on listed domains). Add the real domain names later. Sign-in errors now show the real reason.
3. DONE: shop approved at `/admin`. (New shops are **pending** until approved; the homepage lists only active shops.)
3b. **Bug fixed, needs the owner's retest:** after editing a banner the homepage still showed the shop, but clicking it said "This shop is not open" (Firestore and `/admin` showed it active); it worked after refreshing minutes later. Cause: public pages cache lookups in `src/lib/cached.ts` and a "not found" answer was being cached (stale-while-revalidate kept serving it). Fix: "not found" and empty lists are now never cached (a miss is thrown inside `unstable_cache`, which does not store errors, and converted back to null/[] outside). The homepage also keeps the last good shop list in memory and shows "We could not load the shops just now" instead of an empty page on a failed read. Test: `node scripts/check-site.mjs https://<site>` (opens every shop on the homepage and in the sitemap; exit code 2 and a list if any shows "not open"). Run it after every deployment and right after editing a shop; also test by changing a banner, then immediately clicking the shop from the homepage on another device. If it still happens, next steps: shorten or remove the 60 s cache for shop pages, and call `revalidateTag("shops")` after a seller saves (needs a small authenticated API route).
4. Rules deployment and tests: the owner reports tests passed; confirm the rules were deployed after the video/category changes (`npx firebase-tools deploy --only firestore:rules,storage`).

**B. Test on a phone/browser (built, not seen by Claude)**: the order list; product videos (also a video over 60 s and one over 40 MB to check the messages); the filters panel and both category dropdowns; "Edit this product" and return; settings page layout; custom colour; several categories and places; the long-name splash (try 40+ characters and one very long word); sign-in feel (the 5 s in Google's popup cannot be fixed by code; `npm run dev` also compiles pages on first visit, so test speed on the deployed site); shop and account deletion with throwaway accounts; email sign-up and reset.

**C. Before real launch**
0. Set the Firebase email action URL to the new `/auth/action` page (see "Email links page") and edit the template wording (subject like "Confirm your email for MyStores").
1. Create the **live Firebase project** (Firestore and Storage in africa-south1, Google + Email/Password, account linking "same email", rules deployed with `--project`, its own service-account key, billing alert) and put its values in Vercel; keep `mystores-workspace` for testing.
2. Connect `mystores.com.ng` in Vercel (A record and `www` CNAME as Vercel shows them; remove old/parking records; wait for HTTPS), add both names to Firebase Authorized domains, restrict the web API key to the domain, set `NEXT_PUBLIC_SITE_URL`.
3. Mailbox `help@mystores.com.ng` (the registrar is DomainKing; check whether it offers email hosting, or use another mail host and add its MX/SPF/DKIM records); switch `NEXT_PUBLIC_CONTACT_EMAIL`; customise Firebase verification/reset email templates (sender name "MyStores", custom sender/action domain) in both projects.
4. App Check: register reCAPTCHA v3, set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, watch the verified percentage, then Enforce (never set `NEXT_PUBLIC_APPCHECK_DEBUG` on the host).
5. Make the owner admin on the live project; set `NEXT_PUBLIC_BUSINESS_NAME` and `NEXT_PUBLIC_BUSINESS_ADDRESS` (owner asked for a business-name suggestion: use the trading name "MyStores"; a registered company name such as "MyStores Nigeria" is only a suggestion, availability at CAC is unchecked, and the address must be the owner's real one); Nigerian lawyer reviews `/terms`, `/privacy`, `docs/MODERATION.md`.
6. Confirm Vercel's current plan terms allow a business site. Video is off by default, so the cost question is postponed.
7. Full live test (second Google account, phone), submit `sitemap.xml` to Google Search Console, plan Firestore exports/backups.
8. Clear test data with `node scripts/reset-test-data.mjs <bucket> [--auth]` (see below) before launching on any project that held test shops.

**D. Later**: Stage B checkout and payments (Paystack or Flutterwave, Blaze, Cloud Functions, webhook verification, stock reduction, seller order list; shop deletion must then also handle orders; recommended-limit enforcement); subscription plans (deferred by the owner until about 50 customers); custom shop domains; reviews and ratings (after moderation); more languages; automatic image moderation (needs Blaze + Cloud Functions); email or automatic WhatsApp notifications.

## 9. Scripts (run from `C:\Dev\mystores` in PowerShell, key variable set first)
- `npm run make-admin <email>`: give the admin claim (account must exist).
- `node scripts/delete-user.mjs <email>`: remove one sign-in account.
- `node scripts/reset-test-data.mjs <storage-bucket> [--auth]`: wipes ALL shops (with products, stats, orders), slugs, owners, reports and photos under `shops/`; with `--auth` also non-admin sign-in accounts (admins are kept; make yourself admin first). It refuses any project other than `mystores-workspace`, shows counts and needs you to type the project name. It must never be pointed at the live project (it refuses by design).
- `node scripts/fix-photo-cache.mjs <bucket>`: one-year cache header on old photos. `node scripts/backfill-owners.mjs`: historic.
- `docs/LAUNCH.md` holds the launch checklist; a fuller checklist (12 parts, including cleanup and domain steps) was made as a document in the chat.

## 10. Scripts note
`node scripts/check-site.mjs <site address>` checks every shop and sitemap address on a live site (see 8 A, item 3b).

## 11. Owner decisions (4 November 2026)
- Domain `mystores.com.ng` is bought at DomainKing. **Priority: launch with the domain first.** Add features and payment integrations later, when customers exist.
- Use a **separate live Firebase project** (any project name is fine for the owner; suggested `mystores-live`). Keep `mystores-workspace` for testing.
- "What you sell" in shop settings stays as buttons (up to 5); no dropdown.
- Videos: not allowed for now (switch off by default, not final). Cost of storage is postponed.
- Business name for legal pages: owner asked Claude to suggest one (see 8 C item 5); the owner must confirm the real registered name and address.
- Google sign-in and email sign-in work. All tests passed. Video upload untested.
- Open question for the owner: which Vercel environments (Production, Preview, Development) have the variables.

## 12. Starter message for a new chat
> I'm building MyStores, a multi-shop platform for Nigerians (Next.js + Firebase, deployed on Vercel from GitHub). I've attached the briefing, the blueprint and the project zip. Please read the briefing first, then help me with section 8: first re-test the "shop not open" fix, then set up the branded email links, then connect the domain mystores.com.ng (bought at DomainKing) and create the live Firebase project, one item at a time. I'm on Windows with PowerShell, so give exact commands, and send changed files as a zip I can unzip over the project without touching `.env.local` or `.firebaserc`. Tell me whenever the rules changed and I must redeploy.
