"use client";
import { useEffect, useRef, useState } from "react";

// An optional photo: shows only if the file exists. Missing files never show a broken-image icon.
export function useImg() {
  const ref = useRef<HTMLImageElement>(null), [s, setS] = useState<"load" | "ok" | "bad">("load");
  useEffect(() => { const i = ref.current; if (i?.complete) setS(i.naturalWidth > 0 ? "ok" : "bad"); }, []);
  return { ref, s, onLoad: () => setS("ok"), onError: () => setS("bad") };
}

export default function Photo({ src, className = "", caption, onOk, eager = false }: { src: string; className?: string; caption?: string; onOk?: () => void; eager?: boolean }) {
  const { ref, s, onLoad, onError } = useImg();
  useEffect(() => { if (s === "ok") onOk?.(); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  if (s === "bad") return null;
  return (
    <figure className={`pf ${className}${s === "ok" ? " show" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} src={src} alt="" loading={eager ? "eager" : "lazy"} onLoad={onLoad} onError={onError} draggable={false} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
