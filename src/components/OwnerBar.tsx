"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

// Shown ONLY to the shop's owner while they look at their own public shop: one tap back to the dashboard or the shop settings.
export default function OwnerBar({ ownerUid }: { ownerUid: string }) {
  const { user } = useAuth();
  if (!user || user.uid !== ownerUid) return null;
  return (
    <nav className="ownerbar" aria-label="Shop owner">
      <span>👋 You are viewing your own shop</span>
      <div><Link className="btn alt sm" href="/dashboard">← Dashboard</Link><Link className="btn sm" href="/dashboard?tab=Profile">⚙ Shop settings</Link></div>
    </nav>
  );
}
