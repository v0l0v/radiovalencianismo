const CACHE_NAME = 'radio-valencianismo-v3';
const urlsToCache = [
  './',
  './index.html',
  './css/style-v2.css',
  './js/radio.js',
  './js/refranes.js',
  './assets/icon.png',
  './assets/logob.png',
  './assets/default-cover.png',
  './assets/default-cover-2.png',
  './assets/default-cover-3.png',
  './assets/default-cover-4.png'
];

// Install SW
self.addEventListener('install', event => {
  self.skipWaiting(); // Activa inmediatamente sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate & Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de todas las pestañas
  );
});

// Fetch - Network First para HTML/CSS/JS, Cache First para imágenes
self.addEventListener('fetch', event => {
  // No cachear el stream de audio ni APIs externas
  if (event.request.url.includes(':8000') ||
      event.request.url.includes('itunes.apple.com') ||
      event.request.url.includes('qrserver.com') ||
      event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  const isAsset = event.request.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/);

  if (isAsset) {
    // Cache First para imágenes
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  } else {
    // Network First para HTML, CSS, JS — así los cambios se ven de inmediato
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback a caché si no hay red
    );
  }
});