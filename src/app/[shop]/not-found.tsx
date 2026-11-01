import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 80 }}>🛍️</div><h1 style={{ fontSize: "clamp(34px,8vw,56px)", margin: "10px 0" }}>This shop is not open</h1>
      <p className="lead" style={{ margin: "0 auto 26px" }}>The address may be wrong, or the shop is waiting to open.</p>
      <Link className="btn" href="/">See all shops</Link>
    </main>
  );
}
