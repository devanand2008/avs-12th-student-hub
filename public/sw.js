const CACHE_NAME = "avs-public-shell-v3";
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("avs-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Handle HTML page navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedPage = await caches.match(event.request);
        if (cachedPage) return cachedPage;
        const offlinePage = await caches.match("/offline.html");
        return offlinePage || Response.error();
      })
    );
    return;
  }

  // Handle static assets & images
  if (
    url.origin === self.location.origin &&
    (PRECACHE_ASSETS.includes(url.pathname) ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
              );
            }
            return response;
          })
          .catch(() => cached || Response.error());
      })
    );
  }
});

