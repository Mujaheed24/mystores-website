"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { errText } from "@/lib/errText";
import type { Shop } from "@/lib/types";

// Owner only: invite helpers by email. A helper signs in (Google OR email and password) with that same email, opens the join link and accepts.
// Helpers can add and edit products and photos. They cannot change shop settings, invite people, or delete the shop (enforced in firestore.rules).
const MAX_TEAM = 5;
type Person = { id: string; email: string };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Team({ shop }: { shop: Shop }) {
  const [members, setMembers] = useState<Person[]>([]), [invites, setInvites] = useState<Person[]>([]), [mail, setMail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [copied, setCopied] = useState(false);
  const link = `${typeof window === "undefined" ? "" : window.location.origin}/join?shop=${shop.slug}`;
  const load = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([getDocs(query(collection(db, "members"), where("ownerUid", "==", shop.ownerUid))), getDocs(collection(db, "shops", shop.id, "invites"))]);
      setMembers(m.docs.map((d) => ({ id: d.id, email: String(d.data().email || "") })));
      setInvites(i.docs.map((d) => ({ id: d.id, email: d.id })));
    } catch (e) { setMsg({ ok: false, t: errText(e) }); }
    setLoaded(true);
  }, [shop.id]);
  useEffect(() => { load(); }, [load]);

  async function invite() {
    setMsg(null); const e = mail.trim().toLowerCase();
    if (!EMAIL.test(e)) return setMsg({ ok: false, t: "Type a full email address, like name@gmail.com." });
    if (members.length + invites.length >= MAX_TEAM) return setMsg({ ok: false, t: `You can have up to ${MAX_TEAM} helpers and invitations.` });
    if (members.some((x) => x.email === e) || invites.some((x) => x.id === e)) return setMsg({ ok: false, t: "That person is already invited." });
    setBusy(true);
    try {
      await setDoc(doc(db, "shops", shop.id, "invites", e), { email: e, shopName: shop.name.slice(0, 60), createdAt: serverTimestamp() });
      setMail(""); setMsg({ ok: true, t: "Invited. Now send them the link below." }); await load();
    } catch (x) { setMsg({ ok: false, t: errText(x) }); }
    setBusy(false);
  }
  async function cancel(id: string) {
    if (!confirm(`Cancel the invitation for ${id}?`)) return;
    try { await deleteDoc(doc(db, "shops", shop.id, "invites", id)); await load(); } catch (x) { setMsg({ ok: false, t: errText(x) }); }
  }
  async function removeMember(p: Person) {
    if (!confirm(`Remove ${p.email}? They will not be able to edit your shop any more.`)) return;
    try { await deleteDoc(doc(db, "members", p.id)); await load(); } catch (x) { setMsg({ ok: false, t: errText(x) }); }
  }
  const text = `Hello! I invited you to help manage my shop "${shop.name}" on MyStores. Open this link, sign in with this email address, and accept: ${link}`;
  async function copy() { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { prompt("Copy this link:", link); } }
  return (
    <section className="card fsec f" aria-labelledby="s6" style={{ marginTop: 16 }}>
      <h3 id="s6">Your team</h3>
      <p className="muted hint" style={{ marginTop: -8 }}>Invite people to help with your shop without giving them your login. They can add and edit products and photos. They cannot change shop settings, invite others or delete the shop. You can remove them at any time.</p>
      {loaded && members.length > 0 && <div><div className="lab">Helpers</div>{members.map((p) => <div className="teamrow" key={p.id}><span>{p.email}</span><button type="button" className="linkbtn" onClick={() => removeMember(p)}>Remove</button></div>)}</div>}
      {loaded && invites.length > 0 && <div><div className="lab">Waiting to accept</div>{invites.map((p) => <div className="teamrow" key={p.id}><span>{p.email}</span><button type="button" className="linkbtn" onClick={() => cancel(p.id)}>Cancel</button></div>)}</div>}
      <label>Email address of the person to invite<input type="email" inputMode="email" autoComplete="off" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="name@gmail.com" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); invite(); } }} /></label>
      <button type="button" className="btn alt sm" style={{ justifySelf: "start" }} disabled={busy} aria-busy={busy} onClick={invite}>{busy ? "Inviting…" : "Invite"}</button>
      {msg && <p role="alert" className={msg.ok ? "ok" : "bad"}>{msg.t}</p>}
      {(invites.length > 0 || members.length > 0) && <>
        <p className="muted hint">Send this link to your helper. They must sign in with the exact email address you invited (with Google, or with an email and password).</p>
        <div className="row"><a className="btn wa sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>Send on WhatsApp</a><button type="button" className="btn alt sm" onClick={copy}>{copied ? "✓ Copied" : "Copy link"}</button></div>
      </>}
    </section>
  );
}
