/* 月夕生活台 - 轻量 Service Worker（PWA 可安装 + 离线兜底）
   策略：同源资源"网络优先"，离线时回退缓存；跨域（如 Supabase CDN）缓存优先。
   发版后如需强制刷新缓存，请修改下面的 CACHE 版本号。 */
const CACHE = 'yuexi-v1';
const PRECACHE = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/config.js', './js/storage.js', './js/sync.js', './js/sections.js', './js/app.js', './js/auth.js',
  './assets/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
