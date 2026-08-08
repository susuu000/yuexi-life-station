/* 月夕生活台 - 轻量 Service Worker（PWA 可安装 + 离线兜底）
   策略：
     - 导航请求（req.mode === 'navigate'）→ 网络优先；成功时顺带把响应缓存成 ./index.html
       供离线冷启动使用；失败则依次回退 ./offline.html → 缓存的 ./index.html，杜绝首次无网白屏。
     - 同源静态资源（html/css/js/图片/字体/音频）→ 缓存优先（stale-while-revalidate）
       立即从缓存响应，离线冷启动零白屏；后台静默拉取新版并更新缓存，下次访问生效。
     - 实时数据（data/feeds.json 等）→ 网络优先，保证 Actions 更新后能立即生效；离线则回退缓存
     - 跨域 **脚本**（jsDelivr 上的 Supabase JS SDK，.js/.mjs）→ 缓存优先，失败再走网络
     - 其余所有跨域请求（Supabase REST /rest/v1/、auth、第三方 CDN 图片等）→ **纯网络，绝不写缓存**
       ⚠️ 安全红线：Supabase REST 响应携带用户隐私数据（日志/打卡/收藏等），一旦落入 Cache Storage
       就等于把私密内容明文留在磁盘上，且会造成旧数据滞留、切换账号后串数据。此分支只允许 fetch，
       任何情况下都不得调用 caches.put()。
   更新流程：新 SW 安装后进入 waiting，页面通过 postMessage 发送 SKIP_WAITING
   令其立即接管，再 reload 即可拿到新代码（横幅提示见 app.js）。
   发版后如需强制刷新缓存，请递增下面的 CACHE 版本号（如 yuexi-v5 → yuexi-v6）。
   本次 v8 → v9：activate 会删除所有非当前版本的缓存，用于**清除历史版本误缓存的
   Supabase REST 私密响应**，这是 P1-1 修复能立即生效的必要条件，请勿回退版本号。 */
const CACHE = 'yuexi-v9';
const PRECACHE = [
  './', './index.html', './manifest.json',
  './offline.html',
  './css/style.css',
  './js/config.js', './js/storage.js', './js/sync.js', './js/sections.js', './js/app.js', './js/auth.js', './js/datasource.js',
  './assets/icon.svg',
  /* 安装到主屏幕用的 PNG 图标：manifest 与 apple-touch-icon 都引用了它们，
     离线首装时缺失会导致图标回退成网页截图。
     167/152/120 为 iPad Pro / iPad / iPhone 的 apple-touch-icon 尺寸。 */
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/icon-167.png', './assets/icon-152.png', './assets/icon-120.png'
];

self.addEventListener('install', (e) => {
  // 逐资源降级：单个 URL 404 / 网络抖动不再让整批 addAll 回滚，
  // 保证核心壳（index/css/js/offline.html）总能装进缓存。
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(
      PRECACHE.map((url) => c.add(url).catch((err) => {
        console.warn('[SW] 预缓存失败:', url, err);
      }))
    ))
  );
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

  // 导航请求 → 网络优先 + 离线兜底页（必须排在静态/跨域分支之前：
  // 访问 './' 时 pathname 为 '/'，不命中 isStatic，会掉到最后的兜底分支而没有离线页可用）。
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        // 把最新的应用外壳存成 ./index.html，供下次离线冷启动使用
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
        return res;
      } catch (err) {
        // 离线：先给离线提示页，再退而求其次给缓存里的应用外壳
        const fallback = (await caches.match('./offline.html')) || (await caches.match('./index.html'));
        if (fallback) return fallback;
        // 极端情况：预缓存整批失败（首访即断网）。此时必须返回一个真实 Response，
        // respondWith(undefined) 会抛 TypeError，浏览器直接显示原生错误页。
        return new Response(
          '<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>月夕生活台</title>' +
          '<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;' +
          'font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',sans-serif;background:#F7F4EE;color:#2E6F7E;' +
          'text-align:center;line-height:1.9">' +
          '<div><strong>月夕生活台</strong><br>当前处于离线状态，请恢复网络后重试。</div>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

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

  // ---------- 跨域请求 ----------
  if (!sameOrigin) {
    // 仅「跨域脚本」可缓存：jsDelivr 上的 Supabase JS SDK（.js / .mjs）。
    // 这类资源是公开的不可变代码，缓存它是为了 CDN 被墙 / 离线时 SDK 仍能加载，
    // .catch(() => cached) 保证 respondWith 不以 reject 收场（否则请求挂起 → 白屏）。
    const isCrossOriginScript = /\.(?:js|mjs)$/i.test(url.pathname);
    if (isCrossOriginScript) {
      e.respondWith(
        caches.match(req).then((cached) =>
          cached || fetch(req).then((res) => {
            if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
            return res;
          }).catch(() => cached)
        )
      );
      return;
    }

    // 其余所有跨域请求（Supabase REST /rest/v1/、/auth/v1/、Realtime、第三方 CDN 图片等）
    // → 纯网络直连，**绝不写入 Cache Storage**。
    // ⚠️ P1-1 安全红线：这里禁止出现任何 caches.put()/cache.add()。
    //    REST 响应含用户隐私数据，写缓存会造成 (a) 隐私明文落盘 (b) 旧数据滞留、
    //    (c) 切换账号后读到上一个账号的缓存响应。
    //    离线时不做缓存兜底——宁可让 Supabase SDK 自己报网络错误走本地模式，
    //    也不能返回一份可能过期/串号的数据。
    e.respondWith(fetch(req));
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
