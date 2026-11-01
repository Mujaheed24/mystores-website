import type { MetadataRoute } from "next";
export const dynamic = "force-static";
// Lets sellers install MyStores on their phone like an app (Add to Home screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyStores", short_name: "MyStores", description: "Open your own online store and sell on WhatsApp.",
    start_url: "/dashboard", scope: "/", display: "standalone", background_color: "#f3f6f4", theme_color: "#0c6b58",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
