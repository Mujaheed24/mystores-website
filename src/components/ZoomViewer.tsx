"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./Icons";
import s from "./ZoomViewer.module.css";

type View = { s: number; x: number; y: number; smooth: boolean };
const MIN = 1, MAX = 5, TAP_ZOOM = 2.5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Full-screen photo viewer with zoom: pinch, double-tap/double-click, mouse wheel, +/- buttons, drag to move around,
// swipe or arrows to change photo, Esc to close. Rendered in a portal so no parent can trap it.
export default function ZoomViewer({ images, start = 0, alt, emoji, onClose }: { images: string[]; start?: number; alt: string; emoji?: string; onClose: () => void }) {
  const n = images.length, [i, setI] = useState(start), [v, setV] = useState<View>({ s: 1, x: 0, y: 0, smooth: false }), [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), closeBtn = useRef<HTMLButtonElement>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>()), pinch = useRef<{ d: number; s: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null), moved = useRef(0), lastTap = useRef({ t: 0, x: 0, y: 0 });
  const vRef = useRef(v); vRef.current = v;

  const bounds = (sc: number) => { const r = stage.current?.getBoundingClientRect(); return { bx: r ? ((sc - 1) * r.width) / 2 : 0, by: r ? ((sc - 1) * r.height) / 2 : 0 }; };
  // Zoom to scale s2 keeping the point (cx, cy), measured from the centre of the stage, where it is.
  const zoomTo = (s2: number, cx = 0, cy = 0, smooth = false) => {
    const cur = vRef.current, sc = clamp(s2, MIN, MAX), k = sc / cur.s;
    if (sc <= 1.001) return setV({ s: 1, x: 0, y: 0, smooth });
    const { bx, by } = bounds(sc);
    setV({ s: sc, x: clamp(cx - k * (cx - cur.x), -bx, bx), y: clamp(cy - k * (cy - cur.y), -by, by), smooth });
  };
  const rel = (e: { clientX: number; clientY: number }) => { const r = stage.current!.getBoundingClientRect(); return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }; };
  const go = (d: number) => { if (n < 2) return; setI((x) => (x + d + n) % n); setV({ s: 1, x: 0, y: 0, smooth: false }); };
  const pan = (dx: number, dy: number) => { const c = vRef.current, { bx, by } = bounds(c.s); setV({ ...c, x: clamp(c.x + dx, -bx, bx), y: clamp(c.y + dy, -by, by), smooth: true }); };

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null, prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => {
      const c = vRef.current;
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomTo(c.s * 1.5, 0, 0, true);
      else if (e.key === "-") zoomTo(c.s / 1.5, 0, 0, true);
      else if (e.key === "0") zoomTo(1, 0, 0, true);
      else if (e.key === "ArrowRight") c.s > 1 ? pan(-80, 0) : go(1);
      else if (e.key === "ArrowLeft") c.s > 1 ? pan(80, 0) : go(-1);
      else if (e.key === "ArrowUp" && c.s > 1) pan(0, 80);
      else if (e.key === "ArrowDown" && c.s > 1) pan(0, -80);
      else if (e.key === "Tab") { // keep keyboard focus inside the viewer
        const f = Array.from(root.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? []);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prevOverflow; prevFocus?.focus?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse wheel zoom needs a non-passive listener so the page behind does not scroll.
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); const p = rel(e); zoomTo(vRef.current.s * (e.deltaY < 0 ? 1.18 : 1 / 1.18), p.x, p.y); };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) { const [a, b] = Array.from(pts.current.values()); pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: vRef.current.s }; drag.current = null; }
    else { drag.current = { x: e.clientX, y: e.clientY, px: vRef.current.x, py: vRef.current.y }; moved.current = 0; setDragging(true); }
  };
  const move = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pts.current.values()), p = rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      zoomTo(pinch.current.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d), p.x, p.y);
    } else if (drag.current) {
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; moved.current = Math.max(moved.current, Math.hypot(dx, dy));
      const c = vRef.current;
      if (c.s > 1) { const { bx, by } = bounds(c.s); setV({ s: c.s, x: clamp(drag.current.px + dx, -bx, bx), y: clamp(drag.current.py + dy, -by, by), smooth: false }); }
    }
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current, wasPinch = pinch.current;
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    if (pts.current.size === 0) { drag.current = null; setDragging(false); }
    if (wasPinch || !d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (vRef.current.s <= 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) return go(dx < 0 ? 1 : -1); // swipe to the next photo
    if (moved.current < 8) { // a tap; two quick taps in the same place toggle the zoom
      const now = Date.now(), lt = lastTap.current;
      if (now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) { const p = rel(e); zoomTo(vRef.current.s > 1.05 ? 1 : TAP_ZOOM, p.x, p.y, true); lastTap.current = { t: 0, x: 0, y: 0 }; }
      else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
  };

  const zoomed = v.s > 1.001;
  return createPortal(
    <div className={s.ov} ref={root} role="dialog" aria-modal="true" aria-label={`${alt || "Photo"} (zoom)`}>
      <div className={s.bar}>
        <div className={s.tools}>
          <button className={s.b} onClick={() => zoomTo(v.s / 1.5, 0, 0, true)} disabled={!zoomed} aria-label="Zoom out">−</button>
          <button className={s.b} onClick={() => zoomTo(v.s * 1.5, 0, 0, true)} disabled={v.s >= MAX} aria-label="Zoom in">+</button>
          {zoomed && <button className={s.b} style={{ fontSize: 16 }} onClick={() => zoomTo(1, 0, 0, true)}>Reset</button>}
        </div>
        {n > 1 && <span className={s.cnt} aria-live="polite">{i + 1} / {n}</span>}
        <button ref={closeBtn} className={s.b} onClick={onClose} aria-label="Close"><IconClose /></button>
      </div>
      <div ref={stage} className={`${s.stage} ${zoomed ? s.z : ""} ${dragging && zoomed ? s.drag : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {n ? /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} className={`${s.img} ${v.smooth ? s.smooth : ""}`} src={images[i]} alt={alt} draggable={false} style={{ transform: `translate(${v.x}px,${v.y}px) scale(${v.s})` }} /> : <span className={s.emoji}>{emoji}</span>}
        {n > 1 && !zoomed && <><button className={`${s.a} ${s.l}`} aria-label="Previous photo" onClick={() => go(-1)} onPointerDown={(e) => e.stopPropagation()}>‹</button><button className={`${s.a} ${s.r}`} aria-label="Next photo" onClick={() => go(1)} onPointerDown={(e) => e.stopPropagation()}>›</button></>}
        {n > 0 && !zoomed && <div className={s.hint}>Double-tap or pinch to zoom</div>}
      </div>
    </div>,
    document.body,
  );
}
