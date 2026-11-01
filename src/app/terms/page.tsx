import type { Metadata } from "next";
import { LEGAL_EMAIL } from "@/lib/contact";
export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <main className="wrap legal">
      <h1>Terms of use</h1>
      <p className="muted">Last updated: 31 October 2026</p>

      <h2>1. What MyStores is</h2>
      <p>MyStores lets businesses open an online store at their own web address. Each shop is run by an independent seller. MyStores provides the platform and is not the seller of the goods. Customers usually place orders by contacting the seller directly, for example on WhatsApp. Any sale is an agreement between the customer and the seller.</p>

      <h2>2. Seller accounts</h2>
      <ul>
        <li>You must give accurate shop and contact details and keep your account secure.</li>
        <li>You may run one shop per account.</li>
        <li>New shops are reviewed. We may approve, refuse, suspend or remove a shop that breaks these terms or the law.</li>
      </ul>

      <h2>3. What you may sell</h2>
      <p>You may sell only lawful goods that you have the right to sell. You must not list illegal drugs, weapons or ammunition, stolen or counterfeit goods, adult content, items that promote violence or hatred, or anything else that is unlawful in Nigeria. Product descriptions, prices and photos must be truthful.</p>

      <h2>4. Your content</h2>
      <p>You keep ownership of your photos, text and logos. You give MyStores permission to store and display them as part of running your shop and the platform. You promise you have the right to use everything you upload.</p>

      <h2>5. Orders, payments and delivery</h2>
      <p>Sellers are responsible for prices, stock, delivery, refunds and after-sales service. MyStores does not hold or guarantee payments made outside the platform. Take care when paying anyone, and prefer payment on delivery or a trusted method.</p>

      <h2>6. Fees</h2>
      <p>Basic use may be free. We may introduce paid plans later. We will tell sellers well before any charge starts, and no seller is charged unless they agree to a plan.</p>

      <h2>7. Suspension and removal</h2>
      <p>We may suspend or remove shops or products that break these terms, receive credible complaints, or put customers at risk. A suspended shop is hidden from visitors.</p>

      <h2>8. Liability</h2>
      <p>The platform is provided as it is. To the extent the law allows, MyStores is not liable for the actions of sellers or customers, or for losses from using the platform.</p>

      <h2>9. Changes and contact</h2>
      <p>We may update these terms and will post the new version here. Questions: {LEGAL_EMAIL}.</p>
    </main>
  );
}
