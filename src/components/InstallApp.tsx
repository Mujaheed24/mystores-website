"use client";
import { useEffect, useState } from "react";

type Prompt = Event & { prompt: () => Promise<void> };
const KEY = "ms-install-hidden";
// Offers sellers a one-tap install (Android/desktop) or the Add to Home Screen hint (iPhone).
export default function InstallApp() {
  const [ev, setEv] = useState<Prompt | null>(null), [ios, setIos] = useState(false), [hidden, setHidden] = useState(true);
  useEffect(() => {
    let off = false; try { off = localStorage.getItem(KEY) === "1"; } catch { /* private mode */ }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHidden(off || standalone);
    const h = (e: Event) => { e.preventDefault(); setEv(e as Prompt); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const hide = () => { setHidden(true); try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } };
  if (hidden || (!ev && !ios)) return null;
  return (
    <div className="note" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ flex: "1 1 220px" }}>{ev ? "Put MyStores on your phone like an app." : "To put MyStores on your iPhone: tap the Share button, then Add to Home Screen."}</span>
      {ev && <button className="btn sm" onClick={async () => { await ev.prompt(); setEv(null); hide(); }}>Install</button>}
      <button className="btn alt sm" onClick={hide}>Not now</button>
    </div>
  );
}
