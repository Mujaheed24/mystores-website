import Link from "next/link";
import HeroPhone from "./HeroPhone";
import HeroPhotos from "./HeroPhotos";
import Photo from "./Photo";
import SellerStrip from "./SellerStrip";
import { IconBox, IconChat, IconArrow, IconShop } from "./Icons";
import Reveal from "./Reveal";
import SlugChecker from "./SlugChecker";
import ShopDirectory, { type DirShop } from "./ShopDirectory";
import type { Shop } from "@/lib/types";

const STEPS = [
  { n: "1", icon: <IconShop size={32} />, t: "Pick your shop address", d: "Choose a name like mystores.com.ng/yourshop. It is yours alone." },
  { n: "2", icon: <IconBox size={32} />, t: "Add your products", d: "Take photos on your phone, type the price, tap publish. That is all." },
  { n: "3", icon: <IconChat size={32} />, t: "Share and sell on WhatsApp", d: "Send your link to customers. They tap one button and chat with you." },
];
const PERKS = [["📱", "Works on any phone"], ["🔗", "Your own shop link"], ["💬", "Orders on WhatsApp"], ["🎨", "Looks like your brand"]];

const toDir = (s: Shop): DirShop => ({ id: s.id, slug: s.slug, name: s.name, category: s.category, categories: s.categories, description: s.description, themeColor: s.themeColor, logoUrl: s.logoUrl, bannerUrl: s.bannerUrl, state: s.state, city: s.city, locations: s.locations });

export default function HomeView({ shops }: { shops: Shop[] }) {
  return (
    <main className="wrap">
      <section className="hero">
        <i className="blob b1" /><i className="blob b2" />
        <div>
          <h1>Your shop. Your link. <em>Your customers</em> on WhatsApp.</h1>
          <p className="lead">Open a beautiful online store in minutes. Add your products, share one link, and customers order straight on WhatsApp.</p>
          <div className="row">
            <Link href="/sell" className="btn">Open my store <IconArrow /></Link>
            <a href="#shops" className="btn alt">See shops</a>
          </div>
          <SlugChecker />
        </div>
        <div className="hero-art"><HeroPhotos /><HeroPhone /></div>
      </section>

      <section className="sec">
        <Reveal><h2>Three steps. No tech skills.</h2><p className="muted">If you can use WhatsApp, you can run your store.</p></Reveal>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}><div className="card step"><Photo className="stepimg" src={`/images/home/step-${s.n}.jpg`} /><span className="n">{s.n}</span><div className="ic">{s.icon}</div><h3>{s.t}</h3><p>{s.d}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="perks">
          {PERKS.map(([e, t], i) => <Reveal key={t} delay={i * 80}><div className="card perk"><i>{e}</i>{t}</div></Reveal>)}
        </div>
      </section>

      <SellerStrip />

      <section className="sec" id="shops">
        <Reveal><h2>Shops on MyStores</h2><p className="muted">Tap a shop to visit it.</p></Reveal>
        <ShopDirectory shops={shops.map(toDir)} />
      </section>

      <Reveal>
        <section className="band photo"><h2>Ready to sell from your own link?</h2><Link href="/sell" className="btn">Open my store <IconArrow /></Link></section>
      </Reveal>
    </main>
  );
}
