"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AddToCart } from "./Cart";
import { IconChat, IconClose, IconExpand } from "./Icons";
import { TapLink } from "./Track";
import { naira, priceLabel, type Product } from "@/lib/types";

type Props = { p: Product; slug: string; shopName: string; whatsapp: string };

// Small "expand" button on a product photo. Opens the full, uncropped photo without leaving the shop page.
export default function ExpandButton(props: Props) {
  const [open, setOpen] = useState(false);
  const { p } = props;
  return (
    <>
      <button type="button" className="xp" aria-label={`See full photo${p.name ? ` of ${p.name}` : ""}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}><IconExpand size={22} /></button>
      {open && createPortal(<Lightbox {...props} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Lightbox({ p, slug, shopName, whatsapp, onClose }: Props & { onClose: () => void }) {
  const imgs = p.imageUrls, n = imgs.length, [i, setI] = useState(0), closeRef = useRef<HTMLButtonElement>(null), x0 = useRef<number | null>(null);
  const move = (d: number) => n > 1 && setI((x) => (x + d + n) % n);
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null, prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prevOverflow; prevFocus?.focus?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const wa = whatsapp.replace(/\D/g, "");
  const href = () => `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${shopName}, I am interested in ${p.name || "this item"}${p.price !== null ? ` (${naira(p.price)})` : ""}: ${location.origin}/${slug}/p/${p.id}`)}`;
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={p.name || "Product photo"} onClick={onClose}>
      <div className="lb-box" onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => (x0.current = e.clientX)} onPointerUp={(e) => { if (x0.current !== null && Math.abs(e.clientX - x0.current) > 50) move(e.clientX < x0.current ? 1 : -1); x0.current = null; }}>
        <button ref={closeRef} className="lb-x" aria-label="Close" onClick={onClose}><IconClose /></button>
        <div className="lb-img">
          {n ? /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={imgs[i]} alt={p.name || "Product photo"} draggable={false} /> : <span className="lb-emoji">{p.emoji}</span>}
          {n > 1 && <><button className="lb-a l" aria-label="Previous photo" onClick={() => move(-1)}>‹</button><button className="lb-a r" aria-label="Next photo" onClick={() => move(1)}>›</button></>}
        </div>
        {n > 1 && <div className="dots lb-dots">{imgs.map((u, j) => <button key={u} className="dot" aria-current={j === i} aria-label={`Photo ${j + 1}`} onClick={() => setI(j)} />)}</div>}
        <div className="lb-info">
          <div><div className="lb-name">{p.name || shopName}</div><div className="lb-price">{priceLabel(p.price)}</div></div>
          <div className="row">
            <AddToCart p={p} />
            <Link className="btn alt sm" href={`/${slug}/p/${p.id}`} onClick={onClose}>Details</Link>
            {wa && <TapLink shopId={p.shopId} ownerUid={p.sellerUid} productId={p.id} className="btn wa sm" href={href()}><IconChat size={20} /> Order</TapLink>}
          </div>
        </div>
      </div>
    </div>
  );
}
