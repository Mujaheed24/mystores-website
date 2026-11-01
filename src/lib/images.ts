import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getStorageClient } from "./firebase";

export const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
// File names are unique, so a photo never changes after upload. Browsers can keep it for a year.
const META = { contentType: "image/webp", cacheControl: "public,max-age=31536000,immutable" };

async function open(file: File) {
  if (!OK_TYPES.includes(file.type)) throw new Error("Use a JPG, PNG or WebP photo.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That photo is over 15 MB. Choose a smaller one.");
  return createImageBitmap(file);
}
function encode(bmp: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not process that photo."))), "image/webp", quality));
}

// Shrinks a phone photo (default max 1200px) and converts to WebP so pages load fast on mobile data.
export async function compressImage(file: File, max = 1600): Promise<Blob> {
  const bmp = await open(file);
  try { return await encode(bmp, max, 0.88); } finally { bmp.close?.(); }
}

export async function uploadImage(shopId: string, productId: string, blob: Blob): Promise<string> {
  const r = ref(getStorageClient(), `shops/${shopId}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
  await uploadBytes(r, blob, META);
  return getDownloadURL(r);
}

// Uploads the full photo (1600px) AND a smaller copy (800px, sharp on phones and laptops) used in shop grids and the seller's lists.
export async function uploadProductPhoto(shopId: string, productId: string, file: File): Promise<{ url: string; thumbUrl: string }> {
  const bmp = await open(file);
  try {
    const [full, thumb] = await Promise.all([encode(bmp, 1600, 0.86), encode(bmp, 800, 0.82)]);
    const base = `shops/${shopId}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const a = ref(getStorageClient(), `${base}.webp`), b = ref(getStorageClient(), `${base}-t.webp`);
    await Promise.all([uploadBytes(a, full, META), uploadBytes(b, thumb, META)]);
    const [url, thumbUrl] = await Promise.all([getDownloadURL(a), getDownloadURL(b)]);
    return { url, thumbUrl };
  } finally { bmp.close?.(); }
}

export async function uploadBrandImage(shopId: string, kind: "logo" | "banner", blob: Blob): Promise<string> {
  const r = ref(getStorageClient(), `shops/${shopId}/branding/${kind}-${Date.now()}.webp`);
  await uploadBytes(r, blob, META);
  return getDownloadURL(r);
}
// Removes files from Storage by their download URLs. Failures are ignored so a missing file never blocks the seller.
export async function deleteImages(urls: string[]) {
  await Promise.all(urls.map((u) => deleteObject(ref(getStorageClient(), u)).catch(() => {})));
}
