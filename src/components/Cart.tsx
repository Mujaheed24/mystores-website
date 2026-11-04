"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconChat, IconClose } from "./Icons";
import { useTracker } from "./Track";
import { naira, type Product } from "@/lib/types";

// A simple order list. The customer adds several products, then sends ONE WhatsApp message to the seller.
// It lives in the customer's own browser (one list per shop). It is not an online checkout and takes no payment.
type Line = { id: string; name: string; price: number | null; qty: number; max: number; img?: string };
type ShopInfo = { id: string; slug: string; name: string; whatsapp: string; ownerUid: string };
type Ctx = { shop: ShopInfo; lines: Line[]; count: number; qtyOf: (id: string) => number; add: (p: Product) => void; setQty: (id: string, q: number) => void; remove: (id: string) => void; clear: () => void; open: () => void };
const C = createContext<Ctx | null>(null);
const useCart = () => useContext(C);
const MAX_LINES = 20, MAX_QTY = 99;
const key = (id: string) => `ms-cart:${id}`;

export function CartProvider({ shop, children }: { shop: ShopInfo; children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]), [show, setShow] = useState(false), [loaded, setLoaded] = useState(false);
  useEffect(() => { // read the saved list after the page has loaded (never during the server render)
    try { const raw = localStorage.getItem(key(shop.id)); if (raw) setLines((JSON.parse(raw) as Line[]).filter((l) => l && typeof l.id === "string" && l.qty > 0).slice(0, MAX_LINES)); } catch { /* private mode: start empty */ }
    setLoaded(true);
  }, [shop.id]);
  useEffect(() => { if (loaded) try { localStorage.setItem(key(shop.id), JSON.stringify(lines)); } catch { /* ignore */ } }, [lines, loaded, shop.id]);
  const value = useMemo<Ctx>(() => ({
    shop, lines, count: lines.reduce((n, l) => n + l.qty, 0), open: () => setShow(true),
    qtyOf: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
    add: (p) => setLines((ls) => {
      const max = Math.min(MAX_QTY, Math.max(1, p.stockQuantity)), i = ls.findIndex((l) => l.id === p.id);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: Math.min(max, l.qty + 1), max } : l));
      if (ls.length >= MAX_LINES) return ls;
      return [...ls, { id: p.id, name: p.name, price: p.price, qty: 1, max, img: p.thumbUrl || p.imageUrls[0] }];
    }),
    setQty: (id, q) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(l.max, q)) } : l))),
    remove: (id) => setLines((ls) => ls.filter((l) => l.id !== id)),
    clear: () => setLines([]),
  }), [shop, lines]);
  return <C.Provider value={value}>{children}{show && typeof document !== "undefined" && createPortal(<Sheet onClose={() => setShow(false)} />, document.body)}</C.Provider>;
}

// "Add to order" button for one product. Hidden when the product is sold out.
export function AddToCart({ p, className = "btn alt sm" }: { p: Product; className?: string }) {
  const cart = useCart(), [flash, setFlash] = useState(false);
  if (!cart || p.stockQuantity <= 0) return null;
  const n = cart.qtyOf(p.id);
  return (
    <button type="button" className={className} onClick={(e) => { e.preventDefault(); e.stopPropagation(); cart.add(p); setFlash(true); setTimeout(() => setFlash(false), 1200); }}>
      {flash ? "✓ Added" : n ? `+ Add another (${n} in order)` : "+ Add to order"}
    </button>
  );
}

// Floating "Your order" button. Only shows when something has been added.
export function CartButton({ lift = false }: { lift?: boolean }) {
  const cart = useCart();
  if (!cart || cart.count === 0) return null;
  return <button type="button" className={`cartfab${lift ? " lift" : ""}`} onClick={cart.open} aria-label={`Open your order, ${cart.count} items`}>🛒 Your order <b>{cart.count}</b></button>;
}

