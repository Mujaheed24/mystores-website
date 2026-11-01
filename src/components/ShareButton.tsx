"use client";
import { useState } from "react";
import { IconCheck, IconShare } from "./Icons";

export default function ShareButton({ title, text, className = "btn alt" }: { title: string; text: string; className?: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = location.href;
    try {
      if (navigator.share) return await navigator.share({ title, text, url });
      await navigator.clipboard.writeText(url);
      setDone(true); setTimeout(() => setDone(false), 2200);
    } catch { /* cancelled */ }
  }
  return <button className={className} onClick={share}>{done ? <><IconCheck /> Link copied</> : <><IconShare /> Share</>}</button>;
}
