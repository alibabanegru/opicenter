const CACHE_NAME = "opticenter-shell-v2";
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only handle same-origin http(s) requests; never intercept Firebase/Google/external APIs or Vite dev modules
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@") ||
    url.pathname === "/sw.js"
  ) {
    return;
  }

  // Network-first for HTML navigations so deploys are always fresh
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/");
        return cached || Response.error();
      })
    );
    return;
  }

  // Cache-first with background revalidation for production static assets/icons only
  if (
    url.pathname.startsWith("/assets/") ||
    PRECACHE_ASSETS.includes(url.pathname) ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === "basic") {
              cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })
    );
  }
});
