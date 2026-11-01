"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { errText } from "@/lib/seller";
import { reasonLabel } from "@/lib/reports";
import type { Shop } from "@/lib/types";
import s from "../admin.module.css";

type Status = "new" | "reviewed" | "dismissed";
type Report = { id: string; shopId: string; productId?: string; reason: string; details?: string; contact?: string; status: Status; createdMs: number };
type Filter = "all" | Status;
const LABEL: Record<Filter, string> = { new: "New", reviewed: "Reviewed", dismissed: "Dismissed", all: "All" };

export default function Reports() {
  const { user, isAdmin, loading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]), [shops, setShops] = useState<Record<string, Shop>>({}), [msg, setMsg] = useState(""), [filter, setFilter] = useState<Filter>("new"), [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [r, sh] = await Promise.all([getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(300))), getDocs(collection(db, "shops"))]);
    setReports(r.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, createdMs: x.createdAt?.toMillis?.() ?? 0 } as Report; }));
    setShops(Object.fromEntries(sh.docs.map((d) => [d.id, { id: d.id, ...d.data() } as Shop])));
    setReady(true);
  }, []);
  useEffect(() => { if (isAdmin) load().catch((e) => setMsg(errText(e))); }, [isAdmin, load]);
  const shown = useMemo(() => reports.filter((r) => filter === "all" || r.status === filter), [reports, filter]);

  if (loading) return <main className="wrap" aria-busy="true"><div className="skel" style={{ height: 200 }} /></main>;
  if (!user || !isAdmin) return <main className="wrap"><div className="card"><h2>Administrators only</h2><p className="muted" style={{ marginTop: 8 }}>This page is for the MyStores administrator.</p></div></main>;

  const mark = async (r: Report, status: Status) => {
    try { await updateDoc(doc(db, "reports", r.id), { status, reviewedAt: serverTimestamp() }); await load(); setMsg(`Report marked ${status}.`); } catch (e) { setMsg(errText(e)); }
  };
  const suspend = async (r: Report) => {
    const sh = shops[r.shopId]; if (!sh) return;
    if (!confirm(`Suspend ${sh.name}? Its shop and products will be hidden from visitors.`)) return;
    try {
      await updateDoc(doc(db, "shops", sh.id), { status: "suspended", updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "reports", r.id), { status: "reviewed", reviewedAt: serverTimestamp() });
      await load(); setMsg(`${sh.name} is now suspended and the report is marked reviewed.`);
    } catch (e) { setMsg(errText(e)); }
  };
  const count = (f: Filter) => (f === "all" ? reports.length : reports.filter((r) => r.status === f).length);
  const date = (ms: number) => (ms ? new Date(ms).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

  return (
    <main className="wrap">
      <Link className="btn alt sm" href="/admin">← All shops</Link>
      <h1 style={{ fontSize: "clamp(34px,7vw,52px)", margin: "14px 0 8px" }}>Reports</h1>
      <p className={s.sub}>What visitors reported about shops and products.</p>
      <div className="msg" role="status">{msg}</div>
      <div className="chips" role="group" aria-label="Filter reports" style={{ marginBottom: 16 }}>
        {(Object.keys(LABEL) as Filter[]).map((f) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{LABEL[f]}<span className={s.count}>{count(f)}</span></button>)}
      </div>
      <div className="plist">
        {ready && shown.length === 0 && <div className={`card ${s.empty}`}><p className="muted">{reports.length ? "No reports in this list." : "No reports yet."}</p></div>}
        {shown.map((r) => {
          const sh = shops[r.shopId];
          return (
            <article className="card" key={r.id}>
              <div className="arow">
                <div>
                  <h3>{reasonLabel(r.reason)}</h3>
                  <div className={s.facts} style={{ marginTop: 6 }}>
                    <span>{sh ? <>Shop: <Link href={`/${sh.slug}`} target="_blank">{sh.name}</Link> ({sh.status})</> : "Shop no longer exists"}</span>
                    {r.productId && sh && <span><Link href={`/${sh.slug}/p/${r.productId}`} target="_blank">View reported product</Link></span>}
                    <span>{date(r.createdMs)}</span>
                  </div>
                  {r.details && <p style={{ margin: "0 0 8px", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{r.details}</p>}
                  {r.contact && <p className="muted" style={{ margin: "0 0 10px", fontWeight: 600 }}>Reporter: {r.contact}</p>}
                  <span className={`status ${r.status === "new" ? "pending" : r.status === "reviewed" ? "active" : "suspended"}`}>{r.status}</span>
                </div>
                <div className="row">
                  {r.status !== "reviewed" && <button className="btn" onClick={() => mark(r, "reviewed")}>Mark reviewed</button>}
                  {r.status !== "dismissed" && <button className="btn alt" onClick={() => mark(r, "dismissed")}>Dismiss</button>}
                  {r.status !== "new" && <button className="btn alt" onClick={() => mark(r, "new")}>Reopen</button>}
                  {sh && sh.status !== "suspended" && <button className="btn alt" onClick={() => suspend(r)}>Suspend shop</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
