"use client";
import { useEffect, useState } from "react";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import AccountSettings from "./AccountSettings";
import ColorPicker from "../ColorPicker";
import { db } from "@/lib/firebase";
import { compressImage, deleteImages, uploadBrandImage } from "@/lib/images";
import { CATEGORIES, CATEGORY_EMOJI, LIMITS, MAX_CATEGORIES, MAX_EXTRA_PLACES, NG_STATES, isTooLight, normalizeNgPhone, shopCategories } from "@/lib/options";
import { errText } from "@/lib/seller";
import type { Shop } from "@/lib/types";

// A picture chooser: shows the current (or newly chosen) picture, with one clear button to change it.
function PicPick({ title, hint, current, file, onFile, wide, removed, onRemove }: { title: string; hint: string; current?: string; file: File | null; onFile: (f: File | null) => void; wide?: boolean; removed: boolean; onRemove: (v: boolean) => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => { if (!file) return setUrl(""); const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  const src = url || (removed ? undefined : current);
  return (
    <div className={`pick${wide ? " wide" : ""}`}>
      <div className="pv2">{src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" /> : <span aria-hidden="true">🖼️</span>}</div>
      <div className="pt"><b>{title}</b><span className="muted hint">{file ? `New: ${file.name}` : hint}</span>
        <label className="btn alt sm">{src ? "Change" : "Choose a photo"}<input className="sr" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { onFile(e.target.files?.[0] ?? null); onRemove(false); e.target.value = ""; }} /></label>
        {file && <button type="button" className="linkbtn" onClick={() => onFile(null)}>Undo</button>}
        {!file && current && !removed && <button type="button" className="linkbtn rmpic" onClick={() => onRemove(true)}>Remove {title.toLowerCase()}</button>}
        {removed && <span className="muted hint">Will be removed when you save. <button type="button" className="linkbtn" onClick={() => onRemove(false)}>Undo</button></span>}
      </div>
    </div>
  );
}

export default function Profile({ shop, onSaved }: { shop: Shop; onSaved: (s: Shop) => void }) {
  const [name, setName] = useState(shop.name), [desc, setDesc] = useState(shop.description), [wa, setWa] = useState(shop.whatsappNumber), [color, setColor] = useState(shop.themeColor);
  const [cats, setCats] = useState<string[]>(shopCategories(shop)), [places, setPlaces] = useState<{ state: string; city: string }[]>(shop.locations ?? []);
  const [state, setState] = useState(shop.state ?? ""), [city, setCity] = useState(shop.city ?? ""), [hours, setHours] = useState(shop.openingHours ?? ""), [delivery, setDelivery] = useState(shop.deliveryNotes ?? "");
  const [logo, setLogo] = useState<File | null>(null), [banner, setBanner] = useState<File | null>(null), [noLogo, setNoLogo] = useState(false), [noBanner, setNoBanner] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!name.trim()) return setErr("Enter your shop name.");
    if (!cats.length) return setErr("Choose at least one thing that you sell.");
    const phone = normalizeNgPhone(wa);
    if (!phone) return setErr("Enter your WhatsApp number, like 0803 123 4567.");
    if (isTooLight(color)) return setErr("That shop colour is too light. Pick a darker one so your shop name is easy to read.");
    setBusy(true);
    try {
      const d: Partial<Shop> = { name: name.trim(), description: desc.trim(), whatsappNumber: phone, themeColor: color, category: cats[0], categories: cats,
        locations: places.filter((x) => x.state).map((x) => ({ state: x.state, city: x.city.trim().slice(0, LIMITS.city) })), state, city: city.trim(), openingHours: hours.trim(), deliveryNotes: delivery.trim() }, old: string[] = [];
      // logo and banner are prepared and uploaded at the same time
      await Promise.all([
        logo && (async () => { if (shop.logoUrl) old.push(shop.logoUrl); d.logoUrl = await uploadBrandImage(shop.id, "logo", await compressImage(logo, 800)); })(),
        banner && (async () => { if (shop.bannerUrl) old.push(shop.bannerUrl); d.bannerUrl = await uploadBrandImage(shop.id, "banner", await compressImage(banner, 2000)); })(),
      ]);
      // "Remove" deletes the field; a newly chosen picture wins over a pending removal
      const gone: Record<string, unknown> = {};
      if (noLogo && !logo && shop.logoUrl) { gone.logoUrl = deleteField(); old.push(shop.logoUrl); }
      if (noBanner && !banner && shop.bannerUrl) { gone.bannerUrl = deleteField(); old.push(shop.bannerUrl); }
      await updateDoc(doc(db, "shops", shop.id), { ...d, ...gone, updatedAt: serverTimestamp() });
      deleteImages(old); setWa(phone); setLogo(null); setBanner(null); setNoLogo(false); setNoBanner(false);
      const next: Shop = { ...shop, ...d }; if (gone.logoUrl) delete next.logoUrl; if (gone.bannerUrl) delete next.bannerUrl;
      onSaved(next);
    } catch (x) { setErr(errText(x)); }
    setBusy(false);
  }
  const setPlace = (i: number, v: Partial<{ state: string; city: string }>) => setPlaces(places.map((y, j) => (j === i ? { ...y, ...v } : y)));
  return (
    <>
    <form className="fsecs" onSubmit={save}>
      <section className="card fsec f" aria-labelledby="s1">
        <h3 id="s1">1 · About your shop</h3>
        <label>Shop name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
        <label>Short description<textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} rows={3} /><span className="hint muted">{desc.length} / 200</span></label>
        <label>WhatsApp number<input inputMode="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0803 123 4567" /><span className="hint muted">Customers will chat with you on this number.</span></label>
        <p className="muted hint">Your shop address (mystores.com.ng/{shop.slug}) cannot be changed.</p>
      </section>

      <section className="card fsec f" aria-labelledby="s2">
        <h3 id="s2">2 · What you sell</h3>
        <p className="muted hint" style={{ marginTop: -8 }}>Choose up to {MAX_CATEGORIES}. {cats.length} chosen.</p>
        <div className="chips wrapchips" role="group" aria-label="What you sell">{CATEGORIES.map((c) => <button type="button" key={c} className="chip" aria-pressed={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : x.length >= MAX_CATEGORIES ? x : [...x, c]))}>{CATEGORY_EMOJI[c]} {c}</button>)}</div>
      </section>

      <section className="card fsec f" aria-labelledby="s3">
        <h3 id="s3">3 · Where customers find you</h3>
        <div className="two">
          <label>State<select value={state} onChange={(e) => setState(e.target.value)}><option value="">Choose your state</option>{NG_STATES.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
          <label>City or area<input value={city} onChange={(e) => setCity(e.target.value)} maxLength={LIMITS.city} placeholder="e.g. Ikeja" /></label>
        </div>
        {places.length > 0 && <div className="lab">Other places you sell from</div>}
        {places.map((x, i) => (
          <div className="placerow" key={i}>
            <select aria-label={`State of place ${i + 2}`} value={x.state} onChange={(e) => setPlace(i, { state: e.target.value })}><option value="">State</option>{NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <input aria-label={`City or area of place ${i + 2}`} value={x.city} maxLength={LIMITS.city} placeholder="City or area" onChange={(e) => setPlace(i, { city: e.target.value })} />
            <button type="button" className="rm" aria-label="Remove this place" onClick={() => setPlaces(places.filter((_, j) => j !== i))}>×</button>
          </div>))}
        {places.length < MAX_EXTRA_PLACES && <button type="button" className="btn alt sm" style={{ justifySelf: "start" }} onClick={() => setPlaces([...places, { state: "", city: "" }])}>+ Add another place</button>}
        <label>Opening hours<input value={hours} onChange={(e) => setHours(e.target.value)} maxLength={LIMITS.hours} placeholder="e.g. Mon–Sat, 9am–6pm" /></label>
        <label>Delivery notes<textarea value={delivery} onChange={(e) => setDelivery(e.target.value)} maxLength={LIMITS.delivery} rows={3} placeholder="e.g. We deliver within Lagos in 1–2 days. Pickup is free." /></label>
      </section>

      <section className="card fsec f" aria-labelledby="s4">
        <h3 id="s4">4 · How your shop looks</h3>
        <PicPick title="Logo" hint="Square works best" current={shop.logoUrl} file={logo} onFile={setLogo} removed={noLogo} onRemove={setNoLogo} />
        <PicPick title="Banner" hint="A wide photo, shown behind your shop name" current={shop.bannerUrl} file={banner} onFile={setBanner} wide removed={noBanner} onRemove={setNoBanner} />
        <div className="lab">Shop colour<ColorPicker value={color} onChange={setColor} /></div>
        <div className="mini"><div className="bn" style={{ backgroundColor: color }}><span>{cats.map((c) => CATEGORY_EMOJI[c]).join(" ")} {cats.join(", ")}</span><b>{name || "Your shop"}</b></div><div className="bd">mystores.com.ng/{shop.slug}</div></div>
      </section>

      <div className="savebar">
        <div className="bad" role="alert">{err}</div>
        <button className="btn" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
    <AccountSettings />
    </>
  );
}
