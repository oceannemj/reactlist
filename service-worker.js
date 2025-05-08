// service-worker.js
const CACHE_NAME = 'my-app-cache-v1';
const OFFLINE_URL = '/offline.html'; // Définissez cette variable
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  
  '/favicon.svg',
  OFFLINE_URL // Ajoutez la page offline aux ressources à cacher
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes non-GET ou externes
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Mise en cache des nouvelles ressources
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
          })
          .catch(() => {
            // Fallback pour les pages (HTML seulement)
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Prendre le contrôle immédiat
  );
});