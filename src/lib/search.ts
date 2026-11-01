// Forgiving search used by the shop directory and every shop's product list.
// - ignores capital letters, accents and punctuation ("Café" finds "cafe")
// - every word typed must match (so "red sandal" finds "Red leather sandals")
// - words match from the start of any word, anywhere inside it, and allow one small typing mistake ("sandals")
// - results can be ranked: a match in the name beats a match in the description
export const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9₦\s]/g, " ").replace(/\s+/g, " ").trim();

function within(a: string, b: string, max: number): boolean { // is the edit distance between a and b at most `max`?
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

// 0 = no match. 3 = word starts with it, 2 = found inside a word, 1 = close spelling.
function wordScore(token: string, words: string[], text: string): number {
  if (words.some((w) => w.startsWith(token))) return 3;
  if (token.length >= 3 && text.includes(token)) return 2;
  if (token.length >= 4) {
    const max = token.length >= 7 ? 2 : 1;
    if (words.some((w) => within(token, w.slice(0, token.length + 1), max) || within(token, w, max))) return 1;
  }
  return 0;
}

// `fields` run from most to least important (for example name, category, description).
export function searchScore(query: string, fields: (string | undefined)[]): number {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (!tokens.length) return 1;
  const prepared = fields.map((f) => { const t = norm(f ?? ""); return { t, w: t.split(" ").filter(Boolean) }; });
  let total = 0;
  for (const tok of tokens) {
    let best = 0;
    prepared.forEach((f, i) => { const s = wordScore(tok, f.w, f.t); if (s) best = Math.max(best, s * (fields.length - i)); });
    if (!best) return 0; // every typed word must be found somewhere
    total += best;
  }
  return total;
}
