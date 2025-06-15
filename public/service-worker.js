const CACHE_NAME = 'nexlify-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/splash-320x480.png',
  '/splash-640x960.png',
  '/splash-640x1136.png',
  '/splash-750x1334.png',
  '/splash-1080x1920.png',
  '/splash-1242x2208.png',
  '/splash-1125x2436.png',
  '/splash-1440x2560.png',
  // Add more assets if needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
}); 