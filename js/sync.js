/* ============================================
   sync.js - Supabase 云端同步 + 邮箱登录 + 实时同步
   （替代原 CloudBase 实现，保留全局名 Sync 与旧方法签名，
    因此 app.js / storage.js 无需改动即可工作）
   ============================================ */

/* 登录/恢复会话后是否自动把本机数据回传云端。
   置 false 可在云端数据可疑时"只拉不推"，避免本地损坏形状污染云端备份。
   当前云端 17 集合形状实测正确，保持 true。 */
const SYNC_AUTO_PUSH = true;

/* 图片桶是否为私有桶。
   false（默认，当前线上行为）：images 桶 public，读图走 getPublicUrl，URL 永久有效。
   true：images 桶已在 Supabase 后台设为 private，读图必须走 createSignedUrl 签名 URL（1 小时有效）。
   ⚠️ 这两者必须与 Supabase 后台 storage.buckets.public 的实际值保持一致，否则图片全挂。
      切换步骤见 supabase/rls-hardening.sql 第 (c) 节，且历史 public URL 会立即失效。 */
const SB_BUCKET_PRIVATE = false;

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
      // 配额写满 / Safari 无痕模式下 setItem 会抛 QuotaExceededError，
      // 未捕获会直接打断 Sync.init()，整个云同步不可用。设备 ID 只是辅助信息，写不进去就退化成会话级。
      try { localStorage.setItem('yuexi_device_id', this._deviceId); } catch (e) {}
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
          // 先拉取云端，再回传本机数据（保证首次登录把本地数据迁移上云）
          this.loadAll().then(() => { if (SYNC_AUTO_PUSH) return this.pushAll().catch(() => {}); }).catch(e => console.error('加载云端数据失败', e));
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
          // 先拉取云端，再回传本机数据（保证首次登录把本地数据迁移上云）
          this.loadAll().then(() => { if (SYNC_AUTO_PUSH) return this.pushAll().catch(() => {}); }).catch(e => console.error('加载云端数据失败', e));
        }
        this._notifyAuth();
        this.updateUI();
      }).catch(() => {});
    } catch (e) {
      console.warn('Supabase 初始化失败，本地模式运行：', e.message);
    }
    // 网络在线/离线状态变化时刷新同步状态栏（仅绑定一次）
    if (!this._netBound) {
      this._netBound = true;
      window.addEventListener('online', () => this.updateUI());
      window.addEventListener('offline', () => this.updateUI());
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
    this._mergeHappened = false;
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

      // 集合（字段级 / 数组并集合并，避免整条覆盖导致其他设备修改丢失）
      const { data: colRows } = await this.client
        .from(SB_TABLES.collections).select('collection_key,items').eq('user_id', uid);
      if (colRows && colRows.length) {
        const localHadData = Object.keys(Storage.data).length > 0;
        colRows.forEach(r => {
          const path = COLLECTION_PATH[r.collection_key] || [];
          const remote = r.items;
          if (isListCollection(r.collection_key)) {
            const before = getByPath(Storage.data, path);
            const merged = mergeArrayById(before, remote, r.collection_key);
            if (before && JSON.stringify(before) !== JSON.stringify(merged)) this._mergeHappened = true;
            setByPath(Storage.data, path, merged);
          } else {
            const shape = COLLECTION_SHAPE[r.collection_key];
            const before = getByPath(Storage.data, path) || {};
            // 含 lists 的容器集合（bookMedia/period/journal）走并集，避免子列表被远端整体替换；
            // 纯对象集合（profile/weather/horoscope）保持递归 deepMerge。
            const merged = (shape && shape.lists && shape.lists.length)
              ? mergeContainer(before, remote, shape.lists)
              : deepMerge(before, remote);
            if (Object.keys(before).length) this._mergeHappened = true;
            setByPath(Storage.data, path, merged);
          }
        });
        if (localHadData && this._mergeHappened) this._maybeMergeToast();
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

  /* ---------- 读取图片 URL（public / private 桶通吃） ----------
     脚手架：SB_BUCKET_PRIVATE=false 时行为与现状完全一致（getPublicUrl），
     置 true 后自动改用 1 小时有效的签名 URL。
     ⚠️ 签名 URL 会过期，不能把它当持久值写进 Storage.data —— 应在渲染时现取。
     @param {string} path 桶内对象路径，如 '<uid>/1712345678_ab12cd.jpg'
     @returns {Promise<string>} 可直接放进 img.src 的 URL；取不到时返回 '' */
  async getImageUrl(path) {
    if (!path || !this.client) return '';
    try {
      if (SB_BUCKET_PRIVATE) {
        const { data } = await this.client.storage.from(SB_BUCKET).createSignedUrl(path, 3600);
        return (data && data.signedUrl) || '';
      }
      const { data } = this.client.storage.from(SB_BUCKET).getPublicUrl(path);
      return (data && data.publicUrl) || '';
    } catch (e) {
      console.warn('获取图片 URL 失败', e);
      return '';
    }
  },

  /* ---------- 合并提示（节流，避免初始化同步时刷屏） ---------- */
  _maybeMergeToast() {
    const now = Date.now();
    if (this._lastMergeToast && now - this._lastMergeToast < 3000) return;
    this._lastMergeToast = now;
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('已从云端合并其他设备的更新');
    }
  },

  /* ---------- UI ---------- */
  updateUI() {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const dot = el.querySelector('.sync-dot');
    const text = el.querySelector('.sync-text');
    if (!dot || !text) return;
    dot.className = 'sync-dot';

    // 网络离线时优先提示（无论是否已登录 Supabase），让用户知道当前处于离线模式
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      dot.classList.add('sync-dot-offline');
      text.textContent = '离线模式 · 数据存本地';
      el.style.background = 'var(--border-light)';
      return;
    }

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
        const path = COLLECTION_PATH[row.collection_key] || [];
        if (isListCollection(row.collection_key)) {
          const before = getByPath(Storage.data, path);
          setByPath(Storage.data, path, mergeArrayById(before, row.items, row.collection_key));
        } else {
          const shape = COLLECTION_SHAPE[row.collection_key];
          const before = getByPath(Storage.data, path) || {};
          const merged = (shape && shape.lists && shape.lists.length)
            ? mergeContainer(before, row.items, shape.lists)
            : deepMerge(before, row.items);
          setByPath(Storage.data, path, merged);
        }
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
  if (!payload || typeof payload !== 'object') return;
  if (section === 'reading_checkin') {
    Storage.data.reading = Storage.data.reading || {};
    Storage.data.reading.checkin = Storage.data.reading.checkin || {};
    // 字段级合并：只覆盖远端有的字段，本地其他字段保留，避免整条丢失
    Storage.data.reading.checkin[date] = deepMerge(Storage.data.reading.checkin[date] || {}, payload);
  } else if (ENTRY_SECTIONS.includes(section)) {
    Storage.data[section] = Storage.data[section] || {};
    Storage.data[section][date] = deepMerge(Storage.data[section][date] || {}, payload);
  }
}

