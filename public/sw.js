const CACHE = "animevault-v1";
const PRECACHE = ["/", "/index.html"];

// Install — cache shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Same-origin HTML → network first (fresh app shell)
// - Images (Supabase / AniList CDN) → cache first, 7-day TTL
// - Everything else → network first with cache fallback
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Cache-first for CDN images
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("anilist.co") ||
    url.hostname.includes("s4.anilist.co") ||
    url.hostname.includes("s1.anilist.co")
  ) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
