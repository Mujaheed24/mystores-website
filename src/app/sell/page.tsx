"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import DeleteAccount from "@/components/DeleteAccount";
import ShopWizard, { type NewShop } from "@/components/ShopWizard";
import VerifyEmail from "@/components/VerifyEmail";
import { useAuth } from "@/lib/auth";
import { createShop } from "@/lib/createShop";
import { errText, getMyShop } from "@/lib/seller";

export default function Sell() {
  const { user, loading, emailVerified, signingIn } = useAuth(), router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!user) return setChecking(false);
    setChecking(true); // a signed-in person: find out first whether they already have a shop, so the "open a shop" page never flashes
    router.prefetch("/dashboard");
    getMyShop(user.uid).then((s) => (s ? router.replace("/dashboard") : setChecking(false))).catch(() => setChecking(false));
  }, [user, router]);

  if (loading || checking || (signingIn && !user)) return <main className="wrap" aria-busy="true" style={{ textAlign: "center", paddingTop: 70 }}><span className="spinner" aria-hidden="true" /><p className="lead" style={{ margin: "18px auto 0" }} role="status">{user ? "Opening your shop…" : "Signing you in…"}</p></main>;
  if (!user) return (
    <main className="wrap" style={{ textAlign: "center", paddingTop: 50 }}>
      <div style={{ fontSize: 76 }}>🛍️</div>
      <h1 style={{ margin: "12px 0" }}>Open your store in minutes</h1>
      <p className="lead" style={{ margin: "0 auto 28px" }}>Sign in, name your shop, and start adding products. Customers order from you on WhatsApp.</p>
      <AuthForm />
    </main>
  );
  if (!emailVerified) return <VerifyEmail />; // email/password sign-ups must confirm their email first (Google accounts already are)
  async function onCreate(d: NewShop): Promise<string | null> {
    try { await createShop(user!.uid, d); router.replace("/dashboard"); return null; }
    catch (x: any) { return x?.code === "permission-denied" ? "That link was just taken, or you already have a shop. Pick another link." : errText(x); }
  }
  return <><ShopWizard onCreate={onCreate} /><main className="wrap" style={{ paddingTop: 0 }}><DeleteAccount /></main></>;
}
