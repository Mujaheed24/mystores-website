"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrow, IconCheck } from "./Icons";
import ColorPicker from "./ColorPicker";
import { CATEGORIES, CATEGORY_EMOJI, MAX_CATEGORIES, THEME_COLORS, isTooLight, normalizeNgPhone, slugify } from "@/lib/options";
import { slugTaken } from "@/lib/shops";
import { checkSlugFormat } from "@/lib/slug";

export type NewShop = { name: string; slug: string; category: string; categories: string[]; description: string; whatsappNumber: string; themeColor: string };

// Three big, single-question screens. Easy on a phone, no jargon.
export default function ShopWizard({ onCreate }: { onCreate: (d: NewShop) => Promise<string | null> }) {
  const [step, setStep] = useState(0), [name, setName] = useState(""), [slug, setSlug] = useState(""), [edited, setEdited] = useState(false);
  const [avail, setAvail] = useState<{ ok: boolean; t: string } | null>(null);
  const [cats, setCats] = useState<string[]>([]), [desc, setDesc] = useState(""), [phone, setPhone] = useState("");
  const [color, setColor] = useState(THEME_COLORS[0]), [terms, setTerms] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => { if (!edited) setSlug(slugify(name)); }, [name, edited]);
  useEffect(() => {
    if (!slug) return setAvail(null);
    const bad = checkSlugFormat(slug);
    if (bad) return setAvail({ ok: false, t: bad });
    const t = setTimeout(() => slugTaken(slug).then((x) => setAvail(x ? { ok: false, t: `mystores.com.ng/${slug} is taken.` } : { ok: true, t: `mystores.com.ng/${slug} is free!` })).catch(() => setAvail(null)), 400);
    return () => clearTimeout(t);
  }, [slug]);

  const next = () => {
    setErr("");
    if (step === 0) { if (!name.trim()) return setErr("Type your shop name."); if (!avail?.ok) return setErr("Choose a shop address that is free."); }
    if (step === 1) { if (!cats.length) return setErr("Tap what you sell. You can choose more than one."); if (!desc.trim()) return setErr("Write one short line about your shop."); if (!normalizeNgPhone(phone)) return setErr("Enter your WhatsApp number, like 0803 123 4567."); }
    setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setErr(""); setStep(step - 1); };
  async function create() {
    if (isTooLight(color)) return setErr("Pick a darker shop colour so your shop name is easy to read.");
    if (!terms) return setErr("Tick the box to accept the rules.");
    setBusy(true); setErr("");
    const e = await onCreate({ name: name.trim(), slug, category: cats[0], categories: cats, description: desc.trim(), whatsappNumber: normalizeNgPhone(phone)!, themeColor: color });
    if (e) { setErr(e); setBusy(false); }
  }

  return (
    <main className="wrap wiz">
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}><i style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      <p className="muted" style={{ marginTop: 10, fontWeight: 700 }}>Step {step + 1} of 3</p>

      {step === 0 && <div className="wstep f" key="s0">
        <h1>What is your shop called?</h1><p className="lead">This is the name customers will see.</p>
        <label>Shop name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Glow Hair Studio" autoFocus /></label>
        <label>Your shop link
          <input value={slug} onChange={(e) => { setEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} autoComplete="off" autoCapitalize="none" />
          <span className={`hint ${avail ? (avail.ok ? "ok" : "bad") : "muted"}`} aria-live="polite">{avail ? (avail.ok ? "✓ " : "") + avail.t : "mystores.com.ng/your-link"}</span></label>
      </div>}

      {step === 1 && <div className="wstep f" key="s1">
        <h1>What do you sell?</h1><p className="lead">Tap everything that fits (up to {MAX_CATEGORIES}).</p>
        <div className="cats" role="group" aria-label="Categories">{CATEGORIES.map((c) => <button type="button" key={c} className="cat" aria-pressed={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : x.length >= MAX_CATEGORIES ? x : [...x, c]))}><i>{CATEGORY_EMOJI[c]}</i>{c}</button>)}</div>
        <label>Say it in one line<textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} placeholder="e.g. Fresh Ankara dresses made in Lagos" /></label>
        <label>Your WhatsApp number<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" /><span className="hint muted">Customers will chat with you on this number.</span></label>
      </div>}

      {step === 2 && <div className="wstep f" key="s2">
        <h1>Pick your shop colour</h1><p className="lead">Choose one below, or make your own. You can change it any time.</p>
        <ColorPicker value={color} onChange={setColor} />
        <div className="mini"><div className="bn" style={{ backgroundColor: color }}><span>{cats.map((c) => CATEGORY_EMOJI[c]).join(" ")} {cats.join(", ")}</span><b>{name || "Your shop"}</b></div><div className="bd">mystores.com.ng/{slug || "your-link"}</div></div>
        <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span>I will only sell lawful goods and I accept the <Link href="/terms" target="_blank" style={{ textDecoration: "underline" }}>MyStores terms</Link>.</span></label>
      </div>}

      <div className="bad msg" role="alert">{err}</div>
      <div className="row" style={{ marginTop: 14 }}>
        {step > 0 && <button type="button" className="btn alt" onClick={back}>Back</button>}
        {step < 2 ? <button type="button" className="btn" onClick={next}>Next <IconArrow /></button>
          : <button type="button" className="btn" onClick={create} disabled={busy} aria-busy={busy}>{busy ? "Creating your shop…" : <>Create my shop <IconCheck /></>}</button>}
      </div>
    </main>
  );
}
