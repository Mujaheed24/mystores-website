import Link from "next/link";
import SlugChecker from "@/components/SlugChecker";
import { getActiveShops } from "@/lib/shops";

export const dynamic = "force-dynamic";

export default async function Home() {
  const shops = await getActiveShops().catch(() => []);
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>One platform. Every shop gets its own address.</h1>
          <p className="muted" style={{ fontSize: 18, maxWidth: "46ch" }}>
            Create a storefront in minutes. Your products, branding, customers and orders stay yours, and are never mixed into another seller’s page.
          </p>
          <SlugChecker />
        </div>
      </section>
      <h2 style={{ marginBottom: 6 }}>Browse shops</h2>
      <p className="muted" style={{ margin: "0 0 14px" }}>Pick a shop to see only its products.</p>
      <div className="grid">
        {shops.length ? shops.map((s) => (
          <Link key={s.id} href={`/${s.slug}`} className="card shopcard">
            <div className="bn" style={{ background: s.themeColor }} />
            <div className="in"><h3>{s.name}</h3><div className="muted">{s.category} · mystores.com.ng/{s.slug}</div>
              <p className="muted" style={{ margin: "8px 0 0" }}>{s.description}</p></div>
          </Link>
        )) : <p className="muted">No shops yet. Run <code>npm run seed</code> to add demo shops.</p>}
      </div>
    </main>
  );
}
