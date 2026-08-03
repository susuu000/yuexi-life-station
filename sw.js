/* 月夕生活台 - 轻量 Service Worker（PWA 可安装 + 离线兜底）
   策略：
     - 同源静态资源（html/css/js/图片/字体/音频）→ 网络优先，失败回退缓存
       （保证每次打开都拉取最新代码，修复能即时生效；离线时再用缓存兜底）
     - 实时数据（data/feeds.json 等）→ 网络优先，保证 Actions 更新后能立即生效；离线则回退缓存
     - 跨域资源（Supabase SDK / CDN）→ 缓存优先，失败再走网络
   发版后如需强制刷新缓存，请递增下面的 CACHE 版本号（如 yuexi-v3 → yuexi-v4）。 */
const CACHE = 'yuexi-v4';
const PRECACHE = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/config.js', './js/storage.js', './js/sync.js', './js/sections.js', './js/app.js', './js/auth.js', './js/datasource.js',
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

  // 静态资源（html/css/js/图片/字体/音频等）→ 缓存优先，离线秒开、不白屏
  const isStatic = /\.(?:html?|css|js|mjs|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp3|wav|ogg|json)$/i.test(url.pathname);

  // 实时数据（data/feeds.json 等）→ 网络优先，保证 Actions 更新后能立即生效；离线则回退缓存
  if (sameOrigin && /\/data\//.test(url.pathname)) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (sameOrigin && isStatic) {
    // 网络优先：每次打开都尝试拉取最新代码（修复即时生效）；离线或失败时回退缓存（不白屏）
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 跨域资源（Supabase SDK / CDN 等）→ 缓存优先，失败再走网络
  if (!sameOrigin) {
    e.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
      )
    );
    return;
  }

  // 其余同源请求（如将来新增的同源 API）→ 网络优先，失败回退缓存
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req))
  );
});
