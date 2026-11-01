import { normalizeNgPhone } from "@/lib/options";
// Public contact details. Set these in .env.local (and in your hosting settings when live):
//   NEXT_PUBLIC_CONTACT_EMAIL=help@yourdomain.com
//   NEXT_PUBLIC_CONTACT_WHATSAPP=08012345678   (or +2348012345678)
// If a value is empty, that contact option is simply hidden.
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();

const wa = (normalizeNgPhone(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "") ?? "").replace("+", "");
export const CONTACT_WA_DIGITS = wa; // e.g. 2348012345678, or "" when not set
export const CONTACT_WA_DISPLAY = wa ? `+${wa.slice(0, 3)} ${wa.slice(3, 6)} ${wa.slice(6, 9)} ${wa.slice(9)}` : "";
export const CONTACT_WA_LINK = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Hello MyStores, I need help with ")}` : "";
// Used by the legal pages. Set NEXT_PUBLIC_BUSINESS_NAME / NEXT_PUBLIC_BUSINESS_ADDRESS to your registered name and address.
export const LEGAL_EMAIL = CONTACT_EMAIL || "help@mystores.com.ng";
export const BUSINESS_NAME = (process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "").trim() || "MyStores";
export const BUSINESS_ADDRESS = (process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "").trim();
export const HAS_CONTACT = Boolean(CONTACT_EMAIL || wa);
