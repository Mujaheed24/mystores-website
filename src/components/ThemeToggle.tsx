"use client";
import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";

// Light / dark switch. Remembers the choice; the first visit follows the phone's own setting.
export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const a = document.documentElement.getAttribute("data-theme");
    setDark(a ? a === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const flip = () => {
    const next = !dark, root = document.documentElement;
    root.classList.add("theming"); setTimeout(() => root.classList.remove("theming"), 450);
    setDark(next); root.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("ms-theme", next ? "dark" : "light"); } catch { /* private mode */ }
  };
  return (
    <button className="tt" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={!!dark}>
      {dark ? <IconSun key="s" /> : <IconMoon key="m" />}
    </button>
  );
}
