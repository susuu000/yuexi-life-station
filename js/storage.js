/* ============================================
   storage.js - 数据存储与自动保存
   ============================================ */

const Storage = {
  DB_KEY: 'yuexi_life_data_v3',
  BACKUP_KEY: 'yuexi_life_data_v3_backup',
  saveTimer: null,
  _idb: null,
  _idbReady: false,

  // 默认数据结构
  defaultData: {
    settings: {
      appName: '月夕',
      appSubtitle: '生活台',
      appIcon: '',
      sidebar: [
        { id: 'home', name: '首页', icon: 'home', custom: false },
        { id: 'ielts', name: '雅思学习', icon: 'ielts', custom: false },
        { id: 'ai-study', name: 'AI学习', icon: 'ai', custom: false },
        { id: 'reading', name: '阅读', icon: 'reading', custom: false },
        { id: 'podcast', name: '播客', icon: 'podcast', custom: false },
        { id: 'self-media', name: '自媒体', icon: 'media', custom: false },
        { id: 'self-exploration', name: '自我探索', icon: 'explore', custom: false }
      ],
      theme: 'classical',
      personalization: {
        primaryColor: '#2E6F7E',
        accentColor: '#D4A847',
        accentRed: '#C04830',
        fontFamily: 'default',
        fontSize: 'medium',
        density: 'comfortable'
      }
    },
    sync: {
      connected: false,
      lastSync: null,
      envId: ''
    },
    // 打卡系统
    checkin: {
      records: {}, // { '2026-07-29': true, ... }
      streak: 0,
      totalDays: 0
    },
    // 导航历史（用于滑动返回）
    navHistory: [],
    // 首页「快速记录」速记条目：[{ id, text, date, ts }]
    quickNotes: [],
    // 收藏系统
    favorites: [],
    ielts: {},
    aiStudy: {},
    reading: {
      bookMedia: { reading: [], watching: [], planned: [], completed: [] },
      checkin: {}, // { '2026-07-29': [{ type: 'book', title: 'xxx', color: '#xxx' }] }
      checkinColors: { book: '#2E6F7E', media: '#C04830' },
      gongzhonghao: { lastUpdate: '', articles: [] },
      sanlian: { lastUpdate: '', articles: [] } // 三联中读
    },
    podcast: {},
    selfMedia: {},
    selfExploration: {
      self: {
        emotions: [],
        skills: [],
        appearance: { ootd: [], clothes: [], hair: [], weight: [] }
      },
      daily: [],
      period: { records: [], predictions: [] },
      finance: [],
      journal: { reminders: [], entries: [] }
    },
    discover: {},
    profile: {},
    weather: { location: '', lastUpdate: '', data: null },
    horoscope: {
      birthDate: '',
      birthTime: '',
      birthPlace: '',
      sunSign: '',
      moonSign: '',
      risingSign: '',
      weeklyForecast: ''
    }
  },

  // 初始化
  init() {
    this._initIndexedDB();
    const saved = this.load();
    if (!saved) {
      this.data = JSON.parse(JSON.stringify(this.defaultData));
      this._saveNow();
    } else {
      this.data = saved;
      this.mergeDefaults();
      this._saveNow(); // 确保合并后的数据保存
    }
    return this.data;
  },

  // 初始化 IndexedDB（用于存储图片，避免 localStorage 超限）
  _initIndexedDB() {
    if (!window.indexedDB) return;
    try {
      const req = indexedDB.open('yuexi_images', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this._idb = e.target.result;
        this._idbReady = true;
      };
      req.onerror = () => { /* IndexedDB 不可用时回退到 localStorage */ };
    } catch(e) { /* ignore */ }
  },

  // 将图片存入 IndexedDB，返回图片ID
  storeImage(base64) {
    return new Promise((resolve) => {
      const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      if (!this._idb || !this._idbReady) { resolve(base64); return; } // 回退：返回 base64 本身
      try {
        const tx = this._idb.transaction(['images'], 'readwrite');
        tx.objectStore('images').put({ id, data: base64, createdAt: Date.now() });
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => resolve(base64); // 回退
      } catch(e) { resolve(base64); }
    });
  },

  // 从 IndexedDB 加载图片
  loadImage(id) {
    return new Promise((resolve) => {
      if (!id) { resolve(''); return; }
      // 在线图片：URL / dataURL 直接返回（无需 IndexedDB）
      if (typeof id === 'string' && (id.startsWith('http://') || id.startsWith('https://') || id.startsWith('data:'))) {
        resolve(id); return;
      }
      if (!this._idb || !this._idbReady || !id.startsWith('img_')) { resolve(id); return; }
      try {
        const tx = this._idb.transaction(['images'], 'readonly');
        const req = tx.objectStore('images').get(id);
        req.onsuccess = () => resolve(req.result ? req.result.data : '');
        req.onerror = () => resolve('');
      } catch(e) { resolve(''); }
    });
  },

  // 渲染后懒加载图片：仅当图片进入视口时才从 IndexedDB 取 base64 注入（P-2）
  hydrateImages(container) {
    if (!container) container = document;
    const imgs = container.querySelectorAll('img[data-img-id]');
    if (!imgs.length) return;
    // 不支持 IntersectionObserver 时回退为立即加载
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(async (el) => {
        const id = el.getAttribute('data-img-id');
        if (id && id.startsWith('img_')) {
          const src = await this.loadImage(id);
          if (src) el.src = src;
        }
      });
      return;
    }
    // 每次重渲染都重建观察器，避免对已移除（detached）节点持续持有引用造成泄漏
    if (this._imgObserver) this._imgObserver.disconnect();
    this._imgObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        obs.unobserve(el);
        const id = el.getAttribute('data-img-id');
        if (id && id.startsWith('img_')) {
          this.loadImage(id).then(src => { if (src) el.src = src; });
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.01 });
    imgs.forEach(el => this._imgObserver.observe(el));
  },

  // 合并默认值（防止旧数据缺字段）
  mergeDefaults() {
    const d = this.defaultData;
    if (!this.data.settings) this.data.settings = JSON.parse(JSON.stringify(d.settings));
    if (!this.data.settings.personalization) this.data.settings.personalization = d.settings.personalization;
    // 更新主色为秘色
    if (this.data.settings.personalization && !this.data.settings.personalization.accentRed) {
      this.data.settings.personalization.accentRed = '#C04830';
    }
    if (!this.data.settings.appName) this.data.settings.appName = '月夕';
    if (!this.data.settings.appSubtitle) this.data.settings.appSubtitle = '生活台';
    if (!this.data.settings.appIcon) this.data.settings.appIcon = '';

    // 侧边栏：确保播客在阅读后面
    let sidebar = this.data.settings.sidebar || [];
    if (!sidebar.find(s => s.id === 'home')) {
      sidebar.unshift({ id: 'home', name: '首页', icon: 'home', custom: false });
    }
    if (!sidebar.find(s => s.id === 'podcast')) {
      const readIdx = sidebar.findIndex(s => s.id === 'reading');
      if (readIdx >= 0) {
        sidebar.splice(readIdx + 1, 0, { id: 'podcast', name: '播客', icon: 'podcast', custom: false });
      } else {
        sidebar.push({ id: 'podcast', name: '播客', icon: 'podcast', custom: false });
      }
    }
    // 移除侧边栏中的时事新闻（移至发现页）
    sidebar = sidebar.filter(s => s.id !== 'news');
    // 移除侧边栏中的设置（移至我的页）
    sidebar = sidebar.filter(s => s.id !== 'settings');
    this.data.settings.sidebar = sidebar;

    if (!this.data.sync) this.data.sync = d.sync;
    if (!this.data.ielts) this.data.ielts = {};
    if (!this.data.aiStudy) this.data.aiStudy = {};
    if (!this.data.reading) this.data.reading = JSON.parse(JSON.stringify(d.reading));
    if (!this.data.reading.bookMedia) this.data.reading.bookMedia = { reading: [], watching: [], planned: [], completed: [] };
    if (!this.data.reading.checkin) this.data.reading.checkin = {};
    if (!this.data.reading.checkinColors) this.data.reading.checkinColors = { book: '#2E6F7E', media: '#C04830' };
    if (!this.data.reading.gongzhonghao) this.data.reading.gongzhonghao = { lastUpdate: '', articles: [] };
    if (!this.data.reading.sanlian) this.data.reading.sanlian = { lastUpdate: '', articles: [] };
    // 移除真正已迁移的旧字段（blogs/books/media）；sanlian 仍是当前活字段，不可删除
    if (this.data.reading.blogs) delete this.data.reading.blogs;
    if (this.data.reading.books) {
      // 迁移旧书籍数据到bookMedia
      if (this.data.reading.books.reading && this.data.reading.bookMedia.reading.length === 0) {
        this.data.reading.bookMedia.reading = this.data.reading.books.reading;
      }
      delete this.data.reading.books;
    }
    if (this.data.reading.media) {
      if (this.data.reading.media.watching && this.data.reading.bookMedia.watching.length === 0) {
        this.data.reading.bookMedia.watching = this.data.reading.media.watching;
      }
      delete this.data.reading.media;
    }

    if (!this.data.podcast) this.data.podcast = {};
    if (!this.data.selfMedia) this.data.selfMedia = {};
    if (!this.data.selfExploration) this.data.selfExploration = JSON.parse(JSON.stringify(d.selfExploration));
    if (!this.data.discover) this.data.discover = {};
    if (!this.data.profile) this.data.profile = {};
    if (!this.data.checkin) this.data.checkin = { records: {}, streak: 0, totalDays: 0 };
    if (!Array.isArray(this.data.quickNotes)) this.data.quickNotes = [];
    if (!this.data.favorites) this.data.favorites = [];
    if (!this.data.weather) this.data.weather = { location: '', lastUpdate: '', data: null };
    if (!this.data.horoscope) this.data.horoscope = d.horoscope;
    if (this.data.news) delete this.data.news; // 已迁移到discover
  },

  // 加载数据
  load() {
    try {
      const raw = localStorage.getItem(this.DB_KEY);
      if (!raw) {
        // 尝试加载旧数据
        const oldRaw = localStorage.getItem('yuexi_life_data');
        if (oldRaw) {
          const oldData = JSON.parse(oldRaw);
          localStorage.setItem(this.DB_KEY, JSON.stringify(oldData));
          return oldData;
        }
        return null;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('加载数据失败，尝试从备份恢复:', e);
      // 尝试从备份恢复
      try {
        const backupRaw = localStorage.getItem(this.BACKUP_KEY);
        if (backupRaw) {
          const backupData = JSON.parse(backupRaw);
          console.log('从备份恢复成功');
          // 用备份覆盖损坏的主数据
          localStorage.setItem(this.DB_KEY, backupRaw);
          return backupData;
        }
      } catch (e2) {
        console.error('备份也损坏:', e2);
      }
      return null;
    }
  },

  // 保存数据（带防抖）
  save() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this._saveNow();
    }, 500);
  },

  // 立即保存（用于 beforeunload / visibilitychange）
  flushSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    return this._saveNow();
  },

  // 立即保存
  _saveNow() {
    try {
      // 先备份当前数据
      const currentRaw = localStorage.getItem(this.DB_KEY);
      if (currentRaw) {
        try { localStorage.setItem(this.BACKUP_KEY, currentRaw); } catch(eBak) {}
      }
      // 保存新数据
      localStorage.setItem(this.DB_KEY, JSON.stringify(this.data));
      // 触发云端同步（防抖，避免循环）
      if (typeof Sync !== 'undefined' && Sync.onDataChange && !this._syncing) {
        Sync.onDataChange();
      }
      return true;
    } catch (e) {
      console.error('保存数据失败:', e);
      // 存储空间不足时的处理
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        // 尝试去除大体积的 base64 图片后重试
        try {
          const stripped = JSON.parse(JSON.stringify(this.data));
          this._stripBase64(stripped);
          localStorage.setItem(this.DB_KEY, JSON.stringify(stripped));
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('⚠️ 存储空间不足，图片已临时移除，文字记录已保存');
          }
          return true;
        } catch (e2) {
          console.error('去除图片后仍无法保存:', e2);
        }
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('❌ 存储空间不足，数据未保存，请导出后清理');
        }
      }
      return false;
    }
  },

  // 递归去除 data: 开头的 base64 字符串（仅用于紧急保存）
  _stripBase64(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('data:image')) {
        obj[key] = '';
      } else if (typeof obj[key] === 'object') {
        this._stripBase64(obj[key]);
      }
    }
  },

  // 获取今日日期字符串
  today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 获取昨日日期
  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 获取所有历史日期（排序）
  getHistoryDates(section) {
    const data = this.data[section] || {};
    return Object.keys(data).sort((a, b) => b.localeCompare(a));
  },

  // 获取某天的数据
  getDayData(section, date) {
    if (!this.data[section]) this.data[section] = {};
    if (!this.data[section][date]) this.data[section][date] = {};
    return this.data[section][date];
  },

  // 获取今日数据
  getTodayData(section) {
    return this.getDayData(section, this.today());
  },

  // 自动保存输入
  autoSave(element, path) {
    element.addEventListener('input', () => {
      this.setNestedValue(path, element.value);
      this.save();
    });
  },

  setNestedValue(path, value) {
    const keys = path.split('.');
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  },

  getNestedValue(path) {
    const keys = path.split('.');
    let obj = this.data;
    for (const key of keys) {
      if (obj == null) return undefined;
      obj = obj[key];
    }
    return obj;
  },

  // 图片压缩后转 base64（Canvas 压缩，max 800px / quality 0.5）
  imageToBase64(file, callback) {
    const maxSize = 800;
    const quality = 0.5;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        callback(compressed);
      };
      img.onerror = () => {
        // 压缩失败时回退到原始 FileReader 结果
        callback(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  // 压缩图片：在线则上传 Supabase Storage 返回公开 URL（可跨设备显示），
  // 否则回退本地 IndexedDB（仅本设备可见）。现有渲染代码对 URL / img_ 已分别处理，无需改动 UI。
  processImage(file, callback) {
    this.imageToBase64(file, async (base64) => {
      if (typeof Sync !== 'undefined' && Sync.isOnline && Sync.isOnline()) {
        try {
          const url = await Sync.uploadImage(file);
          if (url) { callback(url); return; }
        } catch (e) { console.warn('图片上传失败，回退本地存储', e); }
      }
      const id = await this.storeImage(base64); // 本地 IndexedDB 回退
      callback(id);
    });
  },

  // 添加收藏
  addFavorite(item) {
    if (!this.data.favorites) this.data.favorites = [];
    const fav = {
      id: 'fav-' + Date.now(),
      section: item.section || '',
      title: item.title || '',
      summary: item.summary || '',
      url: item.url || '',
      type: item.type || 'text',
      content: item.content || '',
      date: this.today()
    };
    this.data.favorites.unshift(fav);
    this.save();
    return fav;
  },

  // 移除收藏
  removeFavorite(id) {
    if (!this.data.favorites) return;
    this.data.favorites = this.data.favorites.filter(f => f.id !== id);
    this.save();
  },

  // 检查是否已收藏
  isFavorited(title) {
    if (!this.data.favorites) return false;
    return this.data.favorites.some(f => f.title === title);
  },

  // 自动打卡（学习任意板块后触发）；source 为触发来源说明（用于 IX-7 打卡明细）
  autoCheckin(source) {
    const today = this.today();
    if (!this.data.checkin) this.data.checkin = { records: {}, streak: 0, totalDays: 0, sources: {} };
    if (!this.data.checkin.sources) this.data.checkin.sources = {};
    if (this.data.checkin.records[today]) {
      if (source) this._logCheckinSource(today, source);
      return false;
    }
    this.data.checkin.records[today] = true;
    if (source) this._logCheckinSource(today, source);
    this.data.checkin.totalDays = Object.keys(this.data.checkin.records).length;
    let streak = 0;
    let d = new Date();
    while (true) {
      const ds = this.formatDate(d);
      if (this.data.checkin.records[ds]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    this.data.checkin.streak = streak;
    this.save();
    return true;
  },

  // 记录今日打卡的触发来源（去重）
  _logCheckinSource(today, source) {
    if (!this.data.checkin.sources) this.data.checkin.sources = {};
    if (!this.data.checkin.sources[today]) this.data.checkin.sources[today] = [];
    const arr = this.data.checkin.sources[today];
    if (!arr.includes(source)) arr.push(source);
  },

  /**
   * 手动打卡。
   * @param {string} [source] 打卡来源说明，用于首页「今日打卡明细」；缺省为「手动打卡」。
   * @returns {boolean} true = 本次新建了打卡记录；false = 今日已打过卡（不重复计数）。
   */
  checkin(source) {
    const today = this.today();
    if (!this.data.checkin) this.data.checkin = { records: {}, streak: 0, totalDays: 0, sources: {} };
    if (!this.data.checkin.sources) this.data.checkin.sources = {};
    const label = source || '手动打卡';
    if (this.data.checkin.records[today]) {
      // 今日已打卡：只补记来源，绝不重复累加 totalDays / streak
      this._logCheckinSource(today, label);
      this.save();
      return false;
    }
    this.data.checkin.records[today] = true;
    this._logCheckinSource(today, label);
    this.data.checkin.totalDays = Object.keys(this.data.checkin.records).length;
    // 计算连续天数
    let streak = 0;
    let d = new Date();
    while (true) {
      const ds = this.formatDate(d);
      if (this.data.checkin.records[ds]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    this.data.checkin.streak = streak;
    this.save();
    return true;
  },

  // 检查今日是否已打卡
  isCheckedIn() {
    return this.data.checkin && this.data.checkin.records && this.data.checkin.records[this.today()];
  },

  /* ---------- 首页「快速记录」速记 ---------- */

  /**
   * 保存一条速记。空白内容不落库。
   * @param {string} text 速记正文
   * @returns {object|null} 新建的条目；内容为空时返回 null
   */
  saveQuickNote(text) {
    const body = (text || '').trim();
    if (!body) return null;
    if (!Array.isArray(this.data.quickNotes)) this.data.quickNotes = [];
    const note = {
      id: 'qn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      text: body,
      date: this.today(),
      ts: Date.now()
    };
    this.data.quickNotes.unshift(note);
    // 只保留最近 200 条，避免 localStorage 无限膨胀
    if (this.data.quickNotes.length > 200) this.data.quickNotes.length = 200;
    this.save();
    return note;
  },

  /**
   * 读取速记列表。
   * @param {string} [dateStr] 传日期（YYYY-MM-DD）则只返回当天的；缺省返回全部
   * @returns {Array<object>} 按时间倒序
   */
  getQuickNotes(dateStr) {
    const all = Array.isArray(this.data.quickNotes) ? this.data.quickNotes : [];
    const list = dateStr ? all.filter(n => n && n.date === dateStr) : all.slice();
    return list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  },

  /**
   * 删除一条速记。
   * @param {string} id 条目 id
   * @returns {boolean} 是否删掉了内容
   */
  deleteQuickNote(id) {
    if (!Array.isArray(this.data.quickNotes)) return false;
    const before = this.data.quickNotes.length;
    this.data.quickNotes = this.data.quickNotes.filter(n => n && n.id !== id);
    const changed = this.data.quickNotes.length !== before;
    if (changed) this.save();
    return changed;
  },

  exportData() {
    return JSON.stringify(this.data, null, 2);
  },

  importData(jsonStr) {
    try {
      this.data = JSON.parse(jsonStr);
      this.mergeDefaults();
      this._saveNow();
      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  },

  // 导航历史
  pushNav(section) {
    if (!this.data.navHistory) this.data.navHistory = [];
    // 不重复连续记录
    const last = this.data.navHistory[this.data.navHistory.length - 1];
    if (last !== section) this.data.navHistory.push(section);
    if (this.data.navHistory.length > 50) this.data.navHistory.shift();
  },

  popNav() {
    if (!this.data.navHistory || this.data.navHistory.length < 2) return null;
    this.data.navHistory.pop();
    return this.data.navHistory[this.data.navHistory.length - 1];
  },

  getNavHistory() {
    return this.data.navHistory || [];
  }
};