/* 集合形状单一可信源：分类 / pushAll 兜底 / 本地自愈 / 容器合并 四处统一推导。
   ⚠️ 这里的 key 必须与下方 COLLECTION_PATH 的 key 逐字一致，否则该集合会被当成"未知"
      而走错分支。历史上 isListCollection 用黑名单判定，把 4 个对象集合误判为数组，
      mergeArrayById 两侧都不是数组时静默返回 []，把对象夷平导致渲染层 TypeError。 */
const COLLECTION_SHAPE = {
  // ---- 数组集合（9）----
  'favorites':                 { kind: 'array' },
  'se.emotions':               { kind: 'array' },
  'se.skills':                 { kind: 'array' },
  'se.appearance.ootd':        { kind: 'array' },
  'se.appearance.clothes':     { kind: 'array' },
  'se.appearance.hair':        { kind: 'array' },
  'se.appearance.weight':      { kind: 'array' },
  'se.daily':                  { kind: 'array' },
  'se.finance':                { kind: 'array' },
  // ---- 对象集合（8），lists 为其中需要按 id 并的子数组字段 ----
  'reading.bookMedia':         { kind: 'object', lists: ['reading', 'watching', 'planned', 'completed'] },
  'reading.gongzhonghao':      { kind: 'object', lists: [] },
  // sanlian 是第 5 个夷平受害者：defaultData 声明为对象 {lastUpdate, articles}，
  // 云端观测到的 [] 是旧代码 loadAll 夷平后 pushAll 固化上去的损坏值，非原生形状。
  'reading.sanlian':           { kind: 'object', lists: [] },
  'se.period':                 { kind: 'object', lists: ['records'] },   // predictions 为推导数据，整体替换
  'se.journal':                { kind: 'object', lists: ['entries', 'reminders'] },
  'profile':                   { kind: 'object', lists: [] },
  'weather':                   { kind: 'object', lists: [] },
  'horoscope':                 { kind: 'object', lists: [] },
  // ---- 兼容别名：防御可能存在的旧长名 collection_key（当前 COLLECTION_PATH 未使用）----
  'selfExploration.period':    { kind: 'object', lists: ['records'] },
  'selfExploration.journal':   { kind: 'object', lists: ['entries', 'reminders'] }
};

/* 对象集合合并：base 优先取本地正确对象，src 取远端；
   lists 内的子字段走数组并集，其余字段整体替换。任一侧不是纯对象时安全降级，绝不返回 []。 */
