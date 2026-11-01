"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

// Sign-in choices: Google, or email and password (create account / sign in / forgot password).
export default function AuthForm() {
  const { signIn, signInEmail, signUpEmail, resetPassword, signingIn } = useAuth();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in"), [email, setEmail] = useState(""), [pw, setPw] = useState("");
  const [err, setErr] = useState(""), [info, setInfo] = useState(""), [busy, setBusy] = useState(false), [gBusy, setGBusy] = useState(false);
  const go = (m: "in" | "up" | "reset") => { setMode(m); setErr(""); setInfo(""); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    setErr(""); setInfo("");
    if (!email.trim()) return setErr("Enter your email address.");
    if (mode !== "reset" && !pw) return setErr("Enter your password.");
    if (mode === "up" && pw.length < 8) return setErr("Choose a password with at least 8 characters.");
    setBusy(true);
    const r = mode === "in" ? await signInEmail(email, pw) : mode === "up" ? await signUpEmail(email, pw) : await resetPassword(email);
    setBusy(false);
    if (r) return setErr(r);
    if (mode === "reset") setInfo("If that email has an account, we sent a link to choose a new password. Check your spam folder too.");
  }
  return (
    <div className="authbox">
      <button type="button" className="btn" disabled={gBusy || signingIn} aria-busy={gBusy || signingIn} onClick={async () => { setGBusy(true); setErr((await signIn()) ?? ""); setGBusy(false); }}>{signingIn ? (gBusy ? "Choose your Google account…" : "Signing you in…") : "Continue with Google"}</button>
      <div className="or" aria-hidden="true"><span>or use your email</span></div>
      <form className="f" onSubmit={submit} noValidate>
        <label>Email address<input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== "reset" && <label>Password<input type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
          {mode === "up" && <span className="hint muted">At least 8 characters.</span>}</label>}
        <div className="bad" role="alert">{err}</div>
        {info && <div className="ok" role="status" style={{ fontWeight: 600 }}>{info}</div>}
        <button className="btn alt" disabled={busy} aria-busy={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create my account" : "Send reset link"}</button>
      </form>
      <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
        {mode !== "in" && <button type="button" className="linkbtn" onClick={() => go("in")}>I already have an account</button>}
        {mode !== "up" && <button type="button" className="linkbtn" onClick={() => go("up")}>Create an account with email</button>}
        {mode === "in" && <button type="button" className="linkbtn" onClick={() => go("reset")}>Forgot password?</button>}
      </div>
    </div>
  );
}
