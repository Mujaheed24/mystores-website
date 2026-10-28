export type Shop = {
  id: string; ownerUid: string; name: string; slug: string; category: string; description: string;
  themeColor: string; whatsappNumber: string; status: "pending" | "active" | "suspended"; subscriptionPlan: string;
};
export type Product = {
  id: string; shopId: string; sellerUid: string; name: string; description: string; category: string;
  price: number; stockQuantity: number; status: "draft" | "published"; featured: boolean; emoji: string; createdAt: number;
};
export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
