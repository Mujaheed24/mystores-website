"use client";
import { useEffect, type AnchorHTMLAttributes } from "react";
import { useAuth } from "@/lib/auth";
import { SHOP_STAT } from "@/lib/statKeys";

// Counting rules (kept simple on purpose):
// - the shop owner's own visits are never counted;
// - one view and one WhatsApp tap per product per browser session (a refresh does not add more);
// - a failed count is silently ignored. Counting must never break or slow down a page.
const once = (key: string) => {
  try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch { /* private mode: count it */ }
  return true;
};

export function useTracker(shopId: string, ownerUid: string) {
  const { user, loading } = useAuth();
  const skip = loading || user?.uid === ownerUid;
  return {
    ready: !loading,
    count: (kind: "views" | "taps", productId?: string) => {
      if (skip) return;
      const id = productId ?? SHOP_STAT;
      // The database code is fetched only now, so it never slows the first load of a shop page.
      if (once(`ms-${kind}:${shopId}/${id}`)) import("@/lib/stats").then((m) => m.bump(shopId, id, kind)).catch(() => {});
    },
  };
}

// Put on a public page to count a view. productId omitted = a visit to the shop page.
export default function Track({ shopId, ownerUid, productId }: { shopId: string; ownerUid: string; productId?: string }) {
  const t = useTracker(shopId, ownerUid);
  useEffect(() => { if (t.ready) t.count("views", productId); }, [t.ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// A normal link that also counts a WhatsApp tap. productId omitted = "Chat on WhatsApp" for the whole shop.
export function TapLink({ shopId, ownerUid, productId, onClick, ...a }: { shopId: string; ownerUid: string; productId?: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const t = useTracker(shopId, ownerUid);
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a {...a} onClick={(e) => { t.count("taps", productId); onClick?.(e); }} />;
}
