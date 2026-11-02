// NoticeLens Lean Static Assets Service Worker for Offline OCR Support
const CACHE_NAME = 'noticelens-ocr-cache-v2';

// Essential core scripts pre-cached during install (~109 KB instead of ~35 MB)
// Core WASM variants are cached on first successful use rather than all downloaded at installation
const ESSENTIAL_PRECACHE_ASSETS = [
  '/tesseract/worker.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          // Strictly scoped to NoticeLens-owned caches
          if (key.startsWith('noticelens-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept local static tesseract engine and wasm assets
  if (url.origin === self.location.origin && url.pathname.startsWith('/tesseract/')) {
    event.respondWith(
      (async () => {
        // 1. Offline cache lookup performed before network fallback
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Fetch from network when not yet in cache
        const networkResponse = await fetch(event.request);

        // 3. Cache only after a successful 200 response
        // Await the cache put AND attach to event.waitUntil() to prevent SW termination race
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          const cachePutPromise = caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          event.waitUntil(cachePutPromise);
          await cachePutPromise;
        }

        // 4. Return original network response to application
        return networkResponse;
      })()
    );
  }
});
