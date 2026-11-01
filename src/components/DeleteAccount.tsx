"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usesPassword } from "@/lib/auth";
import { deleteAccountOnly } from "@/lib/deleteShop";
import { errText } from "@/lib/errText";

// For someone who signed up but has not opened a shop yet and wants their account removed.
export default function DeleteAccount() {
  const { user } = useAuth(), router = useRouter();
  const [open, setOpen] = useState(false), [pw, setPw] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const withPw = usesPassword(user);
  async function go() {
    if (!user || busy || (withPw && !pw)) return;
    setBusy(true); setErr("");
    try { await deleteAccountOnly(user, () => {}, withPw ? pw : undefined); router.replace("/"); }
    catch (e: any) {
      setErr(e?.code === "auth/wrong-password" || e?.code === "auth/invalid-credential" ? "That password is not right. Nothing was deleted."
        : e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request" ? "Nothing was deleted. Confirm with Google to continue."
        : errText(e));
      setBusy(false);
    }
  }
  return (
    <section className="card danger" style={{ maxWidth: 560, margin: "30px auto 0" }}>
      <h3>Delete my account</h3>
      {!open ? (
        <>
          <p className="muted" style={{ margin: "6px 0 14px" }}>You have not opened a shop. You can remove your sign-in account if you do not want it.</p>
          <button type="button" className="btn alt sm" onClick={() => setOpen(true)}>Delete my account…</button>
        </>
      ) : (
        <div className="f">
          <p><b>This cannot be undone.</b> Your sign-in account will be removed.</p>
          {withPw && <label>Your password, to confirm it is you<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={busy} /></label>}
          <div className="bad" role="alert">{err}</div>
          <div className="row">
            <button type="button" className="btn dng" disabled={busy || (withPw && !pw)} aria-busy={busy} onClick={go}>{busy ? "Deleting…" : "Delete my account"}</button>
            <button type="button" className="btn alt" disabled={busy} onClick={() => { setOpen(false); setErr(""); }}>Keep it</button>
          </div>
        </div>
      )}
    </section>
  );
}
