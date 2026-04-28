const CACHE_NAME = 'radio-valencianismo-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './css/style-v2.css',
  './js/radio.js',
  './js/refranes.js',
  './assets/icon.png',
  './assets/default-cover.png'
];

// Install SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch (Network first for HTML/TXT, Cache first for Assets)
self.addEventListener('fetch', event => {
  // Do not cache audio stream or external APIs
  if (event.request.url.includes('stream.zeno.fm') || 
      event.request.url.includes('api.zeno.fm') || 
      event.request.url.includes('itunes.apple.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate & Cleanup old caches
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