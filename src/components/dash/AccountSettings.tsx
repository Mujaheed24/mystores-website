"use client";
import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail } from "firebase/auth";
import { usesPassword, useAuth } from "@/lib/auth";
import { getAuthClient } from "@/lib/firebaseApp";

// Sign-in details: change email and password. Only accounts that sign in with a password can do this here;
// Google accounts keep their email and password with Google. Firebase asks for the current password again first (a safety rule).
const why = (e: any) => {
  switch (e?.code) {
    case "auth/invalid-credential": case "auth/wrong-password": return "Your current password is not right.";
    case "auth/weak-password": return "Choose a new password with at least 8 characters.";
    case "auth/email-already-in-use": return "Another account already uses that email.";
    case "auth/invalid-email": return "That email address does not look right.";
    case "auth/too-many-requests": return "Too many tries. Wait a few minutes and try again.";
    case "auth/network-request-failed": return "No internet connection. Check your data and try again.";
    case "auth/requires-recent-login": return "Please sign out, sign in again, and retry.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function AccountSettings() {
  const { user } = useAuth();
  const [cur, setCur] = useState(""), [mail, setMail] = useState(""), [pw, setPw] = useState(""), [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string; who: "mail" | "pw" } | null>(null), [busy, setBusy] = useState<"" | "mail" | "pw">("");
  if (!user) return null;
  if (!usesPassword(user)) return (
    <section className="card fsec f" aria-labelledby="s5" style={{ marginTop: 16 }}>
      <h3 id="s5">Your sign-in</h3>
      <p>You sign in with Google as <b>{user.email}</b>. To change your email or password, change it in your Google account. Your shop keeps working the same.</p>
    </section>
  );
  async function again() {
    if (!cur) throw { code: "auth/invalid-credential" };
    await reauthenticateWithCredential(user!, EmailAuthProvider.credential(user!.email || "", cur));
  }
  async function changeMail() {
    setMsg(null); const e = mail.trim();
    if (!e) return setMsg({ ok: false, t: "Type your new email address.", who: "mail" });
    setBusy("mail");
    try { await again(); await verifyBeforeUpdateEmail(user!, e); setMsg({ ok: true, t: `We sent a link to ${e}. Open it to confirm. Until then you keep signing in with ${user!.email}.`, who: "mail" }); setMail(""); setCur(""); }
    catch (x) { setMsg({ ok: false, t: why(x), who: "mail" }); }
    setBusy("");
  }
  async function changePw() {
    setMsg(null);
    if (pw.length < 8) return setMsg({ ok: false, t: "Choose a new password with at least 8 characters.", who: "pw" });
    if (pw !== pw2) return setMsg({ ok: false, t: "The two new passwords are not the same.", who: "pw" });
    setBusy("pw");
    try { await again(); await updatePassword(getAuthClient().currentUser!, pw); setMsg({ ok: true, t: "Password changed.", who: "pw" }); setPw(""); setPw2(""); setCur(""); }
    catch (x) { setMsg({ ok: false, t: why(x), who: "pw" }); }
    setBusy("");
  }
  const note = (w: "mail" | "pw") => msg?.who === w && <p role="alert" className={msg.ok ? "ok" : "bad"}>{msg.t}</p>;
  return (
    <section className="card fsec f" aria-labelledby="s5" style={{ marginTop: 16 }}>
      <h3 id="s5">Your sign-in</h3>
      <p className="muted hint" style={{ marginTop: -8 }}>Signed in as {user.email}. For your safety, type your current password for either change.</p>
      <label>Current password<input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></label>
      <label>New email address<input type="email" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value)} /></label>
      <button type="button" className="btn alt sm" style={{ justifySelf: "start" }} disabled={!!busy} aria-busy={busy === "mail"} onClick={changeMail}>{busy === "mail" ? "Sending…" : "Change email"}</button>
      {note("mail")}
      <label>New password<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label>Type the new password again<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      <button type="button" className="btn alt sm" style={{ justifySelf: "start" }} disabled={!!busy} aria-busy={busy === "pw"} onClick={changePw}>{busy === "pw" ? "Saving…" : "Change password"}</button>
      {note("pw")}
    </section>
  );
}
