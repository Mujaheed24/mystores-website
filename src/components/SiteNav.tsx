"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth";

export default function SiteNav() {
  const path = usePathname(), { user, isAdmin, loading, signOut } = useAuth();
  if (!["/", "/sell", "/dashboard", "/admin", "/terms", "/privacy", "/help"].includes(path)) return null; // storefronts keep their own look
  return (
    <nav className="topnav" aria-label="Main">
      <Link href="/" className="brand">MyStores</Link>
      {user && <Link href="/dashboard" className="navlink">My shop</Link>}
      {isAdmin && <Link href="/admin" className="navlink">Admin</Link>}
      {!loading && user && <button className="navlink" onClick={() => signOut()}>Sign out</button>}
      {!user && path !== "/sell" && <Link href="/sell" className="navlink pri">Sell</Link>}
      <ThemeToggle />
    </nav>
  );
}