function mergeContainer(localObj, remoteObj, lists) {
  lists = lists || [];
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const base = isObj(localObj) ? localObj : (isObj(remoteObj) ? remoteObj : {});
  const src  = isObj(remoteObj) ? remoteObj : base;
  const out = Object.assign({}, base);
  Object.keys(src).forEach(k => {
    if (lists.indexOf(k) >= 0) {
      out[k] = mergeArrayById(base[k], src[k], null); // key 传 null → 必走数组并集分支
    } else {
      out[k] = src[k];
    }
  });
  return out;
}

/* 取一个「活数据」成员的最后活动时间（ms）。
   本项目的数组成员上并没有统一的 updated_at（pushAll 的 updated_at 是写在**行**上而非成员上），
   所以依次回退 updated_at → ts → 0。取不到时间的活数据视为「很旧」，
   在与墓碑比较时会被删除事件淘汰 —— 这正是删除能跨设备传播的前提。 */
function _itemTime(it) {
  if (!it) return 0;
  if (it.updated_at) {
    const t = new Date(it.updated_at).getTime();
    if (!isNaN(t)) return t;
  }
  if (typeof it.ts === 'number') return it.ts;
  return 0;
}

/* 数组按 id 合并（用于集合类数据：收藏/书影/OOTD 等）。
   - 形状感知：key 命中 COLLECTION_SHAPE 且 kind==='object' 时改走 mergeContainer，避免夷平
   - 无 id 的项按内容去重，保留并集（两台设备各加的不同项都会保留）
   - 同 id 冲突时按下面的「墓碑感知 LWW」取舍
   - 墓碑（_deleted）本身**保留在结果里**：它是删除事件的载体，pushAll 要把它带上云，
     其它设备 loadAll 时才拿得到删除信号。过滤墓碑是渲染层的事（Storage.livingList）。 */
function mergeArrayById(localArr, remoteArr, key) {
  const shape = key ? COLLECTION_SHAPE[key] : null;
  if (shape && shape.kind === 'object') {
    return mergeContainer(localArr, remoteArr, shape.lists);
  }
  if (!Array.isArray(localArr)) return Array.isArray(remoteArr) ? remoteArr.slice() : [];
  if (!Array.isArray(remoteArr)) return localArr.slice();
  const keyOf = it => (it && it.id != null) ? ('id:' + it.id) : ('json:' + JSON.stringify(it));
  const map = new Map();
  localArr.forEach(it => map.set(keyOf(it), it));
  remoteArr.forEach(it => {
    const k = keyOf(it);
    const existing = map.get(k);
    if (!existing) { map.set(k, it); return; }

    const inDel = !!(it && it._deleted);
    const exDel = !!(existing && existing._deleted);

    // 两边都是墓碑 → 取删除时间较新的那条（保留更完整的删除元信息）
    if (inDel && exDel) {
      if ((it._deletedAt || 0) > (existing._deletedAt || 0)) map.set(k, it);
      return;
    }

    // 一边墓碑、一边活数据 → 比较「删除时间」与「活数据最后活动时间」，谁新谁赢。
    // · 删除时间更新 → 删除传播：本机这条活数据被墓碑取代，渲染层随即隐藏它。
    // · 活数据更新   → 撤销删除：说明删除之后又有过改动，活数据胜出（墓碑不覆盖更新的活数据）。
    // 由于本项目成员普遍没有 updated_at/ts，活数据时间通常为 0，默认结果是**删除生效**，
    // 这正是跨设备删除传播所需要的；而「重新添加」走的是新 id，不会落到这个分支里。
    if (inDel !== exDel) {
      const tomb = inDel ? it : existing;
      const live = inDel ? existing : it;
      const winner = (_itemTime(live) > (tomb._deletedAt || 0)) ? live : tomb;
      map.set(k, winner);
      return;
    }

    // 两边都是活数据 → 沿用原有 updated_at 取舍（较新者胜，都没时间戳则保留本地）
    const lt = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const rt = it.updated_at ? new Date(it.updated_at).getTime() : 0;
    if (rt > lt) map.set(k, it);
  });
  return Array.from(map.values());
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
  // 白名单判定（唯一可信源 COLLECTION_SHAPE）：只有显式声明为 array 的集合才按数组处理。
  // 未知 key 一律按对象处理，宁可少并也绝不夷平。
  return !!(COLLECTION_SHAPE[key] && COLLECTION_SHAPE[key].kind === 'array');
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
  // 形状冲突兜底：target 是被夷平的 []、source 是正确的云端对象时，原逻辑会把
  // 'reading'/'watching' 等键当字符串属性挂到数组上，产出一个 JSON.stringify 后
  // 仍是 "[]" 的怪物 —— 云端数据实际丢失，随后 pushAll 会把空值写回云端。
  // 形状不一致时一律采用 source（远端优先，与下方同 id 冲突的取舍一致）。
  if (Array.isArray(target) !== Array.isArray(source)) return JSON.parse(JSON.stringify(source));
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
