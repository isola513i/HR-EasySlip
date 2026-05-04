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

const CACHE_NAME = "easyslip-v4";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/",
  "/signin",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicons/favicon-32x32.png",
  "/favicons/apple-touch-icon.png",
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

// ── Message: handle sign-out cache purge (PDPA compliance) ──
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_AUTH_CACHE") {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// ── Push: show notification ──
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: "EasySlip HR", body: event.data.text() }; }
  const title = payload.title || "EasySlip HR";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/favicons/apple-touch-icon.png",
      badge: "/favicons/favicon-32x32.png",
      tag: payload.tag || "easyslip-default",
      data: { url: payload.url || "/employee/today" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/employee/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      const open = all.find((c) => c.url.includes(targetUrl));
      if (open) return open.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Fetch: network-first for navigations, cache-first for assets ──
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Cacheable read-only API paths — network first, cache fallback
  const CACHEABLE_API = ["/api/v1/leave/quota/me", "/api/v1/employee/me/profile", "/api/v1/consent/status"];
  if (CACHEABLE_API.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || new Response('{"ok":false,"error":"offline"}', { status: 503, headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // Skip other API routes
  if (url.pathname.startsWith("/api/")) return;

  // PDPA: Never cache auth-required pages — prevents data leak on shared devices
  const PROTECTED_PATHS = ["/hr", "/employee", "/manager", "/profile"];
  const isProtected = PROTECTED_PATHS.some((p) => url.pathname.startsWith(p));

  // Navigation requests: network first → cache fallback (skip protected paths)
  if (request.mode === "navigate") {
    if (isProtected) {
      // Always fetch from network — never cache authenticated HR pages.
      // On offline, show offline page (not signin) to avoid forcing re-auth on flaky networks.
      event.respondWith(
        fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503 })))
      );
      return;
    }
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((r) => r || caches.match(OFFLINE_URL))
            .then((r) => r || new Response("Offline", { status: 503 }))
        )
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
