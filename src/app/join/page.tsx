"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import AuthForm from "@/components/AuthForm";
import VerifyEmail from "@/components/VerifyEmail";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { errText } from "@/lib/errText";
import { getWorkShop } from "@/lib/seller";

// The page an invited helper opens: /join?shop=<address>. They sign in with the invited email, then accept.
export default function Join() {
  const { user, loading, emailVerified, signOut } = useAuth(), router = useRouter();
  const [slug, setSlug] = useState<string | null>(null), [state, setState] = useState<"checking" | "invite" | "none" | "done">("checking"), [shopId, setShopId] = useState(""), [ownerUid, setOwnerUid] = useState(""), [shopName, setShopName] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { setSlug((new URLSearchParams(window.location.search).get("shop") || "").toLowerCase().replace(/[^a-z0-9-]/g, "")); }, []);
  const email = (user?.email || "").toLowerCase();
  useEffect(() => {
    if (!user || !emailVerified || !slug) return;
    let alive = true;
    (async () => {
      try {
        const w = await getWorkShop(user.uid);
        if (w) return router.replace("/dashboard"); // already has a shop or is already a helper
        const sl = await getDoc(doc(db, "slugs", slug));
        if (!sl.exists()) return alive && setState("none");
        const id = String(sl.data().shopId), inv = await getDoc(doc(db, "shops", id, "invites", email));
        if (!alive) return;
        if (!inv.exists()) return setState("none");
        setShopId(id); setOwnerUid(String(sl.data().ownerUid)); setShopName(String(inv.data().shopName || slug)); setState("invite");
      } catch { if (alive) setState("none"); }
    })();
    return () => { alive = false; };
  }, [user, emailVerified, slug, email, router]);

  async function accept() {
    if (!user) return; setBusy(true); setMsg("");
    try {
      const b = writeBatch(db);
      b.set(doc(db, "members", user.uid), { shopId, ownerUid, email, createdAt: serverTimestamp() });
      b.delete(doc(db, "shops", shopId, "invites", email));
      await b.commit(); router.replace("/dashboard");
    } catch (e: any) { setMsg(e?.code === "permission-denied" ? "This could not be accepted. The invitation may have been cancelled, or this account already owns a shop." : errText(e)); setBusy(false); }
  }
  const box = (children: React.ReactNode) => <main className="wrap" style={{ textAlign: "center", paddingTop: 50 }}>{children}</main>;
  if (loading || slug === null || (user && emailVerified && state === "checking")) return <main className="wrap" aria-busy="true" style={{ textAlign: "center", paddingTop: 70 }}><span className="spinner" aria-hidden="true" /><p className="lead" style={{ margin: "18px auto 0" }} role="status">Checking your invitation…</p></main>;
  if (!slug) return box(<><h1>Join a shop</h1><p className="lead" style={{ margin: "12px auto" }}>This link is incomplete. Ask the shop owner to send it again.</p></>);
  if (!user) return box(<><div style={{ fontSize: 70 }}>🤝</div><h1 style={{ margin: "12px 0" }}>You were invited to help with a shop</h1><p className="lead" style={{ margin: "0 auto 26px" }}>Sign in with the email address the owner invited, with Google or an email and password.</p><AuthForm /></>);
  if (!emailVerified) return <VerifyEmail />;
  if (state === "none") return box(<><div style={{ fontSize: 70 }}>🔍</div><h1 style={{ margin: "12px 0" }}>No invitation found</h1><p className="lead" style={{ margin: "0 auto 18px" }}>There is no invitation for <b>{user.email}</b> at this shop. Ask the owner to invite exactly this email, or sign in with the email that was invited.</p><button className="btn alt" onClick={() => signOut()}>Sign out and try another account</button></>);
  return box(<><div style={{ fontSize: 70 }}>🤝</div><h1 style={{ margin: "12px 0" }}>Help run {shopName}</h1><p className="lead" style={{ margin: "0 auto 8px" }}>You can add and edit products and photos for this shop. You cannot change its settings or delete it. You can leave at any time.</p><p className="muted" style={{ marginBottom: 22 }}>Signed in as {user.email}</p><button className="btn" disabled={busy} aria-busy={busy} onClick={accept}>{busy ? "Joining…" : "Accept and join"}</button>{msg && <p role="alert" className="bad" style={{ marginTop: 14 }}>{msg}</p>}</>);
}
