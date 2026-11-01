import { IconEdit, IconStar, IconTrash } from "../Icons";
import type { Stat } from "@/lib/stats";
import { priceLabel, type Product } from "@/lib/types";

export default function ProductCard({ p, stat, canFeature, onToggle, onFeature, onEdit, onDelete }: {
  p: Product; stat?: Stat; canFeature: boolean; onToggle: () => void; onFeature: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const live = p.status === "published";
  return (
    <article className="card prow">
      <div className="top">
        <div className="tn">{p.imageUrls[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumbUrl || p.imageUrls[0]} alt="" loading="lazy" decoding="async" /> : p.emoji}</div>
        <div><h3>{p.name || "Photo only"}</h3><div className="sub">{priceLabel(p.price)} · {p.stockQuantity === 0 ? "Sold out" : `${p.stockQuantity} in stock`}</div>
          <div className="sub stat" aria-label={`${stat?.views ?? 0} views, ${stat?.taps ?? 0} WhatsApp taps`}>👁 {stat?.views ?? 0} views · 💬 {stat?.taps ?? 0} taps</div></div>
      </div>
      <div className="acts">
        <button className="sw-t" aria-pressed={live} onClick={onToggle}><i />{live ? "Visible" : "Hidden"}</button>
        <button className="ib" aria-pressed={p.featured} aria-label={p.featured ? "Remove from Recommended" : "Add to Recommended"} disabled={!live || (!p.featured && !canFeature)} onClick={onFeature}><IconStar fill={p.featured} /></button>
        <button className="ib" aria-label={`Edit ${p.name || "product"}`} onClick={onEdit}><IconEdit /></button>
        <button className="ib del" aria-label={`Delete ${p.name || "product"}`} onClick={onDelete}><IconTrash /></button>
      </div>
    </article>
  );
}
