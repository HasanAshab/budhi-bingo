const CACHE_NAME = 'bingo-book-v4';
const urlsToCache = [
  '/budhi-bingo',
  '/budhi-bingo/index.html',
  '/budhi-bingo/styles.css',
  '/budhi-bingo/app.js',
  '/budhi-bingo/firebase-config.js',
  '/budhi-bingo/manifest.json',
  '/budhi-bingo/icon-192.jpg',
  '/budhi-bingo/icon-512.jpg'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
