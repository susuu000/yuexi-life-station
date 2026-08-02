/* ============================================
   app.js - 主应用逻辑
   ============================================ */

const App = {
  currentTab: 'home', // home / discover / profile
  currentSection: 'home',
  clockTimer: null,
  touchStartX: 0,
  touchStartY: 0,
  touchStartTime: 0,

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
      this.updateDate();
      this.updateWeather();
      this.bindEvents();
      this.applyPersonalization();
      this.registerSW();
      Storage.pushNav('home');
      this.switchTab('home');
    } catch(e) {
      console.error('Init error:', e);
      try {
        const content = document.getElementById('contentArea');
        if (content) content.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--text-ink-muted);">加载遇到问题，请下拉刷新重试</div>';
      } catch(e2) {}
    }
  },

  async registerSW() {
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('./sw.js'); } catch (e) {}
    }
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
      <div class="nav-item ${item.id === this.currentSection ? 'active' : ''}" onclick="App.navigate('${item.id}')">
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
    this.closeSidebar();
    setTimeout(() => Storage.hydrateImages(), 50);
  },

  // 侧边栏导航
  navigate(sectionId) {
    this.currentTab = 'home';
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === 'home');
    });

    this.currentSection = sectionId;
    Storage.pushNav(sectionId);

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('onclick') === `App.navigate('${sectionId}')`);
    });

    const content = document.getElementById('contentArea');
    const item = Storage.data.settings.sidebar.find(s => s.id === sectionId);
    const sectionMap = {
      'home': 'home', 'ielts': 'ielts', 'ai-study': 'aiStudy', 'reading': 'reading',
      'podcast': 'podcast', 'self-media': 'selfMedia', 'self-exploration': 'selfExploration',
      'settings': 'settings'
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
    if (this.currentTab === 'home' && this.currentSection === 'home') {
      this.switchTab('home');
    } else if (this.currentTab === 'home') {
      this.navigate(this.currentSection);
    } else {
      this.switchTab(this.currentTab);
    }
    // 渲染完成后异步加载 IndexedDB 中的图片
    setTimeout(() => Storage.hydrateImages(), 50);
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
    this.updateFlipClock();
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = setInterval(() => this.updateFlipClock(), 1000);
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
    this._setFlipDigit('flipH1', hh[0]);
    this._setFlipDigit('flipH2', hh[1]);
    this._setFlipDigit('flipM1', mm[0]);
    this._setFlipDigit('flipM2', mm[1]);
    if (this._flipClockExpanded) {
      this._setFlipDigit('flipS1', ss[0]);
      this._setFlipDigit('flipS2', ss[1]);
    }
  },

  _setFlipDigit(id, val) {
    const el = document.getElementById(id);
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

  updateWeather() {
    const weatherEl = document.getElementById('currentWeather');
    if (!weatherEl) return;
    weatherEl.innerHTML = '<span class="weather-icon">⏳</span> 获取中...';
    weatherEl.style.cursor = 'pointer';

    if (!navigator.geolocation) {
      this._fetchWeather('39.90', '116.41', weatherEl);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(2);
        const lon = pos.coords.longitude.toFixed(2);
        await this._fetchWeather(lat, lon, weatherEl);
      },
      () => { this._fetchWeather('39.90', '116.41', weatherEl); },
      { timeout: 8000, enableHighAccuracy: false }
    );
  },

  async _fetchWeather(lat, lon, weatherEl) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !data.current) throw new Error('no data');
      this._weatherData = data;
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const desc = this._weatherCodeToText(code);
      const icon = this._weatherCodeToIcon(code);
      weatherEl.innerHTML = `<span class="weather-icon">${icon}</span> ${temp}°${desc}`;
    } catch (e) {
      this._setFallbackWeather(weatherEl);
    }
  },

  _setFallbackWeather(weatherEl) {
    const month = new Date().getMonth() + 1;
    const tempRange = {1:[2,8],2:[4,12],3:[10,18],4:[15,24],5:[20,28],6:[24,32],7:[26,35],8:[26,34],9:[20,28],10:[14,22],11:[8,16],12:[3,10]};
    const range = tempRange[month] || [15,25];
    const temp = Math.floor(Math.random()*(range[1]-range[0])+range[0]);
    const conds = [['☀️','晴'],['⛅','多云'],['☁️','阴'],['🌧️','小雨']];
    const c = conds[Math.floor(Math.random()*conds.length)];
    weatherEl.innerHTML = `<span class="weather-icon">${c[0]}</span> ${temp}°${c[1]}`;
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
    if (this._weatherData && this._weatherData.daily) {
      const days = ['日','一','二','三','四','五','六'];
      const daily = this._weatherData.daily;
      let forecast = '';
      for (let i = 0; i < daily.time.length; i++) {
        const d = new Date(daily.time[i]);
        const hi = Math.round(daily.temperature_2m_max[i]);
        const lo = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        forecast += `<div class="weather-day"><div class="weather-day-name">${i===0?'今天':'星期'+days[d.getDay()]}</div><div class="weather-day-icon">${this._weatherCodeToIcon(code)}</div><div class="weather-day-cond">${this._weatherCodeToText(code)}</div><div class="weather-day-temp">${hi}° / ${lo}°</div></div>`;
      }
      this.showModal('未来一周天气', `<div class="weather-forecast">${forecast}</div>`);
    } else {
      const days = ['日','一','二','三','四','五','六'];
      let forecast = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate()+i);
        const m = d.getMonth()+1;
        const tr = {1:[2,8],2:[4,12],3:[10,18],4:[15,24],5:[20,28],6:[24,32],7:[26,35],8:[26,34],9:[20,28],10:[14,22],11:[8,16],12:[3,10]}[m]||[15,25];
        const hi = Math.floor(Math.random()*6+tr[1]);
        const lo = Math.floor(Math.random()*4+tr[0]);
        const cs = [['☀️','晴'],['⛅','多云'],['☁️','阴'],['🌧️','小雨'],['🌤️','晴间多云']];
        const c = cs[Math.floor(Math.random()*cs.length)];
        forecast += `<div class="weather-day"><div class="weather-day-name">${i===0?'今天':'星期'+days[d.getDay()]}</div><div class="weather-day-icon">${c[0]}</div><div class="weather-day-cond">${c[1]}</div><div class="weather-day-temp">${hi}° / ${lo}°</div></div>`;
      }
      this.showModal('未来一周天气', `<div class="weather-forecast">${forecast}</div>`);
    }
  },

  // 外部链接打开（兼容 iOS / PWA）
  _openingExternal: false,

  openExternal(url) {
    if (!url) return;
    if (this._openingExternal) return;
    this._openingExternal = true;
    setTimeout(() => { this._openingExternal = false; }, 800);

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
    if (weatherEl) weatherEl.addEventListener('click', () => this.showWeather());

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

    // 边缘滑动返回/前进
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

  // 边缘滑动
  bindEdgeSwipe() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const dt = Date.now() - this.touchStartTime;
      const winW = window.innerWidth;

      // 水平滑动为主
      if (Math.abs(dx) > 60 && Math.abs(dy) < 80 && dt < 500) {
        // 从左边缘向右滑 → 返回上一级
        if (this.touchStartX < 40 && dx > 60) {
          this.goBack();
        }
        // 从右边缘向左滑 → 前进（回到首页）
        else if (this.touchStartX > winW - 40 && dx < -60) {
          this.switchTab('home');
        }
      }
    }, { passive: true });
  },

  // 统一分栏绑定（支持所有板块的sub-tab）
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

  // 自动打卡（学习任意板块后触发）
  triggerAutoCheckin() {
    if (Storage.autoCheckin()) {
      this.showToast('✅ 学习已记录，自动打卡成功');
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

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  },

  showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalOverlay').classList.add('show');
  },

  closeModal() { document.getElementById('modalOverlay').classList.remove('show'); },

  exportData() {
    const data = Storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yuexi-backup-${Storage.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('✅ 数据已导出');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) App.refresh();
}, 60000);
