"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { authMessage } from "@/lib/auth";
import { getAuthClient } from "@/lib/firebaseApp";

// The page people land on after tapping the link in a MyStores email (verify email, reset password, undo an email change).
// Set it in Firebase console, Authentication, Templates, pencil icon, "Customize action URL": https://<your-site>/auth/action
type View =
  | { k: "loading" } | { k: "verified" } | { k: "recovered" } | { k: "resetDone" }
  | { k: "reset"; email: string; code: string } | { k: "error"; msg: string };

const friendly = (e: any) => {
  const c = e?.code as string | undefined;
  if (c === "auth/expired-action-code") return "This link has expired. Go back to MyStores and ask for a new email.";
  if (c === "auth/invalid-action-code") return "This link was already used or is no longer valid. If you already tapped it once, your email is probably confirmed: just sign in.";
  if (c === "auth/user-disabled") return "This account has been switched off. Please contact MyStores help.";
  return authMessage(e);
};

function Mark({ ok = true }: { ok?: boolean }) {
  return (
    <div className={`okmark${ok ? "" : " no"}`} aria-hidden="true">
      <svg viewBox="0 0 52 52" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {ok ? <path d="M14 27l8 8 16-17" /> : <path d="M16 16l20 20M36 16L16 36" />}
      </svg>
    </div>
  );
}

export default function ActionPage() {
  const [view, setView] = useState<View>({ k: "loading" }), [next, setNext] = useState("/sell");
  const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search), mode = q.get("mode"), code = q.get("oobCode"), cont = q.get("continueUrl");
    try { if (cont && new URL(cont).origin === window.location.origin) setNext(new URL(cont).pathname || "/sell"); } catch { /* ignore a bad address */ }
    const auth = getAuthClient();
    (async () => {
      if (!mode || !code) return setView({ k: "error", msg: "This link is not complete. Open the link from your email again, or copy all of it." });
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, code);
          // if the same browser is signed in, refresh it so the shop-opening page knows the email is now confirmed
          try { await auth.currentUser?.reload(); await auth.currentUser?.getIdToken(true); } catch { /* the seller can tap the refresh button later */ }
          setView({ k: "verified" });
        } else if (mode === "resetPassword") {
          setView({ k: "reset", email: await verifyPasswordResetCode(auth, code), code });
        } else if (mode === "recoverEmail") {
          await applyActionCode(auth, code); setView({ k: "recovered" });
        } else setView({ k: "error", msg: "We do not know what to do with this link. Open it again from your email." });
      } catch (e) { setView({ k: "error", msg: friendly(e) }); }
    })();
  }, []);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (view.k !== "reset") return;
    if (pw.length < 8) return setErr("Choose a password with at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords are not the same.");
    setBusy(true);
    try { await confirmPasswordReset(getAuthClient(), view.code, pw); setView({ k: "resetDone" }); }
    catch (x) { setErr(friendly(x)); }
    setBusy(false);
  }

  return (
    <main className="wrap actpage">
      <div className="card actcard" role="status" aria-live="polite">
        <div className="actbrand">🛍️ MyStores</div>
        {view.k === "loading" && <><span className="spinner" aria-hidden="true" /><h1>One moment…</h1><p className="lead">We are checking your link.</p></>}
        {view.k === "verified" && <><Mark /><h1>Email confirmed!</h1><p className="lead">Thank you. Your email is now verified, so you can open your shop and start selling on WhatsApp.</p>
          <Link className="btn" href={next}>Continue to open my shop</Link><Link className="linkbtn" href="/">Go to the home page</Link></>}
        {view.k === "recovered" && <><Mark /><h1>Your email was restored</h1><p className="lead">We changed your sign-in email back. If this was not you, reset your password right away.</p><Link className="btn" href="/sell">Sign in</Link></>}
        {view.k === "resetDone" && <><Mark /><h1>New password saved</h1><p className="lead">You can now sign in with your new password.</p><Link className="btn" href="/sell">Sign in</Link></>}
        {view.k === "reset" && (
          <form className="f" onSubmit={savePassword} style={{ textAlign: "left" }}>
            <h1 style={{ textAlign: "center" }}>Choose a new password</h1>
            <p className="lead" style={{ textAlign: "center", margin: "0 auto" }}>For <b>{view.email}</b></p>
            <label>New password<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /><span className="hint muted">At least 8 characters.</span></label>
            <label>Type it again<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
            {err && <div className="bad" role="alert">{err}</div>}
            <button className="btn" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save new password"}</button>
          </form>
        )}
        {view.k === "error" && <><Mark ok={false} /><h1>This link did not work</h1><p className="lead">{view.msg}</p><Link className="btn" href="/sell">Go to sign in</Link><Link className="linkbtn" href="/">Go to the home page</Link></>}
      </div>
    </main>
  );
}
