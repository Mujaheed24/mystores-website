# MyStores moderation policy (first version, for the owner and lawyer to review)

This is the policy-first part of item 12. It tells sellers what is not allowed, tells you how to act on reports, and lists the tooling that can come later.

## 1. What is not allowed on MyStores
Shops and products must not contain or sell:
- Anything illegal in Nigeria: stolen goods, fake or counterfeit goods, illegal drugs, weapons and ammunition, fake documents, fake currency.
- Adult or sexual content, or any image of a child in a sexual or unsafe way. The last one is reported to the police at once.
- Scams: taking money for goods that do not exist, fake "investment" or "double your money" offers, pretending to be another shop or brand.
- Copied photos or text from another seller or brand without permission.
- Hate, threats or harassment.
These words should also appear in `/terms` (the lawyer decides the final wording).

## 2. Acting on a report (`/admin/reports`)
Check new reports at least once a day. For each report:
1. Open the shop or product and decide: **fine**, **fix**, or **remove**.
2. **Fine:** mark the report Dismissed.
3. **Fix** (small problem, seller probably did not know): suspend the shop at `/admin`, contact the seller on their WhatsApp number, explain what to change, and reactivate once it is fixed. Mark the report Reviewed.
4. **Remove** (scam, illegal, adult, child safety): suspend the shop at once. Keep a note of the date and reason. Do not reactivate. Mark the report Reviewed.
5. Child safety material: do not share or forward the images. Suspend the shop and report it to the police or the NCPC / relevant agency; ask your lawyer which body to use.

Suspending a shop hides it and all its products from visitors straight away (the rules only show shops with status `active`).

## 3. Targets to promise yourself
- Child safety, illegal items, scams: act within 24 hours.
- Everything else: within 3 days.
- Tell the seller why, once, in plain words.

## 4. Repeat offenders
Two suspensions for the same shop, or any confirmed scam: the shop stays suspended. Because one account can only own one shop, the person cannot simply open another from the same account. A new email account is still possible, so note the WhatsApp number of removed shops and refuse to approve a new shop that uses it.

## 5. Tooling for later (needs Blaze plan and Cloud Functions)
- Automatic image check on every upload with Google Cloud Vision SafeSearch: flag or hide images rated adult or violent and add a report for you.
- New shops stay `pending` until you approve them (already the case), so you see every shop before the public does. Check the logo, banner and first products before approving.
- Daily email to you listing new unreviewed reports (part of item 16, notifications).
