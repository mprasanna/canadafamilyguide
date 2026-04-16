// sw.js — Service Worker for Canada Family Guide PWA
const CACHE = 'cfg-v1';

// Core pages to cache immediately on install
const PRECACHE = [
  '/',
  '/index.html',
  '/news.html',
  '/newcomer-start.html',
  '/finance.html',
  '/healthcare.html',
  '/education.html',
  '/styles.css',
  '/nav.js',
  '/manifest.json'
];

// Install — cache core pages
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  // Skip API calls and non-GET requests — always go to network
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache fresh responses for HTML and CSS
        if (res.ok && (e.request.url.endsWith('.html') || e.request.url.endsWith('.css') || e.request.url.endsWith('.js'))) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
