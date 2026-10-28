# MyStores – project notes

Nigerian multi-shop platform: one site, many independent shops at mystores.com.ng/<shop>. Prices in Naira (₦).

## Non-negotiable rules
- Never build an "all products from all shops" query or page. Every product query is scoped to one shop ID.
- Security is enforced in firestore.rules / storage.rules, never only in the UI. Any new feature that touches data needs a rules change AND a test in tests/rules.test.mjs.
- Shop address (slug) = document ID in `slugs/`. Create the shop and slug in one batch (src/lib/createShop.ts).
- Orders are created by server code only. Payments are verified server-side. No secrets in frontend code.
- Keep the reserved-address list in sync: src/lib/slug.ts and firestore.rules.

## Commands
npm run dev | npm run build | npm run seed | npm run test:rules

## Docs
docs/ holds the blueprint (what to build) and the clickable preview (how it should look).
