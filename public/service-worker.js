const CACHE_NAME = 'smartthrift-cache-v1';
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
      .catch(err => {
        console.error('Service Worker install: Failed to cache some files:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
      .catch(() => {
        // Optionally, return a fallback page or message
        return new Response('Resource not available', { status: 503 });
      })
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