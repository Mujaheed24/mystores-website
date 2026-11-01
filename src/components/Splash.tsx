"use client";
import { useEffect, useState } from "react";

// Full-screen branded entry banner: ~2 seconds, then lifts away like a curtain. Tap to skip.
export default function Splash({ name, category, slug, color, logoUrl }: { name: string; category: string; slug: string; color: string; logoUrl?: string }) {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const a = setTimeout(() => setPhase("out"), 2000), b = setTimeout(() => setPhase("gone"), 2850);
    return () => { clearTimeout(a); clearTimeout(b); document.body.style.overflow = ""; };
  }, []);
  useEffect(() => { if (phase === "gone") document.body.style.overflow = ""; }, [phase]);
  if (phase === "gone") return null;
  // Long names break between WORDS (never in the middle of a word). The text size is worked out from the longest word so the
  // whole name always fits the screen, and the letters appear quickly enough that even a very long name is complete before the curtain lifts.
  const words = name.trim().split(/\s+/).filter(Boolean), w0 = words.map((_, i) => words.slice(0, i).reduce((n, w) => n + Array.from(w).length, 0));
  const total = words.reduce((n, w) => n + Array.from(w).length, 0), longest = Math.max(5, ...words.map((w) => Array.from(w).length));
  const k = total > 40 ? 0.5 : total > 28 ? 0.6 : total > 16 ? 0.78 : 1;                       // longer names start smaller
  const fit = (86 / (longest * 0.64)).toFixed(2);                                              // vw that makes the longest word fit the width
  const size = `min(clamp(${Math.round(30 * k)}px, ${(13 * k).toFixed(1)}vw, ${Math.round(120 * k)}px), ${fit}vw)`;
  const step = Math.max(8, Math.min(45, Math.floor(700 / total)));                             // ms between letters: all letters start within 0.7 s
  return (
    <div className={`splash${phase === "out" ? " out" : ""}`} style={{ ["--sa" as string]: color }} role="status" onClick={() => setPhase("out")}>
      <div>
        <div className="sl">{logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logoUrl} alt="" /> : name[0]}</div>
        <h1 aria-label={name} style={{ fontSize: size, ["--step" as string]: `${step}ms` }}>{words.map((w, wi) => <span className="w" key={wi} aria-hidden="true">{Array.from(w).map((c, ci) => <span key={ci} style={{ ["--i" as string]: w0[wi] + ci }}>{c}</span>)}</span>)}</h1>
        <p>{category} · mystores.com.ng/{slug}</p>
        <small>Tap to skip</small>
      </div>
      <div className="prog" />
    </div>
  );
}
