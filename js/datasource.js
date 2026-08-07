/**
 * DataSource — 真实数据源统一读取层
 *
 * 架构说明：
 *   浏览器端直接抓取新闻 / 股市 / RSS 会被 CORS 拦截，第三方代理又不稳定。
 *   因此改由 GitHub Actions 在服务端定时抓取（scripts/fetch-feeds.mjs），
 *   把结果写进仓库的 data/feeds.json，前端「同源」读取 —— 秒开、无 CORS、不依赖第三方。
 *
 * 读取顺序：
 *   1) 同源 data/feeds.json（GitHub Pages 上就是最新抓取结果）
 *   2) localStorage 缓存（离线 / 断网时）
 *   3) 各板块自带的示例数据（首次打开且断网）
 *
 * 数据结构：
 *   { updatedAt, news:{data,updatedAt,stale}, ai:…, stock:…, podcastHot:…,
 *     podcastFollow:…, sanlian:…, subscriptions:{data:{thinking,psychology,lifestyle}},
 *     inspiration:…, releases:… }
 */
const DataSource = {
  URL: 'data/feeds.json',
  LS_KEY: 'wb_yuexi_feeds_cache',
  raw: null,
  loading: null,
  lastError: null,

  /** 转义字符串，防止外部 RSS / 资讯标题注入 HTML（P0-3） */
  _escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  /** 递归转义对象 / 数组中的所有字符串值（feed 标题、摘要、URL 等） */
  _sanitize(v) {
    if (typeof v === 'string') return this._escapeHtml(v);
    if (Array.isArray(v)) return v.map(x => this._sanitize(x));
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = this._sanitize(v[k]);
      return o;
    }
    return v;
  },

  /** 载入数据；force=true 时绕过浏览器缓存重新拉取 */
  async load(force = false) {
    if (this.raw && !force) return this.raw;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      // 1) 同源 JSON
      try {
        const bust = force ? '?t=' + Date.now() : '?v=' + new Date().toISOString().slice(0, 13);
        const res = await fetch(this.URL + bust, { cache: force ? 'reload' : 'default' });
        if (res.ok) {
          const json = await res.json();
          if (json && json.updatedAt) {
            this.raw = this._sanitize(json);
            this.lastError = null;
            try { localStorage.setItem(this.LS_KEY, JSON.stringify(this.raw)); } catch (e) {}
            return this.raw;
          }
        }
        this.lastError = 'HTTP ' + res.status;
      } catch (e) {
        this.lastError = e.message;
      }

      // 2) 本地缓存兜底（同样转义，避免旧缓存携带未转义内容）
      try {
        const cached = localStorage.getItem(this.LS_KEY);
        if (cached) {
          try { this.raw = this._sanitize(JSON.parse(cached)); } catch (e) { this.raw = null; }
          if (this.raw) return this.raw;
        }
      } catch (e) {}

      // 3) 交给各板块用示例数据兜底
      this.raw = null;
      return null;
    })();

    try { return await this.loading; } finally { this.loading = null; }
  },

  /** 取某个板块的完整节点 */
  node(key) {
    return (this.raw && this.raw[key]) || null;
  },

  /** 取数组型板块数据，无数据返回 [] */
  list(key) {
    const n = this.node(key);
    if (!n) return [];
    return Array.isArray(n.data) ? n.data : [];
  },

  /** 取对象型板块数据（如 subscriptions 的分组） */
  map(key) {
    const n = this.node(key);
    return n && n.data && !Array.isArray(n.data) ? n.data : null;
  },

  updatedAt(key) {
    const n = this.node(key);
    return (n && n.updatedAt) || (this.raw && this.raw.updatedAt) || '';
  },

  isStale(key) {
    const n = this.node(key);
    return !!(n && n.stale);
  },

  /**
   * 是否真的拿到了内容。
   * 传 key 时只看该板块；不传时只要任意一个板块有数据即算有。
   * 用于避免「明明没有任何新内容，却提示已更新到最新数据」。
   */
  hasData(key) {
    if (!this.raw) return false;
    if (key) {
      const n = this.node(key);
      if (!n || !n.data) return false;
      return Array.isArray(n.data) ? n.data.length > 0 : Object.keys(n.data).length > 0;
    }
    return Object.keys(this.raw).some(k => {
      const n = this.raw[k];
      if (!n || typeof n !== 'object' || !n.data) return false;
      return Array.isArray(n.data) ? n.data.length > 0 : Object.keys(n.data).length > 0;
    });
  },

  /** 相对时间：刚刚 / 12 分钟前 / 3 小时前 */
  relative(iso) {
    if (!iso) return '';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      if (isNaN(diff)) return '';
      const min = Math.floor(diff / 60000);
      if (min < 1) return '刚刚';
      if (min < 60) return min + ' 分钟前';
      const hr = Math.floor(min / 60);
      if (hr < 24) return hr + ' 小时前';
      const day = Math.floor(hr / 24);
      if (day < 30) return day + ' 天前';
      return new Date(iso).toLocaleDateString('zh-CN');
    } catch (e) { return ''; }
  },

  /** 统一的「更新于 xxx」小字条 */
  stamp(key) {
    const at = this.updatedAt(key);
    if (!at) return '';
    const stale = this.isStale(key)
      ? '<span style="color:var(--gold,#b8860b);margin-left:6px;">源暂时不可用，显示上次结果</span>'
      : '';
    return `<div class="ds-stamp">更新于 ${this.relative(at)}${stale}</div>`;
  },

  /**
   * 手动刷新：重新拉取并重渲染当前页。
   * @param {string} btnId 触发按钮 id（用于 loading 态）
   * @param {string} [key] 该按钮对应的数据源 key；传了就只针对这个板块判断有没有内容
   */
  async refresh(btnId, key) {
    const btn = btnId && document.getElementById(btnId);
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '刷新中…'; btn.disabled = true; }
    await this.load(true);
    if (btn) { btn.innerHTML = oldHtml; btn.disabled = false; }
    if (window.App && App.refresh) App.refresh();
    if (window.App && App.showToast) {
      if (!this.raw) {
        App.showToast('暂时无法连接数据源，显示本地缓存');
      } else if (!this.hasData(key)) {
        // 拉到了 JSON 但该板块没有任何条目：不能谎称「已更新到最新数据」
        App.showToast('暂无更新');
      } else {
        App.showToast('已更新到最新数据');
      }
    }
  },

  /**
   * 启动时预载：先渲染（用缓存/示例），拿到数据后再刷一次。
   * 这样冷启动不会白屏等待网络。
   */
  async boot() {
    // 先同步吃本地缓存，让首屏就能出真实内容（转义后再用，防止未转义内容先渲染）
    try {
      const cached = localStorage.getItem(this.LS_KEY);
      if (cached) { try { this.raw = this._sanitize(JSON.parse(cached)); } catch (e) { this.raw = null; } }
    } catch (e) {}

    const before = this.raw && this.raw.updatedAt;
    await this.load(true);
    const after = this.raw && this.raw.updatedAt;
    if (after && after !== before && window.App && App.refresh) App.refresh();
  }
};

window.DataSource = DataSource;
