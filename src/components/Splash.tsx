"use client";
import { useEffect, useState } from "react";

export default function Splash({ name, category, slug, color }: { name: string; category: string; slug: string; color: string }) {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");
  useEffect(() => {
    const a = setTimeout(() => setPhase("out"), 2000);
    const b = setTimeout(() => setPhase("gone"), 2450);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "gone") return null;
  return (
    <div className={`splash${phase === "out" ? " out" : ""}`} style={{ ["--sa" as string]: color }} role="status"
      onClick={() => setPhase("out")}>
      <div>
        <div className="sl">{name[0]}</div>
        <h1>{name}</h1>
        <p>{category} · mystores.com.ng/{slug}</p>
        <small>Tap to skip</small>
      </div>
    </div>
  );
}
