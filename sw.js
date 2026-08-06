/* 月夕生活台 - 轻量 Service Worker（PWA 可安装 + 离线兜底）
   策略：
     - 同源静态资源（html/css/js/图片/字体/音频）→ 缓存优先（stale-while-revalidate）
       立即从缓存响应，离线冷启动零白屏；后台静默拉取新版并更新缓存，下次访问生效。
     - 实时数据（data/feeds.json 等）→ 网络优先，保证 Actions 更新后能立即生效；离线则回退缓存
     - 跨域资源（Supabase SDK / CDN）→ 缓存优先，失败再走网络
   更新流程：新 SW 安装后进入 waiting，页面通过 postMessage 发送 SKIP_WAITING
   令其立即接管，再 reload 即可拿到新代码（横幅提示见 app.js）。
   发版后如需强制刷新缓存，请递增下面的 CACHE 版本号（如 yuexi-v5 → yuexi-v6）。 */
const CACHE = 'yuexi-v7';
const PRECACHE = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/config.js', './js/storage.js', './js/sync.js', './js/sections.js', './js/app.js', './js/auth.js', './js/datasource.js',
  './assets/icon.svg',
  /* 安装到主屏幕用的 PNG 图标：manifest 与 apple-touch-icon 都引用了它们，
     离线首装时缺失会导致图标回退成网页截图。 */
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 更新流程：页面发现新 SW 后发送 SKIP_WAITING，令其立即接管（配合 app.js 的更新横幅）
self.addEventListener('message', (e) => {
  const data = e.data;
  if (data === 'SKIP_WAITING' || (data && data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

// batch-3 #19：Web Push 客户端脚手架（发送端需另行搭建，详见 js/app.js enablePush 的 TODO）
self.addEventListener('push', (e) => {
  let data = { title: '月夕生活台', body: '', url: './' };
  if (e.data) {
    try { data = Object.assign(data, e.data.json()); }
    catch (_) { data.body = e.data.text(); }
  }
  const icon = './assets/icon-192.png';
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: icon,
      badge: icon,
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      for (const c of cls) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(target);
    })
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
    // 缓存优先（stale-while-revalidate）：立即用缓存响应，离线冷启动零白屏；
    // 同时在后台拉取最新资源并更新缓存，下次访问即生效。
    e.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
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
