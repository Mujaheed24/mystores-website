// Minimal service worker so the site can be installed. It deliberately caches NOTHING, so shops and prices are always fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
