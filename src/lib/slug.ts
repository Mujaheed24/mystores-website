// Keep RESERVED in sync with firestore.rules
export const RESERVED = ["admin","dashboard","home","login","signup","api","shops","help","support","terms","privacy","sell","join"];
export function checkSlugFormat(v: string): string | null {
  if (!/^[a-z0-9-]{3,24}$/.test(v)) return "Use 3–24 lowercase letters, numbers or hyphens.";
  if (RESERVED.includes(v)) return `mystores.com.ng/${v} is reserved. Try another address.`;
  return null;
}
