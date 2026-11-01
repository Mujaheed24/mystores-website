import s from "./ShopInfo.module.css";
import { shopPlaces } from "@/lib/options";
import type { Shop } from "@/lib/types";

// Shows the optional info a seller filled in: location, opening hours, delivery notes.
export default function ShopInfo({ shop }: { shop: Shop }) {
  const places = shopPlaces(shop), hours = shop.openingHours?.trim(), delivery = shop.deliveryNotes?.trim();
  if (!places.length && !hours && !delivery) return null;
  const rows: [string, string, string][] = [];
  if (places.length) rows.push(["📍", places.length > 1 ? "Where to find us" : "Where we are", places.map((x) => [x.city, x.state].filter(Boolean).join(", ")).join("\n")]);
  if (hours) rows.push(["🕒", "Opening hours", hours]);
  if (delivery) rows.push(["🚚", "Delivery", delivery]);
  return (
    <section className={`card ${s.box}`} aria-label="Shop information">
      {rows.map(([i, t, v]) => <div className={s.row} key={t}><span className={s.ic} aria-hidden="true">{i}</span><div><h3>{t}</h3><p>{v}</p></div></div>)}
    </section>
  );
}
