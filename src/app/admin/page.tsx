"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getCountFromServer, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { adminDeleteShop } from "@/lib/deleteShop";
import { LEGAL_EMAIL } from "@/lib/contact";
import { errText } from "@/lib/seller";
import { placeLabel } from "@/lib/options";
import type { Shop } from "@/lib/types";
import s from "./admin.module.css";

type AShop = Shop & { createdMs: number };
type Counts = { total: number; live: number };
type Filter = "all" | Shop["status"];
const LABEL: Record<Filter, string> = { all: "All", pending: "Waiting", active: "Active", suspended: "Suspended" };
const WEEK = 7 * 24 * 3600 * 1000;
// Free "notifications": a ready-written WhatsApp message to the seller (opens WhatsApp, you press send).
type Kind = "approved" | "suspended" | "hello";
const waLink = (x: Shop, kind: Kind) => {
  const n = x.whatsappNumber.replace(/\D/g, "");
  const text = kind === "approved" ? `Hello ${x.name}, your MyStores shop is now live: mystores.com.ng/${x.slug}. Share the link with your customers. Reply here if you need any help.`
    : kind === "suspended" ? `Hello ${x.name}, your MyStores shop has been paused because we found a problem with it. Please reply here or write to ${LEGAL_EMAIL} so we can sort it out together.`
    : `Hello ${x.name}, this is MyStores.`;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "";
};

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [shops, setShops] = useState<AShop[]>([]), [msg, setMsg] = useState(""), [counts, setCounts] = useState<Record<string, Counts>>({});
  const [notice, setNotice] = useState<{ x: AShop; kind: Kind } | null>(null), [busyDel, setBusyDel] = useState(""), [newReports, setNewReports] = useState<number | null>(null), [q, setQ] = useState(""), [filter, setFilter] = useState<Filter>("all"), [state, setState] = useState("");

  const load = useCallback(async () => {
    const snap = await getDocs(collection(db, "shops"));
    setShops(snap.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, createdMs: x.createdAt?.toMillis?.() ?? 0 } as AShop; }));
  }, []);
  useEffect(() => { if (isAdmin) load().catch((e) => setMsg(errText(e))); }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return;
    getCountFromServer(query(collection(db, "reports"), where("status", "==", "new"))).then((c) => setNewReports(c.data().count)).catch(() => {});
  }, [isAdmin]);

  // Product COUNTS, one shop at a time (never a query across all shops' products).
  useEffect(() => {
    const todo = shops.filter((x) => !counts[x.id]);
    if (!isAdmin || !todo.length) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < todo.length; i += 6) {
        const part = await Promise.all(todo.slice(i, i + 6).map(async (x) => {
          try {
            const col = collection(db, "shops", x.id, "products");
            const [t, l] = await Promise.all([getCountFromServer(col), getCountFromServer(query(col, where("status", "==", "published")))]);
            return [x.id, { total: t.data().count, live: l.data().count }] as const;
          } catch { return null; }
        }));
        if (cancelled) return;
        setCounts((c) => ({ ...c, ...Object.fromEntries(part.filter((p): p is NonNullable<typeof p> => !!p)) }));
      }
    })();
    return () => { cancelled = true; };
  }, [shops, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const states = useMemo(() => Array.from(new Set(shops.map((x) => x.state).filter((v): v is string => !!v))).sort(), [shops]);
  const by = (st: Shop["status"]) => shops.filter((x) => x.status === st).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const order = { pending: 0, active: 1, suspended: 2 };
    return shops
      .filter((x) => (filter === "all" || x.status === filter) && (!state || x.state === state)
        && (!needle || [x.name, x.slug, x.category, x.city, x.state, x.whatsappNumber].join(" ").toLowerCase().includes(needle)))
      .sort((a, b) => order[a.status] - order[b.status] || b.createdMs - a.createdMs);
  }, [shops, q, filter, state]);

  // Browser tab shows how many things are waiting, e.g. "(3) MyStores admin". Free, no server needed.
  const waiting = shops.filter((x) => x.status === "pending").length + (newReports ?? 0);
  useEffect(() => { if (isAdmin) document.title = `${waiting ? `(${waiting}) ` : ""}MyStores admin`; }, [isAdmin, waiting]);

  if (loading) return <main className="wrap" aria-busy="true"><div className="skel" style={{ height: 200 }} /></main>;
  if (!user || !isAdmin) return <main className="wrap"><div className="card"><h2>Administrators only</h2><p className="muted" style={{ marginTop: 8 }}>This page is for the MyStores administrator.</p></div></main>;

  const setStatus = async (x: AShop, status: Shop["status"]) => {
    try { await updateDoc(doc(db, "shops", x.id), { status, updatedAt: serverTimestamp() }); await load(); setMsg(`${x.name} is now ${status}.`); if (status !== "pending") setNotice({ x, kind: status === "active" ? "approved" : "suspended" }); } catch (e) { setMsg(errText(e)); }
  };
  const remove = async (x: AShop) => {
    const typed = window.prompt(`This deletes "${x.name}" and ALL its products, photos and numbers for good.\nType the shop address to confirm: ${x.slug}`);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== x.slug) return setMsg("The address did not match. Nothing was deleted.");
    setBusyDel(x.id);
    try { await adminDeleteShop(x, (m) => setMsg(m)); await load(); setNotice(null); setMsg(`${x.name} was deleted.`); }
    catch (e) { setMsg(`${errText(e)} The shop may be partly deleted. Try again.`); }
    setBusyDel("");
  };
  const newWeek = shops.filter((x) => x.createdMs > Date.now() - WEEK).length;
  const known = Object.values(counts), totalProducts = known.reduce((n, c) => n + c.total, 0), liveProducts = known.reduce((n, c) => n + c.live, 0);
  const countsDone = shops.length > 0 && shops.every((x) => counts[x.id]);
  const date = (ms: number) => (ms ? new Date(ms).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "");

  return (
    <main className="wrap">
      <h1 style={{ fontSize: "clamp(34px,7vw,52px)", marginBottom: 8 }}>All shops</h1>
      <div className={s.stats}>
        {([["Shops", shops.length], ["Waiting", by("pending")], ["Active", by("active")], ["Suspended", by("suspended")]] as [string, number][]).map(([l, n]) => <div className="card tile" key={l}><b>{n}</b><span>{l}</span></div>)}
      </div>
      <p className={s.sub}>{newWeek} new this week · {countsDone ? `${totalProducts} products (${liveProducts} visible)` : "counting products…"}</p>
      <div className="msg" role="status">{msg}</div>
      {notice && waLink(notice.x, notice.kind) && (
        <div className="note" style={{ marginBottom: 14 }}>
          {notice.x.name} is {notice.kind === "approved" ? "live" : "suspended"}. Tell the seller:{" "}
          <a className="btn sm" href={waLink(notice.x, notice.kind)} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>{" "}
          <button className="btn alt sm" onClick={() => setNotice(null)}>Not now</button>
        </div>
      )}
      <div className="row" style={{ marginBottom: 14 }}><Link className="btn alt" href="/admin/reports">Reports{newReports ? ` (${newReports} new)` : ""}</Link></div>

      <div className={s.tools}>
        <input type="search" aria-label="Search shops" placeholder="Search name, address, category, city or number" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by state" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>{states.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Filter by status" style={{ marginBottom: 16 }}>
        {(Object.keys(LABEL) as Filter[]).map((f) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{LABEL[f]}<span className={s.count}>{f === "all" ? shops.length : by(f)}</span></button>)}
      </div>

      <div className="plist">
        {shown.length === 0 && <div className={`card ${s.empty}`}><p className="muted">{shops.length ? "No shops match your search." : "No shops yet."}</p></div>}
        {shown.map((x) => {
          const c = counts[x.id], place = placeLabel(x);
          return (
            <article className="card" key={x.id}>
              <div className="arow">
                <div>
                  <h3>{x.name}</h3>
                  <div className="muted" style={{ margin: "4px 0 8px", fontWeight: 600, fontSize: 16 }}>mystores.com.ng/{x.slug} · {x.category}</div>
                  <div className={s.facts}>
                    <span>{c ? `${c.total} ${c.total === 1 ? "product" : "products"} (${c.live} visible)` : "… products"}</span>
                    {place && <span>📍 {place}</span>}
                    {x.whatsappNumber && <span>{x.whatsappNumber}</span>}
                    {x.createdMs > 0 && <span>Opened {date(x.createdMs)}</span>}
                  </div>
                  <span className={`status ${x.status}`}>{x.status}</span>
                </div>
                <div className="row">
                  {x.status === "active" && <a className="btn alt" href={`/${x.slug}`} target="_blank" rel="noopener noreferrer">View shop</a>}
                  {x.status !== "active" && <button className="btn" onClick={() => setStatus(x, "active")}>{x.status === "pending" ? "Approve" : "Reactivate"}</button>}
                  {x.status !== "suspended" && <button className="btn alt" onClick={() => setStatus(x, "suspended")}>Suspend</button>}
                  {waLink(x, "hello") && <a className="btn alt" href={waLink(x, "hello")} target="_blank" rel="noopener noreferrer">WhatsApp seller</a>}
                  <button className="btn dng" disabled={busyDel === x.id} aria-busy={busyDel === x.id} onClick={() => remove(x)}>{busyDel === x.id ? "Deleting…" : "Delete…"}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
