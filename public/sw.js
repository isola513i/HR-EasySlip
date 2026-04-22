// ════════════════════════════════════════════════════════════════
// EasySlip HR — Service Worker (Offline Shell + Network First)
// ────────────────────────────────────────────────────────────────
// Strategy:
//   - App shell (HTML, CSS, JS, icons) → Cache First
//   - API calls & dynamic pages → Network First, fallback to cache
//   - Images → Stale While Revalidate
//
// Phase 1 MVP: lightweight — no Workbox dependency.
// ════════════════════════════════════════════════════════════════

const CACHE_NAME = "easyslip-v1";

const APP_SHELL = [
  "/",
  "/signin",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// ── Install: pre-cache app shell ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for navigations, cache-first for assets ──
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and auth/api routes
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests: network first → cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: cache first → network fallback
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          // Only cache same-origin successful responses
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
    )
  );
});
