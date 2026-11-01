"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import AuthForm from "@/components/AuthForm";
import InstallApp from "@/components/InstallApp";
import BottomNav, { type Tab } from "@/components/dash/BottomNav";
import Overview from "@/components/dash/Overview";
import ProductCard from "@/components/dash/ProductCard";
import QuickAdd from "@/components/dash/QuickAdd";
import DeleteShop from "@/components/dash/DeleteShop";
import Profile from "@/components/dash/Profile";
import ProductForm from "@/components/ProductForm";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { deleteImages } from "@/lib/images";
import { MAX_FEATURED } from "@/lib/options";
import { CONTACT_EMAIL, CONTACT_WA_DIGITS } from "@/lib/contact";
import { errText, getAllProducts, getMyShop } from "@/lib/seller";
import { deleteStat, getStats, type StatMap } from "@/lib/stats";
import type { Product, Shop } from "@/lib/types";

export default function Dashboard() {
  const { user, loading } = useAuth(), router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null), [products, setProducts] = useState<Product[]>([]), [stats, setStats] = useState<StatMap>({});
  const [tab, setTab] = useState<Tab>("Home"), [editing, setEditing] = useState<Product | undefined>(), [toast, setToast] = useState(""), [ready, setReady] = useState(false), [dataReady, setDataReady] = useState(false), [mode, setMode] = useState<"one" | "many">("one");
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2600); };
  const load = useCallback(async (s: Shop) => {
    // products and numbers are fetched at the same time (faster than one after the other)
    const [pr, st] = await Promise.all([getAllProducts(s.id), getStats(s.id).catch(() => null)]); // numbers are a bonus: never block the dashboard
    setProducts(pr); if (st) setStats(st);
  }, []);
  const goTab = (t: Tab) => { setEditing(undefined); setTab(t); window.scrollTo({ top: 0, behavior: "smooth" }); };

  useEffect(() => { // links like /dashboard?tab=Profile open that tab directly
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "Profile" || t === "Products" || t === "Form" || t === "Home") setTab(t);
  }, []);
  useEffect(() => {
    if (!user) return;
    getMyShop(user.uid).then(async (s) => { if (!s) return router.replace("/sell"); setShop(s); setReady(true); await load(s); setDataReady(true); }).catch((e) => { say(errText(e)); setReady(true); setDataReady(true); }); // the page appears as soon as the shop is known; products fill in after
  }, [user, router, load]);

  if (loading || (user && !ready)) return <main className="wrap" aria-busy="true"><div className="skel" style={{ height: 60, width: "60%" }} /><div className="skel" style={{ height: 170, margin: "20px 0" }} /><div className="skel" style={{ height: 220 }} /></main>;
  if (!user) return <main className="wrap" style={{ textAlign: "center", paddingTop: 50 }}><h1 style={{ marginBottom: 12 }}>Your shop dashboard</h1><p className="lead" style={{ margin: "0 auto 26px" }}>Sign in to manage your shop.</p><AuthForm /></main>;
  if (!shop) return <main className="wrap"><p className="muted">Could not load your shop. Refresh the page.</p></main>;

  const featuredCount = products.filter((p) => p.featured).length;
  const patch = async (p: Product, d: Partial<Product>, msg: string) => {
    const before = products;
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...d } : x))); // show the change at once, then save
    try { await updateDoc(doc(db, "shops", shop.id, "products", p.id), { ...d, updatedAt: serverTimestamp() }); say(msg); } catch (e) { setProducts(before); say(errText(e)); }
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await deleteDoc(doc(db, "shops", shop.id, "products", p.id)); setProducts((ps) => ps.filter((x) => x.id !== p.id)); await Promise.all([deleteStat(shop.id, p.id), deleteImages([...p.imageUrls, ...(p.thumbUrl ? [p.thumbUrl] : [])])]); say("Product deleted"); } catch (e) { say(errText(e)); }
  };
  const statusNote = shop.status === "active" ? null : shop.status === "pending"
    ? "Your shop is waiting for approval. Add your products now. Customers can see your shop once it is approved."
    : "Your shop is suspended and hidden from customers. Please contact support.";
  const ask = `Hello MyStores, my shop "${shop.name}" (mystores.com.ng/${shop.slug}) is ${shop.status === "pending" ? "waiting for approval" : "suspended"}. Please can you help?`;
  const waHref = CONTACT_WA_DIGITS ? `https://wa.me/${CONTACT_WA_DIGITS}?text=${encodeURIComponent(ask)}` : "", mailHref = CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`My shop ${shop.slug}`)}&body=${encodeURIComponent(ask)}` : "";

  return (
    <main className="wrap" style={{ ["--sa" as string]: shop.themeColor }}>
      <div className="dhead">
        <div><h1 style={{ fontSize: "clamp(32px,7vw,48px)", marginBottom: 10 }}>{shop.name}</h1><span className={`status ${shop.status}`}>{shop.status === "active" ? "Live" : shop.status === "pending" ? "Waiting for approval" : "Suspended"}</span></div>
        <div className="row">
          {shop.status === "active" && <Link className="btn sm" href={`/${shop.slug}`}>👁 View my shop</Link>}
          <button type="button" className="btn alt sm" onClick={() => goTab("Profile")}>⚙ Shop settings</button>
        </div>
      </div>
      {statusNote && <div className="note">{statusNote}
        {(waHref || mailHref) && <div className="row" style={{ marginTop: 12 }}>
          {waHref && <a className="btn wa sm" href={waHref}>💬 Contact MyStores on WhatsApp</a>}
          {mailHref && <a className="btn alt sm" href={mailHref}>✉ Send an email</a>}
        </div>}
      </div>}
      <InstallApp />
      <BottomNav tab={tab} onTab={goTab} />

      {!dataReady && tab !== "Profile" && <div aria-busy="true" role="status" aria-label="Loading your products"><div className="skel" style={{ height: 150, marginBottom: 16 }} /><div className="skel" style={{ height: 120, marginBottom: 16 }} /><div className="skel" style={{ height: 200 }} /></div>}
      {dataReady && tab === "Home" && <Overview shop={shop} products={products} stats={stats} go={goTab} />}

      {dataReady && tab === "Products" && (products.length ? (
        <div className="plist">{products.map((p) => (
          <ProductCard key={p.id} p={p} stat={stats[p.id]} canFeature={featuredCount < MAX_FEATURED}
            onToggle={() => patch(p, p.status === "published" ? { status: "draft", featured: false } : { status: "published" }, p.status === "published" ? "Product hidden" : "Product is now visible")}
            onFeature={() => patch(p, { featured: !p.featured }, p.featured ? "Removed from Recommended" : "Added to Recommended")}
            onEdit={() => { setEditing(p); setTab("Form"); window.scrollTo({ top: 0 }); }} onDelete={() => remove(p)} />))}</div>
      ) : <div className="card" style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 64 }}>📦</div><h3 style={{ margin: "10px 0" }}>No products yet</h3><p className="muted" style={{ marginBottom: 20 }}>Add your first product and it will show in your shop.</p><button className="btn" onClick={() => goTab("Form")}>Add a product</button></div>)}

      {dataReady && tab === "Form" && (
        <>
          {!editing && <div className="seg" role="group" aria-label="How many products"><button aria-pressed={mode === "one"} onClick={() => setMode("one")}>One product</button><button aria-pressed={mode === "many"} onClick={() => setMode("many")}>Many photos</button></div>}
          {mode === "many" && !editing
            ? <QuickAdd shop={shop} uid={user.uid} onDone={async (m) => { await load(shop); setTab("Products"); say(m); window.scrollTo({ top: 0 }); }} />
            : <ProductForm key={editing?.id ?? "new"} shop={shop} uid={user.uid} product={editing} featuredCount={featuredCount}
                categories={Array.from(new Set(products.map((p) => p.category)))}
                onDone={async (m) => { await load(shop); setEditing(undefined); setTab("Products"); say(m); window.scrollTo({ top: 0 }); }} onCancel={() => goTab("Products")} />}
        </>
      )}

      {tab === "Profile" && <><Profile shop={shop} onSaved={(s) => { setShop(s); say("Shop saved"); }} /><DeleteShop shop={shop} /></>}
      <div className="dnav-pad" />
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
