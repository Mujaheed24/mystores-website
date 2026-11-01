"use client";
import { useState } from "react";
import Photo from "./Photo";

const SELLERS: [string, string][] = [["seller-1", "Fashion and fabrics"], ["seller-2", "Hair and beauty"], ["seller-3", "Phones and gadgets"], ["seller-4", "Perfumes and oils"], ["seller-5", "Shoes and bags"], ["seller-6", "Food and snacks"]];

// A slowly scrolling strip of seller photos. Hidden until at least 3 of the 6 files exist.
export default function SellerStrip() {
  const [n, setN] = useState(0);
  return (
    <section className={`sec strip${n >= 3 ? " on" : ""}`} aria-label="Sellers on MyStores">
      <h2>Made for sellers like you</h2>
      <p className="muted">Fabrics, hair, phones, perfume, food. If you sell it, you can open a shop for it.</p>
      <div className="mqwrap"><div className="mq">
        {[0, 1, 2].map((c) => SELLERS.map(([f, l]) => <Photo key={c + f} src={`/images/home/${f}.jpg`} caption={l} className="sc" eager onOk={c === 0 ? () => setN((x) => x + 1) : undefined} />))}
      </div></div>
    </section>
  );
}
