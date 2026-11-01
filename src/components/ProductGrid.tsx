"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddToCart } from "./Cart";
import ExpandButton from "./ExpandButton";
import { IconSearch } from "./Icons";
import ProductImage from "./ProductImage";
import Reveal from "./Reveal";
import { norm, searchScore } from "@/lib/search";
import { naira, priceLabel, type Product } from "@/lib/types";

const OTHER = "Other items";
type Sort = "new" | "lo" | "hi" | "az";
const catKey = (p: Product) => (p.category.trim() ? norm(p.category) : "");

// Image-first cards: the photo does the talking. Name and price are optional.
// Customers can search, pick a category, show only what is in stock, set a price range and sort.
export default function ProductGrid({ slug, shopName, whatsapp, products }: { slug: string; shopName: string; whatsapp: string; products: Product[] }) {
  const [q, setQ] = useState(""), [cat, setCat] = useState("all"), [sort, setSort] = useState<Sort>("new");
  const [stockOnly, setStockOnly] = useState(false), [min, setMin] = useState(""), [max, setMax] = useState(""), [panel, setPanel] = useState(false);

  // Categories: "Fashion" and "fashion " count as one. Items without a category are grouped as "Other items". Biggest groups first.
  const cats = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    for (const p of products) { const k = catKey(p) || "_other"; const e = m.get(k); if (e) e.n++; else m.set(k, { label: p.category.trim() || OTHER, n: 1 }); }
    return Array.from(m, ([key, v]) => ({ key, ...v })).sort((a, b) => (a.key === "_other" ? 1 : b.key === "_other" ? -1 : b.n - a.n || a.label.localeCompare(b.label)));
  }, [products]);
  const prices = products.map((p) => p.price).filter((x): x is number => x !== null);
  const lo = min.trim() === "" ? null : Number(min.replace(/[,\s₦]/g, "")), hi = max.trim() === "" ? null : Number(max.replace(/[,\s₦]/g, ""));
  const filtersOn = (stockOnly ? 1 : 0) + (lo !== null || hi !== null ? 1 : 0), anyOn = filtersOn > 0 || cat !== "all" || q.trim() !== "";

  const list = useMemo(() => {
    const scored = products
      .filter((p) => cat === "all" || (catKey(p) || "_other") === cat)
      .filter((p) => !stockOnly || p.stockQuantity > 0)
      .filter((p) => (lo === null || (p.price !== null && p.price >= lo)) && (hi === null || (p.price !== null && p.price <= hi)))
      .map((p) => ({ p, s: searchScore(q, [p.name, p.category, p.description]) })).filter((x) => x.s > 0);
    if (q.trim() && sort === "new") scored.sort((a, b) => b.s - a.s); // best match first when searching
    const l = scored.map((x) => x.p), val = (p: Product, d: number) => (p.price === null ? d : p.price);
    if (sort === "lo") l.sort((a, b) => val(a, Infinity) - val(b, Infinity));
    if (sort === "hi") l.sort((a, b) => val(b, -1) - val(a, -1));
    if (sort === "az") l.sort((a, b) => (a.name || "￿").localeCompare(b.name || "￿"));
    return l;
  }, [products, q, cat, sort, stockOnly, lo, hi]);
  const clear = () => { setQ(""); setCat("all"); setStockOnly(false); setMin(""); setMax(""); };

  return (
    <section className="sec2" id="products">
      <h2>{products.some((p) => p.name) ? "All products" : "Our collection"}</h2>
      {products.length > 3 && (
        <div className="bar">
          <div className="sbox">
            <div><IconSearch size={22} /><input aria-label="Search this shop" placeholder="Search products" type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button type="button" className={`fbtn${filtersOn ? " on" : ""}`} aria-expanded={panel} aria-controls="filters" onClick={() => setPanel(!panel)}>⚙ Filters{filtersOn ? <b>{filtersOn}</b> : null}</button>
          </div>
          {cats.length > 1 && (
            <div className="chips" role="group" aria-label="Categories">
              <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>All <span className="cn">{products.length}</span></button>
              {cats.map((c) => <button key={c.key} className="chip" aria-pressed={cat === c.key} onClick={() => setCat(cat === c.key ? "all" : c.key)}>{c.label} <span className="cn">{c.n}</span></button>)}
            </div>
          )}
          {panel && (
            <div className="fpanel" id="filters">
              <label>Sort by<select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="new">Newest first</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option><option value="az">Name: A to Z</option></select></label>
              {prices.length > 0 && <div className="lab">Price (₦)
                <div className="two"><input aria-label="Lowest price" inputMode="numeric" placeholder={`From ${naira(Math.min(...prices))}`} value={min} onChange={(e) => setMin(e.target.value)} />
                  <input aria-label="Highest price" inputMode="numeric" placeholder={`To ${naira(Math.max(...prices))}`} value={max} onChange={(e) => setMax(e.target.value)} /></div></div>}
              <label className="check"><input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} /><span>Only show items in stock</span></label>
            </div>
          )}
          <div className="rcount" aria-live="polite">{anyOn ? `${list.length} of ${products.length} products` : `${products.length} products`}{anyOn && <button type="button" className="linkbtn" onClick={clear}>Clear all</button>}</div>
        </div>
      )}
      {list.length ? (
        <div className="pgrid">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70} instant={i >= 8}>
              <div className="pcard">
                <Link className="pclink" href={`/${slug}/p/${p.id}`} aria-label={p.name || "View photo"}>
                  <div className="ph"><ProductImage p={p} />
                    {p.stockQuantity === 0 ? <span className="badge sold">Sold out</span> : p.featured && <span className="badge">★ Pick</span>}
                    <span className="ptag">{priceLabel(p.price)}</span></div>
                  {p.name && <div className="pin"><div className="pname">{p.name}</div></div>}
                </Link>
                <ExpandButton p={p} slug={slug} shopName={shopName} whatsapp={whatsapp} />
                <div className="padd"><AddToCart p={p} className="btn alt sm" /></div>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 20, textAlign: "center" }}>
          <p className="muted">{!products.length ? "This shop has not added products yet. Check back soon." : q.trim() ? `Nothing matches “${q.trim()}”. Check the spelling, try fewer words, or change the filters.` : "No products match these filters."}</p>
          {products.length > 0 && <button type="button" className="btn alt sm" style={{ marginTop: 14 }} onClick={clear}>Clear search and filters</button>}
        </div>
      )}
    </section>
  );
}
