import type { Metadata } from "next";
import Link from "next/link";
import s from "./help.module.css";
import { CONTACT_EMAIL, CONTACT_WA_DISPLAY, CONTACT_WA_LINK, HAS_CONTACT } from "@/lib/contact";
import { IconChat } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Help",
  description: "Answers for sellers and customers: how to open a shop, add products with photos, and order on WhatsApp.",
};

type QA = { q: string; a: React.ReactNode; text: string };

const sellers: QA[] = [
  {
    q: "How do I open my shop?",
    text: "Tap Sell and sign in with Google, or with your email and a password (we email you a link to confirm it). Answer the questions one at a time: shop name, shop address, category, a short description, your WhatsApp number and a colour. Then your shop is created.",
    a: (<>
      <p>It takes a few minutes.</p>
      <ol>
        <li>Tap <Link href="/sell">Sell</Link> and sign in with Google, or create an account with your email and a password. If you use email, tap the link we send you to confirm it.</li>
        <li>Answer the questions one at a time: shop name, shop address, category, a short description, your WhatsApp number and a colour.</li>
        <li>Tap finish. Your shop is created and waits for approval.</li>
      </ol>
    </>),
  },
  {
    q: "Why does my shop say “pending”?",
    text: "Every new shop is checked by the MyStores team before it appears to the public. Until it is approved, only you can see it. You can add products while you wait.",
    a: (<>
      <p>Every new shop is checked by the MyStores team before it shows to the public. Until it is approved, only you can see it.</p>
      <p>You can add your products while you wait, so your shop is ready the moment it is approved.</p>
    </>),
  },
  {
    q: "How do I add a product?",
    text: "Open your dashboard, go to Add, choose a photo, and save. A product needs a photo or a name. Price is optional.",
    a: (<>
      <ol>
        <li>Open your <Link href="/dashboard">dashboard</Link> and go to <b>Add</b>.</li>
        <li>Choose a photo from your phone. You can also type a name, a price and a short description.</li>
        <li>Save. Choose <b>Visible</b> when you want customers to see it.</li>
      </ol>
      <p>A product needs a photo or a name. If you leave the price empty, customers see “Ask for price”.</p>
    </>),
  },
  {
    q: "Can I add many photos at once?",
    text: "Yes. Choose Many photos mode and select up to 20 photos. Each photo becomes its own product, and you can add names and prices later.",
    a: (<p>Yes. In <b>Add</b>, choose <b>Many photos</b> and select up to 20 photos. Each photo becomes its own product. You can add names and prices later by tapping Edit on a product.</p>),
  },
  {
    q: "What does “Recommend” do?",
    text: "Recommended products appear in the big sliding carousel at the top of your shop. You can recommend up to 5 products.",
    a: (<p>Recommended products appear in the big sliding carousel at the top of your shop. You can recommend up to 5. The carousel shows only when you have at least 2 recommended products that are in stock.</p>),
  },
  {
    q: "How do I change my logo, banner or colour?",
    text: "Open your dashboard, go to My shop, and change the logo, banner image or colour. Save when you are done.",
    a: (<p>Open your <Link href="/dashboard">dashboard</Link>, go to <b>My shop</b>, and change your logo, banner image or colour. Save when you are done. Your shop updates straight away.</p>),
  },
  {
    q: "How do I change my WhatsApp number?",
    text: "Go to My shop in your dashboard and edit the WhatsApp number. Use a Nigerian number, for example 0801 234 5678.",
    a: (<p>Go to <b>My shop</b> in your dashboard and edit the WhatsApp number. Use a Nigerian number, for example 0801 234 5678. Customers’ orders go to this number.</p>),
  },
  {
    q: "How do I share my shop?",
    text: "On your dashboard Home, tap the share button to send your shop link on WhatsApp, or copy it and post it on your status or social pages.",
    a: (<p>On your dashboard <b>Home</b>, use the share buttons to send your shop link on WhatsApp, or copy the link and post it on your status or social pages. Your link looks like mystores.com.ng/your-shop.</p>),
  },
  {
    q: "How do I delete my shop and account?",
    text: "Open your dashboard, go to My shop and scroll to the bottom. Tap Delete my shop, type your shop address and confirm it is you (with Google, or by typing your password). Your shop, products, photos and account are removed for good.",
    a: (<p>Open your <Link href="/dashboard">dashboard</Link>, go to <b>My shop</b> and scroll to the bottom. Tap <b>Delete my shop</b>, type your shop address and confirm it is you (with Google, or by typing your password). Your shop, products, photos and account are removed for good, and your address becomes free for others to take. This cannot be undone.</p>),
  },
  {
    q: "Does MyStores take payment from my customers?",
    text: "Not yet. Customers order on WhatsApp and you agree payment and delivery with them directly.",
    a: (<p>Not yet. Customers order on WhatsApp, and you agree payment and delivery with them directly. Online checkout may come later.</p>),
  },
];

const customers: QA[] = [
  {
    q: "How do I order?",
    text: "Open the product and tap Order on WhatsApp. A message to the seller opens with the product link already in it. Send it, then agree price, payment and delivery with the seller.",
    a: (<ol>
      <li>Open the product you like.</li>
      <li>Tap <b>Order on WhatsApp</b>. A message to the seller opens with the product link already in it.</li>
      <li>Send the message, then agree price, payment and delivery with the seller.</li>
    </ol>),
  },
  {
    q: "Do I pay on MyStores?",
    text: "No. MyStores does not take payments. You pay the seller directly, so be careful: prefer payment on delivery or a method you trust.",
    a: (<p>No. MyStores does not take payments. You deal with the seller directly. Be careful: prefer payment on delivery or a method you trust, and never send money to someone you cannot reach.</p>),
  },
  {
    q: "What does “Ask for price” mean?",
    text: "The seller has not put a price on this item. Tap Order on WhatsApp and ask them.",
    a: (<p>The seller has not put a price on this item. Tap <b>Order on WhatsApp</b> and ask them.</p>),
  },
  {
    q: "Something is wrong with a shop or a seller. What can I do?",
    text: "Contact MyStores with the shop address and what happened. We can review and suspend shops that break our rules.",
    a: (<p>Contact us using the details below. Tell us the shop address and what happened. We can review a shop and suspend it if it breaks our <Link href="/terms">terms</Link>.</p>),
  },
];

function Group({ title, items }: { title: string; items: QA[] }) {
  return (
    <section aria-label={title}>
      <h2 className={s.group}>{title}</h2>
      {items.map((x) => (
        <details key={x.q} className={s.faq}>
          <summary>{x.q}</summary>
          <div className={s.ans}>{x.a}</div>
        </details>
      ))}
    </section>
  );
}

export default function Help() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...sellers, ...customers].map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.text } })),
  };
  return (
    <main className={`wrap ${s.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1>Help</h1>
      <p className={s.lead}>Short answers for sellers and customers.</p>

      <Group title="For sellers" items={sellers} />
      <Group title="For customers" items={customers} />

      <section className={`card ${s.contact}`} aria-label="Contact us">
        <h2>Still need help?</h2>
        {HAS_CONTACT ? (
          <>
            <p>Send us a message and we will reply as soon as we can.</p>
            <div className={s.actions}>
              {CONTACT_WA_LINK && <a className="btn wa" href={CONTACT_WA_LINK} target="_blank" rel="noopener noreferrer"><IconChat size={22} /> WhatsApp {CONTACT_WA_DISPLAY}</a>}
              {CONTACT_EMAIL && <a className="btn alt" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
            </div>
          </>
        ) : (
          <p>Contact details will be shown here soon.</p>
        )}
      </section>
    </main>
  );
}
