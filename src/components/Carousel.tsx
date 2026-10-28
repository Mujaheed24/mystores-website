"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { naira, type Product } from "@/lib/types";

export default function Carousel({ slug, items }: { slug: string; items: Product[] }) {
  const n = items.length;
  const [ci, setCi] = useState(0);
  const paused = useRef(false);
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) setCi((c) => (c + 1) % n); }, 3200);
    return () => clearInterval(t);
  }, [n]);
  if (n < 2) return null;
  const h = Math.floor(n / 2);
  return (
    <section className="rec" aria-label="Recommended products">
      <h2>Recommended</h2>
      <div className="stage" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)} onBlur={() => (paused.current = false)}>
        {items.map((p, j) => {
          const o = ((j - ci + n + h) % n) - h, a = Math.abs(o);
          const style = {
            transform: `translateX(${o * 52}%) translateZ(${-a * 90}px) rotateY(${-o * 30}deg) scale(${1 - a * 0.08})`,
            opacity: a > 2 ? 0 : 1 - a * 0.2, zIndex: 10 - a, pointerEvents: a > 2 ? ("none" as const) : ("auto" as const),
          };
          const inner = (<><div className="ph">{p.emoji}</div><div className="in"><div>{p.name}</div><div className="price">{naira(p.price)}</div></div></>);
          return o === 0
            ? <Link key={p.id} className="rc" aria-current="true" style={style} href={`/${slug}/p/${p.id}`}>{inner}</Link>
            : <button key={p.id} className="rc" style={style} tabIndex={a > 2 ? -1 : 0} onClick={() => setCi(j)} aria-label={`Show ${p.name}`}>{inner}</button>;
        })}
      </div>
      <div className="ctl">
        <button className="btn alt sm" onClick={() => setCi((ci - 1 + n) % n)} aria-label="Previous product">‹</button>
        <span className="muted">{ci + 1} of {n}</span>
        <button className="btn alt sm" onClick={() => setCi((ci + 1) % n)} aria-label="Next product">›</button>
      </div>
    </section>
  );
}
