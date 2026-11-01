"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Fades and lifts its content into view the first time it scrolls on screen.
export default function Reveal({ children, delay = 0, className = "", instant = false }: { children: ReactNode; delay?: number; className?: string; instant?: boolean }) {
  const ref = useRef<HTMLDivElement>(null), [on, setOn] = useState(instant);
  useEffect(() => {
    const el = ref.current;
    if (instant || !el || !("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv${on ? " in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
