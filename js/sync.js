/* ============================================
   sync.js - Supabase 云端同步 + 邮箱登录 + 实时同步
   （替代原 CloudBase 实现，保留全局名 Sync 与旧方法签名，
    因此 app.js / storage.js 无需改动即可工作）
   ============================================ */

const Sync = {
  client: null,
  user: null,
  status: 'offline',        // offline | online | syncing
  lastSync: null,
  _pushTimer: null,
  _deviceId: null,
  _realtime: null,
  _authListeners: [],
  onNeedAuth: null,         // 由 auth.js 注入：未登录时打开登录框

  /* ---------- 初始化 ---------- */
  init() {
    this.status = 'offline';
    this.lastSync = null;

    // 设备ID（用于区分来源，可选）
    this._deviceId = localStorage.getItem('yuexi_device_id');
    if (!this._deviceId) {
      this._deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('yuexi_device_id', this._deviceId);
    }

    try {
      if (typeof supabase === 'undefined' || !supabase.createClient) {
        throw new Error('Supabase SDK 未加载');
      }
      if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR-')) {
        console.warn('Supabase 未配置（请填写 src/js/config.js），将以本地模式运行');
        this.updateUI();
        return;
      }
      this.client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // 登录态变化
      this.client.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          this.user = session.user;
          this.status = 'online';
          this._startRealtime();
          this.loadAll().catch(e => console.error('加载云端数据失败', e));
        } else {
          this.user = null;
          this.status = 'offline';
          this._stopRealtime();
        }
        this._notifyAuth();
        this.updateUI();
      });

      // 恢复已有会话
      this.client.auth.getSession().then(({ data }) => {
        if (data.session && data.session.user) {
          this.user = data.session.user;
          this.status = 'online';
          this._startRealtime();
          this.loadAll().catch(e => console.error('加载云端数据失败', e));
        }
        this._notifyAuth();
        this.updateUI();
      }).catch(() => {});
    } catch (e) {
      console.warn('Supabase 初始化失败，本地模式运行：', e.message);
    }
    this.updateUI();
  },

  /* ---------- 状态辅助 ---------- */
  isOnline() { return !!(this.client && this.user); },

  onAuthChange(cb) { if (typeof cb === 'function') this._authListeners.push(cb); },
  _notifyAuth() { this._authListeners.forEach(cb => { try { cb(this.user); } catch (e) {} }); },

  /* ---------- 邮箱注册 / 登录 / 登出 ---------- */
  async signUp(email, password) {
    if (!this.client) throw new Error('Supabase 未初始化');
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    // 若开启了"邮件确认"，此时 session 为空，需用户先去邮箱确认
    return data;
  },

  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase 未初始化');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.user = null;
    this.status = 'offline';
    this._stopRealtime();
    this._notifyAuth();
    this.updateUI();
  },

  /* ---------- 从云端加载全部数据到本地 ---------- */
  async loadAll() {
    if (!this.isOnline()) return false;
    const uid = this.user.id;
    try {
      // 设置
      const { data: sRow } = await this.client
        .from(SB_TABLES.settings).select('data').eq('user_id', uid).maybeSingle();
      if (sRow && sRow.data) {
        Storage.data.settings = deepMerge(Storage.data.settings || {}, sRow.data);
      }

      // 打卡（关系型）
      const { data: cRows } = await this.client
        .from(SB_TABLES.checkins).select('check_date').eq('user_id', uid);
      if (cRows) {
        Storage.data.checkin = Storage.data.checkin || { records: {}, streak: 0, totalDays: 0 };
        cRows.forEach(r => { Storage.data.checkin.records[r.check_date] = true; });
        recomputeCheckin(Storage.data.checkin);
      }

      // 日志（按板块+日期）
      const { data: eRows } = await this.client
        .from(SB_TABLES.entries).select('section,entry_date,payload').eq('user_id', uid);
      if (eRows) {
        eRows.forEach(r => applyEntry(r.section, r.entry_date, r.payload));
      }

      // 集合
      const { data: colRows } = await this.client
        .from(SB_TABLES.collections).select('collection_key,items').eq('user_id', uid);
      if (colRows) {
        colRows.forEach(r => setByPath(Storage.data, COLLECTION_PATH[r.collection_key] || [], r.items));
      }

      Storage.mergeDefaults();
      Storage._syncing = true;
      Storage._saveNow();
      Storage._syncing = false;

      this.lastSync = new Date().toISOString();
      Storage.data.sync = { connected: true, lastSync: this.lastSync, provider: 'supabase' };

      if (typeof App !== 'undefined' && App.refresh) App.refresh();
      this.updateUI();
      return true;
    } catch (e) {
      console.error('loadAll 失败', e);
      return false;
    }
  },

  /* ---------- 把本地数据推送到云端（规范化分表 upsert） ---------- */
  async pushAll() {
    if (!this.isOnline()) return false;
    const uid = this.user.id;
    const now = new Date().toISOString();
    try {
      // 1) 设置
      await this.client.from(SB_TABLES.settings).upsert({
        user_id: uid, data: Storage.data.settings || {}, updated_at: now
      });

      // 2) 打卡
      const dates = Object.keys(Storage.data.checkin?.records || {})
        .filter(d => Storage.data.checkin.records[d]);
      if (dates.length) {
        await this.client.from(SB_TABLES.checkins).upsert(
          dates.map(d => ({ user_id: uid, check_date: d, updated_at: now }))
        );
      }

      // 3) 日志（板块+日期）
      const entryRows = [];
      ENTRY_SECTIONS.forEach(sec => {
        const obj = Storage.data[sec];
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(date => {
          const payload = obj[date];
          if (payload && typeof payload === 'object') {
            entryRows.push({ user_id: uid, section: sec, entry_date: date, payload, updated_at: now });
          }
        });
      });
      // reading.checkin 单独成一节
      const rc = Storage.data.reading?.checkin || {};
      Object.keys(rc).forEach(date => {
        entryRows.push({ user_id: uid, section: 'reading_checkin', entry_date: date, payload: rc[date], updated_at: now });
      });
      if (entryRows.length) {
        await this.client.from(SB_TABLES.entries).upsert(entryRows);
      }

      // 4) 集合
      const colRows = COLLECTION_KEYS.map(key => ({
        user_id: uid,
        collection_key: key,
        items: getByPath(Storage.data, COLLECTION_PATH[key]) || (isListCollection(key) ? [] : {}),
        updated_at: now
      })).filter(r => r.items !== null && r.items !== undefined);
      if (colRows.length) {
        await this.client.from(SB_TABLES.collections).upsert(colRows);
      }

      this.lastSync = now;
      Storage.data.sync = { connected: true, lastSync: this.lastSync, provider: 'supabase' };
      Storage._syncing = true;
      Storage._saveNow();
      Storage._syncing = false;
      this.updateUI();
      return true;
    } catch (e) {
      console.error('pushAll 失败', e);
      return false;
    }
  },

  /* ---------- 手动同步按钮 ---------- */
  async syncNow() {
    if (!this.isOnline()) {
      if (typeof this.onNeedAuth === 'function') this.onNeedAuth();
      else if (typeof App !== 'undefined' && App.showToast) App.showToast('请先登录云端账户');
      return false;
    }
    this.status = 'syncing';
    this.updateUI();
    if (typeof App !== 'undefined' && App.showToast) App.showToast('正在同步...');
    try {
      await this.pushAll();
      await this.loadAll();   // 拉取其他设备的最新数据
      this.status = 'online';
      if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ 同步完成');
      return true;
    } catch (e) {
      console.error('syncNow 失败', e);
      this.status = 'online';
      if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ 同步失败：' + (e.message || ''));
      return false;
    } finally {
      this.updateUI();
    }
  },

  /* ---------- 本地数据变更时防抖上传 ---------- */
  onDataChange() {
    if (!this.isOnline()) return;
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.pushAll().catch(e => console.error('自动上传失败', e));
    }, 2500);
  },

  /* ---------- 图片上传到 Supabase Storage，返回公开 URL ---------- */
  async uploadImage(file) {
    if (!this.isOnline()) return null;
    const dataUrl = await new Promise(res => Storage.imageToBase64(file, res));
    if (!dataUrl) return null;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${this.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await this.client.storage
      .from(SB_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data: pub } = this.client.storage.from(SB_BUCKET).getPublicUrl(path);
    return pub.publicUrl;
  },

  /* ---------- UI ---------- */
  updateUI() {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const dot = el.querySelector('.sync-dot');
    const text = el.querySelector('.sync-text');
    if (!dot || !text) return;
    dot.className = 'sync-dot';
    switch (this.status) {
      case 'online':
        dot.classList.add('sync-dot-online');
        text.textContent = this.lastSync ? `已同步 · ${fmtSyncTime(this.lastSync)}` : '已连接';
        el.style.background = 'rgba(91,140,90,0.12)';
        break;
      case 'syncing':
        dot.classList.add('sync-dot-syncing');
        text.textContent = '同步中...';
        el.style.background = 'rgba(212,168,71,0.12)';
        break;
      default:
        dot.classList.add('sync-dot-offline');
        text.textContent = '未登录';
        el.style.background = 'var(--border-light)';
    }
  },

  /* ---------- 实时订阅 ---------- */
  _startRealtime() {
    if (!SB_REALTIME || this._realtime || !this.isOnline()) return;
    const uid = this.user.id;
    this._realtime = ['settings', 'checkins', 'entries', 'collections'].map(t => {
      const table = SB_TABLES[t];
      return this.client.channel(`${table}:${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${uid}` },
          (payload) => this._onRealtime(t, payload))
        .subscribe();
    });
  },
  _stopRealtime() {
    if (this._realtime && this.client) {
      this._realtime.forEach(ch => { try { this.client.removeChannel(ch); } catch (e) {} });
    }
    this._realtime = null;
  },
  _onRealtime(kind, payload) {
    if (!payload || !payload.new) return;
    const row = payload.new;
    Storage._syncing = true;
    try {
      if (kind === 'settings' && row.data) {
        Storage.data.settings = deepMerge(Storage.data.settings || {}, row.data);
      } else if (kind === 'checkins' && row.check_date) {
        Storage.data.checkin = Storage.data.checkin || { records: {}, streak: 0, totalDays: 0 };
        Storage.data.checkin.records[row.check_date] = true;
        recomputeCheckin(Storage.data.checkin);
      } else if (kind === 'entries' && row.section && row.entry_date) {
        applyEntry(row.section, row.entry_date, row.payload);
      } else if (kind === 'collections' && row.collection_key) {
        setByPath(Storage.data, COLLECTION_PATH[row.collection_key] || [], row.items);
      }
      Storage.mergeDefaults();
      Storage._saveNow();
    } catch (e) {
      console.error('realtime 应用失败', e);
    } finally {
      Storage._syncing = false;
    }
    if (typeof App !== 'undefined' && App.refresh) App.refresh();
  }
};

