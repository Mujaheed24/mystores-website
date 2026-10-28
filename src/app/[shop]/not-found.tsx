import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap"><div className="card"><h2>This shop is unavailable</h2>
      <p className="muted">The address may be wrong, or the shop is not open yet.</p>
      <Link className="btn" href="/">Browse shops</Link></div></main>
  );
}
