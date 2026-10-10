/* BANGTAOSTYLE app shell. Network-first: the live site always wins; the cached shell is only a
   fallback when the phone is offline. API, chat, media and streams are never cached. */
const CACHE = 'bts-shell-v1';
const SHELL = ['/', '/app/icon-192.png', '/app/icon-512.png', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/^\/(api|ws|chat)\//.test(url.pathname) || /^\/assets\/(audio|video)\//.test(url.pathname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('/', copy)); return r; }).catch(() => caches.match('/')));
  }
});
