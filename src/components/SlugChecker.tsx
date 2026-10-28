"use client";
import { useState } from "react";
import { checkSlugFormat } from "@/lib/slug";
import { slugTaken } from "@/lib/shops";

export default function SlugChecker() {
  const [v, setV] = useState(""), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function check(e: React.FormEvent) {
    e.preventDefault();
    const s = v.trim().toLowerCase(), bad = checkSlugFormat(s);
    if (bad) return setMsg({ ok: false, t: bad });
    try {
      const taken = await slugTaken(s);
      setMsg(taken ? { ok: false, t: `mystores.com.ng/${s} is taken. Try another address.` } : { ok: true, t: `mystores.com.ng/${s} is available.` });
    } catch { setMsg({ ok: false, t: "Could not check right now. Try again." }); }
  }
  return (
    <>
      <form className="slug" onSubmit={check}>
        <input aria-label="Shop address" placeholder="Pick your shop address, e.g. glowcare" value={v} onChange={(e) => setV(e.target.value)} autoComplete="off" />
        <button className="btn">Check address</button>
      </form>
      <div className={`msg ${msg ? (msg.ok ? "ok" : "bad") : ""}`} aria-live="polite">{msg?.t}</div>
    </>
  );
}
