const CACHE = 'delegacy-store-v6';
const CORE = [
  './', './index.html', './admin.html', './styles.css', './collection.css', './admin.css',
  './store-data.js', './app.js', './admin.js', './firebase-config.js',
  './manifest.webmanifest', './dl-logo.png', './icon-192.png', './icon-512.png',
  './vests-lineup.png', './tee-back-stock.png', './vest-men-front.jpg', './vest-men-back.jpg', './vest-women-front.jpg', './vest-women-back.jpg', './tee-front-detail.jpg', './tee-back-worn.jpg', './ambassador-walk.png', './ambassador-run.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(CORE.map(u => cache.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || /\.mp4($|\?)/i.test(url.pathname)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request).then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
