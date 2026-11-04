export type Shop = {
  id: string; ownerUid: string; name: string; slug: string; category: string; description: string;
  themeColor: string; whatsappNumber: string; logoUrl?: string; bannerUrl?: string; state?: string; city?: string; openingHours?: string; deliveryNotes?: string; categories?: string[]; locations?: { state: string; city: string }[]; status: "pending" | "active" | "suspended"; subscriptionPlan: string;
};
export type Product = {
  id: string; shopId: string; sellerUid: string; name: string; description: string; category: string;
  price: number | null; stockQuantity: number; status: "draft" | "published"; featured: boolean; emoji: string; imageUrls: string[]; thumbUrl?: string | null; videoUrl?: string | null; videoPoster?: string | null; createdAt: number;
};
export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
export const priceLabel = (p: number | null | undefined) => (p === null || p === undefined ? "Ask for price" : naira(p));
