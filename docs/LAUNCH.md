# MyStores – launch plan

Work through this in order. Nothing here needs payment code, so it can be done before checkout is built.

## 1. Domain
1. Buy `mystores.com.ng` (and `mystores.ng` if free) from a Nigerian-accredited registrar. Check the registrar's current prices and terms.
2. Check the CAC business-names register and the trademark registry for "MyStores" conflicts before spending money on branding.
3. Claim matching handles on Instagram, X and Facebook.

## 2. Separate production Firebase project
Keep `mystores-workspace` for development. Create a second project (for example `mystores-live`) so test data never mixes with real sellers.
1. Create the project, turn on Firestore (**africa-south1**, production mode), Storage, Google sign-in and Email/Password sign-in.
2. Add your live domain under Authentication, Settings, Authorized domains.
3. Deploy the rules: `npx firebase-tools deploy --only firestore:rules,storage --project mystores-live`
4. Create your own account at `/sell` on the live site once, then run `npm run make-admin` against the live project to make yourself administrator.
5. Restrict the web API key to your domain in Google Cloud console, under APIs and Services, Credentials.
6. Set a billing budget alert in Google Cloud so a surprise bill cannot build up unnoticed.
7. **Turn on App Check** (stops bots flooding reports, view counters and uploads):
   1. Go to https://www.google.com/recaptcha/admin and create a **reCAPTCHA v3** site for your live domain (add `localhost` to the test project's site). Copy the **site key** and the **secret key**.
   2. Firebase console, App Check, Apps: register your web app, choose reCAPTCHA v3 and paste the **secret key**.
   3. Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site key>` in `.env.local` and on the host. Deploy.
   4. Wait a day, open App Check, APIs, and look at the verified-request percentage for Cloud Firestore and Cloud Storage. When almost all requests are verified, click **Enforce** on both.
   5. For local testing after enforcing, set `NEXT_PUBLIC_APPCHECK_DEBUG=true`, open the site once, copy the debug token printed in the browser console and add it under App Check, Apps, Manage debug tokens. Never set this on the live host.
8. **Fix the email templates** (Authentication, Templates): verification email and password reset. Set sender name "MyStores", a short clear subject, friendly wording, and (once you own the domain) a custom sender address and action URL on your domain so the emails are not marked as spam. Do this in each project.

### Domain checklist (after you buy mystores.com.ng)
1. Create the mailbox **help@mystores.com.ng** with your registrar or an email host (the legal pages and footer already show this address as the default). Make sure you can send and receive from it.
2. Set these on the host and in `.env.local`: `NEXT_PUBLIC_SITE_URL=https://mystores.com.ng`, `NEXT_PUBLIC_CONTACT_EMAIL=help@mystores.com.ng`, `NEXT_PUBLIC_CONTACT_WHATSAPP=<your help number>`, `NEXT_PUBLIC_BUSINESS_NAME=<your registered business name>`, `NEXT_PUBLIC_BUSINESS_ADDRESS=<your address>`.
3. Firebase, Authentication, Settings, **User account linking**: choose "Link accounts that use the same email". Then a seller who used Google and later signs in with the same email does not get a second account.
4. Firebase console, Storage: confirm the bucket location is **africa-south1** (shown at the top of the Files tab). It cannot be changed later.
5. Send the Firebase email templates from your domain (see step 8 above).

## 3. Hosting (decision needed)
Two common routes for a Next.js site. Check the current pricing and terms of each before choosing.
- **Vercel:** simplest for Next.js. Their free tier is meant for non-commercial projects, so a business site normally needs a paid plan.
- **Firebase App Hosting:** keeps everything in Firebase. It needs the Blaze (pay-as-you-go) plan, which you will need anyway for Cloud Functions in the checkout phase.

Whichever you choose, set these environment variables on the host (same names as `.env.local`): the five `NEXT_PUBLIC_FIREBASE_*` values for the **live** project, plus `NEXT_PUBLIC_SITE_URL=https://mystores.com.ng`. Then connect the domain in the host's dashboard and follow its DNS instructions.

## 4. Before the first real seller
- [ ] Lawyer reviews `/terms` and `/privacy`, and the bracketed gaps are filled in
- [ ] A contact email exists and is written into both pages
- [ ] Remove demo shops (or never seed them in the live project)
- [ ] Test the full seller flow on the live site with a second Google account: sign up, create shop, add product with photos, approve at `/admin`, view the storefront on a phone
- [ ] Share a shop link in WhatsApp and check the preview card shows the shop name and image
- [ ] Submit `https://mystores.com.ng/sitemap.xml` in Google Search Console
- [ ] App Check is **enforced** for Firestore and Storage (section 2, step 7)
- [ ] Email templates are customised (section 2, step 8)
- [ ] Moderation policy in `docs/MODERATION.md` is read, and a person is named to check `/admin/reports` every day
- [ ] Run `npm run test:rules` on a machine with Java and `firebase-tools` and make sure every test passes
- [ ] Decide how sellers contact you for help (email or a WhatsApp number) and add a Help page
