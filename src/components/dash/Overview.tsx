"use client";
import { useEffect, useState } from "react";
import { IconCheck, IconChat, IconCopy } from "../Icons";
import type { Tab } from "./BottomNav";
import { SHOP_STAT, type StatMap } from "@/lib/stats";
import type { Product, Shop } from "@/lib/types";

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 800); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v}</>;
}

export default function Overview({ shop, products, stats, go }: { shop: Shop; products: Product[]; stats: StatMap; go: (t: Tab) => void }) {
  const [origin, setOrigin] = useState(""), [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/${shop.slug}`, shown = origin ? url.replace(/^https?:\/\//, "") : `mystores.com.ng/${shop.slug}`;
  const live = products.filter((p) => p.status === "published").length, rec = products.filter((p) => p.featured).length, sold = products.filter((p) => p.stockQuantity === 0).length;
  const visits = stats[SHOP_STAT]?.views ?? 0;
  const pViews = products.reduce((n, p) => n + (stats[p.id]?.views ?? 0), 0);
  const taps = Object.values(stats).reduce((n, s) => n + s.taps, 0);
  const top = products.map((p) => ({ p, v: stats[p.id]?.views ?? 0, t: stats[p.id]?.taps ?? 0 })).filter((x) => x.v + x.t > 0).sort((a, b) => b.v + b.t * 3 - (a.v + a.t * 3)).slice(0, 5);
  const checks: { t: string; done: boolean; tab: Tab }[] = [
    { t: "Add your logo", done: !!shop.logoUrl, tab: "Profile" },
    { t: "Add a banner photo", done: !!shop.bannerUrl, tab: "Profile" },
    { t: "Add your state, opening hours and delivery info", done: !!shop.state && !!shop.openingHours?.trim() && !!shop.deliveryNotes?.trim(), tab: "Profile" },
    { t: "Add at least 3 products", done: products.length >= 3, tab: "Form" },
    { t: "Put a photo on every product", done: products.length > 0 && products.every((p) => p.imageUrls.length > 0), tab: "Products" },
  ];
  const done = checks.filter((c) => c.done).length, pct = Math.round((done / checks.length) * 100);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ } };
  return (
    <>
      <section className="card share">
        <h3>Share your shop</h3><p>Send your link to customers and they can order on WhatsApp.</p>
        <span className="link">{shown}</span>
        <div className="row">
          <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(`Visit my shop on MyStores: ${url}`)}`}><IconChat /> Send on WhatsApp</a>
          <button className="btn alt" onClick={copy}>{copied ? <><IconCheck /> Copied</> : <><IconCopy /> Copy link</>}</button>
        </div>
      </section>
      <div className="tiles">
        {([["Products", products.length], ["Visible", live], ["Recommended", rec], ["Sold out", sold]] as [string, number][]).map(([l, n]) => <div className="card tile" key={l}><b><CountUp to={n} /></b><span>{l}</span></div>)}
      </div>
      <section className="card">
        <h3>Your visitors</h3><p className="muted" style={{ margin: "4px 0 14px" }}>Counted since this feature started. Your own visits are not counted.</p>
        <div className="tiles t3">
          {([["Shop visits", visits], ["Product views", pViews], ["WhatsApp taps", taps]] as [string, number][]).map(([l, n]) => <div className="card tile" key={l}><b><CountUp to={n} /></b><span>{l}</span></div>)}
        </div>
        {top.length > 0 ? (
          <>
            <h3 style={{ marginTop: 22 }}>Most popular products</h3>
            {top.map(({ p, v, t }) => (
              <div className="toprow-s" key={p.id}>
                <div className="tn">{p.imageUrls[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumbUrl || p.imageUrls[0]} alt="" loading="lazy" decoding="async" /> : p.emoji}</div>
                <div><b>{p.name || "Photo only"}</b><div className="muted">👁 {v} views · 💬 {t} taps</div></div>
              </div>
            ))}
          </>
        ) : <p className="muted" style={{ marginTop: 16 }}>No visits yet. Share your link and the numbers will appear here.</p>}
      </section>
      {done < checks.length && <section className="card">
        <h3>Get your shop ready</h3><p className="muted" style={{ margin: "4px 0 14px" }}>{done} of {checks.length} done</p>
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
        {checks.map((c) => <button key={c.t} className={`check-i${c.done ? " done" : ""}`} onClick={() => go(c.tab)}><span className="c">{c.done && <IconCheck size={18} />}</span><span>{c.t}</span></button>)}
      </section>}
      <p className="muted" style={{ marginTop: 18, fontSize: 16 }}>Orders arrive on your WhatsApp. Website checkout is coming later.</p>
    </>
  );
}