/* ============================================================
   映射关系与工具函数
   ============================================================ */

/* 日志：本地"板块" -> entries.section 名 */
const ENTRY_SECTIONS = ['ielts', 'aiStudy', 'podcast', 'selfMedia', 'discover'];

function applyEntry(section, date, payload) {
  if (section === 'reading_checkin') {
    Storage.data.reading = Storage.data.reading || {};
    Storage.data.reading.checkin = Storage.data.reading.checkin || {};
    Storage.data.reading.checkin[date] = payload;
  } else if (ENTRY_SECTIONS.includes(section)) {
    Storage.data[section] = Storage.data[section] || {};
    Storage.data[section][date] = payload;
  }
}

/* 集合：collection_key -> 在 Storage.data 中的路径（数组） */
const COLLECTION_PATH = {
  'favorites':                 ['favorites'],
  'reading.bookMedia':         ['reading', 'bookMedia'],
  'reading.gongzhonghao':      ['reading', 'gongzhonghao'],
  'reading.sanlian':           ['reading', 'sanlian'],
  'se.emotions':               ['selfExploration', 'self', 'emotions'],
  'se.skills':                 ['selfExploration', 'self', 'skills'],
  'se.appearance.ootd':        ['selfExploration', 'self', 'appearance', 'ootd'],
  'se.appearance.clothes':     ['selfExploration', 'self', 'appearance', 'clothes'],
  'se.appearance.hair':        ['selfExploration', 'self', 'appearance', 'hair'],
  'se.appearance.weight':      ['selfExploration', 'self', 'appearance', 'weight'],
  'se.daily':                  ['selfExploration', 'daily'],
  'se.period':                 ['selfExploration', 'period'],
  'se.finance':                ['selfExploration', 'finance'],
  'se.journal':                ['selfExploration', 'journal'],
  'profile':                   ['profile'],
  'weather':                   ['weather'],
  'horoscope':                 ['horoscope']
};
const COLLECTION_KEYS = Object.keys(COLLECTION_PATH);
function isListCollection(key) {
  // 这些在本地是数组；其余（profile/weather/horoscope）是单对象
  return !['profile', 'weather', 'horoscope'].includes(key);
}

function getByPath(obj, path) {
  if (!path || !path.length) return undefined;
  let cur = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}
function setByPath(obj, path, val) {
  if (!path || !path.length) return;
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = val;
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return JSON.parse(JSON.stringify(source));
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && target[k] && typeof target[k] === 'object') {
      target[k] = deepMerge(target[k], sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

function recomputeCheckin(checkin) {
  checkin.records = checkin.records || {};
  checkin.totalDays = Object.keys(checkin.records).length;
  let streak = 0;
  let d = new Date();
  while (true) {
    const ds = Storage.formatDate(d);
    if (checkin.records[ds]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  checkin.streak = streak;
}

function fmtSyncTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
