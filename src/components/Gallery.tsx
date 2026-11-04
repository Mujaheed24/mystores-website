"use client";
import { useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { IconExpand } from "./Icons";
import ZoomViewer from "./ZoomViewer";

export default function Gallery({ p }: { p: Pick<Product, "imageUrls" | "emoji" | "name"> & { videoUrl?: string | null; videoPoster?: string | null } }) {
  const imgs = p.imageUrls ?? [], hasVid = !!p.videoUrl, total = imgs.length + (hasVid ? 1 : 0), [i, setI] = useState(0), [zoom, setZoom] = useState(false), x0 = useRef<number | null>(null), dx = useRef(0);
  const move = (d: number) => total > 1 && setI((i + d + total) % total);
  const onVideo = hasVid && i === 0, img = hasVid ? i - 1 : i; // item 0 is the video when there is one
  return (
    <div>
      <div className="ph" style={{ touchAction: "pan-y", cursor: imgs.length && !onVideo ? "zoom-in" : undefined }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("video")) { x0.current = null; return; } x0.current = e.clientX; dx.current = 0; }}
        onPointerUp={(e) => { if (x0.current !== null) { dx.current = e.clientX - x0.current; if (Math.abs(dx.current) > 40) move(dx.current < 0 ? 1 : -1); } x0.current = null; }}
        onClick={() => { if (imgs.length && !onVideo && Math.abs(dx.current) < 10) setZoom(true); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {onVideo ? /* eslint-disable-next-line jsx-a11y/media-has-caption */ <video key="v" src={p.videoUrl!} poster={p.videoPoster ?? imgs[0]} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
          : imgs.length ? <img key={i} src={imgs[img]} alt={p.name} draggable={false} style={{ animation: "pageIn .5s var(--ease)" }} /> : p.emoji}
        {imgs.length > 0 && !onVideo && (
          <button type="button" className="xp" style={{ opacity: 1, transform: "none" }} aria-label="Zoom photo" onClick={(e) => { e.stopPropagation(); setZoom(true); }} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}><IconExpand size={22} /></button>
        )}
      </div>
      {total > 1 && (
        <div className="thumbs">
          {hasVid && <button className="thumb vthumb" aria-pressed={i === 0} aria-label="Play video" onClick={() => setI(0)}>{/* eslint-disable-next-line @next/next/no-img-element */}{(p.videoPoster || imgs[0]) && <img src={p.videoPoster || imgs[0]} alt="" />}<span aria-hidden="true">▶</span></button>}
          {imgs.map((u, j) => { const k = hasVid ? j + 1 : j; return (
            <button key={u} className="thumb" aria-pressed={i === k} aria-label={`Photo ${j + 1}`} onClick={() => setI(k)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" /></button>); })}
        </div>
      )}
      {zoom && <ZoomViewer images={imgs} start={Math.max(0, img)} alt={p.name} emoji={p.emoji} onClose={() => setZoom(false)} />}
    </div>
  );
}
