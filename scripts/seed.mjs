// Adds three demo shops. Works against a real project or the emulator.
// Real project: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file.
// Emulator:     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-mystores npm run seed
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT } : { credential: applicationDefault() });
const db = getFirestore();
const shops = {
  techworld: { name: "TechWorld", category: "Electronics", themeColor: "#1d4ed8", whatsappNumber: "+2348010000001", description: "Phones, laptops and accessories, with warranty on every device.",
    products: [["📱","iPhone 13, 128GB","Phones",620000,4],["💻","HP EliteBook 840","Laptops",780000,2],["🔌","20W fast charger","Accessories",8500,40],["🛡️","Shockproof phone case","Accessories",4000,0],["🎧","Wireless earbuds","Accessories",22000,12]] },
  oudpalace: { name: "Oud Palace", category: "Fragrance", themeColor: "#7a4a12", whatsappNumber: "+2348020000002", description: "Oud, bakhoor and perfume oils, blended and sold by the tola.",
    products: [["🪵","Royal oud, 50ml","Oud",45000,9],["🧴","Amber perfume spray","Perfume",28000,15],["🕯️","Bakhoor gift set","Bakhoor",12000,22],["💧","Musk oil, 12ml","Perfume",9500,30]] },
  fashionhub: { name: "FashionHub", category: "Fashion", themeColor: "#a3174f", whatsappNumber: "+2348030000003", description: "Ankara dresses, sandals and bags, made in small batches.",
    products: [["👗","Ankara wrap dress","Dresses",18500,6],["👡","Leather sandals","Shoes",14000,10],["👜","Woven tote bag","Bags",11000,0]] },
};
for (const [slug, { products, ...shop }] of Object.entries(shops)) {
  const ownerUid = `demo-owner-${slug}`, shopRef = db.collection("shops").doc(`shop-${slug}`);
  await shopRef.set({ ...shop, slug, ownerUid, status: "active", subscriptionPlan: "basic", createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  await db.collection("slugs").doc(slug).set({ shopId: shopRef.id, ownerUid });
  let t = Date.now();
  for (const [emoji, name, category, price, stockQuantity] of products) {
    await shopRef.collection("products").add({ shopId: shopRef.id, sellerUid: ownerUid, emoji, name, category, price, stockQuantity,
      description: `${name} from ${shop.name}.`, status: "published", featured: stockQuantity > 0, createdAt: Timestamp.fromMillis(t++) });
  }
  console.log("Seeded", slug);
}
