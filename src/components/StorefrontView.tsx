import Carousel from "./Carousel";
import { CartButton, CartProvider } from "./Cart";
import OwnerBar from "./OwnerBar";
import { IconChat } from "./Icons";
import ProductGrid from "./ProductGrid";
import ShareButton from "./ShareButton";
import ThemeToggle from "./ThemeToggle";
import Splash from "./Splash";
import ShopInfo from "./ShopInfo";
import { ClampText, ShopMeta } from "./ShopMeta";
import ReportButton from "./ReportButton";
import Track, { TapLink } from "./Track";
import { MAX_FEATURED, shopCategories, shopPlaces } from "@/lib/options";
import type { Product, Shop } from "@/lib/types";

export default function StorefrontView({ shop, products, preview = false }: { shop: Shop; products: Product[]; preview?: boolean }) {
  const inStock = products.filter((p) => p.stockQuantity > 0), marked = inStock.filter((p) => p.featured);
  const recommended = (marked.length >= 2 ? marked : inStock).slice(0, MAX_FEATURED);
  const wa = shop.whatsappNumber.replace(/\D/g, ""), chat = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${shop.name}, I saw your shop on MyStores.`)}` : "";
  return (
    <CartProvider shop={{ id: shop.id, slug: shop.slug, name: shop.name, whatsapp: shop.whatsappNumber, ownerUid: shop.ownerUid }}>
      {!preview && <OwnerBar ownerUid={shop.ownerUid} />}
      <main className="wrap" style={{ ["--sa" as string]: shop.themeColor }}>
        {!preview && <Track shopId={shop.id} ownerUid={shop.ownerUid} />}
        {!preview && <Splash name={shop.name} category={shopCategories(shop).length > 2 ? `${shopCategories(shop).slice(0, 2).join(", ")} +${shopCategories(shop).length - 2} more` : shopCategories(shop).join(", ")} slug={shop.slug} color={shop.themeColor} logoUrl={shop.logoUrl} />}
        <div className="toprow"><div className="addr">🔒 mystores.com.ng/<b>{shop.slug}</b></div><ThemeToggle /></div>
        <header className="sbanner" style={shop.bannerUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.48),rgba(0,0,0,.48)), url(${shop.bannerUrl})` } : undefined}>
          <div className="sb-in">
            <div className="lg">{shop.logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={shop.logoUrl} alt="" /> : shop.name[0]}</div>
            <div><h1>{shop.name}</h1><ClampText text={shop.description} /></div>
          </div>
          <div className="sb-actions">
            {chat && <TapLink shopId={shop.id} ownerUid={shop.ownerUid} className="btn wa" href={chat}><IconChat /> Chat on WhatsApp</TapLink>}
            <ShareButton title={shop.name} text={`Shop at ${shop.name} on MyStores`} />
          </div>
        </header>
        <ShopMeta cats={shopCategories(shop)} places={shopPlaces(shop).map((x) => [x.city, x.state].filter(Boolean).join(", "))} count={products.length} />
        <ShopInfo shop={shop} />
        <Carousel slug={shop.slug} shopName={shop.name} whatsapp={shop.whatsappNumber} items={recommended} />
        <ProductGrid slug={shop.slug} shopName={shop.name} whatsapp={shop.whatsappNumber} products={products} />
        {!preview && <div style={{ textAlign: "center", margin: "30px 0 90px" }}><ReportButton shopId={shop.id} label="Report this shop" /></div>}
      </main>
      <CartButton />
      {chat && <TapLink shopId={shop.id} ownerUid={shop.ownerUid} className="fab" href={chat} aria-label={`Chat with ${shop.name} on WhatsApp`}><IconChat size={30} /> Chat</TapLink>}
    </CartProvider>
  );
}
