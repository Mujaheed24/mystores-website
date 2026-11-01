"use client";
import { useEffect, useState } from "react";
import { useImg } from "./Photo";

const DEMOS = [
  { slug: "oudpalace", name: "Oud Palace", cat: "Fragrance", color: "#7a4a12", items: ["🪵", "🧴", "🕯️", "💧", "🌹", "✨"] },
  { slug: "techworld", name: "TechWorld", cat: "Electronics", color: "#1d4ed8", items: ["📱", "💻", "🎧", "🔌", "⌚", "📷"] },
  { slug: "fashionhub", name: "FashionHub", cat: "Fashion", color: "#a3174f", items: ["👗", "👜", "👡", "🧣", "👒", "👔"] },
  { slug: "glowhair", name: "Glow Hair Studio", cat: "Beauty", color: "#6d28d9", items: ["💇", "✨", "💄", "🧴", "💅", "🪮"] },
];

// Optional photo inside the phone. Missing files are skipped (colour and emoji show instead).
function DemoImg({ src, cls }: { src: string; cls: string }) {
  const { ref, s, onLoad, onError } = useImg();
  if (s === "bad") return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} className={`${cls}${s === "ok" ? " show" : ""}`} src={src} alt="" onLoad={onLoad} onError={onError} draggable={false} />;
}

// Decorative phone that cycles through example shops, typing each address. Shows the idea in 3 seconds.
export default function HeroPhone() {
  const [i, setI] = useState(0), [n, setN] = useState(99);
  const d = DEMOS[i], full = `mystores.com.ng/${d.slug}`;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(full.length);
    setN(0); let k = 0;
    const t = setInterval(() => { k++; setN(k); if (k >= full.length) clearInterval(t); }, 48);
    const next = setTimeout(() => setI((x) => (x + 1) % DEMOS.length), 4200);
    return () => { clearInterval(t); clearTimeout(next); };
  }, [i, full]);
  return (
    <div className="phone" aria-hidden="true" style={{ ["--sa" as string]: d.color }}>
      <div className="pbar"><span>🔒</span><span>{full.slice(0, n)}<i className="caret" /></span></div>
      <div className="pbanner" style={{ backgroundColor: d.color }}><DemoImg key={"bi" + i} cls="pbimg" src={`/images/home/demo-${i + 1}-banner.jpg`} /><i className="pbshade" /><span key={"c" + i}>{d.cat}</span><b key={"n" + i}>{d.name}</b></div>
      <div className="ptiles" key={"t" + i}>{d.items.map((e, j) => <div className="ptile" key={j} style={{ animationDelay: `${j * 130 + 250}ms` }}><span>{e}</span><DemoImg cls="ptimg" src={`/images/home/demo-${i + 1}-${j + 1}.jpg`} /></div>)}</div>
      <div className="pwa" style={{ backgroundColor: "#128c4a" }}>Order on WhatsApp</div>
    </div>
  );
}
