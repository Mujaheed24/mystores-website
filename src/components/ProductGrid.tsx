"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { naira, type Product } from "@/lib/types";

export default function ProductGrid({ slug, products }: { slug: string; products: Product[] }) {
  const [q, setQ] = useState(""), [cat, setCat] = useState("All"), [sort, setSort] = useState("new");
  const cats = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const list = useMemo(() => {
    const l = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "lo") l.sort((a, b) => a.price - b.price);
    if (sort === "hi") l.sort((a, b) => b.price - a.price);
    return l;
  }, [products, q, cat, sort]);
  return (
    <>
      <h2 style={{ marginTop: 26 }}>All products</h2>
      <div className="bar">
        <input aria-label="Search this shop" placeholder="Search this shop" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option>
        </select>
      </div>
      <div className="bar" style={{ marginTop: 0 }}>
        {cats.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="grid">
        {list.length ? list.map((p) => (
          <Link key={p.id} className="card prod" href={`/${slug}/p/${p.id}`}>
            <div className="ph">{p.emoji}</div>
            <div className="in"><div>{p.name}</div><div className="price">{naira(p.price)}</div>
              {p.stockQuantity > 0 ? <div className="tag">{p.category}</div> : <div className="out">Out of stock</div>}</div>
          </Link>
        )) : <p className="muted">No products match. Clear the search or pick another category.</p>}
      </div>
    </>
  );
}
