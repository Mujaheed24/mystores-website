"use client";
import { useEffect, useState } from "react";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MAX_VIDEO_MB, MAX_VIDEO_SECONDS, VIDEO_TYPES, deleteImages, inspectVideo, uploadProductPhoto, uploadProductVideo } from "@/lib/images";
import { MAX_FEATURED, shopCategories } from "@/lib/options";
import { errText } from "@/lib/seller";
import type { Product, Shop } from "@/lib/types";

type Pick = { f: File; url: string };
// Video upload is switched off by default. Set NEXT_PUBLIC_ENABLE_VIDEO=true (Vercel environment variables, then redeploy) to allow it.
const VIDEO_ON = process.env.NEXT_PUBLIC_ENABLE_VIDEO === "true";

// Photo first. Name and price are optional: a product needs at least a photo OR a name.
export default function ProductForm({ shop, uid, product, categories, featuredCount, onDone, onCancel }: {
  shop: Shop; uid: string; product?: Product; categories: string[]; featuredCount: number;
  onDone: (msg: string) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? ""), [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : ""), [stock, setStock] = useState(product ? String(product.stockQuantity) : "1");
  const [desc, setDesc] = useState(product?.description ?? ""), [status, setStatus] = useState<"draft" | "published">(product?.status ?? "published");
  const [featured, setFeatured] = useState(product?.featured ?? false), [images, setImages] = useState<string[]>(product?.imageUrls ?? []);
  const [picks, setPicks] = useState<Pick[]>([]), [removed, setRemoved] = useState<string[]>([]), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  // video: the one already saved (if any), or a new one just chosen
  const [video, setVideo] = useState<{ url: string; poster: string | null } | null>(product?.videoUrl ? { url: product.videoUrl, poster: product.videoPoster ?? null } : null);
  const [custom, setCustom] = useState(false), [vidFile, setVidFile] = useState<File | null>(null), [vidUrl, setVidUrl] = useState(""), [pct, setPct] = useState(0);
  useEffect(() => { if (!vidFile) return setVidUrl(""); const u = URL.createObjectURL(vidFile); setVidUrl(u); return () => URL.revokeObjectURL(u); }, [vidFile]);
  async function pickVideo(f: File | undefined) {
    if (!f) return; setErr("");
    try { await inspectVideo(f); setVidFile(f); } catch (x) { setErr(errText(x)); } // checks the type, size and length straight away
  }
  // suggestions: categories already used on this shop first, then the shop's own categories (no duplicates, capital letters ignored)
  const sugg = Array.from(new Map([...categories, ...shopCategories(shop)].map((c) => c.trim()).filter(Boolean).map((c) => [c.toLowerCase(), c])).values()).slice(0, 14);
  const canFeature = featured || featuredCount < MAX_FEATURED;

  function addFiles(list: FileList | null) {
    const add = Array.from(list ?? []).map((f) => ({ f, url: URL.createObjectURL(f) }));
    setPicks((p) => [...p, ...add]);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const photos = images.length + picks.length;
    if (!name.trim() && photos === 0 && !video && !vidFile) return setErr("Add a photo, or type a name. A product needs at least one.");
    let p: number | null = null;
    if (price.trim() !== "") {
      const n = Number(price.replace(/[,\s₦]/g, ""));
      if (!Number.isInteger(n) || n <= 0) return setErr("Price must be a whole number above 0, or leave it empty.");
      p = n;
    }
    const st = Number(stock);
    if (!Number.isInteger(st) || st < 0) return setErr("How many you have must be a whole number, 0 or more.");
    if (photos > 6) return setErr("You can add up to 6 photos.");
    setBusy(true);
    try {
      const ref = product ? doc(db, "shops", shop.id, "products", product.id) : doc(collection(db, "shops", shop.id, "products"));
      const urls = [...images];
      // The small copy must belong to the FIRST photo. Keep the old one only while that photo is unchanged.
      let thumb: string | null = product && images.length > 0 && images[0] === product.imageUrls[0] ? product.thumbUrl ?? null : null;
      // all photos go up at the same time (much faster than one after another); their order is kept
      const ups = await Promise.all(picks.map((k) => uploadProductPhoto(shop.id, ref.id, k.f)));
      for (const r of ups) { if (urls.length === 0) thumb = r.thumbUrl; urls.push(r.url); }
      // video: upload a new one, or remember it was removed. A product with a video but no photo uses the video's cover picture as its photo.
      let videoUrl = video?.url ?? null, videoPoster = video?.poster ?? null;
      if (vidFile) {
        const r = await uploadProductVideo(shop.id, ref.id, vidFile, setPct);
        videoUrl = r.videoUrl; videoPoster = r.posterUrl;
        if (urls.length === 0) { urls.push(r.posterUrl); thumb = r.posterUrl; }
      }
      const oldVideoFiles = (keep: string[]) => (product?.videoUrl && product.videoUrl !== videoUrl ? [product.videoUrl, ...(product.videoPoster && !keep.includes(product.videoPoster) && product.videoPoster !== thumb ? [product.videoPoster] : [])] : []);
      const data = { shopId: shop.id, sellerUid: uid, name: name.trim(), description: desc.trim(), category: category.trim(), price: p,
        stockQuantity: st, status, featured: status === "published" && featured, imageUrls: urls, thumbUrl: thumb, videoUrl, videoPoster, emoji: product?.emoji ?? "🛍️" };
      if (product) await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      else await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await deleteImages([...removed, ...(product?.thumbUrl && product.thumbUrl !== thumb ? [product.thumbUrl] : []), ...oldVideoFiles(urls)]);
      onDone(product ? "Changes saved" : status === "published" ? "Published" : "Saved as hidden");
    } catch (x) { setErr(errText(x)); setBusy(false); }
  }
  return (
    <form className="f card" onSubmit={submit}>
      <h3>{product ? "Edit product" : "Add a product"}</h3>
      <label className="drop"><b>📷 Tap to add photos</b><span className="muted hint">Up to 6 · JPG, PNG or WebP</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /></label>
      <div className="previews">
        {images.map((u) => <div className="pv" key={u}><div className="tn">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" /></div>
          <button type="button" aria-label="Remove photo" onClick={() => { setImages(images.filter((x) => x !== u)); setRemoved([...removed, u]); }}>×</button></div>)}
        {picks.map((k, i) => <div className="pv" key={k.url}><div className="tn">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={k.url} alt="" /></div>
          <button type="button" aria-label="Remove photo" onClick={() => { URL.revokeObjectURL(k.url); setPicks(picks.filter((_, j) => j !== i)); }}>×</button></div>)}
      </div>
      {(VIDEO_ON || video || vidFile) && <div className="vidbox">
        {!video && !vidFile && VIDEO_ON && <label className="drop"><b>🎬 Tap to add a video</b><span className="muted hint">Optional · one video · up to {MAX_VIDEO_SECONDS} seconds and {MAX_VIDEO_MB} MB</span>
          <input type="file" accept={VIDEO_TYPES.join(",")} onChange={(e) => { pickVideo(e.target.files?.[0]); e.target.value = ""; }} /></label>}
        {(video || vidFile) && (
          <div className="vprev">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={vidFile ? vidUrl : video!.url} poster={vidFile ? undefined : video!.poster ?? undefined} controls playsInline preload="metadata" />
            <div className="pt"><b>{vidFile ? `New video: ${vidFile.name}` : "Product video"}</b>
              <button type="button" className="btn alt sm" onClick={() => { setVidFile(null); setVideo(null); }} disabled={busy}>Remove video</button></div>
          </div>
        )}
        {busy && vidFile && pct < 100 && <div role="status" aria-live="polite"><progress max={100} value={pct} style={{ width: "100%" }} /> <span className="muted hint">Uploading video… {pct}%</span></div>}
      </div>}
      <label>Name <span className="muted hint">(optional if you add a photo)</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></label>
      <label>Price in ₦ <span className="muted hint">(leave empty to show “Ask for price”)</span><input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 15000" /></label>
      <label>Category <span className="muted hint">(optional, helps customers filter your shop)</span>
        <select value={custom ? "__new" : sugg.find((c) => c.toLowerCase() === category.trim().toLowerCase()) ?? ""} onChange={(e) => { const v = e.target.value; if (v === "__new") { setCustom(true); setCategory(""); } else { setCustom(false); setCategory(v); } }}>
          <option value="">No category</option>
          {sugg.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new">+ New category…</option>
        </select></label>
      {custom && <label>New category name<input value={category} maxLength={40} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sandals" autoFocus /></label>}
      <label>How many do you have?<input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></label>
      <label>Description <span className="muted hint">(optional)</span><textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
      <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
        <option value="published">Published</option><option value="draft">Hidden (draft)</option></select></label>
      <label className="check"><input type="checkbox" checked={featured && status === "published"} disabled={status !== "published" || !canFeature}
        onChange={(e) => setFeatured(e.target.checked)} /><span>Recommend this (shown in the carousel){!canFeature && " – limit of {MAX_FEATURED} reached"}</span></label>
      <div className="bad" role="alert">{err}</div>
      <div className="row"><button className="btn" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn alt" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