function Sheet({ onClose }: { onClose: () => void }) {
  const cart = useCart()!, { shop, lines } = cart, t = useTracker(shop.id, shop.ownerUid);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", k); };
  }, [onClose]);
  const priced = lines.filter((l) => l.price !== null), total = priced.reduce((n, l) => n + (l.price as number) * l.qty, 0), unpriced = lines.length - priced.length;
  const wa = shop.whatsapp.replace(/\D/g, "");
  // WhatsApp links break when the message is too long, so we add a product link to as many lines as fit (earliest lines first),
  // never a fixed number. Names are shortened for big orders. The "Copy order" button has no length limit at all.
  const URL_BUDGET = 3000; // characters of the encoded wa.me address; safe for phones and WhatsApp Web
  function build(nameMax: number, linkCount: number) {
    const origin = location.origin;
    const rows = lines.map((l, i) => {
      const nm = (l.name || "Item (see photo)").slice(0, nameMax);
      return `${i + 1}. ${nm} x${l.qty}${l.price !== null ? ` - ${naira(l.price * l.qty)}` : " - ask price"}${i < linkCount ? `\n   ${origin}/${shop.slug}/p/${l.id}` : ""}`;
    });
    const tail = priced.length ? `\nTotal: ${naira(total)}${unpriced ? ` (+ ${unpriced} to confirm)` : ""}` : "";
    return `Hello ${shop.name}, I would like to order:\n\n${rows.join("\n")}${tail}\n\nPlease confirm availability, delivery and payment.`;
  }
  function message() {
    for (const nameMax of [60, 30]) for (let n = lines.length; n >= 0; n--) { const m = build(nameMax, n); if (encodeURIComponent(m).length <= URL_BUDGET) return m; }
    return build(30, 0);
  }
  function fullMessage() { return build(120, lines.length); }
  const href = () => `https://wa.me/${wa}?text=${encodeURIComponent(message())}`;
  const [copied, setCopied] = useState(false);
  const tooLong = lines.length > 0 && typeof location !== "undefined" && encodeURIComponent(build(60, lines.length)).length > URL_BUDGET;
  async function copy() { try { await navigator.clipboard.writeText(fullMessage()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { prompt("Copy your order:", fullMessage()); } }
  return (
    <div className="lb cartwrap" role="dialog" aria-modal="true" aria-label="Your order" onClick={onClose}>
      <div className="cartsheet" onClick={(e) => e.stopPropagation()}>
        <div className="carthead"><h3>Your order</h3><button className="lb-x" style={{ position: "static" }} aria-label="Close" onClick={onClose}><IconClose /></button></div>
        {lines.length === 0 ? <p className="muted" style={{ padding: "20px 4px" }}>Your order is empty. Tap “Add to order” on the products you want.</p> : (
          <div className="cartlines">
            {lines.map((l) => (
              <div className="cline" key={l.id}>
                <div className="tn">{l.img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={l.img} alt="" /> : "🛍️"}</div>
                <div className="ci"><b>{l.name || "Item"}</b><span className="muted">{l.price === null ? "Ask for price" : naira(l.price * l.qty)}</span></div>
                <div className="qty" role="group" aria-label={`Quantity of ${l.name || "item"}`}>
                  <button type="button" aria-label="Fewer" onClick={() => (l.qty > 1 ? cart.setQty(l.id, l.qty - 1) : cart.remove(l.id))}>−</button>
                  <span aria-live="polite">{l.qty}</span>
                  <button type="button" aria-label="More" disabled={l.qty >= l.max} onClick={() => cart.setQty(l.id, l.qty + 1)}>+</button>
                </div>
                <button type="button" className="rm" aria-label={`Remove ${l.name || "item"}`} onClick={() => cart.remove(l.id)}>×</button>
              </div>
            ))}
          </div>
        )}
        {lines.length > 0 && <>
          <div className="carttot"><span>Total</span><b>{priced.length ? naira(total) : "Ask seller"}</b></div>
          {unpriced > 0 && priced.length > 0 && <p className="muted hint">{unpriced} item{unpriced > 1 ? "s have" : " has"} no price yet. The seller will confirm it.</p>}
          <p className="muted hint">This sends your list to {shop.name} on WhatsApp. You pay and arrange delivery with the seller.</p>
          {wa && <a className="btn wa" href={href()} onClick={() => t.count("taps")}><IconChat /> Send order on WhatsApp</a>}
          {tooLong && <p className="muted hint">Big order: product links are added to the first items only. Tap “Copy full order with all links” and paste it into your WhatsApp chat with {shop.name} to include every link.</p>}
          {tooLong && <button type="button" className="btn alt sm" style={{ marginTop: 10 }} onClick={copy}>{copied ? "✓ Copied" : "Copy full order with all links"}</button>}
          <button type="button" className="btn alt sm" style={{ marginTop: 10 }} onClick={() => { if (confirm("Clear your whole order?")) cart.clear(); }}>Clear order</button>
        </>}
      </div>
    </div>
  );
}
