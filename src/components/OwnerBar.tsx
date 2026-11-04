"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

// Shown ONLY to the shop's owner while they look at their own public shop: one tap back to the dashboard or the shop settings.
export default function OwnerBar({ ownerUid, product }: { ownerUid: string; product?: { id: string; path: string } }) {
  const { user } = useAuth();
  if (!user || user.uid !== ownerUid) return null;
  return (
    <nav className="ownerbar" aria-label="Shop owner">
      <span>👋 {product ? "This is your product" : "You are viewing your own shop"}</span>
      <div>{product && <Link className="btn sm" href={`/dashboard?tab=Form&edit=${encodeURIComponent(product.id)}&back=${encodeURIComponent(product.path)}`}>✏ Edit this product</Link>}<Link className="btn alt sm" href="/dashboard">← Dashboard</Link><Link className="btn sm" href="/dashboard?tab=Profile">⚙ Shop settings</Link></div>
    </nav>
  );
}
