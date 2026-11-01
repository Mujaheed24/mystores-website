"use client";
import { useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { IconExpand } from "./Icons";
import ZoomViewer from "./ZoomViewer";

export default function Gallery({ p }: { p: Pick<Product, "imageUrls" | "emoji" | "name"> }) {
  const imgs = p.imageUrls ?? [], [i, setI] = useState(0), [zoom, setZoom] = useState(false), x0 = useRef<number | null>(null), dx = useRef(0);
  const move = (d: number) => imgs.length > 1 && setI((i + d + imgs.length) % imgs.length);
  return (
    <div>
      <div className="ph" style={{ touchAction: "pan-y", cursor: imgs.length ? "zoom-in" : undefined }}
        onPointerDown={(e) => { x0.current = e.clientX; dx.current = 0; }}
        onPointerUp={(e) => { if (x0.current !== null) { dx.current = e.clientX - x0.current; if (Math.abs(dx.current) > 40) move(dx.current < 0 ? 1 : -1); } x0.current = null; }}
        onClick={() => { if (imgs.length && Math.abs(dx.current) < 10) setZoom(true); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imgs.length ? <img key={i} src={imgs[i]} alt={p.name} draggable={false} style={{ animation: "pageIn .5s var(--ease)" }} /> : p.emoji}
        {imgs.length > 0 && (
          <button type="button" className="xp" style={{ opacity: 1, transform: "none" }} aria-label="Zoom photo" onClick={(e) => { e.stopPropagation(); setZoom(true); }} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}><IconExpand size={22} /></button>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="thumbs">{imgs.map((u, j) => (
          <button key={u} className="thumb" aria-pressed={i === j} aria-label={`Photo ${j + 1}`} onClick={() => setI(j)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" /></button>))}</div>
      )}
      {zoom && <ZoomViewer images={imgs} start={i} alt={p.name} emoji={p.emoji} onClose={() => setZoom(false)} />}
    </div>
  );
}
