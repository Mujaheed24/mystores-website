"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExpandButton from "./ExpandButton";
import ProductImage from "./ProductImage";
import { priceLabel, type Product } from "@/lib/types";

// Edge-to-edge 3D centre-mode slider. Card height scales with the screen and card WIDTH follows each photo's shape
// (tall photos get narrow cards, wide photos get wide cards). Swipe, arrow keys, auto-advance, expand button.
export default function Carousel({ slug, shopName, whatsapp, items }: { slug: string; shopName: string; whatsapp: string; items: Product[] }) {
  const n = items.length, [ci, setCi] = useState(0), [W, setW] = useState(390), [asp, setAsp] = useState<Record<string, number>>({});
  const stage = useRef<HTMLDivElement>(null), paused = useRef(false), x0 = useRef<number | null>(null), dragged = useRef(false);

  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) setCi((c) => (c + 1) % n); }, 3600);
    return () => clearInterval(t);
  }, [n]);
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, [n]);
  useEffect(() => { // learn each photo's shape so its card can match
    items.forEach((p) => {
      const u = p.imageUrls[0]; if (!u || asp[p.id]) return;
      const im = new Image();
      im.onload = () => setAsp((a) => ({ ...a, [p.id]: Math.min(1.6, Math.max(0.7, im.naturalWidth / im.naturalHeight)) }));
      im.src = u;
    });
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (n < 2) return null;
  const go = (d: number) => setCi((c) => (c + d + n) % n), h = Math.floor(n / 2);
  const H = Math.round(W < 700 ? Math.min(W * 0.68, 300) : Math.min(430, Math.max(280, W * 0.3)));       // photo height: full-width but kept compact on shop pages
  const wOf = (p: Product) => Math.round(Math.min(H * (asp[p.id] ?? 0.8), W * 0.7, 720));                  // card width: full-bleed, just narrower and more controlled
  const wAt = (o: number) => wOf(items[(ci + o + n * 4) % n]);
  const xOf = (o: number) => { const s = Math.sign(o); let x = 0; for (let k = 1; k <= Math.abs(o); k++) x += ((wAt(s * (k - 1)) + wAt(s * k)) / 2) * (k === 1 ? 0.74 : 0.44); return s * x; };
  const pin = items.some((p) => p.name) ? 76 : 0;
  return (
    <section className="rec" aria-label="Recommended products" onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}>
      <h2>Recommended for you</h2>
      <div ref={stage} className="stage" style={{ height: H + pin + 48, ["--ih" as string]: `${H}px` }}
        onPointerEnter={() => (paused.current = true)} onPointerLeave={() => { paused.current = false; x0.current = null; }}
        onFocus={() => (paused.current = true)} onBlur={() => (paused.current = false)}
        onPointerDown={(e) => { x0.current = e.clientX; paused.current = true; }}
        onPointerUp={(e) => {
          if (x0.current === null) return;
          const dx = e.clientX - x0.current; x0.current = null;
          if (Math.abs(dx) > 40) { dragged.current = true; go(dx < 0 ? 1 : -1); setTimeout(() => (dragged.current = false), 60); }
        }}
        onClickCapture={(e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); } }}>
        {items.map((p, j) => {
          const o = ((j - ci + n + h) % n) - h, a = Math.abs(o), w = wOf(p);
          const style = {
            width: w, marginLeft: -w / 2,
            transform: `translateX(${xOf(o)}px) translateZ(${-a * 120}px) rotateY(${-o * 30}deg) scale(${1 - a * 0.08})`,
            opacity: a > 2 ? 0 : 1 - a * 0.2, zIndex: 10 - a, pointerEvents: a > 2 ? ("none" as const) : ("auto" as const),
          };
          const inner = (<><div className="ph"><ProductImage p={{ ...p, thumbUrl: null }} eager={o === 0} /><span className="badge">★ Pick</span><span className="ptag">{priceLabel(p.price)}</span></div>{p.name && <div className="pin"><div className="pname">{p.name}</div></div>}</>);
          return (
            <div key={p.id} className="rc" aria-current={o === 0} style={style}>
              {o === 0
                ? <Link className="rcin" href={`/${slug}/p/${p.id}`} draggable={false}>{inner}</Link>
                : <button className="rcin" tabIndex={a > 2 ? -1 : 0} onClick={() => setCi(j)} aria-label={`Show ${p.name || "photo " + (j + 1)}`}>{inner}</button>}
              {o === 0 && <ExpandButton p={p} slug={slug} shopName={shopName} whatsapp={whatsapp} />}
            </div>
          );
        })}
      </div>
      <div className="dots" role="tablist" aria-label="Choose product">
        {items.map((p, j) => <button key={p.id} className="dot" aria-current={j === ci} aria-label={`Product ${j + 1}${p.name ? ": " + p.name : ""}`} onClick={() => setCi(j)} />)}
      </div>
    </section>
  );
}
