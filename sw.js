// Desert Wind - Service Worker
const CACHE_VERSION = 'desert-wind-v1';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Telepítés: előre cache-eljük a fő fájlokat
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktiválás: régi cache-ek törlése
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first stratégia, fallback hálózat
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Csak GET kéréseket kezelünk
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((response) => {
        // Csak sikeres, same-origin válaszokat cache-elünk
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(req, responseClone);
        });
        return response;
      }).catch(() => {
        // Offline fallback a fő oldalhoz
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
