// Service Worker mínimo — sin caché
// Permite instalar la app como PWA pero siempre carga los archivos frescos del servidor

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Eliminar cualquier caché antigua que pudiera existir
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Sin interceptar fetch — el navegador siempre va al servidor