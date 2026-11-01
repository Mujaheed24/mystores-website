"use client";
import { useRef, useState } from "react";
import { errText } from "@/lib/errText";
import { REPORT_LIMITS, REPORT_REASONS } from "@/lib/reports";
import s from "./ReportButton.module.css";

const KEY = "ms-reports"; // remembers what this device already reported, to stop accidental repeats
const read = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const DAY = 24 * 3600 * 1000;

export default function ReportButton({ shopId, productId, label }: { shopId: string; productId?: string; label: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState(""), [details, setDetails] = useState(""), [contact, setContact] = useState("");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const id = productId ? `${shopId}/${productId}` : shopId;

  const open = () => {
    setErr(""); setDone(false);
    const recent = Object.entries(read()).filter(([, t]) => Date.now() - t < DAY);
    if (recent.some(([k]) => k === id)) setDone(true);
    dlg.current?.showModal();
  };
  const close = () => dlg.current?.close();
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setErr("Please choose what is wrong.");
    const recent = Object.entries(read()).filter(([, t]) => Date.now() - t < DAY);
    if (recent.length >= 5) return setErr("You have sent several reports today. Thank you. We will look into them.");
    setBusy(true); setErr("");
    try {
      const [{ addDoc, collection, serverTimestamp }, { db }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
      await addDoc(collection(db, "reports"), {
        shopId, ...(productId ? { productId } : {}), reason,
        details: details.trim(), contact: contact.trim(), status: "new", createdAt: serverTimestamp(),
      });
      try { localStorage.setItem(KEY, JSON.stringify({ ...Object.fromEntries(recent), [id]: Date.now() })); } catch { /* private mode */ }
      setDone(true); setReason(""); setDetails(""); setContact("");
    } catch (x) { setErr(errText(x)); }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className={s.trigger} onClick={open}>{label}</button>
      <dialog ref={dlg} className={s.dlg} aria-labelledby={`rp-${id}`} onClick={(e) => { if (e.target === dlg.current) close(); }}>
        <div className={s.in}>
          <h2 id={`rp-${id}`}>{label}</h2>
          {done ? (
            <>
              <p className={s.ok} role="status">Thank you. We have your report and will look into it.</p>
              <div className={s.acts}><button type="button" className="btn" onClick={close}>Close</button></div>
            </>
          ) : (
            <form onSubmit={send} className={s.in} style={{ padding: 0 }}>
              <p>Tell us what is wrong. We read every report. You do not need to sign in.</p>
              <label>What is wrong?
                <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                  <option value="">Choose one</option>{REPORT_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              <label>More details (optional)
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={REPORT_LIMITS.details} placeholder="What happened?" />
              </label>
              <label>How can we reach you? (optional)
                <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={REPORT_LIMITS.contact} placeholder="Phone number or email" />
              </label>
              <div className={s.err} role="alert">{err}</div>
              <div className={s.acts}>
                <button type="submit" className="btn" disabled={busy} aria-busy={busy}>{busy ? "Sending…" : "Send report"}</button>
                <button type="button" className="btn alt" onClick={close}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
