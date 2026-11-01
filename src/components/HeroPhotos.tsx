"use client";
import { useImg } from "./Photo";

function Hp({ n, cls }: { n: number; cls: string }) {
  const { ref, s, onLoad, onError } = useImg();
  if (s === "bad") return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} className={`hp ${cls}${s === "ok" ? " show" : ""}`} src={`/images/home/hero-${n}.jpg`} alt="" onLoad={onLoad} onError={onError} draggable={false} />;
}
// Three floating photos around the hero phone. Add hero-1.jpg, hero-2.jpg, hero-3.jpg to public/images/home.
export default function HeroPhotos() { return <><Hp n={1} cls="hp1" /><Hp n={2} cls="hp2" /><Hp n={3} cls="hp3" /></>; }
