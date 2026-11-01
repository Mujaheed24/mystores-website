"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IconSearch } from "./Icons";
import Reveal from "./Reveal";
import { placesLabel, shopPlaces } from "@/lib/options";
import { searchScore } from "@/lib/search";

// Plain data only (no Firestore timestamps) so it can cross from server to client.
export type DirShop = { id: string; slug: string; name: string; category: string; categories?: string[]; description: string; themeColor: string; logoUrl?: string; bannerUrl?: string; state?: string; city?: string; locations?: { state: string; city: string }[] };

// The directory lists SHOPS only, never products. Search and the state filter narrow the list of shops.
export default function ShopDirectory({ shops }: { shops: DirShop[] }) {
  const [state, setState] = useState(""), [q, setQ] = useState("");
  const states = useMemo(() => Array.from(new Set(shops.flatMap((s) => shopPlaces(s).map((p) => p.state)).filter(Boolean))).sort(), [shops]);
  const shown = useMemo(() => {
    const scored = shops
      .filter((s) => !state || shopPlaces(s).some((p) => p.state === state))
      .map((s) => ({ s, k: searchScore(q, [s.name, (s.categories?.length ? s.categories : [s.category]).join(" "), shopPlaces(s).map((p) => `${p.city} ${p.state}`).join(" "), s.description]) }))
      .filter((x) => x.k > 0);
    if (q.trim()) scored.sort((a, b) => b.k - a.k);
    return scored.map((x) => x.s);
  }, [shops, state, q]);
  return (
    <>
      {shops.length > 3 && <div className="sbox" style={{ marginBottom: 14 }}><div><IconSearch size={22} /><input aria-label="Search shops" type="search" enterKeyHint="search" placeholder="Search shops, categories or places" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>}
      {states.length > 1 && (
        <div className="chips" role="group" aria-label="Filter shops by state" style={{ marginBottom: 14 }}>
          {["", ...states].map((st) => <button key={st || "all"} className="chip" aria-pressed={state === st} onClick={() => setState(st)}>{st || "All states"}</button>)}
        </div>
      )}
      <div className="shopgrid">
        {shown.length ? shown.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 90}>
            <Link href={`/${s.slug}`} className="card shopcard">
              <div className="bn" style={{ backgroundColor: s.themeColor, backgroundImage: s.bannerUrl ? `url(${s.bannerUrl})` : undefined }}>
                <div className="av" style={{ background: s.themeColor }}>{s.logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logoUrl} alt="" /> : s.name[0]}</div>
              </div>
              <div className="in"><h3>{s.name}</h3><div className="muted" style={{ fontWeight: 600, fontSize: 16 }}>{(s.categories?.length ? s.categories : [s.category]).join(", ")}{placesLabel(s) && <> · 📍 {placesLabel(s)}</>}</div><p>{s.description}</p></div>
            </Link>
          </Reveal>
        )) : <p className="muted">{shops.length ? "No shops match. Check the spelling or clear the search and filter." : "No shops yet. Be the first to open one."}</p>}
      </div>
    </>
  );
}
