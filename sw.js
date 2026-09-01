/*
  Sohaib Traders — Service Worker
  ---------------------------------
  Bump CACHE_VERSION any time you upload a new index.html so old cached
  copies are thrown away automatically. This also uses a "network first"
  strategy for the app page itself, so as long as the phone/laptop has
  internet, it always loads the latest version from GitHub Pages instead
  of an old cached one — offline mode is only a fallback, not the default.
*/
const CACHE_VERSION = 'sohaib-traders-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {
      // If any asset fails to fetch during install, don't block install —
      // the app will still work, just without a full offline copy yet.
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Network-first for page navigation (the HTML itself), so updates are
  // picked up immediately whenever there's internet. Falls back to the
  // cached copy only if offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) — these rarely change.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
