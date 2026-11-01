"use client";
import { useState } from "react";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadProductPhoto } from "@/lib/images";
import { errText } from "@/lib/seller";
import type { Shop } from "@/lib/types";

type Pick = { f: File; url: string };

// Pick many photos at once. Each photo becomes its own product. Add names and prices later, or never.
export default function QuickAdd({ shop, uid, onDone }: { shop: Shop; uid: string; onDone: (msg: string) => void }) {
  const [picks, setPicks] = useState<Pick[]>([]), [done, setDone] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const add = (list: FileList | null) => setPicks((p) => [...p, ...Array.from(list ?? []).map((f) => ({ f, url: URL.createObjectURL(f) }))].slice(0, 20));
  async function go() {
    setBusy(true); setErr(""); setDone(0);
    let ok = 0;
    try {
      // three photos at a time: much faster than one by one, and kind to a phone's memory
      for (let i = 0; i < picks.length; i += 3) {
        await Promise.all(picks.slice(i, i + 3).map(async (k) => {
          const ref = doc(collection(db, "shops", shop.id, "products"));
          const { url, thumbUrl } = await uploadProductPhoto(shop.id, ref.id, k.f);
          await setDoc(ref, { shopId: shop.id, sellerUid: uid, name: "", description: "", category: "", price: null, stockQuantity: 1, status: "published",
            featured: false, imageUrls: [url], thumbUrl, emoji: "🛍️", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          ok++; setDone(ok);
        }));
      }
      onDone(`${ok} ${ok === 1 ? "product" : "products"} added`);
    } catch (x) { setErr(`${errText(x)} ${ok} of ${picks.length} were added.`); setBusy(false); }
  }
  return (
    <div className="f card">
      <h3>Add many photos at once</h3>
      <p className="muted">Each photo becomes a product in your shop. You can add names and prices later.</p>
      <label className="drop"><b>📷 Tap to choose photos</b><span className="muted hint">Up to 20 · JPG, PNG or WebP</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { add(e.target.files); e.target.value = ""; }} /></label>
      {picks.length > 0 && <div className="previews">{picks.map((k, i) => <div className="pv" key={k.url}><div className="tn">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={k.url} alt="" /></div>
        {!busy && <button type="button" aria-label="Remove photo" onClick={() => { URL.revokeObjectURL(k.url); setPicks(picks.filter((_, j) => j !== i)); }}>×</button>}</div>)}</div>}
      {busy && <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={picks.length} aria-valuenow={done}><i style={{ width: `${(done / picks.length) * 100}%` }} /></div>}
      <div className="bad" role="alert">{err}</div>
      <button className="btn" onClick={go} disabled={busy || picks.length === 0} aria-busy={busy}>{busy ? `Uploading ${done} of ${picks.length}…` : `Publish ${picks.length || ""} ${picks.length === 1 ? "photo" : "photos"}`}</button>
    </div>
  );
}
