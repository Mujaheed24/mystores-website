// Reasons a visitor can pick. Keep the keys in sync with validReport() in firestore.rules.
export const REPORT_REASONS = [
  { key: "scam", label: "Scam or fake seller" },
  { key: "illegal", label: "Illegal or dangerous items" },
  { key: "adult", label: "Adult or offensive content" },
  { key: "copied", label: "Stolen photos or fake product" },
  { key: "other", label: "Something else" },
] as const;
export const reasonLabel = (k: string) => REPORT_REASONS.find((r) => r.key === k)?.label ?? k;
export const REPORT_LIMITS = { details: 500, contact: 100 };
