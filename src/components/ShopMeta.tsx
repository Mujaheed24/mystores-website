"use client";
import { useState } from "react";

// Description in the shop banner: long text is cut to 3 lines with a "Read more" button, so the banner never grows huge.
export function ClampText({ text, limit = 150 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > limit;
  return (
    <>
      <p className={long && !open ? "clamp3" : undefined}>{text}</p>
      {long && <button type="button" className="morebtn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>}
    </>
  );
}

// Category and place chips under the banner: the first few, then one "+N more" chip that opens the rest.
export function ShopMeta({ cats, places, count }: { cats: string[]; places: string[]; count: number }) {
  const [all, setAll] = useState(false);
  const CAT = 3, PLACE = 1, hiddenC = all ? 0 : Math.max(0, cats.length - CAT), hiddenP = all ? 0 : Math.max(0, places.length - PLACE);
  return (
    <div className="meta">
      {(all ? cats : cats.slice(0, CAT)).map((c) => <span className="pill" key={c}>{c}</span>)}
      {hiddenC > 0 && <button type="button" className="pill more" onClick={() => setAll(true)}>+{hiddenC} more</button>}
      <span className="pill">{count} {count === 1 ? "product" : "products"}</span>
      {(all ? places : places.slice(0, PLACE)).map((p) => <span className="pill" key={p}>📍 {p}</span>)}
      {hiddenP > 0 && <button type="button" className="pill more" onClick={() => setAll(true)}>+{hiddenP} more {hiddenP === 1 ? "place" : "places"}</button>}
      {all && (cats.length > CAT || places.length > PLACE) && <button type="button" className="pill more" onClick={() => setAll(false)}>Show less</button>}
    </div>
  );
}
