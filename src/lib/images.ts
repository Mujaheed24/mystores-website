import { deleteObject, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
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

// ---- Product video: one per product. The phone video is NOT re-encoded in the browser, so it must already be small enough. ----
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_VIDEO_MB = 40, MAX_VIDEO_SECONDS = 60; // keep in sync with okVideo() in storage.rules
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

// Checks a chosen video and makes a still picture from it (used as the cover before the video plays).
export async function inspectVideo(file: File): Promise<{ seconds: number; poster: Blob }> {
  if (!VIDEO_TYPES.includes(file.type)) throw new Error("Use an MP4, WebM or MOV video.");
  if (file.size >= MAX_VIDEO_MB * 1024 * 1024) throw new Error(`That video is over ${MAX_VIDEO_MB} MB. Record a shorter one or lower the video quality, then try again.`);
  const url = URL.createObjectURL(file), v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
  const when = (ev: string, ms: number) => new Promise<void>((res, rej) => { const t = setTimeout(() => rej(new Error("timeout")), ms); v.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true }); v.addEventListener("error", () => { clearTimeout(t); rej(new Error("error")); }, { once: true }); });
  try {
    try { await when("loadeddata", 10000); } catch { throw new Error("This browser cannot read that video. Try an MP4 video (H.264)."); }
    if (!isFinite(v.duration) || v.duration <= 0) throw new Error("This browser cannot read that video. Try an MP4 video (H.264).");
    if (v.duration > MAX_VIDEO_SECONDS + 0.5) throw new Error(`That video is ${Math.round(v.duration)} seconds long. The limit is ${MAX_VIDEO_SECONDS} seconds.`);
    v.currentTime = Math.min(0.5, v.duration / 2);
    try { await when("seeked", 6000); } catch { /* use the first frame that loaded */ }
    if (!v.videoWidth) throw new Error("This browser cannot read that video. Try an MP4 video (H.264).");
    const k = Math.min(1, 800 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const poster = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read a picture from that video."))), "image/webp", 0.82));
    return { seconds: v.duration, poster };
  } finally { URL.revokeObjectURL(url); v.removeAttribute("src"); v.load(); }
}

// Uploads the video and its cover picture. `progress` gets 0 to 100 while the video goes up.
export async function uploadProductVideo(shopId: string, productId: string, file: File, progress?: (pct: number) => void): Promise<{ videoUrl: string; posterUrl: string }> {
  const { poster } = await inspectVideo(file);
  const base = `shops/${shopId}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const vr = ref(getStorageClient(), `${base}.${EXT[file.type]}`), pr = ref(getStorageClient(), `${base}-p.webp`);
  const up = uploadBytesResumable(vr, file, { contentType: file.type, cacheControl: META.cacheControl });
  await Promise.all([
    new Promise<void>((res, rej) => up.on("state_changed", (s) => progress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)), rej, () => res())),
    uploadBytes(pr, poster, META),
  ]);
  const [videoUrl, posterUrl] = await Promise.all([getDownloadURL(vr), getDownloadURL(pr)]);
  return { videoUrl, posterUrl };
}
