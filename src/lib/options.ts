export const CATEGORIES = ["Electronics", "Fragrance", "Fashion", "Beauty and hair care", "Groceries", "Home and furniture", "Books and stationery", "Sports", "Other"];
export const THEME_COLORS = ["#0c6b58", "#1d4ed8", "#7a4a12", "#a3174f", "#6d28d9", "#b45309", "#0f766e", "#334155"];
export const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
// Accepts 080..., 234 80... or +234 80... and returns +234XXXXXXXXXX
export function normalizeNgPhone(v: string): string | null {
  const m = v.replace(/[\s-]/g, "").match(/^(?:\+234|234|0)([789][01]\d{8})$/);
  return m ? `+234${m[1]}` : null;
}
// Keep NG_STATES in sync with the state list in firestore.rules (function validExtras)
export const NG_STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
export const LIMITS = { city: 60, hours: 120, delivery: 300 };
export const placeLabel = (s: { city?: string; state?: string }) => [s.city?.trim(), s.state].filter(Boolean).join(", ");
export const CATEGORY_EMOJI: Record<string, string> = { Electronics: "📱", Fragrance: "🧴", Fashion: "👗", "Beauty and hair care": "💇", Groceries: "🛒", "Home and furniture": "🛋️", "Books and stationery": "📚", Sports: "⚽", Other: "✨" };

// ---- Limits and helpers added for: several categories, several locations, custom colours, 10 recommended ----
export const MAX_FEATURED = 10;   // products shown in the "Recommended" carousel
export const MAX_CATEGORIES = 5;  // what a shop sells (keep in sync with validExtras in firestore.rules)
export const MAX_EXTRA_PLACES = 4; // places in addition to the main state and city (keep in sync with firestore.rules)
type PlaceShop = { state?: string; city?: string; locations?: { state: string; city: string }[] };
// All categories of a shop. Older shops only have one `category`.
export const shopCategories = (s: { category: string; categories?: string[] }) => (s.categories?.length ? s.categories : [s.category]).filter(Boolean);
// Every place a shop sells from: the main place first, then the extra ones. No duplicates.
export function shopPlaces(s: PlaceShop): { state: string; city: string }[] {
  const all = [{ state: s.state ?? "", city: (s.city ?? "").trim() }, ...(s.locations ?? [])].filter((x) => x.state || x.city);
  const seen = new Set<string>();
  return all.filter((x) => { const k = `${x.state}|${x.city.toLowerCase()}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
export const placesLabel = (s: PlaceShop) => shopPlaces(s).map((x) => [x.city, x.state].filter(Boolean).join(", ")).join(" · ");
export const isHexColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
// Shop text on banners is white, so very light colours would be unreadable.
export function isTooLight(hex: string): boolean {
  if (!isHexColor(hex)) return true;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}
