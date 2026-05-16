/*
  Sage service worker.

  Purpose: enable offline use of the PWA shell. The user can open the
  app, read past conversations, and compose new messages even with no
  network. New messages buffer in IndexedDB until sync runs.

  Strategy:
    - App shell (HTML, CSS, JS, manifest, icons): cache-first
    - Fonts from Google: cache-first with fallback to network
    - /sync, /health: never cached (always go to network)

  Cache version: bump CACHE_VERSION when the shell changes; old caches
  are cleaned up on activate.
*/

const CACHE_VERSION = 'sage-v1';
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Use addAll with no-cors fallback; some entries may not exist yet
      return Promise.all(
        APP_SHELL.map(url =>
          cache.add(url).catch(err => {
            console.warn('Failed to cache', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache sync or health endpoints
  if (url.pathname.endsWith('/sync') || url.pathname.endsWith('/health')) {
    return;  // let the browser handle it directly
  }

  // App shell: cache-first
  if (event.request.method === 'GET' && url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Cache successful responses for next time
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Offline and not in cache — return shell as fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // External resources (fonts, etc.): cache-first with network fallback
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => new Response('Offline', { status: 503 }));
      })
    );
  }
});
