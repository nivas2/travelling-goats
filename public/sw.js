// Kill-switch service worker.
//
// A previous version of this app shipped a *caching* service worker, which can
// keep serving stale HTML/JS/CSS after changes ("I can't see my changes").
// This replacement does the opposite: on activation it deletes every cache,
// unregisters itself, and reloads any open tabs — so nothing is ever cached
// and the browser always fetches the latest from the server.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch {
        /* ignore */
      }
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});

// Pass every request straight through to the network — never serve from cache.
self.addEventListener("fetch", () => {});
