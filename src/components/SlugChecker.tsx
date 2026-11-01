"use client";
import { useState } from "react";
import { checkSlugFormat } from "@/lib/slug";

export default function SlugChecker() {
  const [v, setV] = useState(""), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [busy, setBusy] = useState(false);
  async function check(e: React.FormEvent) {
    e.preventDefault();
    const s = v.trim().toLowerCase(), bad = checkSlugFormat(s);
    if (bad) return setMsg({ ok: false, t: bad });
    setBusy(true);
    try {
      const taken = await (await import("@/lib/shops")).slugTaken(s); // database code loads only when the visitor taps Check
      setMsg(taken ? { ok: false, t: `mystores.com.ng/${s} is taken. Try another.` } : { ok: true, t: `Good news! mystores.com.ng/${s} is free.` });
    } catch { setMsg({ ok: false, t: "Could not check right now. Try again." }); }
    setBusy(false);
  }
  return (
    <>
      <form className="slug" onSubmit={check}>
        <input aria-label="Shop address" placeholder="Check a name, e.g. glowcare" value={v} onChange={(e) => setV(e.target.value)} autoComplete="off" autoCapitalize="none" />
        <button className="btn alt" disabled={busy} aria-busy={busy}>{busy ? "Checking…" : "Check"}</button>
      </form>
      <div className={`msg ${msg ? (msg.ok ? "ok" : "bad") : ""}`} aria-live="polite">{msg?.t}</div>
    </>
  );
}
