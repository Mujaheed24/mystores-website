import type { Metadata } from "next";
import { BUSINESS_ADDRESS, BUSINESS_NAME, LEGAL_EMAIL } from "@/lib/contact";
export const metadata: Metadata = { title: "Privacy notice" };

export default function Privacy() {
  return (
    <main className="wrap legal">
      <h1>Privacy notice</h1>
      <p className="muted">Last updated: 31 October 2026</p>

      <h2>Who we are</h2>
      <p>MyStores{BUSINESS_NAME !== "MyStores" ? `, run by ${BUSINESS_NAME}` : ""}{BUSINESS_ADDRESS ? `, ${BUSINESS_ADDRESS}` : ""}. Contact: {LEGAL_EMAIL}.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Sellers:</b> your email address, and the name and profile picture from your Google account if you sign in with Google (passwords are handled by Google Firebase and are never visible to us), your shop details (name, address, description, WhatsApp number, category), and the photos and product details you upload.</li>
        <li><b>Visitors:</b> we do not ask visitors to create accounts. Our hosting and database providers may record basic technical data such as IP address and browser type to keep the service running and secure.</li>
        <li><b>Orders:</b> orders are currently arranged on WhatsApp between the customer and the seller. We do not receive those messages. WhatsApp has its own privacy terms.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>To run seller accounts and shops, show shops to visitors, keep the platform safe, review shops, and contact sellers about their account.</p>

      <h2>Who handles it for us</h2>
      <p>We use Google Firebase to sign sellers in and to store data and images. Shop names, descriptions, WhatsApp numbers and product details are shown publicly on the shop. We use Google reCAPTCHA (through Firebase App Check) to block automated abuse, which is covered by Google's own privacy policy. We do not currently use advertising or analytics services, and we will update this notice before adding any such service or a payment provider.</p>

      <h2>How long we keep it</h2>
      <p>For as long as a shop is active. When a seller deletes their shop and account, the data is removed straight away. Reports made about a shop may be kept for up to 12 months for safety reasons, or longer if the law requires.</p>

      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your personal data, and to object to certain uses. Sellers can also delete their shop and account themselves at any time in the dashboard (My shop, then Delete my shop). This removes the shop, its products, photos and statistics, and the sign-in account. Reports made about a shop may be kept for safety reasons. Contact {LEGAL_EMAIL}. You may also complain to the Nigeria Data Protection Commission.</p>

      <h2>Security</h2>
      <p>Access to each shop's data is limited to its owner and the platform administrator. No online service can promise perfect security.</p>

      <h2>Changes</h2>
      <p>We will post any update to this notice on this page.</p>
    </main>
  );
}
