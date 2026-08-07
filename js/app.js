/* ============================================
   app.js - 主应用逻辑
   ============================================ */

const App = {
  currentTab: 'home', // home / discover / profile
  currentSection: 'home',
  clockTimer: null,
  // 性能优化（P-1）：refresh 防抖调度状态
  refreshTimer: null,
  refreshSnapshot: null,
  // 翻页时钟缓存（P-3）
  flipEls: null,
  lastClockMinute: '',
  clockVisibilityBound: false,
  touchStartX: 0,
  touchStartY: 0,
  touchStartTime: 0,
  // B-2：iOS「添加到主屏幕」引导只提示一次的本地标记
  A2HS_KEY: 'yuexi_a2hs_dismissed',

  icons: {
    home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
    ielts: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l10-6 10 6-10 6L2 8z"/><path d="M2 16l10 6 10-6M2 12l10 6 10-6"/></svg>',
    ai: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/></svg>',
    reading: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    podcast: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>',
    media: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z"/></svg>',
    explore: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
    default: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
  },

  // 底部标签可配置注册表（#15）：id -> { name, icon(对应 this.icons 的键) }
  TAB_REGISTRY: {
    'home': { name: '首页', icon: 'home' },
    'discover': { name: '发现', icon: 'explore' },
    'profile': { name: '我的', icon: 'default' },
    'ielts': { name: '雅思', icon: 'ielts' },
    'ai-study': { name: 'AI', icon: 'ai' },
    'reading': { name: '阅读', icon: 'reading' },
    'podcast': { name: '播客', icon: 'podcast' },
    'self-media': { name: '自媒体', icon: 'media' },
    'self-exploration': { name: '探索', icon: 'default' }
  },
  // Web Push 客户端脚手架（#19）：VAPID 公钥占位，部署前需替换为真实公钥
  VAPID_PUBLIC_KEY: 'B__REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY__',

  holidays: {
    '2026-01-01': '元旦', '2026-02-16': '除夕', '2026-02-17': '春节', '2026-02-18': '春节', '2026-02-19': '春节',
    '2026-02-20': '春节', '2026-02-21': '春节', '2026-02-22': '春节', '2026-04-04': '清明节', '2026-04-05': '清明节',
    '2026-04-06': '清明节', '2026-05-01': '劳动节', '2026-05-02': '劳动节', '2026-05-03': '劳动节', '2026-05-04': '劳动节',
    '2026-05-05': '劳动节', '2026-06-19': '端午节', '2026-06-20': '端午节', '2026-06-21': '端午节',
    '2026-09-25': '中秋节', '2026-09-26': '中秋节', '2026-09-27': '中秋节',
    '2026-10-01': '国庆节', '2026-10-02': '国庆节', '2026-10-03': '国庆节', '2026-10-04': '国庆节',
    '2026-10-05': '国庆节', '2026-10-06': '国庆节', '2026-10-07': '国庆节', '2026-10-08': '国庆节'
  },

  init() {
    try {
      Storage.init();
      Sync.init();
      this.updateAppTitle();
      this.renderSidebar();
      this.renderBottomNav();
      this.updateDate();
      this.updateWeather();
      this.bindEvents();
      this.applyPersonalization();
      this.registerSW();
      this.maybeShowInstallGuide();
      Storage.pushNav('home');
      this.switchTab('home');
      this.handleSharedPayload();
      // 真实数据源：先用缓存渲染，拿到最新结果后自动刷新一次
      if (window.DataSource) DataSource.boot().catch(() => {});
    } catch(e) {
      console.error('Init error:', e);
      try {
        const content = document.getElementById('contentArea');
        if (content) content.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--text-ink-muted);">加载遇到问题，请下拉刷新重试</div>';
      } catch(e2) {}
    }
  },

  /**
   * 注册 Service Worker，并接管「有新版本」的提示流程。
   *
   * sw.js 采用缓存优先，离线冷启动不白屏；代价是新代码不会自动生效。
   * 因此这里必须给出可用的更新入口：新 SW 进入 waiting 后弹出横幅，
   * 用户点击 -> 通知它 skipWaiting -> controllerchange -> reload 拿到新代码。
   */
  async registerSW() {
    if (!('serviceWorker' in navigator)) return;
    // 记录注册前是否已有 SW 接管页面：首次安装时为 false，命中更新时为 true
    let hadController = !!navigator.serviceWorker.controller;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');

      // 页面加载时就已经有等待中的新版本
      if (reg.waiting && navigator.serviceWorker.controller) this.showUpdateBanner(reg.waiting);

      // 之后发现的新版本
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          // 有 controller 才说明是「更新」而非首次安装，首次安装不该打扰用户
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateBanner(sw);
          }
        });
      });

      // 新 SW 接管后刷新一次；加锁避免循环刷新
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) return;          // 首次安装不强制刷新
        if (this._swReloading) return;
        this._swReloading = true;
        window.location.reload();
      });

      // 回到前台时主动查一次更新
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (e) {
      console.warn('[月夕] Service Worker 注册失败：', e && e.message);
    }
  },

  /** 展示「新版本已就绪」横幅 */
  showUpdateBanner(worker) {
    if (this._updateBannerShown) return;
    this._updateBannerShown = true;
    this._waitingWorker = worker || null;

    let bar = document.getElementById('updateBanner');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'updateBanner';
      bar.className = 'update-banner';
      bar.innerHTML =
        '<span class="update-banner-text">新版本已就绪，点击刷新</span>' +
        '<button type="button" class="update-banner-btn" id="updateBannerBtn">刷新</button>' +
        '<button type="button" class="update-banner-close" id="updateBannerClose" aria-label="稍后再说">×</button>';
      document.body.appendChild(bar);
      document.getElementById('updateBannerBtn').addEventListener('click', () => this.applyUpdate());
      document.getElementById('updateBannerClose').addEventListener('click', () => {
        bar.classList.remove('show');
        // 关掉只是本次不打扰，下次进入仍会提示，不会把用户永久困在旧缓存上
        this._updateBannerShown = false;
      });
    }
    // 触发过渡动画
    requestAnimationFrame(() => bar.classList.add('show'));
  },

  /** 应用更新：让等待中的 SW 立刻接管；拿不到 SW 时直接硬刷新兜底 */
  applyUpdate() {
    const w = this._waitingWorker;
    if (w && typeof w.postMessage === 'function') {
      w.postMessage({ type: 'SKIP_WAITING' });
      // 万一 controllerchange 没来（例如 SW 状态异常），兜底强制刷新
      setTimeout(() => { if (!this._swReloading) { this._swReloading = true; window.location.reload(); } }, 1500);
      return;
    }
    this._swReloading = true;
    window.location.reload();
  },

  /* ---------- iOS 添加到主屏幕引导 ---------- */

  /** 是否为「iOS Safari 且尚未安装到主屏幕」 */
  _isIosSafariNotInstalled() {
    const ua = navigator.userAgent || '';
    const plat = navigator.platform || ua;
    const isIos = /iPhone|iPad|iPod/.test(plat) ||
      // iPadOS 13+ 默认伪装成 Mac，用触摸点数区分
      (/Macintosh/.test(ua) && typeof document !== 'undefined' && navigator.maxTouchPoints > 1);
    if (!isIos) return false;
    if (navigator.standalone) return false;                    // 已从主屏幕启动
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return false;
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;     // 第三方浏览器没有「添加到主屏幕」
    return true;
  },

  /** 首次在 iOS Safari 打开时，引导「分享 → 添加到主屏幕」（只提示一次） */
  maybeShowInstallGuide() {
    try {
      if (localStorage.getItem(this.A2HS_KEY) === '1') return;
      if (!this._isIosSafariNotInstalled()) return;
      // 让首屏先渲染完再提示，避免和初始化抢主线程
      setTimeout(() => this.showInstallGuide(), 1200);
    } catch (e) {}
  },

  showInstallGuide() {
    const shareIcon =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/>' +
      '<path d="M4 13v6a2 2 0 002 2h12a2 2 0 002-2v-6"/></svg>';
    const plusIcon =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>';

    this.showModal('添加到主屏幕', `
      <div class="a2hs-guide">
        <p class="a2hs-lead">把「月夕生活台」添加到主屏幕，可全屏运行、离线打开，体验和原生 App 一致。</p>
        <div class="a2hs-step">
          <span class="a2hs-num">1</span>
          <span class="a2hs-ico">${shareIcon}</span>
          <span class="a2hs-txt">点击 Safari 底部工具栏的<b>「分享」</b>按钮</span>
        </div>
        <div class="a2hs-step">
          <span class="a2hs-num">2</span>
          <span class="a2hs-ico">${plusIcon}</span>
          <span class="a2hs-txt">在菜单中向下滑动，选择<b>「添加到主屏幕」</b></span>
        </div>
        <div class="a2hs-step">
          <span class="a2hs-num">3</span>
          <span class="a2hs-ico">✅</span>
          <span class="a2hs-txt">右上角点<b>「添加」</b>，回到桌面即可看到图标</span>
        </div>
        <div class="a2hs-actions">
          <button type="button" class="btn btn-outline" onclick="App.dismissInstallGuide()">不再提示</button>
          <button type="button" class="btn btn-primary" onclick="App.closeModal()">知道了</button>
        </div>
      </div>
    `);
  },

  /** 「不再提示」：写入标记，之后不再弹出 */
  dismissInstallGuide() {
    try { localStorage.setItem(this.A2HS_KEY, '1'); } catch (e) {}
    this.closeModal();
  },

  applyPersonalization() {
    const p = Storage.data.settings.personalization;
    if (!p) return;
    if (p.primaryColor) document.documentElement.style.setProperty('--haze-blue', p.primaryColor);
    if (p.accentColor) document.documentElement.style.setProperty('--gold', p.accentColor);
    if (p.accentRed) document.documentElement.style.setProperty('--red', p.accentRed);
    const fonts = { default: '"PingFang SC","Noto Sans SC",sans-serif', serif: '"Songti SC","SimSun",serif', kai: '"Kaiti SC","KaiTi",serif' };
    if (p.fontFamily && fonts[p.fontFamily]) document.body.style.fontFamily = fonts[p.fontFamily];
    const sizes = { small: '13px', medium: '14px', large: '16px' };
    if (p.fontSize && sizes[p.fontSize]) document.body.style.fontSize = sizes[p.fontSize];
  },

  updateAppTitle() {
    const s = Storage.data.settings;
    const logoEl = document.querySelector('.app-logo');
    const titleEl = document.querySelector('.app-title h1');
    const subtitleEl = document.querySelector('.app-title span');
    if (s.appIcon && logoEl) {
      logoEl.innerHTML = `<img src="${s.appIcon}" alt="logo" style="width:100%;height:100%;border-radius:24px;object-fit:cover;">`;
    }
    if (titleEl) titleEl.textContent = s.appName || '月夕';
    if (subtitleEl) subtitleEl.textContent = s.appSubtitle || '生活台';
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const items = Storage.data.settings.sidebar;
    nav.innerHTML = items.map(item => `
      <div class="nav-item ${item.id === this.currentSection ? 'active' : ''}" data-section="${item.id}" onclick="App.navigate('${item.id}')">
        <span class="nav-icon">${this.icons[item.icon] || this.icons.default}</span>
        <span class="nav-label">${item.name}</span>
        ${item.custom ? `<button class="nav-delete" onclick="event.stopPropagation(); App.removeSidebar('${item.id}')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>` : ''}
      </div>
    `).join('');
  },

  // 底部Tab切换
  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });

    const content = document.getElementById('contentArea');
    if (tab === 'home') {
      // 无论之前在哪个板块，点击底部首页都直接显示首页
      this.currentSection = 'home';
      Storage.pushNav('home');
      this.renderSidebar();
      content.innerHTML = Sections.home.render();
      content.scrollTop = 0;
      this.startHomeClock();
    } else if (tab === 'discover') {
      this.currentSection = 'discover';
      Storage.pushNav('discover');
      content.innerHTML = Sections.discover.render();
      content.scrollTop = 0;
      this.bindSubTabs(null);
    } else if (tab === 'profile') {
      this.currentSection = 'profile';
      Storage.pushNav('profile');
      content.innerHTML = Sections.profile.render();
      content.scrollTop = 0;
    }
    this.syncHeaderBack();
    this.closeSidebar();
    setTimeout(() => Storage.hydrateImages(), 50);
  },

  // 侧边栏导航
  navigate(sectionId) {
    // 底部主导航 Tab 直接走 switchTab，保持底部高亮与返回栈一致（P0-1 / 搜索结果路由）
    if (sectionId === 'home' || sectionId === 'discover' || sectionId === 'profile') {
      this.switchTab(sectionId);
      return;
    }
    this.currentTab = 'home';
    const bnItems = document.querySelectorAll('.bottom-nav-item');
    let bnMatch = false;
    bnItems.forEach(el => {
      const on = el.dataset.tab === sectionId;
      if (on) bnMatch = true;
      el.classList.toggle('active', on);
    });
    if (!bnMatch) bnItems.forEach(el => el.classList.toggle('active', el.dataset.tab === 'home'));

    this.currentSection = sectionId;
    Storage.pushNav(sectionId);

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === sectionId);
    });

    const content = document.getElementById('contentArea');
    const item = Storage.data.settings.sidebar.find(s => s.id === sectionId);
    const sectionMap = {
      'home': 'home', 'ielts': 'ielts', 'ai-study': 'aiStudy', 'reading': 'reading',
      'podcast': 'podcast', 'self-media': 'selfMedia', 'self-exploration': 'selfExploration',
      'settings': 'settings',
      // 搜索结果兼容别名（驼峰写法），避免落入「自定义板块」白页并写库污染云端
      'aiStudy': 'aiStudy', 'selfExploration': 'selfExploration'
    };

    const sectionKey = sectionMap[sectionId];
    if (sectionKey && Sections[sectionKey]) {
      content.innerHTML = Sections[sectionKey].render();
      content.scrollTop = 0;
      // 绑定板块内分栏
      if (sectionKey === 'discover') this.bindSubTabs(null);
      if (sectionKey === 'aiStudy') this.bindSubTabs(null);
      if (sectionKey === 'reading') this.bindSubTabs(null);
      if (sectionKey === 'podcast') this.bindSubTabs(null);
      if (sectionKey === 'selfMedia') this.bindSubTabs(null);
      if (sectionKey === 'selfExploration') this.bindSubTabs(null);
    } else {
      content.innerHTML = `
        <div class="section-header"><div class="section-title">${item ? item.name : '板块'}</div></div>
        <div class="card"><div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-text">这是自定义板块，你可以在此自由记录</div></div>
        <textarea class="input-field mt-3" placeholder="开始记录..." oninput="App.saveCustomSection('${sectionId}', this.value)">${Storage.getDayData(sectionId, Storage.today()).text || ''}</textarea></div>
      `;
    }
    this.syncHeaderBack();
    this.closeSidebar();
    setTimeout(() => Storage.hydrateImages(), 50);
  },

  // 返回上一级
  goBack() {
    const prev = Storage.popNav();
    if (prev) {
      if (prev === 'discover') this.switchTab('discover');
      else if (prev === 'profile') this.switchTab('profile');
      else this.navigate(prev);
    }
  },

  saveCustomSection(sectionId, value) {
    Storage.getDayData(sectionId, Storage.today()).text = value;
    Storage.save();
  },

  refresh() {
    // 性能优化（P-1）：防抖合并同一时隙内的多次 refresh 调用，
    // 避免 sync 实时推送 / 连续操作触发的全量 innerHTML 重渲染卡顿。
    const content = document.getElementById('contentArea');
    // 每次调用都刷新焦点/滚动快照（最新一次为准），渲染时用它恢复（IX-2/IX-3）
    const active = document.activeElement;
    let focusId = null, selStart = 0, selEnd = 0;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      focusId = active.id;
      try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) {}
    }
    const qn = document.getElementById('quickNoteInput');
    this.refreshSnapshot = {
      focusId, selStart, selEnd,
      quickNoteDraft: qn ? qn.value : '',
      scrollTop: content ? content.scrollTop : 0
    };
    // 已调度则直接返回，等待合并后的那次渲染
    if (this.refreshTimer) return;
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this._doRefresh(this.refreshSnapshot);
    }, 80);
  },

  _doRefresh(snap) {
    const content = document.getElementById('contentArea');
    if (this.currentTab === 'home' && this.currentSection === 'home') {
      this.switchTab('home');
    } else if (this.currentTab === 'home') {
      this.navigate(this.currentSection);
    } else {
      this.switchTab(this.currentTab);
    }

    // 恢复滚动位置，避免刷新后跳到顶部（IX-2 体验优化）
    if (content) content.scrollTop = snap.scrollTop;
    // 恢复未保存的快速记录草稿，避免刷新后丢失（DEFECT #2 修复）
    if (snap.quickNoteDraft) {
      const qnEl = document.getElementById('quickNoteInput');
      if (qnEl) qnEl.value = snap.quickNoteDraft;
    }
    // 恢复输入框焦点与光标
    if (snap.focusId) {
      const el = document.getElementById(snap.focusId);
      if (el) {
        el.focus();
        try { el.setSelectionRange(snap.selStart, snap.selEnd); } catch (e) {}
      }
    }
    // 首页时钟 DOM 已被重建，下次 tick 重新缓存元素引用（P-3）
    this.flipEls = null;
    // 渲染完成后异步加载 IndexedDB 中的图片（P-2 懒加载在 hydrateImages 内部处理）
    setTimeout(() => Storage.hydrateImages(), 50);
  },

  // 数据量统计（用于 F-3 备份提醒）
  getDataCount() {
    const d = Storage.data;
    let c = 0;
    ['ielts', 'aiStudy', 'podcast', 'selfMedia', 'selfExploration'].forEach(k => { c += Object.keys(d[k] || {}).length; });
    if (d.reading && d.reading.checkin) c += Object.values(d.reading.checkin).reduce((s, a) => s + ((a && a.length) || 0), 0);
    c += (d.favorites || []).length;
    if (d.discover && d.discover.notes) c += Object.keys(d.discover.notes).length;
    return c;
  },

  // F-3：备份提醒横幅（累计 30 条时温和提示）
  getBackupTip() {
    if (Storage.data.settings && Storage.data.settings.backupTipDismissed) return '';
    const count = this.getDataCount();
    if (count < 30) return '';
    return `
      <div class="backup-tip" id="backupTip">
        <span class="backup-tip-text">数据已积累 ${count} 条，建议导出备份以防丢失</span>
        <button class="backup-tip-btn" onclick="App.dismissBackupTip(false)">去备份</button>
        <button class="backup-tip-close" onclick="App.dismissBackupTip(true)">×</button>
      </div>`;
  },

  dismissBackupTip(silent) {
    if (!Storage.data.settings) Storage.data.settings = {};
    Storage.data.settings.backupTipDismissed = true;
    Storage.save();
    if (silent) { this.refresh(); return; }
    this.navigate('settings');
  },

  // 日期
  updateDate() {
    const now = new Date();
    const weekdays = ['日','一','二','三','四','五','六'];
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      dateEl.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
      dateEl.style.cursor = 'pointer';
    }
  },

  // 首页实时时钟 - 翻页效果
  _flipClockExpanded: false,
  _clockTimer: null,

  startHomeClock() {
    this._flipClockExpanded = false;
    this.flipEls = null;            // 时钟 DOM 重建，清空缓存引用
    this.lastClockMinute = '';
    this.updateFlipClock();
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = setInterval(() => this.updateFlipClock(), 1000);
    // 后台标签页时暂停计时，节省资源（P-3）
    if (!this.clockVisibilityBound) {
      this.clockVisibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
        } else if (!this._clockTimer) {
          this.updateFlipClock();
          this._clockTimer = setInterval(() => this.updateFlipClock(), 1000);
        }
      });
    }
  },

  toggleFlipClock() {
    this._flipClockExpanded = !this._flipClockExpanded;
    const wrap = document.getElementById('flipSecondsWrap');
    if (wrap) wrap.style.display = this._flipClockExpanded ? '' : 'none';
  },

  updateFlipClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    // 折叠态（秒数不显示）下，分钟不变则完全不碰 DOM（P-3：每秒 → 每分钟）
    if (!this._flipClockExpanded) {
      const key = hh + mm;
      if (key === this.lastClockMinute) return;
      this.lastClockMinute = key;
    }
    // 缓存元素引用，避免每秒重复 getElementById（P-3）
    if (!this.flipEls) {
      this.flipEls = {
        h1: document.getElementById('flipH1'),
        h2: document.getElementById('flipH2'),
        m1: document.getElementById('flipM1'),
        m2: document.getElementById('flipM2'),
        s1: document.getElementById('flipS1'),
        s2: document.getElementById('flipS2')
      };
    }
    this._setFlipDigit(this.flipEls.h1, hh[0]);
    this._setFlipDigit(this.flipEls.h2, hh[1]);
    this._setFlipDigit(this.flipEls.m1, mm[0]);
    this._setFlipDigit(this.flipEls.m2, mm[1]);
    if (this._flipClockExpanded) {
      this._setFlipDigit(this.flipEls.s1, ss[0]);
      this._setFlipDigit(this.flipEls.s2, ss[1]);
    }
  },

  _setFlipDigit(el, val) {
    if (!el || el.textContent === val) return;
    el.classList.add('flip-anim');
    el.textContent = val;
    setTimeout(() => el.classList.remove('flip-anim'), 300);
  },

  startClock() {
    // 兼容旧代码
  },

  // 天气 - 基于地理位置自动更新
  _weatherData: null,
  _weatherCity: '宁波',
  _weatherLoc: { lat: '29.87', lon: '121.55' }, // 默认：宁波
  _weatherFailed: false, // 真实天气拉取失败时为 true：此时只显示降级提示，绝不编造数据

  updateWeather() {
    const weatherEl = document.getElementById('currentWeather');
    if (!weatherEl) return;
    weatherEl.innerHTML = '<span class="weather-icon">⏳</span> 获取中...';
    weatherEl.style.cursor = 'pointer';

    const fallback = () => this._fetchWeather(this._weatherLoc.lat, this._weatherLoc.lon, '宁波', weatherEl);

    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(2);
        const lon = pos.coords.longitude.toFixed(2);
        let city = '';
        try {
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
          const g = await r.json();
          city = g.city || g.locality || g.principalSubdivision || '';
        } catch (e) {}
        if (!city) city = '本地';
        this._weatherCity = city;
        await this._fetchWeather(lat, lon, city, weatherEl);
      },
      () => { fallback(); },
      { timeout: 8000, enableHighAccuracy: false }
    );
  },

  async _fetchWeather(lat, lon, city, weatherEl) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !data.current) throw new Error('no data');
      this._weatherData = data;
      this._weatherFailed = false;
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const desc = this._weatherCodeToText(code);
      const icon = this._weatherCodeToIcon(code);
      weatherEl.innerHTML = `<span class="weather-city">${city}</span> <span class="weather-icon">${icon}</span> ${temp}°${desc}`;
    } catch (e) {
      this._setFallbackWeather(weatherEl, city);
    }
  },

  /**
   * 天气拉取失败时的降级展示。
   * 明确告知「暂不可用」并提供重试入口，绝不用随机数编造温度与天气状况。
   */
  _setFallbackWeather(weatherEl, city) {
    if (!weatherEl) return;
    this._weatherData = null;
    this._weatherFailed = true;
    const name = city || this._weatherCity || '';
    weatherEl.style.cursor = 'pointer';
    weatherEl.setAttribute('title', '天气数据获取失败，点击重试');
    weatherEl.innerHTML = `${name ? `<span class="weather-city">${name}</span> ` : ''}<span class="weather-icon">⚠️</span> 天气暂不可用 · 点击重试`;
  },

  _weatherCodeToText(code) {
    if (code === 0) return '晴';
    if (code <= 3) return '多云';
    if (code <= 48) return '雾';
    if (code <= 67) return '小雨';
    if (code <= 77) return '雪';
    if (code <= 82) return '阵雨';
    if (code <= 99) return '雷雨';
    return '多云';
  },

  _weatherCodeToIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌦️';
    if (code <= 99) return '⛈️';
    return '⛅';
  },

  showWeather() {
    const city = this._weatherCity || '本地';
    if (this._weatherData && this._weatherData.daily) {
      const days = ['日','一','二','三','四','五','六'];
      const daily = this._weatherData.daily;
      let forecast = '';
      const n = Math.min(3, daily.time.length);
      for (let i = 0; i < n; i++) {
        const d = new Date(daily.time[i]);
        const hi = Math.round(daily.temperature_2m_max[i]);
        const lo = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        forecast += `<div class="weather-day"><div class="weather-day-name">${i===0?'今天':'星期'+days[d.getDay()]}</div><div class="weather-day-icon">${this._weatherCodeToIcon(code)}</div><div class="weather-day-cond">${this._weatherCodeToText(code)}</div><div class="weather-day-temp">${hi}° / ${lo}°</div></div>`;
      }
      this.showModal(`${city} · 未来3天天气`, `<div class="weather-forecast">${forecast}</div>`);
    } else {
      // 没有真实数据时不编造预报，给出明确的降级说明与重试按钮
      this.showModal('天气暂不可用', `
        <div style="padding:8px 0;color:var(--text-ink-muted);line-height:1.7;">
          <div style="font-size:32px;text-align:center;margin-bottom:8px;">⚠️</div>
          <div style="text-align:center;">暂时无法获取${city ? ' ' + city + ' ' : ''}的实时天气。</div>
          <div style="text-align:center;font-size:12px;margin-top:4px;">可能是网络不通，或未授权定位权限。</div>
        </div>
        <div class="modal-actions" style="margin-top:12px;">
          <button class="btn btn-primary" onclick="App.retryWeather()">重新获取</button>
        </div>
      `);
    }
  },

  /** 关闭弹窗并重新拉取天气（供降级态的「重新获取」按钮调用） */
  retryWeather() {
    this.closeModal();
    this.updateWeather();
  },

  // 外部链接打开（兼容 iOS / PWA）
  _openingExternal: false,

  openExternal(url) {
    if (!url) return;
    if (this._openingExternal) return;
    this._openingExternal = true;
    setTimeout(() => { this._openingExternal = false; }, 800);

    // 应用内确认弹窗：避免误触直接跳出 PWA / 离开当前页面
    const display = url.length > 60 ? url.slice(0, 57) + '…' : url;
    this._pendingExternalUrl = url;
    this.showModal('打开外部链接', `
      <p class="ext-confirm-tip">即将在浏览器中打开以下外部链接：</p>
      <p class="ext-confirm-url">${display}</p>
      <div class="ext-confirm-actions">
        <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="App._confirmOpenExternal()">继续打开</button>
      </div>
    `);
  },

  // 用户在确认弹窗中点击"继续打开"后执行真实跳转（跳转逻辑与平台适配逻辑保持原样）
  _confirmOpenExternal() {
    const url = this._pendingExternalUrl;
    this._pendingExternalUrl = null;
    this.closeModal();
    if (!url) return;

    var ua = navigator.userAgent;
    var isIOS = /iP(hone|ad|od)/.test(ua);
    var isPWA = (typeof navigator.standalone !== 'undefined' && navigator.standalone === true) ||
                (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

    // iOS PWA（添加到主屏幕）模式下，window.open 会返回"假成功"对象但什么都不打开，
    // 唯一可靠的方式是用 location.href 跳转——会跳出 PWA，在 Safari 中打开链接。
    if (isIOS && isPWA) {
      window.location.href = url;
      return;
    }

    // 普通浏览器 / iOS Safari：尝试新标签页打开
    var win = null;
    try { win = window.open(url, '_blank'); } catch (e) {}
    if (win && !win.closed && win.location) {
      return; // 成功打开新窗口
    }

    // 兜底：直接跳转
    try { window.location.href = url; } catch (e2) {}
  },

  showCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const h = Storage.data.horoscope || {};
    const hasH = h.sunSign || h.moonSign || h.risingSign;

    this.showModal(`${year}年${month+1}月 · 日历与运势`, `
      <div class="calendar-modal">
        <div class="calendar-section">
          <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="App.changeCalendarMonth(-1)">‹</button>
            <div class="calendar-title" id="calendarTitle">${year}年${month+1}月</div>
            <button class="calendar-nav-btn" onclick="App.changeCalendarMonth(1)">›</button>
          </div>
          <div class="calendar-weekdays">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>
          <div class="calendar-grid" id="calendarGrid">${this.renderCalendarDays(year, month, today)}</div>
        </div>
        <div class="horoscope-section">
          <div class="horoscope-title"><span style="font-size:20px;">🌙</span><span>星盘运势</span></div>
          ${hasH ? `
            <div class="horoscope-info">
              ${h.sunSign?`<div class="horoscope-item"><span class="horoscope-label">太阳星座</span><span class="horoscope-value">${h.sunSign}</span></div>`:''}
              ${h.moonSign?`<div class="horoscope-item"><span class="horoscope-label">月亮星座</span><span class="horoscope-value">${h.moonSign}</span></div>`:''}
              ${h.risingSign?`<div class="horoscope-item"><span class="horoscope-label">上升星座</span><span class="horoscope-value">${h.risingSign}</span></div>`:''}
            </div>
            ${h.weeklyForecast?`<div class="horoscope-forecast"><div class="forecast-label">本周运势</div><div class="forecast-content">${h.weeklyForecast}</div></div>`:`<div class="horoscope-forecast"><div class="forecast-label">本周运势</div><div class="forecast-content" style="color:var(--text-ink-muted);">暂无运势更新</div></div>`}
          ` : `<div class="horoscope-empty"><div style="font-size:32px;margin-bottom:8px;">✨</div><div style="color:var(--text-ink-muted);margin-bottom:12px;">尚未输入星盘信息</div></div>`}
        </div>
      </div>
    `);
    this._calendarYear = year;
    this._calendarMonth = month;
  },

  renderCalendarDays(year, month, today) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    let html = '';
    for (let i = firstDay - 1; i >= 0; i--) html += `<div class="calendar-day other-month">${daysInPrev - i}</div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = d === today && new Date().getMonth() === month && new Date().getFullYear() === year;
      const holiday = this.holidays[ds];
      const isWeekend = new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6;
      let cls = 'calendar-day';
      if (isToday) cls += ' today';
      if (holiday) cls += ' holiday';
      if (isWeekend && !holiday) cls += ' weekend';
      html += `<div class="${cls}" title="${holiday||''}"><span class="cal-day-num">${d}</span>${holiday?`<span class="cal-day-holiday">${holiday}</span>`:''}</div>`;
    }
    const total = firstDay + daysInMonth;
    const rem = (7 - (total % 7)) % 7;
    for (let d = 1; d <= rem; d++) html += `<div class="calendar-day other-month">${d}</div>`;
    return html;
  },

  changeCalendarMonth(delta) {
    this._calendarMonth += delta;
    if (this._calendarMonth < 0) { this._calendarMonth = 11; this._calendarYear--; }
    else if (this._calendarMonth > 11) { this._calendarMonth = 0; this._calendarYear++; }
    const t = document.getElementById('calendarTitle');
    const g = document.getElementById('calendarGrid');
    if (t) t.textContent = `${this._calendarYear}年${this._calendarMonth+1}月`;
    if (g) g.innerHTML = this.renderCalendarDays(this._calendarYear, this._calendarMonth, new Date().getDate());
  },

  bindEvents() {
    document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebarOverlay').addEventListener('click', () => this.closeSidebar());
    document.getElementById('syncBtn').addEventListener('click', () => Sync.syncNow());
    document.getElementById('addSidebarBtn').addEventListener('click', () => this.addSidebarItem());

    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.addEventListener('click', () => this.showCalendar());

    const weatherEl = document.getElementById('currentWeather');
    if (weatherEl) {
      weatherEl.addEventListener('click', () => {
        // 降级态（天气拉取失败）时点击 = 重试；正常态点击 = 查看未来 3 天
        if (this._weatherFailed) this.updateWeather();
        else this.showWeather();
      });
    }

    const logoEl = document.querySelector('.sidebar-header');
    if (logoEl) {
      logoEl.style.cursor = 'pointer';
      logoEl.addEventListener('click', (e) => {
        if (e.target.closest('.app-logo') || e.target.closest('.app-title')) {
          this.switchTab('profile');
        }
      });
    }

    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') this.closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeModal(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) this.closeSidebar(); });

    // 全局拦截外部链接（兼容 iOS PWA）
    document.addEventListener('click', (e) => {
      if (this._openingExternal) return; // 防止 openExternal 内部触发被重复拦截
      const link = e.target.closest('a[target="_blank"]');
      if (link && link.href) {
        e.preventDefault();
        e.stopPropagation();
        this.openExternal(link.href);
      }
    }, true);

    // 左侧边缘右滑返回（替代顶部返回按钮）
    this.bindEdgeSwipe();

    // 兜底保存：APP 切后台或关闭时立即保存（防止 500ms 防抖导致数据丢失）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' || document.visibilityState === 'unloaded') {
        Storage.flushSave();
      }
    });
    window.addEventListener('pagehide', () => { Storage.flushSave(); });
    window.addEventListener('beforeunload', () => { Storage.flushSave(); });
  },

  // 任务 5：左侧边缘右滑返回（替代顶部返回按钮）。
  // Pointer 事件同时覆盖触摸与鼠标，触控兜底用 touch 事件，
  // 保证移动端灵敏、桌面预览也可用鼠标拖动验证。
  bindEdgeSwipe() {
    const EDGE = 36;      // 仅识别距左边缘 ≤36px 的起手
    const THRESH = 60;    // 右滑超过 60px 才触发返回
    const HEADER_H = 64;  // 头部区域不触发，避免与菜单按钮冲突
    let sx = 0, sy = 0, st = 0, ok = false;
    const onDown = (x, y) => { if (x <= EDGE && y > HEADER_H) { sx = x; sy = y; st = Date.now(); ok = true; } };
    const onUp = (x, y) => {
      if (!ok) return; ok = false;
      const dx = x - sx, dy = y - sy, dt = Date.now() - st;
      if (dx > THRESH && Math.abs(dy) < Math.abs(dx) && dt < 1200) {
        if (this.currentTab === 'home' && this.currentSection !== 'home') this.goBack();
      }
    };
    document.addEventListener('pointerdown', e => onDown(e.clientX, e.clientY), { passive: true });
    document.addEventListener('pointerup', e => onUp(e.clientX, e.clientY), { passive: true });
    // 触摸兜底（部分浏览器 pointer 事件异常时）
    let tsx = 0, tsy = 0, tst = 0, tok = false;
    document.addEventListener('touchstart', e => {
      const t = e.touches[0];
      if (t.clientX <= EDGE && t.clientY > HEADER_H) { tsx = t.clientX; tsy = t.clientY; tst = Date.now(); tok = true; }
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (!tok) return; tok = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - tsx, dy = t.clientY - tsy, dt = Date.now() - tst;
      if (dx > THRESH && Math.abs(dy) < Math.abs(dx) && dt < 1200) {
        if (this.currentTab === 'home' && this.currentSection !== 'home') this.goBack();
      }
    }, { passive: true });
  },

  bindSubTabs(clickedBtn) {
    if (clickedBtn) {
      // 找到同一个 tabs-bar 中的所有 tab
      const bar = clickedBtn.closest('.sub-tabs-bar');
      if (!bar) return;
      bar.querySelectorAll('.sub-tab').forEach(x => x.classList.remove('active'));
      clickedBtn.classList.add('active');
      const panel = clickedBtn.dataset.panel;
      // 隐藏同级所有 panel
      const parent = bar.parentElement;
      parent.querySelectorAll('.sub-panel').forEach(p => p.style.display = 'none');
      const el = document.getElementById(panel);
      if (el) el.style.display = '';
    } else {
      // 默认绑定所有 tab 的点击事件
      document.querySelectorAll('.sub-tabs-bar').forEach(bar => {
        bar.querySelectorAll('.sub-tab').forEach(t => {
          t.onclick = () => this.bindSubTabs(t);
        });
      });
    }
  },

  toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); },
  closeSidebar() { document.getElementById('sidebar').classList.remove('open'); },

  addSidebarItem() {
    this.showModal('添加自定义板块', `
      <input class="input-field" id="newSectionName" placeholder="板块名称（如：运动、冥想）" autofocus>
      <div class="flex gap-3 mt-4">
        <button class="btn btn-primary flex-1" onclick="App.confirmAddSidebar()">添加</button>
        <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
      </div>`);
  },

  confirmAddSidebar() {
    const name = document.getElementById('newSectionName').value.trim();
    if (!name) { this.showToast('请输入板块名称'); return; }
    const id = 'custom-' + Date.now();
    Storage.data.settings.sidebar.push({ id, name, icon: 'default', custom: true });
    Storage.save();
    this.closeModal();
    this.renderSidebar();
    this.showToast('✅ 板块已添加');
  },

  removeSidebar(id) {
    if (this.currentSection === id) this.navigate('home');
    Storage.data.settings.sidebar = Storage.data.settings.sidebar.filter(s => s.id !== id);
    Storage.save();
    this.renderSidebar();
    this.showToast('已删除');
  },

  // 自动打卡（学习任意板块后触发）；source 为触发来源说明（用于 IX-7 打卡明细）
  triggerAutoCheckin(source) {
    if (Storage.autoCheckin(source)) {
      this.showToast('✅ 学习已记录，自动打卡成功');
    }
  },

  /**
   * 首页「一键打卡」。不依赖任何板块任务，直接记录今日打卡。
   * Storage.checkin() 内部按日期去重，同日重复点击不会重复计数。
   */
  manualCheckin() {
    const created = Storage.checkin('一键打卡');
    this.showToast(created ? '✅ 打卡成功' : '今日已打卡，无需重复');
    this.refresh();
  },

  /* ---------- 首页「快速记录」 ---------- */

  /** HTML 转义，避免速记内容里的尖括号破坏 innerHTML 结构 */
  escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** 时间戳 -> HH:MM */
  formatClock(ts) {
    const d = new Date(ts || Date.now());
    if (isNaN(d.getTime())) return '';
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  /** 输入时自适应高度，避免长文本需要内部滚动 */
  autoGrowQuickNote(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  },

  /** Ctrl/⌘ + Enter 快捷保存 */
  quickNoteKeydown(e) {
    if (!e) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.saveQuickNote();
    }
  },

  /** 保存速记；保存后只重渲染当前页，输入框随之清空 */
  saveQuickNote() {
    const el = document.getElementById('quickNoteInput');
    if (!el) return;
    const text = (el.value || '').trim();
    if (!text) { this.showToast('请先输入内容'); return; }
    const note = Storage.saveQuickNote(text);
    if (!note) { this.showToast('请先输入内容'); return; }
    el.value = '';
    this.showToast('✅ 已保存速记');
    this.refresh();
  },

  /** 删除一条速记 */
  deleteQuickNote(id) {
    if (Storage.deleteQuickNote(id)) {
      this.showToast('已删除');
      this.refresh();
    }
  },

  // 收藏
  toggleFavorite(item) {
    if (Storage.isFavorited(item.title)) {
      const fav = Storage.data.favorites.find(f => f.title === item.title);
      if (fav) Storage.removeFavorite(fav.id);
      this.showToast('已取消收藏');
    } else {
      Storage.addFavorite(item);
      this.showToast('✅ 已收藏');
    }
    this.refresh();
  },

  // 复制全文
  copyText(text, title) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => this.showToast('✅ 已复制'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('✅ 已复制');
    }
  },

  // 选择复制：弹出文本框供用户选择/编辑后复制
  copyTextSelect(text, title) {
    this.showModal('选择复制 · ' + (title || ''), `
      <div style="font-size:12px;color:var(--text-ink-muted);margin-bottom:8px;">可选中文字后复制，或直接复制全文</div>
      <div class="select-copy-area" contenteditable="true" style="user-select:text;-webkit-user-select:text;min-height:120px;max-height:300px;overflow-y:auto;padding:12px;background:var(--bg-card);border:1px solid var(--border-light);border-radius:8px;line-height:1.8;font-size:14px;white-space:pre-wrap;">${text}</div>
      <div class="flex gap-3 mt-4">
        <button class="btn btn-outline flex-1" onclick="App.copyTextSelectFromArea()">📋 复制选中文字</button>
        <button class="btn btn-primary flex-1" onclick="App.copyText('${(text||'').replace(/'/g,"\\'").replace(/\n/g,'\\n')}','${(title||'').replace(/'/g,"\\'")}')">复制全文</button>
      </div>
    `);
    // 自动选中全部文字
    setTimeout(() => {
      const area = document.querySelector('.select-copy-area');
      if (area) {
        const range = document.createRange();
        range.selectNodeContents(area);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 100);
  },

  copyTextSelectFromArea() {
    const sel = window.getSelection();
    const text = sel.toString();
    if (!text) { this.showToast('请先选中要复制的文字'); return; }
    this.copyText(text, '选中文字');
    this.closeModal();
  },

  showToast(msg, dur = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), dur);
  },

  /** 弹窗打开时锁定页面滚动，避免 iOS 上背景「穿透滚动」 */
  lockBodyScroll() {
    document.body.style.overflow = 'hidden';
  },

  /** 恢复页面滚动（仅当没有任何弹窗处于打开状态时） */
  unlockBodyScroll() {
    const anyOpen = !!document.querySelector('.modal-overlay.show');
    if (!anyOpen) document.body.style.overflow = '';
  },

  showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalOverlay').classList.add('show');
    this.lockBodyScroll();
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    this.unlockBodyScroll();
  },

  /**
   * 导出备份。
   * iOS Safari（尤其是「添加到主屏幕」的 PWA）里 <a download> 基本不可用，
   * 因此优先走 Web Share API 分享文件，其次退回剪贴板。
   */
  async exportData() {
    const json = Storage.exportData();
    const fileName = `yuexi-backup-${Storage.today()}.json`;

    // 1) Web Share API（iOS 可存到「文件」App / 发给自己）
    try {
      if (typeof File === 'function' && navigator.share && navigator.canShare) {
        const file = new File([json], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '月夕生活台备份' });
          this.showToast('✅ 数据已导出');
          return;
        }
      }
    } catch (e) {
      // 用户主动取消分享面板时不再继续兜底，也不报错
      if (e && e.name === 'AbortError') return;
    }

    // 2) 剪贴板兜底
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
        window.alert('本设备不支持直接保存文件，备份内容已复制到剪贴板。\n请粘贴到「备忘录」或任意文本文件中保存。');
        this.showToast('✅ 备份已复制到剪贴板');
        return;
      }
    } catch (e) {}

    // 3) 桌面浏览器：传统下载
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('✅ 数据已导出');
    } catch (e) {
      window.alert('导出失败，请手动复制备份内容：\n\n' + json.slice(0, 2000));
    }
  },

  // 全局搜索：跨板块搜索笔记与记录
  openGlobalSearch() {
    this.showModal('🔍 全局搜索', `
      <input class="input-field" id="globalSearchInput" placeholder="搜索财务、手账、日常、收藏、书影、笔记..." oninput="App.runGlobalSearch(this.value)" autofocus>
      <div id="globalSearchResults" class="search-results"></div>
    `);
    setTimeout(() => { const el = document.getElementById('globalSearchInput'); if (el) el.focus(); }, 50);
  },

  runGlobalSearch(q) {
    const box = document.getElementById('globalSearchResults');
    if (!box) return;
    q = (q || '').trim().toLowerCase();
    if (!q) { box.innerHTML = '<div class="search-empty">输入关键词开始搜索</div>'; return; }
    const D = Storage.data || {};
    const se = D.selfExploration || {};
    const results = [];

    const push = (title, sub, target) => {
      const t = String(title || '');
      const s = String(sub || '');
      if (t.toLowerCase().includes(q) || s.toLowerCase().includes(q)) {
        results.push({ title: t, sub: s, target });
      }
    };

    // 财务
    (se.finance || []).forEach(f => push(`${(f.type==='income'?'收入':'支出')} ¥${f.amount} · ${f.cat||''}`, f.note || f.date, 'self-exploration'));
    // 手账
    (se.journal?.entries || []).forEach(e => push(e.title || '', (e.content||'').slice(0,40), 'self-exploration'));
    // 日常记录
    (se.daily || []).forEach(d => push(d.name || '', (d.text||'').slice(0,40), 'self-exploration'));
    // 心情
    (se.self?.emotions || []).forEach(e => push('心情：' + (e.mood||''), e.date, 'self-exploration'));
    // 收藏
    (D.favorites || []).forEach(f => push(f.title || '', (f.summary||'').slice(0,40), 'profile'));
    // 书影
    const bm = D.reading?.bookMedia || {};
    [...(bm.reading||[]), ...(bm.watching||[]), ...(bm.planned||[]), ...(bm.completed||[])].forEach(b => push(b.title || '', (b.author||''), 'reading'));
    // 雅思笔记
    Object.values(D.ielts || {}).forEach(day => { const notes = day.notes || {}; Object.values(notes).forEach(n => push(n.title || '雅思笔记', (n.text||'').slice(0,40), 'ielts')); });
    // AI学习笔记
    Object.values(D.aiStudy || {}).forEach(day => { const notes = day.notes || {}; Object.values(notes).forEach(n => push(n.title || 'AI笔记', (n.text||'').slice(0,40), 'ai-study')); });
    // 播客笔记
    Object.values(D.podcast || {}).forEach(day => { const notes = day.notes || {}; Object.values(notes).forEach(n => push(n.title || '播客笔记', (n.text||'').slice(0,40), 'podcast')); });

    if (results.length === 0) { box.innerHTML = '<div class="search-empty">未找到匹配「' + App.escapeHtml(q) + '」的记录</div>'; return; }
    box.innerHTML = results.slice(0, 30).map(r => `<div class="search-result-item" onclick="App.closeModal();App.navigate('${r.target}')">
      <div class="search-result-title">${App.escapeHtml(r.title)}</div>
      ${r.sub ? `<div class="search-result-sub">${App.escapeHtml(r.sub)}</div>` : ''}
    </div>`).join('');
  },

  /* ============ batch-3 #17：返回按钮生命周期 hook（替代被移除的内联猴子补丁） ============ */
  syncHeaderBack() {
    const btn = document.getElementById('headerBackBtn');
    if (!btn) return;
    const show = this.currentTab === 'home' && this.currentSection !== 'home';
    btn.classList.toggle('visible', !!show);
  },

  /* ============ batch-3 #15：底部标签自定义 ============ */
  getTabConfig() {
    try {
      const raw = localStorage.getItem('yuexi.tabs');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const valid = arr.filter(id => this.TAB_REGISTRY[id]);
          if (valid.length) return valid;
        }
      }
    } catch (e) {}
    return ['home', 'discover', 'profile'];
  },

  saveTabConfig(ids) {
    const clean = (ids || []).filter(id => this.TAB_REGISTRY[id]);
    if (!clean.length) clean.push('home');
    if (!clean.includes('home')) clean.unshift('home');
    try { localStorage.setItem('yuexi.tabs', JSON.stringify(clean)); } catch (e) {}
    this.renderBottomNav();
    this.showToast('✅ 底部标签已更新');
  },

  renderBottomNav() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    const cfg = this.getTabConfig();
    nav.innerHTML = cfg.map(id => {
      const t = this.TAB_REGISTRY[id];
      if (!t) return '';
      const ico = this.icons[t.icon] || this.icons.default;
      const fn = (id === 'home' || id === 'discover' || id === 'profile')
        ? `App.switchTab('${id}')`
        : `App.navigate('${id}')`;
      const isTop = (id === 'home' || id === 'discover' || id === 'profile');
      const active = (isTop && this.currentTab === id) || (!isTop && this.currentSection === id) ? ' active' : '';
      return `<div class="bottom-nav-item${active}" data-tab="${id}" onclick="${fn}">
        ${ico}<span>${t.name}</span>
      </div>`;
    }).join('');
  },

  tabCfgRender() {
    if (!this._tabCfgDraft) this._tabCfgDraft = this.getTabConfig().slice();
    const draft = this._tabCfgDraft;
    const registryIds = Object.keys(this.TAB_REGISTRY);
    const ordered = draft.slice();
    registryIds.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });
    return ordered.map(id => {
      const t = this.TAB_REGISTRY[id];
      const on = draft.includes(id);
      return `<div class="tab-cfg-item" data-id="${id}">
        <input type="checkbox" ${on ? 'checked' : ''} onchange="App._toggleTabCfg('${id}', this.checked)">
        <span class="tab-cfg-name">${t.name}${id === 'home' ? '（固定）' : ''}</span>
        <button type="button" class="tab-cfg-mv" onclick="App._moveTabCfg('${id}', -1)">↑</button>
        <button type="button" class="tab-cfg-mv" onclick="App._moveTabCfg('${id}', 1)">↓</button>
      </div>`;
    }).join('');
  },

  _toggleTabCfg(id, on) {
    if (!this._tabCfgDraft) this._tabCfgDraft = this.getTabConfig().slice();
    if (id === 'home') return;
    const i = this._tabCfgDraft.indexOf(id);
    if (on && i < 0) this._tabCfgDraft.push(id);
    if (!on && i >= 0) this._tabCfgDraft.splice(i, 1);
    const list = document.getElementById('tabConfigList');
    if (list) list.innerHTML = this.tabCfgRender();
  },

  _moveTabCfg(id, dir) {
    if (!this._tabCfgDraft) this._tabCfgDraft = this.getTabConfig().slice();
    const a = this._tabCfgDraft;
    const i = a.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    const list = document.getElementById('tabConfigList');
    if (list) list.innerHTML = this.tabCfgRender();
  },

  applyTabConfig() {
    const draft = (this._tabCfgDraft || this.getTabConfig().slice()).filter(id => this.TAB_REGISTRY[id]);
    if (!draft.includes('home')) draft.unshift('home');
    if (draft.length > 5) { this.showToast('底部标签最多 5 个'); return; }
    this.saveTabConfig(draft);
    this._tabCfgDraft = null;
    this.closeModal();
    this.switchTab(this.currentTab);
  },

  resetTabConfig() {
    this._tabCfgDraft = ['home', 'discover', 'profile'];
    const list = document.getElementById('tabConfigList');
    if (list) list.innerHTML = this.tabCfgRender();
  },

  /* ============ batch-3 #16：分享入站 ============ */
  handleSharedPayload() {
    try {
      const q = new URLSearchParams(location.search);
      if (!q.has('share')) return;
      const text = (q.get('text') || '').trim();
      const url = (q.get('url') || '').trim();
      const title = (q.get('title') || '').trim();
      let content = text || title || '';
      if (url && content.indexOf(url) < 0) content = (content ? content + '\n' : '') + url;
      if (history.replaceState) history.replaceState(null, '', location.pathname);
      if (!content) return;
      this._pendingShare = content;
      this.showShareInbound(content);
    } catch (e) {}
  },

  showShareInbound(content) {
    App.showModal('从分享保存', `
      <p class="card-hint">以下内容通过系统分享进入，可存入「今日聚焦 · 快速记录」。</p>
      <div class="share-inbound-text">${App.escapeHtml(content)}</div>
      <div class="quick-note-actions mt-3">
        <button type="button" class="btn btn-primary" onclick="App.saveSharedAsNote()">保存到速记</button>
        <button type="button" class="btn btn-outline" onclick="App.closeModal()">忽略</button>
      </div>
    `);
  },

  saveSharedAsNote() {
    const c = this._pendingShare;
    if (!c) { this.closeModal(); return; }
    Storage.saveQuickNote(c);
    this._pendingShare = null;
    this.closeModal();
    if (this.currentTab === 'home') this.refresh();
    this.showToast('✅ 已保存到速记');
  },

  /* ============ batch-3 #19：Web Push 客户端脚手架 ============ */
  isPushSupported() {
    return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  },

  isInstalledPWA() {
    return (navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  },

  async enablePush() {
    try {
      if (!this.isPushSupported()) { this.showToast('当前浏览器不支持 Web Push'); return; }
      if (!this.isInstalledPWA()) {
        this.showToast('请先把「月夕」添加到主屏幕，再开启提醒');
        this.maybeShowInstallGuide();
        return;
      }
      if (this.VAPID_PUBLIC_KEY.indexOf('REPLACE') >= 0) {
        this.showToast('请先在 js/app.js 配置 VAPID_PUBLIC_KEY 再开启');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.VAPID_PUBLIC_KEY
        });
      }
      try { localStorage.setItem('yuexi.pushSub', JSON.stringify(sub)); } catch (e) {}
      /* TODO(发送端)：将 sub 发到服务端（Supabase Edge Function / Cloudflare Worker）才能真正推送。
         最小发送端伪代码（Node/Edge）：
           const webpush = require('web-push');
           webpush.setVapidDetails('mailto:you@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
           await webpush.sendNotification(sub, JSON.stringify({ title:'月夕生活台', body:'今日还没打卡哦', url:'./' })); */
      this.showToast('✅ 已订阅推送（需配置发送端才会真正送达）');
      this.refreshSettingsPush();
    } catch (e) {
      console.error('enablePush failed:', e);
      if (e && e.name === 'NotAllowedError') this.showToast('已拒绝推送授权');
      else this.showToast('开启提醒失败：' + (e && e.message ? e.message : e));
    }
  },

  async disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      try { localStorage.removeItem('yuexi.pushSub'); } catch (e) {}
      this.showToast('已关闭提醒');
      this.refreshSettingsPush();
    } catch (e) {
      this.showToast('关闭提醒失败');
    }
  },

  getPushStatus() {
    try { return !!localStorage.getItem('yuexi.pushSub'); } catch (e) { return false; }
  },

  refreshSettingsPush() {
    const el = document.getElementById('pushStatusText');
    if (el) el.textContent = this.getPushStatus() ? '已开启' : '未开启';
  }
};

/* 顶层 const 只进 global declarative record，不会成为 window 的属性。
   datasource.js / index.html 里的 `window.App && ...` 守卫依赖这个显式挂载，
   缺了它那些分支会恒为假（写法与 datasource.js 末尾的 window.DataSource 保持一致）。 */
window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) App.refresh();
}, 60000);
