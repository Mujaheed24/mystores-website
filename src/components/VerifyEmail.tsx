"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

// Shown to email/password sellers until they click the link we emailed. Google accounts never see this.
export default function VerifyEmail() {
  const { user, refreshUser, resendVerification, signOut } = useAuth();
  const [msg, setMsg] = useState(""), [bad, setBad] = useState(false), [busy, setBusy] = useState(false), [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function check() {
    setBusy(true); setMsg(""); setBad(false);
    try { if (!(await refreshUser())) { setBad(true); setMsg("Not verified yet. Open the email, tap the link, then come back and tap this button again."); } }
    catch { setBad(true); setMsg("Could not check. Check your internet and try again."); }
    setBusy(false);
  }
  async function again() {
    const r = await resendVerification(); setBad(!!r);
    setMsg(r ?? "Sent again. Check your inbox and spam folder."); if (!r) setWait(30);
  }
  return (
    <main className="wrap" style={{ textAlign: "center", paddingTop: 50 }}>
      <div style={{ fontSize: 76 }}>📧</div>
      <h1 style={{ margin: "12px 0" }}>Check your email</h1>
      <p className="lead" style={{ margin: "0 auto 24px" }}>We sent a link to <b>{user?.email}</b>. Tap it to confirm this is your email, then come back here.</p>
      <div className="authbox">
        <button className="btn" onClick={check} disabled={busy} aria-busy={busy}>{busy ? "Checking…" : "I have verified my email"}</button>
        <button className="btn alt" onClick={again} disabled={wait > 0}>{wait > 0 ? `Send again in ${wait}s` : "Send the email again"}</button>
        <div className={bad ? "bad" : "ok"} role="status" style={{ fontWeight: 600, minHeight: 26 }}>{msg}</div>
        <button type="button" className="linkbtn" onClick={() => signOut()}>Use a different account</button>
      </div>
    </main>
  );
}
