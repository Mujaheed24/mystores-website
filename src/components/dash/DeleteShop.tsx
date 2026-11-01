"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usesPassword } from "@/lib/auth";
import { deleteShopAndAccount } from "@/lib/deleteShop";
import { errText } from "@/lib/seller";
import type { Shop } from "@/lib/types";

// "Danger zone" at the bottom of My shop. The seller must type the shop address to confirm.
export default function DeleteShop({ shop }: { shop: Shop }) {
  const { user } = useAuth(), router = useRouter();
  const [open, setOpen] = useState(false), [typed, setTyped] = useState(""), [busy, setBusy] = useState(false), [step, setStep] = useState(""), [err, setErr] = useState(""), [pw, setPw] = useState("");
  const withPw = usesPassword(user);
  const ok = typed.trim().toLowerCase() === shop.slug && (!withPw || pw.length > 0);
  async function go() {
    if (!user || !ok || busy) return;
    setBusy(true); setErr("");
    try { await deleteShopAndAccount(user, shop, setStep, withPw ? pw : undefined); router.replace("/"); }
    catch (e: any) {
      setErr(e?.code === "auth/wrong-password" || e?.code === "auth/invalid-credential" ? "That password is not right. Nothing was deleted."
        : e?.code === "auth/too-many-requests" ? "Too many tries. Wait a few minutes and try again. Nothing was deleted."
        : e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request" ? "Nothing was deleted. Confirm with Google to continue."
        : e?.code === "auth/user-mismatch" ? "Please sign in with the same Google account you use for this shop."
        : `${errText(e)} Your shop is not fully deleted. You can try again.`);
      setBusy(false); setStep("");
    }
  }
  return (
    <section className="card danger">
      <h3>Delete my shop and account</h3>
      {!open ? (
        <>
          <p className="muted" style={{ margin: "6px 0 14px" }}>This removes your shop, products, photos and sign-in for good.</p>
          <button type="button" className="btn alt sm" onClick={() => setOpen(true)}>Delete my shop…</button>
        </>
      ) : (
        <div className="f">
          <p><b>This cannot be undone.</b> We will delete your shop, all products, photos and numbers, and your account. Your address <b>mystores.com.ng/{shop.slug}</b> becomes free for anyone to take. Any messages already sent on WhatsApp stay with you and your customers.</p>
          <label>To confirm, type your shop address: <b>{shop.slug}</b>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={busy} /></label>
          {withPw && <label>Your password, to confirm it is you<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={busy} /></label>}
          <div className="bad" role="alert">{err}</div>
          {busy && <p className="muted" role="status">{step}</p>}
          <div className="row">
            <button type="button" className="btn dng" disabled={!ok || busy} onClick={go}>{busy ? "Deleting…" : "Delete everything"}</button>
            <button type="button" className="btn alt" disabled={busy} onClick={() => { setOpen(false); setTyped(""); setErr(""); }}>Keep my shop</button>
          </div>
        </div>
      )}
    </section>
  );
}
