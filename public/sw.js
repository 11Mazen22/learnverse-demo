const CACHE = 'learning-platform-static-v3';
const STATIC = [
  '/', '/index.html', '/styles.css', '/app.js', '/chat.js', '/markdown.js', '/langdetect.js', '/manifest.webmanifest',
  '/vendor/fonts/cairo/cairo-arabic.woff2', '/vendor/fonts/cairo/cairo-latin.woff2', '/vendor/fonts/cairo/cairo-latin-ext.woff2',
];
self.addEventListener('install', (event) => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC))); });
self.addEventListener('activate', (event) => event.waitUntil(Promise.all([
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  self.clients.claim(),
])));
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
