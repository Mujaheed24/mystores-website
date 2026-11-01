import Link from "next/link";
export default function Footer() {
  return (
    <footer className="foot">
      <Link href="/">MyStores</Link><Link href="/sell">Open a store</Link><Link href="/help">Help</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link>
    </footer>
  );
}
