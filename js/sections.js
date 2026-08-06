/* ============================================
   sections.js - 全部功能板块
   ============================================ */

// 公共：操作按钮（选择复制+复制+收藏）
function actionButtons(item) {
  const isFav = Storage.isFavorited(item.title);
  const summary = (item.summary || item.title || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const title = (item.title || '').replace(/'/g, "\\'");
  return `
    <div class="item-actions">
      <button class="action-btn" onclick="event.stopPropagation();App.copyTextSelect('${summary}','${title}')" title="选择复制">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2V6a2 2 0 00-2-2z"/><path d="M9 11v7a2 2 0 002 2h7a2 2 0 002-2v-7a2 2 0 00-2-2h-7"/></svg>
      </button>
      <button class="action-btn" onclick="event.stopPropagation();App.copyText('${summary}','${title}')" title="复制全文">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
      <button class="action-btn ${isFav?'favorited':''}" onclick="event.stopPropagation();App.toggleFavorite({title:'${title}',summary:'${summary}',url:'${item.url||''}',section:'${item.section||''}',type:'${item.type||''}'})" title="收藏">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
      </button>
    </div>`;
}

// 公共：取一组带 date 字段的对象中最新日期
function maxDateOf(arr) {
  if (!arr || !arr.length) return '';
  const dates = arr.map(x => x && x.date).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : '';
}

const Sections = {

  // ==================== 首页 ====================
  home: {
    expandedSection: null,
    checkinDetailOpen: false,

    render() {
      const checkedIn = Storage.isCheckedIn();
      const ck = Storage.data.checkin || {streak:0,totalDays:0};

      const sections = [
        { id:'ielts', name:'雅思学习', icon:'📚', color:'var(--haze-blue)',
          subSections: [
            {id:'vocabulary', name:'单词学习', target:'ielts'},
            {id:'bbc', name:'外刊听力', target:'ielts'},
            {id:'duolingo', name:'多邻国', target:'ielts'}
          ]
        },
        { id:'ai-study', name:'AI学习', icon:'🤖', color:'var(--gold)',
          subSections: [
            {id:'news', name:'AI前沿资讯', target:'ai-study'},
            {id:'kb', name:'AI知识库', target:'ai-study'}
          ]
        },
        { id:'reading', name:'阅读', icon:'📖', color:'var(--earth)',
          subSections: [
            {id:'bookmedia', name:'书影', target:'reading'},
            {id:'gzh', name:'公众号精选', target:'reading'},
            {id:'sanlian', name:'三联中读', target:'reading'}
          ]
        },
        { id:'podcast', name:'播客', icon:'🎙️', color:'#7B3FF2',
          subSections: [
            {id:'hot', name:'热榜Top5', target:'podcast'},
            {id:'follow', name:'关注更新', target:'podcast'}
          ]
        },
        { id:'self-media', name:'自媒体', icon:'📸', color:'var(--red)',
          subSections: [
            {id:'reco', name:'今日推荐', target:'self-media'},
            {id:'inspiration', name:'今日灵感', target:'self-media'},
            {id:'aesthetic', name:'审美搭建', target:'self-media'}
          ]
        },
        { id:'self-exploration', name:'自我探索', icon:'🌙', color:'var(--haze-blue-dark)',
          subSections: [
            {id:'self', name:'今日状态', target:'self-exploration'},
            {id:'daily', name:'日常记录', target:'self-exploration'},
            {id:'skill', name:'新技能', target:'self-exploration'}
          ]
        }
      ];

      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');

      const backupTip = (typeof App.getBackupTip === 'function') ? App.getBackupTip() : '';
      return `
        ${backupTip}
        <div class="home-time-card-v2" id="homeTimeCard" onclick="App.toggleFlipClock()">
          <div class="flip-clock" id="flipClock">
            <div class="flip-digit" id="flipH1">${hh[0]}</div>
            <div class="flip-digit" id="flipH2">${hh[1]}</div>
            <div class="flip-colon">:</div>
            <div class="flip-digit" id="flipM1">${mm[0]}</div>
            <div class="flip-digit" id="flipM2">${mm[1]}</div>
            <div class="flip-seconds-wrap" id="flipSecondsWrap" style="display:none;">
              <div class="flip-colon">:</div>
              <div class="flip-digit flip-sec" id="flipS1">${ss[0]}</div>
              <div class="flip-digit flip-sec" id="flipS2">${ss[1]}</div>
            </div>
          </div>
        </div>

        <div class="home-checkin-card ${checkedIn?'checked':''}">
          <div class="checkin-icon">${checkedIn?'✅':'📋'}</div>
          <div class="checkin-info">
            <div class="checkin-streak">${ck.streak}天连续 · 累计打卡${ck.totalDays}天</div>
            <div class="checkin-status">${checkedIn?'今日已打卡':'学习任意板块会自动打卡，也可直接手动打卡'}</div>
          </div>
          <button type="button" id="homeCheckinBtn" class="home-checkin-btn ${checkedIn?'done':''}"
                  ${checkedIn?'disabled':''} onclick="App.manualCheckin()">
            ${checkedIn?'今日已打卡 ✓':'一键打卡'}
          </button>
          <div class="checkin-flame">${ck.streak>=3?'🔥':''}</div>
        </div>

        ${this.renderCheckinDetail()}

        ${this.renderTodayFocus()}

        <div class="home-sections-grid-v2">
          ${sections.map(s => this.renderProgressCardV2(s)).join('')}
          <div id="homeSubSections"></div>
        </div>
      `;
    },

    renderCheckinDetail() {
      const ck = Storage.data.checkin || {};
      const sources = (ck.sources && ck.sources[Storage.today()]) || [];
      if (!sources.length) return '';
      return `
        <div class="checkin-detail">
          <div class="checkin-detail-toggle" onclick="Sections.home.toggleCheckinDetail()">
            <span>今日打卡明细（${sources.length}）</span>
            <svg class="checkin-detail-chevron ${this.checkinDetailOpen?'open':''}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="checkin-detail-body" style="${this.checkinDetailOpen?'':'display:none;'}">
            ${sources.map(s => `<div class="checkin-detail-item">${s}</div>`).join('')}
          </div>
        </div>`;
    },

    toggleCheckinDetail() {
      this.checkinDetailOpen = !this.checkinDetailOpen;
      App.refresh();
    },

    /**
     * 「今日聚焦 / 快速记录」卡片。
     * 上半部分汇总今日打卡状态与各板块完成度，下半部分是速记输入。
     */
    renderTodayFocus() {
      const today = Storage.today();
      const checkedIn = !!Storage.isCheckedIn();
      const ck = Storage.data.checkin || { streak: 0, totalDays: 0 };
      const notes = Storage.getQuickNotes(today);
      const allCount = Storage.getQuickNotes().length;

      const focusText = checkedIn
        ? `已打卡 · 连续 ${ck.streak} 天`
        : '今日还没有打卡';
      const focusIcon = checkedIn ? '🎯' : '🌱';

      const noteItems = notes.length
        ? notes.map(n => `
            <div class="quick-note-item">
              <div class="quick-note-text">${App.escapeHtml(n.text)}</div>
              <div class="quick-note-meta">
                <span>${App.formatClock(n.ts)}</span>
                <button type="button" class="quick-note-del" title="删除这条速记"
                        onclick="App.deleteQuickNote('${n.id}')">删除</button>
              </div>
            </div>`).join('')
        : '<div class="quick-note-empty">今天还没有速记，随手记一句吧。</div>';

      return `
        <div class="card mb-4 today-focus-card">
          <div class="card-title"><span class="card-title-bar"></span>今日聚焦</div>
          <div class="focus-status ${checkedIn?'done':''}">
            <span class="focus-icon">${focusIcon}</span>
            <span class="focus-text">${focusText}</span>
            <span class="focus-sub">累计 ${ck.totalDays} 天 · 速记 ${allCount} 条</span>
          </div>

          <div class="card-title" style="margin-top:14px;"><span class="card-title-bar" style="background:var(--gold);"></span>快速记录</div>
          <div class="card-hint">想到什么随手记下来，保存在本机并随备份一起导出。</div>
          <textarea id="quickNoteInput" class="quick-note-input" rows="3"
                    placeholder="记一句话…（Ctrl / ⌘ + Enter 保存）"
                    oninput="App.autoGrowQuickNote(this)"
                    onkeydown="App.quickNoteKeydown(event)"></textarea>
          <div class="quick-note-actions">
            <button type="button" class="btn btn-primary" onclick="App.saveQuickNote()">保存速记</button>
          </div>

          <div class="quick-note-list">${noteItems}</div>
        </div>`;
    },

    renderProgressCardV2(s) {
      let done = 0, total = 0;
      const td = Storage.getTodayData(s.id==='ai-study'?'aiStudy':s.id==='self-media'?'selfMedia':s.id==='self-exploration'?'selfExploration':s.id);

      if (s.id === 'ielts') {
        const tasks = ['vocabulary','bbc','duolingo'];
        total = tasks.length;
        tasks.forEach(k => { if (td[k]?.done) done++; });
      } else if (s.id === 'ai-study') {
        const news = td.news || Sections.aiStudy.sampleNews || [];
        total = news.length;
        news.forEach(n => { if (td.notes?.[n.id]) done++; });
      } else if (s.id === 'reading') {
        const bm = Storage.data.reading.bookMedia;
        total = bm.reading.length + bm.watching.length;
        done = 0;
      } else if (s.id === 'podcast') {
        const list = td.list || Sections.podcast.hotList || [];
        total = list.length;
        list.forEach(p => { if (td.notes?.[p.id]) done++; });
      } else if (s.id === 'self-media') {
        const recos = td.recos || Sections.selfMedia.sampleRecos || [];
        total = recos.length;
        recos.forEach(r => { if (td.notes?.[r.id]) done++; });
      } else if (s.id === 'self-exploration') {
        total = 3;
        if (td.emotions?.length) done++;
        if (td.daily?.length) done++;
        if (td.journal?.length) done++;
      }

      const isComplete = total > 0 && done >= total;
      const pct = total > 0 ? Math.round(done/total*100) : 0;
      const isExpanded = this.expandedSection === s.id;

      return `
        <div class="progress-card-v2 ${isComplete?'complete':''} ${isExpanded?'expanded':''}" onclick="Sections.home.toggleSection('${s.id}')">
          <div class="pcv2-top">
            <div class="pcv2-icon" style="background:${s.color};">${s.icon}</div>
            <div class="pcv2-name">${s.name}</div>
            <div class="pcv2-count ${isComplete?'done':''}">${done}/${total || '—'}</div>
            <svg class="pcv2-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="pcv2-bar-wrap">
            <div class="pcv2-bar" style="width:${pct}%;background:${isComplete?'var(--success)':s.color};"></div>
          </div>
          ${isComplete?'<div class="pcv2-badge">✨ 已完成</div>':''}
        </div>
        ${isExpanded ? `<div class="sub-sections-panel-v2">${s.subSections.map(ss => this.renderSubSection(ss, td, s)).join('')}</div>` : ''}
      `;
    },

    renderSubSection(ss, td, parent) {
      let done = false;
      if (parent.id === 'ielts') {
        done = !!td[ss.id]?.done;
      } else if (parent.id === 'ai-study') {
        done = !!td.notes?.[ss.id];
      } else if (parent.id === 'reading') {
        done = false;
      } else if (parent.id === 'podcast') {
        done = !!td.notes?.[ss.id];
      } else if (parent.id === 'self-media') {
        done = !!td.notes?.[ss.id];
      } else if (parent.id === 'self-exploration') {
        done = false;
      }
      return `
        <div class="sub-section-item ${done?'done':''}" onclick="App.navigate('${ss.target}')">
          <span class="sub-section-status">${done?'✅':'○'}</span>
          <span class="sub-section-name">${ss.name}</span>
          <span class="sub-section-arrow">→</span>
        </div>
      `;
    },

    toggleSection(id) {
      if (this.expandedSection === id) this.expandedSection = null;
      else this.expandedSection = id;
      App.refresh();
    },

    // ===== F-1：今天要处理（原 F-10 合入）=====
    getTodayToHandle() {
      const today = Storage.today();
      const yest = Storage.yesterday();
      const items = [];

      // 雅思任务
      const ieltsToday = Storage.getDayData('ielts', today);
      const ieltsYest = Storage.getDayData('ielts', yest);
      const ieltsTasks = [
        { key: 'vocabulary', name: '单词学习' },
        { key: 'bbc', name: '外刊听力' },
        { key: 'duolingo', name: '多邻国打卡' }
      ];
      ieltsTasks.forEach(t => {
        if (!ieltsToday[t.key]?.done) {
          items.push({ target: 'ielts', title: `完成雅思·${t.name}` });
        }
      });

      // AI 学习笔记
      const aiToday = Storage.getDayData('aiStudy', today);
      const aiYest = Storage.getDayData('aiStudy', yest);
      const aiNews = aiToday.news || (Sections.aiStudy.sampleNews || []);
      aiNews.forEach(n => {
        if (!aiToday.notes?.[n.id]) {
          const title = (n.title || 'AI资讯');
          const short = title.length > 14 ? title.slice(0, 14) + '…' : title;
          items.push({ target: 'ai-study', title: `阅读笔记：${short}` });
        }
      });

      // 阅读打卡
      const checkinToday = (Storage.data.reading.checkin && Storage.data.reading.checkin[today]) || [];
      const checkinYest = (Storage.data.reading.checkin && Storage.data.reading.checkin[yest]) || [];
      if (!checkinToday.length) {
        items.push({ target: 'reading', title: '今日书影打卡' });
      }

      // 自我探索
      const seToday = Storage.getDayData('selfExploration', today);
      const seYest = Storage.getDayData('selfExploration', yest);
      if (!seToday.emotions?.length) {
        items.push({ target: 'self-exploration', title: '记录今日状态' });
      }
      if (!seToday.daily?.length) {
        items.push({ target: 'self-exploration', title: '写日常记录' });
      }

      return items;
    },

    renderTodayToHandle() {
      const items = this.getTodayToHandle();
      if (!items.length) {
        return `
          <div class="home-todo-card empty">
            <div class="todo-card-head">
              <span class="todo-card-bar"></span>
              <span class="todo-card-title">今天要处理</span>
            </div>
            <div class="todo-empty">今日暂无待处理，继续保持</div>
          </div>`;
      }
      const rows = items.map(it => `
        <div class="todo-item" onclick="App.navigate('${it.target}')">
          <span class="todo-dot"></span>
          <span class="todo-text">${it.title}</span>
          <span class="todo-arrow">→</span>
        </div>`).join('');
      return `
        <div class="home-todo-card">
          <div class="todo-card-head">
            <span class="todo-card-bar"></span>
            <span class="todo-card-title">今天要处理</span>
            <span class="todo-count">${items.length}</span>
          </div>
          ${rows}
        </div>`;
    }
  },

  // ==================== 雅思学习 ====================
  ielts: {
    render() {
      const today = Storage.today();
      const td = Storage.getDayData('ielts', today);
      const hist = Storage.getHistoryDates('ielts').filter(d => d !== today);

      const tasks = [
        { key:'vocabulary', name:'单词学习', desc:'跳转墨墨背单词 · 每日15个', url:'https://www.maimemo.com/' },
        { key:'bbc', name:'外刊听力', desc:'每日1篇外刊听力精练', url:'' },
        { key:'duolingo', name:'多邻国打卡', desc:'跳转多邻国完成每日打卡', url:'https://www.duolingo.cn/' }
      ];

      const sorted = [...tasks].sort((a,b) => (td[a.key]?.done?1:0)-(td[b.key]?.done?1:0));

      // 外刊听力每日文章
      const journalArticle = this.getDailyJournal();

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--haze-blue);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l10-6 10 6-10 6L2 8z"/><path d="M2 16l10 6 10-6M2 12l10 6 10-6"/></svg></span>雅思学习</div>
          <div class="section-subtitle">每日精进，积水成渊</div></div>
        </div>
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar"></span>今日任务 · ${today}</div>
          ${sorted.map(t => {
            if (t.key === 'bbc') {
              return `
            <div class="task-item ${td[t.key]?.done?'task-done':''}">
              <div class="task-checkbox ${td[t.key]?.done?'checked':''}" onclick="Sections.ielts.toggleTask('bbc')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>
              <div class="task-content">
                <div class="task-name">${t.name}</div>
                <div class="task-meta">${journalArticle.source} · ${journalArticle.date}</div>
                <div class="journal-article">
                  <div class="journal-title">${journalArticle.title}</div>
                  <div class="journal-summary">${journalArticle.summary}</div>
                  <div class="journal-words"><span class="journal-label">重点词汇：</span>${journalArticle.words}</div>
                  <div class="journal-listening-tip"><span class="journal-label">听力技巧：</span>${journalArticle.tip}</div>
                  <div class="journal-actions">
                    <button class="btn btn-primary journal-btn" id="journalPlayBtn" onclick="Sections.ielts.playJournalAudio()">▶ ${journalArticle.audioUrl ? '原声音频' : 'AI朗读'}</button>
                    <button class="btn btn-outline journal-btn" onclick="Sections.ielts.toggleOriginal()">📄 查看原文</button>
                    <button class="btn btn-outline journal-btn" onclick="Sections.ielts.toggleTranslation()">🌐 点击翻译</button>
                    <a href="${journalArticle.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline journal-btn">🔗 原文链接</a>
                  </div>
                  <div class="journal-speed">
                    <span class="journal-speed-label">语速</span>
                    <button class="speed-btn" data-rate="0.5" onclick="Sections.ielts.setTtsRate(0.5,this)">0.5x</button>
                    <button class="speed-btn" data-rate="0.75" onclick="Sections.ielts.setTtsRate(0.75,this)">0.75x</button>
                    <button class="speed-btn active" data-rate="0.9" onclick="Sections.ielts.setTtsRate(0.9,this)">1x</button>
                    <button class="speed-btn" data-rate="1.25" onclick="Sections.ielts.setTtsRate(1.25,this)">1.25x</button>
                  </div>
                  <div class="journal-audio-tag">${journalArticle.audioUrl ? '🔊 原声音频' : '🤖 AI 朗读（语音合成）'}</div>
                  <div id="journalOriginal" class="journal-original-text" style="display:none;">
                    <div class="journal-label" style="margin-bottom:6px;">英文原文：</div>
                    ${journalArticle.audioText || ''}
                  </div>
                  <div id="journalTranslation" class="journal-translation" style="display:none;">
                    <div class="journal-label" style="margin-bottom:6px;">中文翻译：</div>
                    ${journalArticle.translation || ''}
                  </div>
                  ${actionButtons({section:'ielts',title:journalArticle.title,summary:journalArticle.summary,url:journalArticle.url,type:'journal'})}
                </div>
                <textarea class="task-review" id="rev-bbc" placeholder="听力复盘：听懂了多少？哪些词没抓住？" oninput="Sections.ielts.saveReview('bbc',this.value)">${td[t.key]?.review||''}</textarea>
              </div>
            </div>`;
            }
            return `
            <div class="task-item ${td[t.key]?.done?'task-done':''}">
              <div class="task-checkbox ${td[t.key]?.done?'checked':''}" onclick="Sections.ielts.toggleTask('${t.key}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>
              <div class="task-content">
                <div class="task-name">${t.name}</div>
                <div class="task-meta">${t.desc}</div>
                <div class="flex gap-2 mt-2">
                  <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">跳转学习 <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg></a>
                </div>
                <textarea class="task-review" id="rev-${t.key}" placeholder="复盘：今天学到了什么？" oninput="Sections.ielts.saveReview('${t.key}',this.value)">${td[t.key]?.review||''}</textarea>
              </div>
            </div>`;
          }).join('')}
        </div>
        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map((d, i) => this.renderHistory(d, i)).join('')}</div>` : ''}
      `;
    },

    renderHistory(date, idx = 999) {
      const d = Storage.getDayData('ielts', date);
      const names = {vocabulary:'单词学习',bbc:'外刊听力',duolingo:'多邻国'};
      const done = Object.keys(names).filter(k => d[k]?.done).length;
      const collapsedCls = idx < 3 ? '' : 'collapsed';
      return `<div class="date-group ${collapsedCls}" data-date="${date}">
        <div class="date-group-header" onclick="Sections.toggleDateGroup(this)"><div class="date-group-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="date-group-toggle"><path d="M6 9l6 6 6-6"/></svg>${date}<span class="date-group-badge">${done}/${Object.keys(names).length}</span></div></div>
        <div class="date-group-body">${Object.entries(names).map(([k,n]) => `<div class="task-item ${d[k]?.done?'task-done':''}" style="margin-bottom:6px;"><div class="task-checkbox ${d[k]?.done?'checked':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div><div class="task-content"><div class="task-name">${n}</div>${d[k]?.review?`<div class="task-meta">复盘：${d[k].review}</div>`:''}</div></div>`).join('')}</div></div>`;
    },

    // 每日外刊听力文章（根据日期轮换）
    journals: [
      { title:'The Economics of Remote Work: A Global Shift', source:'The Economist', date:'2026-07-27',
        summary:'经济学人深度报道远程办公对全球经济的影响：生产率提升13%但创新能力下降，城市经济结构面临重构。',
        words:'remote work 远程办公 / productivity 生产率 / innovation 创新 / urban economy 城市经济 / restructuring 重构',
        tip:'先通听一遍把握大意，再逐句精听，重点关注数字和因果连词（because, therefore, as a result）',
        url:'https://www.economist.com/',
        audioText:'The economics of remote work have shifted dramatically since 2020. Studies now show that productivity has increased by an average of thirteen percent, yet innovation metrics have declined in many sectors. Urban economies are undergoing a fundamental restructuring as office vacancy rates remain high. Companies are grappling with how to maintain collaborative culture while embracing flexibility. The long-term implications for cities, transportation, and commercial real estate remain uncertain, but the shift appears irreversible.',
        translation:'自2020年以来，远程办公的经济学效应发生了巨大转变。研究表明生产率平均提升了13%，但许多行业的创新指标却在下降。随着写字楼空置率居高不下，城市经济正经历根本性重构。企业正在努力在拥抱灵活性的同时维持协作文化。对城市、交通和商业地产的长期影响仍不确定，但这一转变似乎不可逆转。' },
      { title:'Climate Adaptation: Cities Rising to the Challenge', source:'The Guardian', date:'2026-07-26',
        summary:'卫报报道全球城市气候适应策略：从海绵城市到垂直森林，市政规划如何应对极端天气。',
        words:'adaptation 适应 / sponge city 海绵城市 / vertical forest 垂直森林 / extreme weather 极端天气 / municipal 市政的',
        tip:'注意英式发音特点，关注专有名词的发音，如地名和机构名',
        url:'https://www.theguardian.com/',
        audioText:'Cities around the world are implementing innovative climate adaptation strategies. From sponge cities in China that absorb excess rainfall, to vertical forests in Italy that purify urban air, municipal planners are reimagining how cities can withstand extreme weather events. The challenge is particularly acute in coastal regions where rising sea levels threaten millions of residents. Many cities are investing in green infrastructure as a cost-effective alternative to traditional engineering solutions.',
        translation:'世界各地的城市正在实施创新的气候适应策略。从中国吸收过量降雨的海绵城市，到意大利净化城市空气的垂直森林，市政规划者正在重新构想城市如何抵御极端天气事件。这一挑战在沿海地区尤为严峻，海平面上升威胁着数百万居民。许多城市正在投资绿色基础设施，作为传统工程解决方案的高性价比替代方案。' },
      { title:'AI in Healthcare: Promises and Pitfalls', source:'Nature', date:'2026-07-25',
        summary:'Nature杂志综述AI在医疗领域的应用进展与风险：诊断准确率提升但数据隐私问题凸显。',
        words:'healthcare 医疗 / diagnosis 诊断 / accuracy 准确率 / data privacy 数据隐私 / pitfall 陷阱',
        tip:'学术英语听力，注意长句结构和被动语态，先抓主谓宾',
        url:'https://www.nature.com/',
        audioText:'Artificial intelligence in healthcare has shown remarkable promise in diagnostic accuracy, with some systems achieving ninety-five percent accuracy in detecting certain cancers. However, significant pitfalls remain. Data privacy concerns have intensified as AI systems require vast amounts of patient data. The medical community is divided on whether AI should augment or replace physician judgment. Regulatory frameworks are struggling to keep pace with technological advancement, raising questions about accountability and patient safety.',
        translation:'医疗领域的人工智能在诊断准确率方面展现了显著前景，某些系统在检测特定癌症方面达到了95%的准确率。然而，重大隐患仍然存在。随着AI系统需要大量患者数据，数据隐私问题日益突出。医学界对于AI应该辅助还是替代医生判断存在分歧。监管框架正努力跟上技术进步的步伐，引发了对问责制和患者安全的质疑。' },
      { title:'The Future of Education: Beyond the Classroom', source:'The Atlantic', date:'2026-07-24',
        summary:'大西洋月刊探讨教育变革：AI个性化学习、项目制教学如何重塑传统课堂模式。',
        words:'personalized learning 个性化学习 / project-based 项目制 / reshape 重塑 / traditional classroom 传统课堂',
        tip:'美式英语，语速较快，注意连读和弱读现象',
        url:'https://www.theatlantic.com/',
        audioText:'The future of education extends far beyond the traditional classroom. Artificial intelligence is enabling truly personalized learning experiences, adapting to each student is pace and learning style. Project-based learning is replacing rote memorization in many progressive schools. Critics argue that technology cannot replace the social and emotional learning that occurs in physical classrooms. The most successful educational models of the future will likely blend digital tools with human connection in ways we are only beginning to understand.',
        translation:'教育的未来远不限于传统课堂。人工智能正在实现真正的个性化学习体验，适应每个学生的节奏和学习风格。在许多前卫学校，项目制学习正在取代死记硬背。批评者认为，技术无法替代在实体课堂中发生的社交和情感学习。未来最成功的教育模式可能会以我们才刚刚开始理解的方式，将数字工具与人际连接融合在一起。' },
      { title:'Global Supply Chains: Post-Pandemic Resilience', source:'Financial Times', date:'2026-07-23',
        summary:'金融时报分析后疫情时代全球供应链韧性建设：近岸外包、多元化供应、库存策略调整。',
        words:'supply chain 供应链 / resilience 韧性 / nearshoring 近岸外包 / diversification 多元化 / inventory 库存',
        tip:'商业英语听力，关注数字表达和趋势描述词（surge, decline, stabilize）',
        url:'https://www.ft.com/',
        audioText:'Global supply chains have undergone unprecedented transformation since the pandemic. Companies are increasingly adopting nearshoring strategies, moving production closer to end markets. Diversification of suppliers has become a critical priority, with many firms reducing dependence on single-source regions. Inventory management strategies have shifted from just-in-time to just-in-case approaches. While these changes increase operational costs, they significantly enhance supply chain resilience against future disruptions.',
        translation:'自疫情以来，全球供应链经历了前所未有的变革。企业越来越多地采用近岸外包策略，将生产转移到更靠近终端市场的地方。供应商多元化已成为关键优先事项，许多公司减少了对单一来源地区的依赖。库存管理策略从准时制转向了以防万一的方式。虽然这些变化增加了运营成本，但显著增强了供应链对未来中断的韧性。' },
      { title:'The Psychology of Social Media: Why We Scroll', source:'Scientific American', date:'2026-07-22',
        summary:'科学美国人从心理学角度分析社交媒体成瘾机制：多巴胺反馈循环与注意力经济。',
        words:'psychology 心理学 / addiction 成瘾 / dopamine 多巴胺 / feedback loop 反馈循环 / attention economy 注意力经济',
        tip:'科普类听力，注意术语解释和实验描述的时态变化',
        url:'https://www.scientificamerican.com/',
        audioText:'The psychology behind social media addiction reveals a sophisticated exploitation of human neurochemistry. Every notification, like, and comment triggers a small dopamine release, creating a feedback loop that keeps users scrolling endlessly. The attention economy rewards platforms that capture and retain user engagement, often at the expense of mental health. Researchers have found that limiting social media use to thirty minutes per day significantly reduces anxiety and depression symptoms in young adults.',
        translation:'社交媒体成瘾背后的心理学揭示了对人体神经化学的精妙利用。每一条通知、点赞和评论都会触发少量的多巴胺释放，创造出一个让用户不断滚动的反馈循环。注意力经济奖励那些能够捕获和保持用户参与度的平台，这往往以牺牲心理健康为代价。研究人员发现，将社交媒体使用限制在每天30分钟，可以显著减轻年轻人的焦虑和抑郁症状。' },
      { title:'Renewable Energy: The Path to Net Zero', source:'BBC Future', date:'2026-07-21',
        summary:'BBC Future深度报道可再生能源发展路径：太阳能成本下降89%，储能技术突破在即。',
        words:'renewable energy 可再生能源 / net zero 净零排放 / solar energy 太阳能 / storage technology 储能技术 / breakthrough 突破',
        tip:'英式发音，注意数字和百分比的读法，关注技术术语',
        url:'https://www.bbc.com/future',
        audioText:'The path to net zero emissions relies heavily on renewable energy adoption. Solar energy costs have plummeted by eighty-nine percent over the past decade, making it the cheapest source of electricity in many regions. Battery storage technology is on the verge of a major breakthrough, with new solid-state batteries promising to double energy density. However, the transition requires massive infrastructure investment and policy coordination across nations. The International Energy Agency estimates that achieving net zero by twenty-fifty requires tripling renewable capacity by twenty-thirty.',
        translation:'实现净零排放的路径在很大程度上依赖可再生能源的采用。在过去十年中，太阳能成本下降了89%，使其成为许多地区最便宜的电力来源。电池储能技术正处于重大突破的边缘，新型固态电池有望将能量密度提高一倍。然而，这一转型需要大规模的基础设施投资和跨国政策协调。国际能源署估计，要在2050年实现净零排放，需要在2030年前将可再生能源产能增加两倍。' }
    ],

    getDailyJournal() {
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
      return this.journals[dayOfYear % this.journals.length];
    },

    // 外刊听力：语速设置
    _ttsRate: 0.9,
    setTtsRate(rate, btn) {
      this._ttsRate = rate;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    },

    // 外刊听力：播放音频（优先真实音频 URL，否则浏览器语音合成 TTS）
    playJournalAudio() {
      const article = this.getDailyJournal();
      if (!article) { App.showToast('暂无音频内容'); return; }
      const playBtn = document.getElementById('journalPlayBtn');

      // 真实音频优先
      if (article.audioUrl) {
        if (window._journalAudioEl) { window._journalAudioEl.pause(); }
        const audio = new Audio(article.audioUrl);
        window._journalAudioEl = audio;
        audio.play().then(() => {
          App.showToast('🔊 播放原声音频');
          if (playBtn) { playBtn.innerHTML = '⏸ 播放中...'; playBtn.onclick = () => { audio.pause(); playBtn.innerHTML = '▶ 原声音频'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); }; }
        }).catch(() => App.showToast('原声音频播放失败，已切换 AI 朗读'));
        audio.onended = () => { if (playBtn) { playBtn.innerHTML = '▶ 原声音频'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); } };
        return;
      }

      // TTS 兜底
      if (!article.audioText) { App.showToast('暂无音频内容'); return; }
      if (!('speechSynthesis' in window)) {
        App.showToast('当前浏览器不支持语音播放');
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(article.audioText);
      utterance.lang = 'en-US';
      utterance.rate = this._ttsRate || 0.9;
      utterance.pitch = 1;
      if (playBtn) {
        playBtn.innerHTML = '⏸ 播放中...';
        playBtn.onclick = () => { window.speechSynthesis.cancel(); playBtn.innerHTML = '▶ AI朗读'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); };
      }
      utterance.onend = () => {
        if (playBtn) { playBtn.innerHTML = '▶ AI朗读'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); }
      };
      window.speechSynthesis.speak(utterance);
      App.showToast('🤖 AI 朗读中');
    },

    // 外刊听力：显示/隐藏翻译
    toggleTranslation() {
      const el = document.getElementById('journalTranslation');
      if (!el) return;
      if (el.style.display === 'none') {
        el.style.display = '';
        App.showToast('已显示翻译');
      } else {
        el.style.display = 'none';
      }
    },

    // 外刊听力：显示/隐藏原文
    toggleOriginal() {
      const el = document.getElementById('journalOriginal');
      if (!el) return;
      if (el.style.display === 'none') {
        el.style.display = '';
        App.showToast('已显示原文');
      } else {
        el.style.display = 'none';
      }
    },

    toggleTask(key) {
      const d = Storage.getDayData('ielts', Storage.today());
      if (!d[key]) d[key] = {done:false,review:''};
      d[key].done = !d[key].done;
      Storage.save();
      // 完成任务时自动打卡
      if (d[key].done) App.triggerAutoCheckin('完成雅思学习任务');
      App.refresh();
    },

    saveReview(key, val) {
      const d = Storage.getDayData('ielts', Storage.today());
      if (!d[key]) d[key] = {done:false,review:''};
      d[key].review = val;
      Storage.save();
    }
  },

  // ==================== AI学习 ====================
  aiStudy: {
    sampleNews: [
      { id:'ai-001', title:'OpenAI 推出 GPT-5 Turbo，推理速度提升5倍', source:'GitHub · openai/openai-cookbook', date:'2026-07-28', sourceUrl:'https://github.com/openai/openai-cookbook',
        summary:'OpenAI 发布 GPT-5 Turbo 模型，采用新型稀疏注意力机制，推理速度较 GPT-5 提升 5 倍，同时保持同等推理质量。API 定价降低 30%，支持 200K 上下文窗口。',
        highlights:'核心亮点：5倍速度提升、定价降30%、200K上下文。不足：高峰期仍有延迟波动。',
        oneLiner:'通过稀疏注意力机制和动态路由优化，GPT-5 Turbo 在不牺牲推理质量的前提下大幅降低计算成本，使大规模 AI 应用更加经济可行。',
        resources: { articles:[{title:'GPT-5 Turbo 官方技术文档',url:'https://platform.openai.com/docs/guides/vision',desc:'官方详细文档'},{title:'GPT-5 Turbo 性能基准测试',url:'https://github.com/openai/openai-cookbook',desc:'GitHub Benchmark'}], videos:[{title:'GPT-5 Turbo 实战教程',url:'https://www.bilibili.com/search?keyword=GPT-5%20Turbo%20%E6%95%99%E7%A8%8B',desc:'B站教程合集'},{title:'AI大模型推理优化',url:'https://www.bilibili.com/search?keyword=AI%20%E5%A4%A7%E6%A8%A1%E5%9E%8B%20%E6%8E%A8%E7%90%86%E4%BC%98%E5%8C%96',desc:'从原理到实践'}] }
      },
      { id:'ai-002', title:'Anthropic 发布 Claude 4：支持超长上下文与多模态推理', source:'GitHub · anthropics/anthropic-cookbook', date:'2026-07-28', sourceUrl:'https://github.com/anthropics/anthropic-cookbook',
        summary:'Anthropic 推出 Claude 4 模型，支持 500K 上下文窗口，原生多模态推理能力，在代码生成和数学推理基准测试中超越所有竞品。新增"深度思考"模式。',
        highlights:'核心亮点：500K上下文、多模态原生、深度思考模式。不足：深度思考模式响应较慢。',
        oneLiner:'Claude 4 通过扩展上下文窗口至 500K 并引入深度思考链路，使 AI 能够处理超长文档理解和复杂多步推理任务。',
        resources: { articles:[{title:'Claude 4 官方文档',url:'https://docs.anthropic.com/en/docs/build-with-claude/agentic',desc:'官方Agentic文档'},{title:'Claude 4 Cookbook',url:'https://github.com/anthropics/anthropic-cookbook',desc:'GitHub示例'}], videos:[{title:'Claude 4 开发实战',url:'https://www.bilibili.com/search?keyword=Claude%204%20%E5%BC%80%E5%8F%91',desc:'B站开发教程'},{title:'AI Agent 入门到精通',url:'https://www.bilibili.com/search?keyword=AI%20Agent%20%E6%95%99%E7%A8%8B',desc:'系统学习Agent'}] }
      }
    ],

    // AI知识库
    knowledgeBase: {
      aiOffice: [
        { id:'kb-o1', title:'万能提示词公式：让AI成为你的超级办公助手', date:'2026-07-28',
          formula:'角色定位 + 任务描述 + 约束条件 + 输出格式 = 高质量结果',
          structure:'四要素结构化指令法：①角色（你是一位资深HR）②任务（撰写招聘JD）③约束（200字内，突出3个核心要求）④格式（Markdown表格输出）',
          summary:'通过结构化提示词，让AI生成专业级的办公文档。关键在于明确角色定位和输出格式，避免模糊指令导致结果偏差。',
          tip:'先用"请以XX专家的角度"开头，再逐步细化要求，效果提升50%以上。',
          url:'https://www.bilibili.com/search?keyword=AI%E5%8A%9E%E5%85%AC%20%E6%8F%90%E7%A4%BA%E8%AF%8D'
        },
        { id:'kb-o2', title:'用AI自动生成PPT大纲与数据图表', date:'2026-07-28',
          formula:'场景描述 + 数据范围 + 视觉风格 + 页数限制 = 完美PPT大纲',
          structure:'①角色（你是麦肯锡咨询顾问）②任务（制作Q3业绩分析PPT）③约束（10页，数据驱动）④格式（每页标题+要点+图表建议）',
          summary:'AI不仅能生成PPT文字大纲，还能根据数据推荐合适的图表类型。结合Excel数据粘贴，AI可自动生成分析洞察。',
          tip:'将Excel数据直接粘贴给AI，要求"用数据说话"，生成的大纲质量更高。',
          url:'https://www.bilibili.com/search?keyword=AI%20PPT%20%E5%A4%A7%E7%BA%B2'
        }
      ],
      aiComic: [
        { id:'kb-c1', title:'AI漫剧制作全流程：从分镜到成片', date:'2026-07-28',
          formula:'故事大纲 + 角色设定 + 分镜描述 + 风格参考 = AI漫剧',
          structure:'①角色（你是漫剧导演）②任务（制作5集玄幻漫剧）③约束（每集30秒，竖屏9:16）④格式（分镜表+AI生图提示词）',
          summary:'AI漫剧制作的核心在于角色一致性和分镜流畅度。使用Midjourney或Stable Diffusion生成角色后，通过ControlNet保持一致性。',
          tip:'先固定角色参考图，再逐帧生成，角色一致性提升80%。',
          url:'https://www.bilibili.com/search?keyword=AI%E6%BC%AB%E5%89%A7%E5%88%B6%E4%BD%9C'
        },
        { id:'kb-c2', title:'AI漫画生成：人物表情与动作控制技巧', date:'2026-07-28',
          formula:'角色IP + 表情库 + 动作描述 + 场景光照 = 连贯漫画',
          structure:'①角色（你是漫画师）②任务（生成对话场景漫画）③约束（4格，表情丰富）④格式（每格画面描述+AI提示词）',
          summary:'通过建立角色表情库和动作参考库，结合AI生图工具，可以高效产出风格统一的漫画作品。',
          tip:'使用LoRA训练角色模型，后续生成时角色还原度可达95%。',
          url:'https://www.bilibili.com/search?keyword=AI%20%E6%BC%AB%E7%94%BB%20%E8%A7%92%E8%89%B2%E4%B8%80%E8%87%B4%E6%80%A7'
        }
      ],
      aiBuild: [
        { id:'kb-b1', title:'零代码搭建AI智能体：从需求到上线', date:'2026-07-28',
          formula:'功能定义 + 知识库 + 工具调用 + 对话流程 = AI智能体',
          structure:'①角色（你是AI产品经理）②任务（搭建客服智能体）③约束（支持FAQ+工单创建）④格式（流程图+配置文档）',
          summary:'使用Coze、Dify等平台，无需编程即可搭建功能完整的AI智能体。核心是构建高质量知识库和设计合理的对话流程。',
          tip:'知识库采用"问题-答案"对的形式入库，检索准确率提升60%。',
          url:'https://www.bilibili.com/search?keyword=AI%E6%99%BA%E8%83%BD%E4%BD%93%E6%90%AD%E5%BB%BA'
        },
        { id:'kb-b2', title:'用AI搭建自动化工作流：连接100+应用', date:'2026-07-28',
          formula:'触发条件 + AI处理 + 输出动作 + 异常处理 = 自动化流程',
          structure:'①角色（你是自动化工程师）②任务（搭建邮件自动回复流程）③约束（3秒响应，支持附件）④格式（流程图+配置步骤）',
          summary:'通过Zapier、Make等工具结合AI能力，可实现跨应用自动化工作流。AI负责理解邮件内容并生成回复，工作流工具负责调度。',
          tip:'先画出完整流程图再动手配置，可避免80%的返工。',
          url:'https://www.bilibili.com/search?keyword=AI%20%E8%87%AA%E5%8A%A8%E5%8C%96%E5%B7%A5%E4%BD%9C%E6%B5%81'
        }
      ]
    },

    render() {
      const today = Storage.today();
      const td = Storage.getDayData('aiStudy', today);
      const hist = Storage.getHistoryDates('aiStudy').filter(d => d !== today);
      // AI 资讯：真实数据源（量子位 / 36氪，服务端抓取），无数据时回落示例
      const liveAI = window.DataSource ? DataSource.list('ai') : [];
      const useDynamic = liveAI.length > 0;
      const newsList = useDynamic ? liveAI : (td.news || this.sampleNews);
      const kb = this.knowledgeBase;
      const aiUpdatedAt = useDynamic && window.DataSource ? DataSource.updatedAt('ai') : '';

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--gold);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/></svg></span>AI学习</div>
          <div class="section-subtitle">AI前沿资讯 · 知识库</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="aiNewsPanel" onclick="App.bindSubTabs(this)">AI前沿资讯</button>
          <button class="sub-tab" data-panel="aiKbPanel" onclick="App.bindSubTabs(this)">AI思路/技巧·知识库</button>
        </div>

        <div class="sub-panel" id="aiNewsPanel">
          <div style="display:flex;align-items:center;margin-bottom:8px;">
            <button class="btn btn-outline" id="refreshAiStudyBtn" style="font-size:11px;padding:2px 10px;" onclick="DataSource.refresh('refreshAiStudyBtn')">刷新资讯</button>
            ${aiUpdatedAt ? `<span style="font-size:11px;color:var(--text-ink-muted);margin-left:8px;">更新于 ${DataSource.relative(aiUpdatedAt)}</span>` : ''}
          </div>
          <div id="aiNewsList">${newsList.map(n => this.renderNewsCard(n, td, useDynamic)).join('')}</div>
        </div>

        <div class="sub-panel" id="aiKbPanel" style="display:none;">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar" style="background:var(--haze-blue);"></span>AI思路/技巧 · 知识库</div>
            <div class="kb-tabs">
              <button class="kb-tab active" onclick="Sections.aiStudy.switchKbTab('aiOffice',this)">AI办公</button>
              <button class="kb-tab" onclick="Sections.aiStudy.switchKbTab('aiComic',this)">AI漫剧</button>
              <button class="kb-tab" onclick="Sections.aiStudy.switchKbTab('aiBuild',this)">AI搭建</button>
            </div>
            <div id="kbContent">${this.renderKbItems('aiOffice')}</div>
          </div>
        </div>

        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map((d, i) => this.renderHistory(d, i)).join('')}</div>` : ''}
      `;
    },

    renderNewsCard(news, td, isSimple) {
      // 简单模式：RSS数据只有 title/url/date/source/summary，无 highlights/oneLiner/resources
      // noteId / note 提升到函数顶部，完整模式与简单模式共用，避免完整模式引用未定义变量
      const noteId = news.id || ('rss-' + (news.url || news.title).substring(0, 50));
      const note = td.notes?.[noteId] || {};
      if (isSimple) {
        return `
          <div class="card mb-4">
            <div class="ai-news-header">
              <div class="ai-news-title">${news.title}</div>
              ${actionButtons({section:'aiStudy',title:news.title,summary:news.summary||news.title,url:news.url||'',type:'article'})}
            </div>
            <div class="ai-news-meta">${news.source || ''} ${news.date ? '· ' + news.date : ''}</div>
            ${news.url ? `<a href="${news.url}" target="_blank" rel="noopener noreferrer" class="ai-news-link">📎 原文链接</a>` : ''}
            ${news.summary ? `<div class="ai-news-section"><div class="ai-news-label">📌 摘要</div><div class="ai-news-content">${news.summary}</div></div>` : ''}
            ${note.text ? `<div class="ai-news-section"><div class="ai-news-label">✍️ 我的笔记</div><div class="ai-news-content">${note.text}</div></div>` : ''}
            <textarea class="task-review mt-3" id="note-${noteId}" placeholder="写下你的学习笔记..." oninput="Sections.aiStudy.saveNote('${noteId}',this.value)">${note.text||''}</textarea>
          </div>`;
      }
      return `
        <div class="card mb-4">
          <div class="ai-news-header">
            <div class="ai-news-title">${news.title}</div>
            ${actionButtons({section:'aiStudy',title:news.title,summary:news.summary,url:news.sourceUrl,type:'article'})}
          </div>
          <div class="ai-news-meta">${news.source} · ${news.date}</div>
          <a href="${news.sourceUrl}" target="_blank" rel="noopener noreferrer" class="ai-news-link">📎 原文链接：${news.source}</a>
          <div class="ai-news-section"><div class="ai-news-label">📌 摘要</div><div class="ai-news-content">${news.summary}</div></div>
          <div class="ai-news-section"><div class="ai-news-label">💡 核心亮点</div><div class="ai-news-content">${news.highlights}</div></div>
          <div class="ai-news-section"><div class="ai-news-label">🧠 一句话理解</div><div class="ai-news-content">${news.oneLiner}</div></div>
          ${note.text ? `<div class="ai-news-section"><div class="ai-news-label">✍️ 我的笔记</div><div class="ai-news-content">${note.text}</div></div>` : ''}
          <div class="ai-resource-section">
            <div class="ai-resource-title">📚 功能解析学习</div>
            <div class="ai-resource-grid">
              ${news.resources.articles.map(a => `<a href="${a.url}" target="_blank" rel="noopener noreferrer" class="ai-resource-item"><div class="ai-resource-type">图文</div><div class="ai-resource-name">${a.title}</div><div class="ai-resource-desc">${a.desc}</div></a>`).join('')}
              ${news.resources.videos.map(v => `<a href="${v.url}" target="_blank" rel="noopener noreferrer" class="ai-resource-item video"><div class="ai-resource-type">视频</div><div class="ai-resource-name">${v.title}</div><div class="ai-resource-desc">${v.desc}</div></a>`).join('')}
            </div>
          </div>
          <textarea class="task-review mt-3" id="note-${news.id}" placeholder="写下你的学习笔记..." oninput="Sections.aiStudy.saveNote('${news.id}',this.value)">${note.text||''}</textarea>
        </div>`;
    },

    renderKbItems(category) {
      const items = this.knowledgeBase[category] || [];
      return items.map(item => `
        <div class="kb-item">
          <div class="kb-item-header">
            <div class="kb-item-title">${item.title}</div>
            ${actionButtons({section:'aiStudy',title:item.title,summary:item.summary,url:item.url,type:'knowledge'})}
          </div>
          <div class="kb-item-date">${item.date}</div>
          <div class="kb-item-section"><span class="kb-label">万能提示词公式</span><div class="kb-content">${item.formula}</div></div>
          <div class="kb-item-section"><span class="kb-label">四要素结构化指令法</span><div class="kb-content">${item.structure}</div></div>
          <div class="kb-item-section"><span class="kb-label">总结</span><div class="kb-content">${item.summary}</div></div>
          <div class="kb-item-section"><span class="kb-label">核心技巧</span><div class="kb-content">${item.tip}</div></div>
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline mt-2" style="font-size:11px;padding:4px 10px;">观看视频教程</a>
        </div>`).join('');
    },

    switchKbTab(cat, btn) {
      document.querySelectorAll('.kb-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('kbContent').innerHTML = this.renderKbItems(cat);
    },

    saveNote(id, val) {
      const d = Storage.getDayData('aiStudy', Storage.today());
      if (!d.notes) d.notes = {};
      if (!d.notes[id]) d.notes[id] = {};
      d.notes[id].text = val;
      Storage.save();
      // 写笔记时自动打卡
      if (val && val.trim()) App.triggerAutoCheckin('完成学习记录');
    },

    renderHistory(date, idx = 999) {
      const d = Storage.getDayData('aiStudy', date);
      const news = d.news || [];
      const done = news.filter(n => d.notes?.[n.id]).length;
      const collapsedCls = idx < 3 ? '' : 'collapsed';
      return `<div class="date-group ${collapsedCls}"><div class="date-group-header" onclick="Sections.toggleDateGroup(this)"><div class="date-group-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="date-group-toggle"><path d="M6 9l6 6 6-6"/></svg>${date}<span class="date-group-badge">${done}/${news.length||0}</span></div></div><div class="date-group-body">${news.map(n => `<div class="task-item ${d.notes?.[n.id]?'task-done':''}" style="margin-bottom:6px;"><div class="task-checkbox ${d.notes?.[n.id]?'checked':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div><div class="task-content"><div class="task-name">${n.title}</div>${d.notes?.[n.id]?.text?`<div class="task-meta">${d.notes[n.id].text}</div>`:''}</div></div>`).join('')}</div></div>`;
    },

    async refresh() {
      if (window.DataSource) await DataSource.refresh('refreshAiStudyBtn');
    }
  },

  // ==================== 阅读（书影+打卡+公众号+三联中读） ====================
  reading: {
    render() {
      const bm = Storage.data.reading.bookMedia;

      // 订阅精选：真实数据（分组），无数据时回落到内置示例
      const liveSub = window.DataSource ? DataSource.map('subscriptions') : null;
      const subGroups = (liveSub && Object.keys(liveSub).length) ? liveSub : this.fallbackGroups();
      const subKeys = Object.keys(subGroups);
      const subStamp = liveSub && window.DataSource ? DataSource.stamp('subscriptions') : '';
      const slStamp = (window.DataSource && DataSource.list('sanlian').length) ? DataSource.stamp('sanlian') : '';

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--earth);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></span>阅读</div>
          <div class="section-subtitle">书影 · 打卡 · 订阅精选 · 三联</div></div>
          <div class="flex gap-2">
            <button class="btn btn-outline" onclick="Sections.reading.addBookMedia('book')">+ 书籍</button>
            <button class="btn btn-outline" onclick="Sections.reading.addBookMedia('media')">+ 影视</button>
          </div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="readingBookMedia" onclick="App.bindSubTabs(this)">书影</button>
          <button class="sub-tab" data-panel="readingGzh" onclick="App.bindSubTabs(this)">订阅精选</button>
          <button class="sub-tab" data-panel="readingSanlian" onclick="App.bindSubTabs(this)">三联中读</button>
        </div>

        <div class="sub-panel" id="readingBookMedia">
          <!-- 书影列表 -->
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar"></span>书影清单</div>
            ${this.renderBookMediaList(bm)}
          </div>

          <!-- 书影打卡月历 -->
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>书影打卡
              <button class="btn btn-outline checkin-quick-btn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.reading.addCheckinEntry('${Storage.today()}')">今日打卡</button>
            </div>
            ${this.renderCheckinCalendar()}
          </div>
        </div>

        <div class="sub-panel" id="readingGzh" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>订阅精选
              <button class="btn btn-outline" id="refreshSubBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshSubBtn')">刷新</button>
            </div>
            ${subStamp}
            <div class="gzh-tabs">
              ${subKeys.map((k,i) => `<button class="gzh-tab ${i===0?'active':''}" onclick="Sections.reading.switchGzh('${k}',this)">${subGroups[k].label}</button>`).join('')}
            </div>
            <div id="gzhContent">${this.renderGzhArticles(subKeys[0])}</div>
          </div>
        </div>

        <div class="sub-panel" id="readingSanlian" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>三联生活周刊 · 最新
              <button class="btn btn-outline" id="refreshSlBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshSlBtn')">刷新</button>
            </div>
            ${slStamp}
            ${this.renderSanlianArticles()}
          </div>
        </div>
      `;
    },

    // 三联中读文章
    sanlianData: [
      { id:'sl-1', title:'中读专访｜余华：写作是一场与时间的角力', date:'2026-07-28', source:'三联中读',
        summary:'余华在专访中谈到《文城2》的创作过程，坦言"写作中最难的不是开始，而是如何在漫长的时间中保持对故事的新鲜感"。他分享了自己每天早晨写作三小时的习惯，以及如何在现实中寻找虚构的锚点。',
        url:'https://www.lifeweek.com.cn/' },
      { id:'sl-2', title:'城市观察｜北京胡同里的"消失与重生"', date:'2026-07-27', source:'三联中读',
        summary:'三联记者深入北京胡同社区，记录老北京人在城市化进程中的生存状态。文章以细腻的白描手法呈现了胡同生活的日常纹理，以及新一代年轻人对胡同文化的重新发现与改造。',
        url:'https://www.lifeweek.com.cn/' }
    ],

    renderSanlianArticles() {
      const live = window.DataSource ? DataSource.list('sanlian') : [];
      const list = live.length ? live : this.sanlianData;
      return list.map(a => `
        <div class="gzh-article">
          <div class="gzh-article-header">
            <div>
              <div class="gzh-article-title">${a.title}</div>
              <div class="gzh-article-meta">${a.source} · ${a.date}</div>
            </div>
            ${actionButtons({section:'reading',title:a.title,summary:a.summary,url:a.url,type:'sanlian'})}
          </div>
          <div class="gzh-article-summary">${a.summary}</div>
          <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="gzh-article-link">阅读全文 →</a>
        </div>`).join('');
    },

    renderBookMediaList(bm) {
      const all = [
        ...bm.reading.map(b => ({...b, _type:'book', _status:'在读'})),
        ...bm.watching.map(m => ({...m, _type:'media', _status:'在看'})),
        ...bm.planned.map(p => ({...p, _type:p.type||'book', _status:'计划'})),
        ...bm.completed.map(c => ({...c, _type:c.type||'book', _status:'已完成'}))
      ];
      if (all.length === 0) return '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">还没有添加书籍或影视，点击右上角添加</div></div>';
      return all.map(item => `
        <div class="book-media-item" onclick="Sections.reading.showDetail('${item._type}','${item.title}')">
          <div class="bm-cover" style="background:${item._type==='book'?'var(--haze-blue)':'var(--red)'};">
            ${item.cover ? `<img src="${item.cover}" alt="">` : `<span>${item._type==='book'?'📖':'🎬'}</span>`}
          </div>
          <div class="bm-info">
            <div class="bm-title">${item.title}</div>
            <div class="bm-meta">${item._type==='book'?'书籍':'影视'} · ${item._status}</div>
            ${item.author ? `<div class="bm-sub">${item._type==='book'?'作者':'导演'}：${item.author}</div>` : ''}
            ${item.summary ? `<div class="bm-summary">${item.summary.slice(0,60)}...</div>` : ''}
          </div>
          <span class="bm-status-badge" style="background:${item._status==='已完成'?'var(--success)':item._status==='计划'?'var(--gold)':'var(--haze-blue)'};">${item._status}</span>
        </div>`).join('');
    },

    renderCheckinCalendar() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const today = now.getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const checkinData = Storage.data.reading.checkin || {};
      const colors = Storage.data.reading.checkinColors || {book:'#2E6F7E',media:'#C04830'};
      const monthKey = `${year}-${String(month+1).padStart(2,'0')}`;

      let html = `<div class="checkin-calendar-header">${year}年${month+1}月</div><div class="checkin-calendar-grid">`;
      ['日','一','二','三','四','五','六'].forEach(w => html += `<div class="checkin-weekday">${w}</div>`);
      for (let i = 0; i < firstDay; i++) html += '<div class="checkin-day empty"></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${monthKey}-${String(d).padStart(2,'0')}`;
        const entries = checkinData[ds] || [];
        const isToday = d === today;
        let dots = '';
        entries.forEach(e => { dots += `<span class="checkin-dot" style="background:${e.color||colors[e.type]||colors.book};"></span>`; });
        html += `<div class="checkin-day ${isToday?'today':''} ${entries.length?'has-entry':''}" onclick="Sections.reading.addCheckinEntry('${ds}')">
          <span class="checkin-day-num">${d}</span>
          <div class="checkin-dots">${dots}</div>
        </div>`;
      }
      html += '</div>';
      html += `<div class="checkin-legend"><span class="checkin-legend-item"><span class="checkin-dot" style="background:${colors.book};"></span>书籍</span><span class="checkin-legend-item"><span class="checkin-dot" style="background:${colors.media};"></span>影视</span></div>`;
      return html;
    },

    addCheckinEntry(date) {
      const bm = Storage.data.reading.bookMedia;
      const items = [...bm.reading, ...bm.watching];
      if (items.length === 0) { App.showToast('请先添加书籍或影视'); return; }
      const colors = Storage.data.reading.checkinColors;
      App.showModal('书影打卡 · ' + date, `
        <div class="checkin-form">
          ${items.map((item, i) => {
            const type = bm.reading.includes(item) ? 'book' : 'media';
            return `<div class="checkin-option" onclick="Sections.reading.confirmCheckin('${date}',${i},'${type}')">
              <span class="checkin-dot" style="background:${type==='book'?colors.book:colors.media};"></span>
              <span>${item.title}</span>
              <span style="color:var(--text-ink-muted);font-size:12px;">${type==='book'?'📖':'🎬'}</span>
            </div>`;
          }).join('')}
        </div>
      `);
    },

    confirmCheckin(date, index, type) {
      const bm = Storage.data.reading.bookMedia;
      const items = type === 'book' ? bm.reading : bm.watching;
      const item = items[index];
      if (!item) return;
      if (!Storage.data.reading.checkin) Storage.data.reading.checkin = {};
      if (!Storage.data.reading.checkin[date]) Storage.data.reading.checkin[date] = [];
      Storage.data.reading.checkin[date].push({ type, title: item.title, color: (Storage.data.reading.checkinColors||{})[type] });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 打卡成功');
      App.refresh();
    },

    // 公众号文章
    gzhData: {
      dandu: [
        { id:'gz-d1', title:'在城市中寻找诗意：2026年夏天的阅读清单', date:'2026-07-28', summary:'单读最新一期推荐了五本夏日读物，从加缪到余华，探讨人在城市中的精神归属。文章以细腻笔触梳理每本书的核心主题，适合在通勤路上阅读。',
          url:'https://www.owspace.com/', source:'单读公众号' },
        { id:'gz-d2', title:'我们为什么需要文学：一场关于阅读的对话', date:'2026-07-25', summary:'单读主编与作家就"文学在短视频时代的意义"展开深度对话，认为文学提供的是一种"慢下来"的能力，是抵抗信息碎片化的最后堡垒。',
          url:'https://www.owspace.com/', source:'单读公众号' }
      ],
      kyx: [
        { id:'gz-k1', title:'为什么我们总是在深夜emo？心理学解释来了', date:'2026-07-28', summary:'KnowYourself从神经科学角度解析深夜情绪波动的原因：前额叶皮层疲劳导致情绪调节能力下降，同时夜晚的安静会放大内心对话。建议建立"情绪缓冲区"。',
          url:'https://www.knowyourself.cc/', source:'KnowYourself公众号' },
        { id:'gz-k2', title:'亲密关系中的"消失的自我"：如何找回自己', date:'2026-07-26', summary:'文章探讨了在亲密关系中过度迎合对方导致自我丧失的心理机制，提出"自我分化"概念，建议通过独处时间和个人爱好重建边界感。',
          url:'https://www.knowyourself.cc/', source:'KnowYourself公众号' }
      ],
      heytea: [
        { id:'gz-h1', title:'喜茶×故宫联名：一杯茶里的东方美学', date:'2026-07-28', summary:'喜茶与故宫博物院推出联名系列，以故宫馆藏文物为灵感设计包装，茶饮配方融入传统花果元素。文章详解了联名背后的文化考据和设计思路。',
          url:'https://www.heytea.com/', source:'喜茶公众号' },
        { id:'gz-h2', title:'喜茶全球旗舰店设计揭秘：光与茶的空间对话', date:'2026-07-24', summary:'喜茶全球旗舰店开业，设计师以"茶汤的光泽"为灵感，用磨砂玻璃和暖光打造沉浸式茶饮空间。文章附完整设计图纸和建造过程。',
          url:'https://www.heytea.com/', source:'喜茶公众号' }
      ]
    },

    /** 无网络时的兜底分组（用原来的示例内容） */
    fallbackGroups() {
      return {
        dandu:   { label: '单读',          items: this.gzhData.dandu   || [] },
        kyx:     { label: 'KnowYourself', items: this.gzhData.kyx     || [] },
        heytea:  { label: '喜茶',          items: this.gzhData.heytea  || [] }
      };
    },

    _subGroups() {
      const live = window.DataSource ? DataSource.map('subscriptions') : null;
      return (live && Object.keys(live).length) ? live : this.fallbackGroups();
    },

    renderGzhArticles(account) {
      const g = this._subGroups()[account];
      const articles = (g && g.items) || [];
      if (!articles.length) return '<div class="empty-hint">暂无内容，点击右上角刷新试试</div>';
      return articles.map(a => `
        <div class="gzh-article">
          <div class="gzh-article-header">
            <div>
              <div class="gzh-article-title">${a.title}</div>
              <div class="gzh-article-meta">${a.source} · ${a.date}</div>
            </div>
            ${actionButtons({section:'reading',title:a.title,summary:a.summary,url:a.url,type:'article'})}
          </div>
          <div class="gzh-article-summary">${a.summary}</div>
          <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="gzh-article-link">阅读全文 →</a>
        </div>`).join('');
    },

    switchGzh(account, btn) {
      document.querySelectorAll('.gzh-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('gzhContent').innerHTML = this.renderGzhArticles(account);
    },

    addBookMedia(type) {
      const typeName = type === 'book' ? '书籍' : '影视';
      App.showModal(`添加${typeName}`, `
        <input class="input-field" id="bmTitle" placeholder="输入${typeName}名称" autofocus>
        <div id="bmAutofillResult" class="mt-3"></div>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-outline flex-1" onclick="Sections.reading.autofillBookMedia('${type}')">自动填充</button>
          <button class="btn btn-primary flex-1" onclick="Sections.reading.confirmAddBookMedia('${type}','reading')">添加到在读</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    async autofillBookMedia(type) {
      const title = document.getElementById('bmTitle').value.trim();
      if (!title) { App.showToast('请先输入名称'); return; }
      document.getElementById('bmAutofillResult').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-ink-muted);">正在检索信息...</div>';
      await new Promise(r => setTimeout(r, 800));
      const mock = type === 'book'
        ? { title, author:'（自动填充）', translator:'', publisher:'', summary:`《${title}》是一部引人入胜的作品，通过细腻的叙事探讨了人性与社会的深层主题。`, cover:'', versions:[{edition:'第一版',publisher:'人民文学出版社',year:'2025'},{edition:'精装版',publisher:'译林出版社',year:'2024'}] }
        : { title, director:'（自动填充）', year:'2025', summary:`《${title}》是一部视觉与情感并重的优秀作品，通过精彩的叙事和出色的表演打动了观众。`, poster:'', characters:['角色A','角色B','角色C'] };

      const el = document.getElementById('bmAutofillResult');
      if (type === 'book' && mock.versions.length > 1) {
        el.innerHTML = `<div class="autofill-result">
          <div style="font-weight:600;margin-bottom:8px;">找到多个版本，请选择：</div>
          ${mock.versions.map((v,i) => `<div class="version-option" onclick="document.getElementById('bmVersionIdx').value=${i}"><input type="radio" name="ver" ${i===0?'checked':''}> ${v.edition} - ${v.publisher} (${v.year})</div>`).join('')}
          <input type="hidden" id="bmVersionIdx" value="0">
        </div>`;
      } else {
        el.innerHTML = `<div class="autofill-result"><div style="color:var(--success);">✅ 已自动填充信息</div></div>`;
      }
      el._mockData = mock;
    },

    confirmAddBookMedia(type, status) {
      const title = document.getElementById('bmTitle').value.trim();
      if (!title) { App.showToast('请输入名称'); return; }
      const resultEl = document.getElementById('bmAutofillResult');
      const mock = resultEl?._mockData || { title, summary:'' };
      const item = { title, author: mock.author||mock.director||'', summary: mock.summary||'', cover: mock.cover||mock.poster||'', type, addedDate: Storage.today() };
      if (type === 'book' && mock.translator) item.translator = mock.translator;
      if (type === 'book' && mock.publisher) item.publisher = mock.publisher;
      if (type === 'media' && mock.characters) item.characters = mock.characters;

      const bm = Storage.data.reading.bookMedia;
      if (status === 'reading') {
        if (type === 'book') bm.reading.push(item); else bm.watching.push(item);
      } else {
        item.type = type;
        bm.planned.push(item);
      }
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已添加');
      App.refresh();
    },

    showDetail(type, title) {
      const bm = Storage.data.reading.bookMedia;
      const all = [...bm.reading, ...bm.watching, ...bm.planned, ...bm.completed];
      const item = all.find(i => i.title === title);
      if (!item) return;
      const isBook = type === 'book';
      App.showModal(item.title, `
        <div class="bm-detail">
          ${item.cover ? `<div class="bm-detail-cover"><img src="${item.cover}" alt=""></div>` : ''}
          <div class="bm-detail-info">
            ${item.author ? `<div class="bm-detail-row"><span class="bm-detail-label">${isBook?'作者':'导演'}</span><span>${item.author}</span></div>` : ''}
            ${item.translator ? `<div class="bm-detail-row"><span class="bm-detail-label">译者</span><span>${item.translator}</span></div>` : ''}
            ${item.publisher ? `<div class="bm-detail-row"><span class="bm-detail-label">出版社</span><span>${item.publisher}</span></div>` : ''}
            ${item.characters ? `<div class="bm-detail-row"><span class="bm-detail-label">角色</span><span>${item.characters.join('、')}</span></div>` : ''}
            ${item.summary ? `<div class="bm-detail-summary">${item.summary}</div>` : ''}
          </div>
          <div class="flex gap-3 mt-4">
            <button class="btn btn-primary flex-1" onclick="Sections.reading.markComplete('${type}','${title}')">${isBook?'读完':'看完'}</button>
            <button class="btn btn-outline" onclick="Sections.reading.startNow('${type}','${title}')">开始${isBook?'阅读':'观看'}</button>
            <button class="btn btn-outline" onclick="App.closeModal()">关闭</button>
          </div>
        </div>
      `);
    },

    markComplete(type, title) {
      const bm = Storage.data.reading.bookMedia;
      let arr = type === 'book' ? bm.reading : bm.watching;
      const idx = arr.findIndex(i => i.title === title);
      if (idx >= 0) {
        const item = arr.splice(idx, 1)[0];
        item.type = type;
        item.completedDate = Storage.today();
        bm.completed.push(item);
        Storage.save();
        App.closeModal();
        App.showToast(`🎉 恭喜${type==='book'?'读完':'看完'}！`);
        App.refresh();
      }
    },

    startNow(type, title) {
      const bm = Storage.data.reading.bookMedia;
      const idx = bm.planned.findIndex(i => i.title === title);
      if (idx >= 0) {
        const item = bm.planned.splice(idx, 1)[0];
        if (type === 'book') bm.reading.push(item); else bm.watching.push(item);
        Storage.save();
        App.closeModal();
        App.showToast(`📚 开始${type==='book'?'阅读':'观看'}`);
        App.refresh();
      }
    }
  },

  // ==================== 播客 ====================
  podcast: {
    // 用户关注的播客列表（可编辑）
    followedPodcasts: ['来都来了','不合时宜','文化有限','忽左忽右','东腔西调'],

    // 示例热榜（仅服务端 Apple 中国区抓取失败时的兜底，链接跳转到 Apple 播客中国区搜索）
    hotList: [
      { id:'pc-001', title:'聊聊2026下半年的AI趋势：从GPT-5到具身智能', podcaster:'硅谷101', duration:'58分', date:'2026-07-27',
        summary:'主播邀请AI领域投资人深度对谈，从GPT-5 Turbo发布聊到具身智能赛道，分析下半年最值得关注的三个AI方向：多模态Agent、AI硬件、垂直行业模型。',
        url:'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent('硅谷101') },
      { id:'pc-002', title:'我做自媒体三年赚了多少？全网最真实分享', podcaster:'半佛仙人', duration:'42分', date:'2026-07-27',
        summary:'半佛仙人首次公开自媒体收入结构和运营策略，从内容选题到变现路径全面拆解，对想做自媒体的人极具参考价值。',
        url:'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent('半佛仙人') },
      { id:'pc-003', title:'35岁被裁后，我开了一家年入百万的小店', podcaster:'故事FM', duration:'36分', date:'2026-07-26',
        summary:'一位前互联网大厂员工分享被裁后创业的真实经历，从选址到经营，从心理调适到财务规划，故事真实动人。',
        url:'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent('故事FM') },
      { id:'pc-004', title:'为什么年轻人开始流行"数字游民"？', podcaster:'忽左忽右', duration:'48分', date:'2026-07-26',
        summary:'探讨数字游民生活方式的兴起原因，从远程办公普及到价值观变迁，分析了这种生活方式的利弊和适合人群。',
        url:'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent('忽左忽右') },
      { id:'pc-005', title:'2026年中国消费趋势报告：5个值得关注的变化', podcaster:'商业就是这样', duration:'32分', date:'2026-07-26',
        summary:'基于最新消费数据，分析2026年中国消费市场的五大趋势：理性消费回归、国货持续崛起、体验经济升温、银发经济爆发、情绪价值定价。',
        url:'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent('商业就是这样') }
    ],

    render() {
      const today = Storage.today();
      const td = Storage.getDayData('podcast', today);
      const hist = Storage.getHistoryDates('podcast').filter(d => d !== today);

      // 热榜：Apple 播客中国区实时榜（服务端抓取），无数据时回落示例
      const liveHot = window.DataSource ? DataSource.list('podcastHot') : [];
      const hotList = liveHot.length ? liveHot : this.hotList;
      const hotStamp = liveHot.length && window.DataSource ? DataSource.stamp('podcastHot') : '';

      // 关注更新：优先用真实抓取到的最新单集，抓不到的给搜索入口
      const names = this.getFollowed();
      const live = window.DataSource ? DataSource.list('podcastFollow') : [];
      const followList = names.map((name, i) => {
        const hit = live.find(x => x.podcaster === name);
        if (hit) {
          const u = (hit.url || '').includes('podcasts.apple.com')
            ? hit.url
            : ('https://podcasts.apple.com/cn/search?term=' + encodeURIComponent(name));
          return { ...hit, url: u };
        }
        return {
          id: 'pc-follow-' + i,
          title: name + ' · 最新一期',
          podcaster: name,
          duration: '',
          date: '',
          summary: '这档播客还没被自动收录，点击下方按钮直接去 Apple 播客搜索收听。',
          url: 'https://podcasts.apple.com/cn/search?term=' + encodeURIComponent(name),
          placeholder: true
        };
      });

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:#7B3FF2;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg></span>播客</div>
          <div class="section-subtitle">Apple 播客中国区热榜 · 我的关注更新</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="podcastHot" onclick="App.bindSubTabs(this)">播客热榜</button>
          <button class="sub-tab" data-panel="podcastFollow" onclick="App.bindSubTabs(this)">我的关注</button>
        </div>

        <div id="podcastHot" class="sub-panel">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar" style="background:#7B3FF2;"></span>热榜 Top ${hotList.length}
              <button class="btn btn-outline" id="refreshPodBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshPodBtn')">刷新</button>
            </div>
            ${hotStamp}
            ${hotList.map((p,i) => this.renderPodcastCard(p, td, i+1)).join('')}
          </div>
        </div>

        <div id="podcastFollow" class="sub-panel" style="display:none;">
          <div class="card mb-4">
            <div class="card-title">
              <span class="card-title-bar" style="background:var(--gold);"></span>关注更新<span class="content-updated">收录至 ${maxDateOf(followList)}</span>
              <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.podcast.editFollowed()">编辑关注</button>
            </div>
            ${followList.map(p => this.renderPodcastCard(p, td)).join('')}
          </div>
        </div>

        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map((d, i) => this.renderHistory(d, i)).join('')}</div>` : ''}
      `;
    },

    _getFollowTitle(name) {
      const titles = {
        '来都来了': '周末闲聊：最近的生活碎片与好物分享',
        '不合时宜': '当我们在谈论独立女性时，我们在谈什么',
        '文化有限': '读书笔记怎么做？我的三套笔记系统',
        '忽左忽右': '这周最值得讨论的一个商业现象',
        '东腔西调': '东西之间：聊聊那些被误解的文化符号'
      };
      return titles[name] || name + ' 最新一期';
    },

    _getFollowSummary(name) {
      const summaries = {
        '来都来了': '轻松的生活闲聊节目，主播分享近期的生活观察、好物与有趣见闻，是忙碌一周后的治愈陪伴。',
        '不合时宜': '围绕性别、职场与社会的深度对谈，嘉宾观点犀利，适合想要拓展认知边界的听众。',
        '文化有限': '主播分享了三套互补的读书笔记系统：卡片笔记法、主题阅读法、费曼输出法，适合不同类型的阅读需求。',
        '忽左忽右': '从商业现象到科技趋势的理性拆解，帮你在信息洪流中建立自己的判断框架。',
        '东腔西调': '聚焦东西方文化碰撞的访谈节目，温柔又有料，带你看见更广阔的世界。'
      };
      return summaries[name] || '关注播客最新更新内容。';
    },

    renderPodcastCard(p, td, rank) {
      const note = td.notes?.[p.id] || {};
      const meta = [p.podcaster, p.genre, p.duration, p.date].filter(Boolean).join(' · ');
      const cover = p.artwork
        ? `<img class="podcast-cover" src="${p.artwork}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : '';
      const isApple = (p.url || '').includes('podcasts.apple.com');
      const playText = p.placeholder ? '在 Apple 播客搜索收听 →' : (isApple ? '在 Apple 播客收听 →' : '收听本期 →');
      return `
        <div class="podcast-item ${note.text?'listened':''}">
          <div class="podcast-header">
            ${rank ? `<div class="podcast-rank">${rank}</div>` : ''}
            ${cover}
            <div class="podcast-main">
              <div class="podcast-title">${p.title}</div>
              <div class="podcast-meta">${meta}</div>
            </div>
            ${actionButtons({section:'podcast',title:p.title,summary:p.summary||p.title,url:p.url,type:'podcast'})}
          </div>
          ${p.summary ? `<div class="podcast-summary">${p.summary}</div>` : ''}
          <div class="podcast-actions-row">
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="podcast-play-btn">${playText}</a>
          </div>
          ${note.text ? `<div class="podcast-note">${note.text}</div>` : ''}
          <input class="podcast-note-input" id="pn-${p.id}" placeholder="记笔记..." oninput="Sections.podcast.saveNote('${p.id}',this.value)" value="${note.text||''}">
        </div>`;
    },

    /** 关注列表持久化在本地，跟着账号一起同步 */
    getFollowed() {
      const saved = Storage.data.podcastFollowed;
      return Array.isArray(saved) && saved.length ? saved : this.followedPodcasts;
    },

    editFollowed() {
      const current = this.getFollowed();
      App.showModal('编辑关注播客', `
        <div style="font-size:12px;color:var(--text-ink-muted);margin-bottom:8px;">添加或删除关注的播客名称，保存后生效</div>
        <div id="followedList" style="margin-bottom:12px;">
          ${current.map((name, i) => `
            <div class="follow-edit-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <input class="input-field flex-1" value="${name}" data-idx="${i}">
              <button class="btn btn-outline" style="padding:4px 8px;" onclick="this.parentElement.remove()">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-outline" style="width:100%;margin-bottom:12px;" onclick="Sections.podcast.addFollowInput()">+ 添加播客</button>
        <div class="flex gap-3">
          <button class="btn btn-primary flex-1" onclick="Sections.podcast.saveFollowed()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    addFollowInput() {
      const container = document.getElementById('followedList');
      const div = document.createElement('div');
      div.className = 'follow-edit-item';
      div.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      div.innerHTML = '<input class="input-field flex-1" value="" placeholder="播客名称"><button class="btn btn-outline" style="padding:4px 8px;" onclick="this.parentElement.remove()">✕</button>';
      container.appendChild(div);
    },

    saveFollowed() {
      const inputs = document.querySelectorAll('#followedList input');
      Storage.data.podcastFollowed = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
      Storage.save();
      App.closeModal();
      App.showToast('✅ 关注列表已更新');
      App.refresh();
    },

    saveNote(id, val) {
      const d = Storage.getDayData('podcast', Storage.today());
      if (!d.notes) d.notes = {};
      if (!d.notes[id]) d.notes[id] = {};
      d.notes[id].text = val;
      Storage.save();
      if (val && val.trim()) App.triggerAutoCheckin('完成学习记录');
    },

    renderHistory(date, idx = 999) {
      const d = Storage.getDayData('podcast', date);
      const list = d.list || [];
      const collapsedCls = idx < 3 ? '' : 'collapsed';
      return `<div class="date-group ${collapsedCls}"><div class="date-group-header" onclick="Sections.toggleDateGroup(this)"><div class="date-group-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="date-group-toggle"><path d="M6 9l6 6 6-6"/></svg>${date}<span class="date-group-badge">${list.length}篇</span></div></div><div class="date-group-body">${list.map(p => `<div class="podcast-item"><div class="podcast-header"><div class="podcast-main"><div class="podcast-title">${p.title}</div><div class="podcast-meta">${p.podcaster} · ${p.date}</div></div></div><div class="podcast-summary">${p.summary}</div></div>`).join('')}</div></div>`;
    }
  },

  // ==================== 自媒体 ====================
  selfMedia: {
    // —— 今日推荐：跨平台编辑精选，值得看 / 追 / 关注（内置示例内容，界面按当前日期标注）——
    sampleRecos: [
      { id:'reco-01', title:'Grok 4.5 免费开放，官方推荐用 Build 工具链调用', platform:'X / xAI', date:'2026-08-05',
        url:'https://aihot.virxact.com/items/cmsflglsq04k6rochfekqziad',
        summary:'Elon Musk 宣布 Grok 4.5 可免费体验，最佳实践是通过 Build 命令行工具链调用。做自媒体的可直接拿它做选题脑暴、脚本生成与多语言字幕。' },
      { id:'reco-02', title:'字节 Seed 发布 SeedRealtime：音视频全双工大模型', platform:'字节 Seed', date:'2026-08-04',
        url:'https://aihot.virxact.com/items/cmsfkn6cf03ciroch6tfynepy',
        summary:'统一架构原生融合音频/视频/文本，实现"边看边听边说"的实时交互，已在豆包全量上线。做口播/直播类内容的，值得关注它的实时反应能力。' },
      { id:'reco-03', title:'Qwen-Image-3.0-Pro 上线 Qwen Cloud', platform:'通义千问', date:'2026-08-05',
        url:'https://aihot.virxact.com/items/cmsficgoy000nrochjow7i1yx',
        summary:'图像生成能力再升级，适合做封面、海报、分镜垫图。配合"统一调色体系"趋势，可做个人视觉风格预设。' },
      { id:'reco-04', title:'开源「活人感写作.skill」：写出没有 AI 味的文字', platform:'公众号 · 数字生命卡兹克', date:'2026-08-05',
        url:'https://aihot.virxact.com/items/cmsff72yv1q6nro2etf4cmbuj',
        summary:'2026 观众反感 AI 同质化表达，这篇开源技能专门对抗"AI 味"。写文案/脚本前先看，能保住你的真实语气。' },
      { id:'reco-05', title:'OpenRouter 上线 FLUX 3 Video 统一多模态模型', platform:'OpenRouter', date:'2026-08-04',
        url:'https://aihot.virxact.com/items/cmseyrhcj1bgmro2ed47t5b0k',
        summary:'图生视频/文生视频统一模型，做短视频垫片、转场、产品展示都很顺手。关注它的授权与商用条款。' },
      { id:'reco-06', title:'抖音热议：AI 生成的作品算艺术吗', platform:'抖音热榜', date:'2026-08-02',
        url:'https://neodrop.ai/post/t87LppPBsq3',
        summary:'热榜话题 #AI生成的作品算艺术吗#。做内容别只跟风生成，建立自己的审美标准（见"审美搭建"）才是差异化关键。' },
      { id:'reco-07', title:'Colorwalk 色彩漫步爆火：一个月 4.6 亿曝光', platform:'小红书', date:'2026-08',
        url:'https://m.toutiao.com/article/7627359777621836323/',
        summary:'选定一种颜色出门"遛自己"，拍下所有呼应色。0 成本散步玩法，极适合做系列化日常 vlog 与九宫格。' },
      { id:'reco-08', title:'OPPO × 小红书 2026 影像趋势报告', platform:'小红书', date:'2026-08',
        url:'https://dy.163.com/article/KH7P1O6F0511D2LM.html',
        summary:'9 大移动影像趋势：胶片/生活感/氛围感人像、0.5x 广角自拍、live 照片、城市旅拍、色彩一致性。年度选题风向标。' }
    ],

    // —— 今日灵感：按题材分类的拍摄 / 创作火花（2026 趋势）——
    sampleInspiration: [
      { id:'ins-01', title:'阴天也能拍出质感人像 · 5 个自然光技巧', category:'portrait', categoryLabel:'人像·氛围', source:'小红书', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('阴天人像摄影'), tip:'阴天漫射光拍花通透；黄金时刻拍人像皮肤发光' },
      { id:'ins-02', title:'只用一盏灯拍出电影感人像 · 附布光图', category:'portrait', categoryLabel:'人像·电影感', source:'小红书', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('电影感人像布光'), tip:'灯位角度+色温控制，最简设备出大片' },
      { id:'ins-03', title:'生活感人像：捕捉不摆拍的真实情绪', category:'life', categoryLabel:'生活感', source:'OPPO×小红书趋势', url:'https://dy.163.com/article/KH7P1O6F0511D2LM.html', tip:'聚会/旅行/街头的自然反应，替代刻意打卡' },
      { id:'ins-04', title:'微观宇宙：水滴里的梦幻世界', category:'micro', categoryLabel:'微观', source:'摄影爆款指南', url:'https://www.toutiao.com/article/7597399997927162411/', tip:'手机微距镜+露珠做透镜，九宫格"一花一世界"' },
      { id:'ins-05', title:'建筑几何：城市里的抽象美学', category:'architecture', categoryLabel:'建筑几何', source:'摄影爆款指南', url:'https://www.toutiao.com/article/7597399997927162411/', tip:'楼梯/幕墙/重复窗，长焦压空间，莫兰迪色系成系列' },
      { id:'ins-06', title:'光影涂鸦：用光线作画的魔法', category:'light', categoryLabel:'光影', source:'摄影爆款指南', url:'https://www.toutiao.com/article/7597399997927162411/', tip:'三脚架+M档10-30s，手电/仙女棒夜空"绘制"' },
      { id:'ins-07', title:'旧物故事：有温度的情感摄影', category:'object', categoryLabel:'旧物', source:'摄影爆款指南', url:'https://www.toutiao.com/article/7597399997927162411/', tip:'旧木板+台灯侧光+大光圈，一句短文案戳共鸣' },
      { id:'ins-08', title:'城市旅拍：街头即旅拍场景', category:'street', categoryLabel:'街头/旅拍', source:'OPPO×小红书趋势', url:'https://dy.163.com/article/KH7P1O6F0511D2LM.html', tip:'人景合一构图，城市街头成为新旅拍地' },
      { id:'ins-09', title:'Colorwalk 色彩漫步：选一色遛自己', category:'color', categoryLabel:'色彩漫步', source:'小红书', url:'https://m.toutiao.com/article/7627359777621836323/', tip:'选粉/绿/黄一色，拼九宫格"春日色彩地图"' },
      { id:'ins-10', title:'电影感调色：青橙分离 + 宽画幅', category:'cinematic', categoryLabel:'电影感', source:'2026摄影趋势', url:'https://yingshilv.cn/sheyingjiqiao/dianyinggan2026.html', tip:'阴影偏青蓝、高光偏暖橙，留白 + 2.35:1 宽幅' },
      { id:'ins-11', title:'黄金时刻：日出后/日落前 1 小时', category:'light', categoryLabel:'光线', source:'小红书', url:'https://m.toutiao.com/article/7627359777621836323/', tip:'上午 9-11、下午 4-6 柔光；侧逆光让花瓣透光' },
      { id:'ins-12', title:'胶片质感：颗粒/漏光/暖调偏移', category:'film', categoryLabel:'胶片', source:'2026摄影趋势', url:'https://www.toutiao.com/article/7598354224740614683/', tip:'对抗 AI 同质化，人像/纪实回归真实温度' },
      { id:'ins-13', title:'耗时三年拍下古诗词里的中国', category:'travel', categoryLabel:'诗意旅行', source:'抖音热榜', url:'https://neodrop.ai/post/t87LppPBsq3', tip:'诗句+实景+地点三栏图，附拍摄季节与原诗' },
      { id:'ins-14', title:'我拍到了海鸥雨 · 慢动作拆解瞬间', category:'travel', categoryLabel:'自然', source:'抖音热榜', url:'https://neodrop.ai/post/t87LppPBsq3', tip:'慢动作拆解"海鸥雨"瞬间，配现场声音' }
    ],

    // —— 审美搭建：可长期沉淀的审美框架与参考 ——
    sampleAesthetic: [
      { id:'aes-01', title:'胶片质感体系', tag:'质感', desc:'颗粒感 + 轻微漏光 + 暖调偏移 + 暗角，对抗 AI 同质化', how:'人像/纪实里保留色调偏移与颗粒，回归真实温度', url:'https://www.toutiao.com/article/7598354224740614683/' },
      { id:'aes-02', title:'电影感调色公式', tag:'调色', desc:'阴影偏青蓝、高光偏暖橙的微妙色彩分离；宽画幅 2.35:1；大量留白', how:'前期就设计"一图一故事"，别全靠后期拯救', url:'https://yingshilv.cn/sheyingjiqiao/dianyinggan2026.html' },
      { id:'aes-03', title:'统一色彩预设', tag:'体系', desc:'建立个人/品牌专属色彩预设，跨照片/视频/实况统一呈现', how:'固定 2-3 个 LUT，强化跨平台视觉识别度', url:'https://dy.163.com/article/KH7P1O6F0511D2LM.html' },
      { id:'aes-04', title:'真实美学 · 反精致', tag:'态度', desc:'保留皮肤纹理、拒绝过度磨皮；拥抱凌乱美学与不完美', how:'抓拍聚会/旅行/街头的自然反应，替代刻意打卡', url:'https://blog.bigbigwork.com/archives/202512161' },
      { id:'aes-05', title:'截图文化 / 数字原生', tag:'表达', desc:'把时间戳、聊天气泡、UI 元素作为完整视觉语言', how:'保留数字噪点，传递即时性与网络真实感', url:'https://blog.bigbigwork.com/archives/202512161' },
      { id:'aes-06', title:'色彩情绪档案', tag:'色彩', desc:'黄绿调怀旧（如 Noémi Ottilia Szabo）、冰蓝时刻、松弛高级感', how:'高光往暖黄拉、阴影往青绿压、降对比出故事感', url:'https://www.toutiao.com/article/7638855358169825834' },
      { id:'aes-07', title:'构图法则库', tag:'构图', desc:'三分+引导线、荷兰角、前景框架、对称留白', how:'街头前景加模糊路人制造"偷窥电影镜头"感', url:'https://yingshilv.cn/sheyingjiqiao/dianyinggan2026.html' },
      { id:'aes-08', title:'光线档案', tag:'光线', desc:'黄金时刻、阴天漫射、窗边柔光、霓虹夜景', how:'等光线落在人物身上的最佳角度，让光替你叙事', url:'https://www.toutiao.com/article/7638855358169825834' }
    ],

    render() {
      const self = this;
      const pick = (k, fb) => { const l = (window.DataSource ? (DataSource.list(k) || []) : []); return l.length ? l : fb; };

      // 今日推荐 / 审美搭建：目前还没有实时源，继续用内置示例内容（界面上会标注「示例内容」）
      const recoList = pick('selfmedia_reco', self.sampleRecos);
      const aesList  = pick('selfmedia_aes', self.sampleAesthetic);

      // 今日灵感：feeds.json 中对应的实时数据 key 为 inspiration
      const rawInsp = (window.DataSource ? (DataSource.list('inspiration') || []) : []);
      const inspIsLive = rawInsp.length > 0;
      const inspList = inspIsLive ? rawInsp.map((it, idx) => {
        // 实时条目结构为 {title, source, heat, url}，补齐渲染所需字段
        const label = it.categoryLabel || it.source || '热门';
        return {
          id: it.id || ('ins-live-' + idx),
          title: it.title || '',
          category: it.category || 'hot',
          categoryLabel: label,
          source: (it.source && it.source !== label) ? it.source : '',
          url: it.url || '',
          tip: it.tip || (it.heat ? ('热度 ' + it.heat) : '')
        };
      }) : self.sampleInspiration;

      const todayStr = new Date().toLocaleDateString('zh-CN');
      const recoIsLive = (window.DataSource ? (DataSource.list('selfmedia_reco') || []).length > 0 : false);
      const recoHint = recoIsLive ? ('更新于 ' + todayStr) : ('示例内容 · ' + todayStr);
      const inspHint = inspIsLive
        ? ('实时热点 · 更新于 ' + (window.DataSource ? (DataSource.relative(DataSource.updatedAt('inspiration')) || todayStr) : todayStr))
        : ('示例内容 · ' + todayStr);

      const groups = {};
      inspList.forEach(it => { const g = it.categoryLabel || '其他'; (groups[g] = groups[g] || []).push(it); });
      const groupHtml = Object.entries(groups).map(([cat, items]) => `
        <div class="insp-group">
          <div class="insp-group-title">${cat} <span style="font-size:11px;color:var(--text-ink-muted);margin-left:4px;">${items.length}</span></div>
          ${items.map((ins,i) => self.renderInspRow(ins, i)).join('')}
        </div>`).join('');

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--red);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z"/></svg></span>自媒体</div>
          <div class="section-subtitle">今日推荐 · 灵感 · 审美搭建（各有所重）</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="smReco" onclick="App.bindSubTabs(this)">今日推荐</button>
          <button class="sub-tab" data-panel="smInspiration" onclick="App.bindSubTabs(this)">今日灵感</button>
          <button class="sub-tab" data-panel="smAesthetic" onclick="App.bindSubTabs(this)">审美搭建</button>
        </div>

        <div id="smReco" class="sub-panel">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar"></span>今日推荐 · 编辑精选
              <button class="btn btn-outline" id="refreshRecoBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshRecoBtn','selfmedia_reco')">刷新</button>
            </div>
            <div class="card-hint">跨平台值得看 / 追 / 关注 · ${recoHint}</div>
            ${recoList.map((r,i) => self.renderRecoRow(r, i)).join('')}
          </div>
        </div>

        <div id="smInspiration" class="sub-panel" style="display:none;">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>今日灵感 · 分类火花
              <button class="btn btn-outline" id="refreshInspBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshInspBtn','inspiration')">刷新</button>
            </div>
            <div class="card-hint">按题材分类的拍摄 / 创作灵感 · ${inspHint}</div>
            ${groupHtml}
          </div>
        </div>

        <div id="smAesthetic" class="sub-panel" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:#7B3FF2;"></span>审美搭建 · 体系图鉴
              <button class="btn btn-outline" id="refreshAeBtn" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="DataSource.refresh('refreshAeBtn','selfmedia_aes')">刷新</button>
            </div>
            <div class="card-hint">可长期沉淀的审美框架与参考 · 示例内容</div>
            <div class="aesthetics-grid">
              ${aesList.map(a => `
                <div class="aesthetic-card" onclick="App.openExternal('${a.url}')">
                  <div class="aesthetic-info">
                    <div class="aesthetic-title">${a.title} <span class="aesthetic-tag">${a.tag}</span></div>
                    <div class="aesthetic-desc">${a.desc}</div>
                    <div class="aesthetic-how">▸ ${a.how}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderRecoRow(r, i) {
      return `
        <div class="inspiration-item">
          <div class="inspiration-rank">${i+1}</div>
          <div class="inspiration-content">
            <div class="inspiration-title">${r.title}</div>
            <div class="inspiration-source">${r.platform}${r.date ? ' · ' + r.date : ''}</div>
            ${r.summary ? `<div class="inspiration-summary">${r.summary}</div>` : ''}
          </div>
          <div class="item-actions">
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="action-btn" aria-label="打开">→</a>
            ${actionButtons({section:'selfMedia',title:r.title,summary:r.summary||r.platform,url:r.url,type:'article'})}
          </div>
        </div>`;
    },

    renderInspRow(ins, i) {
      const label = ins.categoryLabel || '';
      return `
        <div class="inspiration-item">
          <div class="inspiration-rank">${i+1}</div>
          <div class="inspiration-content">
            <div class="inspiration-title">${ins.title || ''}</div>
            <div class="inspiration-source">${label}${ins.source ? (label ? ' · ' : '') + ins.source : ''}</div>
            ${ins.tip ? `<div class="inspiration-summary">💡 ${ins.tip}</div>` : ''}
          </div>
          <div class="item-actions">
            <a href="${ins.url || '#'}" target="_blank" rel="noopener noreferrer" class="action-btn" aria-label="打开">→</a>
            ${actionButtons({section:'selfMedia',title:ins.title||'',summary:label||'摄影灵感',url:ins.url||'',type:'inspiration'})}
          </div>
        </div>`;
    }
  },


  // ==================== 自我探索 ====================
  selfExploration: {
    render() {
      const today = Storage.today();
      const se = Storage.data.selfExploration;
      this._periodMonth = today.slice(0,7);

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--haze-blue-dark);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></span>自我探索</div>
          <div class="section-subtitle">记录每一天的成长</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="seSelf" onclick="App.bindSubTabs(this)">今日状态</button>
          <button class="sub-tab" data-panel="seDaily" onclick="App.bindSubTabs(this)">日常记录</button>
          <button class="sub-tab" data-panel="seSkill" onclick="App.bindSubTabs(this)">新技能</button>
          <button class="sub-tab" data-panel="sePeriod" onclick="App.bindSubTabs(this)">生理期</button>
          <button class="sub-tab" data-panel="seFinance" onclick="App.bindSubTabs(this)">财务</button>
          <button class="sub-tab" data-panel="seJournal" onclick="App.bindSubTabs(this)">手账</button>
        </div>

        <div id="seSelf" class="sub-panel">
          ${this.renderSelfTab(se, today)}
        </div>

        <div id="seDaily" class="sub-panel" style="display:none;">
          ${this.renderDailyTab(se, today)}
        </div>

        <div id="seSkill" class="sub-panel" style="display:none;">
          ${this.renderSkillTab(se, today)}
        </div>

        <div id="sePeriod" class="sub-panel" style="display:none;">
          ${this.renderPeriodTab(se, today)}
        </div>

        <div id="seFinance" class="sub-panel" style="display:none;">
          ${this.renderFinanceTab(se, today)}
        </div>

        <div id="seJournal" class="sub-panel" style="display:none;">
          ${this.renderJournalTab(se, today)}
        </div>
      `;
    },

    // ---- 今日状态 ----
    renderSelfTab(se, today) {
      const mood = se.self.emotions?.find(e=>e.date===today)?.mood;
      const ootdList = se.self.appearance.ootd || [];
      const hairList = se.self.appearance.hair || [];
      const weightList = se.self.appearance.weight || [];
      const clothesList = se.self.appearance.clothes || [];
      const clothesCats = ['上衣','下装','外套','配饰','鞋履','连衣裙','其他'];

      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar"></span>今日心情</div>
          <div class="emotion-row">
            <button class="emotion-btn ${mood==='happy'?'active':''}" onclick="Sections.selfExploration.recordMood('happy')">😊</button>
            <button class="emotion-btn ${mood==='neutral'?'active':''}" onclick="Sections.selfExploration.recordMood('neutral')">😐</button>
            <button class="emotion-btn ${mood==='sad'?'active':''}" onclick="Sections.selfExploration.recordMood('sad')">😢</button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>OOTD / 发型 / 体重</div>
          <div class="flex gap-2 mt-2">
            <button class="btn btn-outline flex-1" onclick="Sections.selfExploration.addOOTD()">📷 OOTD</button>
            <button class="btn btn-outline flex-1" onclick="Sections.selfExploration.addHair()">💇 发型</button>
            <button class="btn btn-outline flex-1" onclick="Sections.selfExploration.addWeight()">⚖️ 体重</button>
          </div>
          ${ootdList.length > 0 ? `<div class="se-records-list">${ootdList.slice(-3).map(o => `<div class="se-record-item">${o.img?`<img ${o.img.startsWith('img_')?`data-img-id="${o.img}" src=""`:`src="${o.img}"`} class="se-record-thumb">`:'<div class="se-record-thumb-placeholder">📷</div>'}<div class="se-record-info"><div class="se-record-date">${o.date}</div><div class="se-record-text">${o.note||'OOTD'}</div></div></div>`).join('')}</div>` : ''}
          ${weightList.length > 0 ? `<div class="se-weight-display">最近体重：<strong>${weightList[weightList.length-1].value}kg</strong> <span style="color:var(--text-ink-muted);font-size:12px;">(${weightList[weightList.length-1].date})</span></div>` : ''}
          ${hairList.length > 0 ? `<div style="margin-top:6px;font-size:12px;color:var(--text-ink-muted);">最近发型：${hairList[hairList.length-1].desc||'已记录'}</div>` : ''}
        </div>

        <div class="card">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>购衣记录
            <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.selfExploration.addClothes()">+ 添加</button>
          </div>
          ${clothesList.length > 0 ? clothesCats.map(cat => {
            const items = clothesList.filter(c => c.cat === cat);
            if (items.length === 0) return '';
            return `<div class="se-clothes-cat"><div class="se-clothes-cat-title">${cat} (${items.length})</div><div class="se-clothes-grid">${items.map(c => `<div class="se-clothes-item" onclick="Sections.selfExploration.viewClothes('${c.id||c.date}')"><div class="se-clothes-name">${c.name||'未命名'}</div><div class="se-clothes-price">${c.price||'—'}</div><div class="se-clothes-date">${c.date}</div></div>`).join('')}</div></div>`;
          }).join('') : '<div class="empty-state"><div class="empty-state-icon">👗</div><div class="empty-state-text">粘贴购物链接，自动解析服装信息并分类</div></div>'}
        </div>
      `;
    },

    // ---- 日常记录 ----
    renderDailyTab(se, today) {
      const dailyList = se.daily || [];
      const todayList = dailyList.filter(d => d.date === today);
      const dailyTypes = [
        {icon:'🎉',name:'出门玩'},
        {icon:'🍳',name:'做饭'},
        {icon:'🧹',name:'打扫卫生'},
        {icon:'📝',name:'自定义'}
      ];

      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>今日日常</div>
          <div style="font-size:12px;color:var(--text-ink-muted);margin-bottom:8px;">点击一次记录 · 再次点击取消</div>
          <div class="daily-icons">
            ${dailyTypes.map(t => {
              const recorded = todayList.find(d => d.name === t.name);
              return `
              <button class="daily-icon-btn ${recorded?'active':''}" onclick="Sections.selfExploration.toggleDaily('${t.icon}','${t.name}')">
                <span class="icon-emoji">${t.icon}</span>
                <span class="icon-text">${t.name}</span>
                ${recorded?'<span class="daily-check-mark">✅</span>':''}
              </button>
              `;
            }).join('')}
          </div>
        </div>
        ${todayList.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar"></span>今日记录 (${todayList.length})</div>${todayList.map(d => `<div class="se-daily-item"><span style="font-size:20px;">${d.icon}</span><div class="se-daily-info"><div class="se-daily-name">${d.name||''}</div>${d.text?`<div class="se-daily-text">${d.text}</div>`:''}${d.img?`<img ${d.img.startsWith('img_')?`data-img-id="${d.img}" src=""`:`src="${d.img}"`} class="se-daily-photo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-top:4px;">`:''}</div></div>`).join('')}</div>` : ''}
        ${dailyList.filter(d => d.date !== today).length > 0 ? `<div class="card mt-4"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${dailyList.filter(d => d.date !== today).slice(-5).reverse().map(d => `<div class="se-daily-item"><span style="font-size:20px;">${d.icon}</span><div class="se-daily-info"><div class="se-daily-name">${d.name||''} <span style="color:var(--text-ink-muted);font-size:11px;">${d.date}</span></div>${d.text?`<div class="se-daily-text">${d.text}</div>`:''}${d.img?`<img ${d.img.startsWith('img_')?`data-img-id="${d.img}" src=""`:`src="${d.img}"`} class="se-daily-photo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-top:4px;">`:''}</div></div>`).join('')}</div>` : ''}
      `;
    },

    // ---- 新技能 ----
    renderSkillTab(se, today) {
      const skills = se.self.skills || [];
      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--haze-blue);"></span>记录新掌握的技能
            <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.selfExploration.addSkill()">+ 添加</button>
          </div>
          ${skills.length > 0 ? skills.slice().reverse().map(s => `<div class="se-skill-item"><div class="se-skill-icon">✨</div><div class="se-skill-info"><div class="se-skill-name">${s.name}</div><div class="se-skill-meta">${s.date}${s.level?' · '+s.level:''}</div>${s.note?`<div class="se-skill-note">${s.note}</div>`:''}</div></div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-text">记录你最新掌握的技能，见证成长轨迹</div></div>'}
        </div>
      `;
    },

    // ---- 生理期 ----
    renderPeriodTab(se, today) {
      const records = (se.period.records || []).slice().sort((a,b) => a.date < b.date ? -1 : 1);
      const recSet = new Set(records.map(r => r.date));

      // 基于历史周期推算未来 3 次
      let predicted = [];
      if (records.length >= 2) {
        const diffs = [];
        for (let i = 1; i < records.length; i++) {
          const d1 = new Date(records[i-1].date), d2 = new Date(records[i].date);
          const diff = Math.round((d2 - d1) / 86400000);
          if (diff > 0) diffs.push(diff);
        }
        if (diffs.length > 0) {
          const avg = Math.round(diffs.reduce((s,v)=>s+v,0) / diffs.length);
          const last = new Date(records[records.length-1].date);
          for (let k = 1; k <= 3; k++) {
            const d = new Date(last); d.setDate(d.getDate() + avg * k);
            predicted.push(Storage.formatDate(d));
          }
        }
      }
      const predSet = new Set(predicted);

      const calendar = this.renderPeriodCalendar(today, recSet, predSet);

      const predictionCard = predicted.length ? `
        <div class="card mt-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>智能预测</div>
          <div class="se-period-predict">基于 ${records.length} 次记录推算</div>
          <div class="se-period-predict-list">
            ${predicted.map((d,i) => `<div class="se-period-predict-item"><span class="se-period-dot" style="background:var(--red);"></span>预计 ${i===0?'下次':'再'+i+'次'}：<b>${d}</b></div>`).join('')}
          </div>
        </div>` : '';

      return `
        ${calendar}
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>生理期记录
            <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.selfExploration.recordPeriod()">+ 记录</button>
          </div>
          ${records.length > 0
            ? records.slice().reverse().slice(0, 6).map(r => `<div class="se-period-item"><span class="se-period-dot" style="background:${r.flow==='量多'?'var(--red)':r.flow==='量中'?'var(--gold)':'var(--earth-light)'};"></span><span class="se-period-date">${r.date}</span><span class="se-period-flow">${r.flow}</span></div>`).join('')
            : '<div class="empty-state"><div class="empty-state-icon">🌸</div><div class="empty-state-text">点击日历日期或「+记录」添加</div></div>'}
        </div>
        ${predictionCard}
      `;
    },

    renderPeriodCalendar(today, recSet, predSet) {
      const viewMonth = this._periodMonth || today.slice(0,7);
      const [vy, vm] = viewMonth.split('-').map(Number);
      const first = new Date(vy, vm-1, 1);
      const startDow = (first.getDay() + 6) % 7; // 周一为每周起始
      const daysInMonth = new Date(vy, vm, 0).getDate();
      const cells = [];
      for (let i = 0; i < startDow; i++) cells.push('<div class="period-day empty"></div>');
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${vy}-${String(vm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cls = ['period-day'];
        if (recSet.has(ds)) cls.push('period');
        else if (predSet.has(ds)) cls.push('predicted');
        if (ds === today) cls.push('today');
        cells.push(`<div class="${cls.join(' ')}" onclick="Sections.selfExploration.recordPeriod('${ds}')">${d}</div>`);
      }
      const weekHdr = ['一','二','三','四','五','六','日'].map(w => `<div class="period-dow">${w}</div>`).join('');
      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>生理期月历
            <div class="period-nav">
              <button class="btn btn-outline period-nav-btn" onclick="Sections.selfExploration.changePeriodMonth(-1)">‹</button>
              <span class="period-month-label">${vy}年${vm}月</span>
              <button class="btn btn-outline period-nav-btn" onclick="Sections.selfExploration.changePeriodMonth(1)">›</button>
            </div>
          </div>
          <div class="period-calendar">
            <div class="period-weekdays">${weekHdr}</div>
            <div class="period-grid">${cells.join('')}</div>
          </div>
          <div class="period-legend">
            <span><span class="period-day period period-chip"></span>已记录</span>
            <span><span class="period-day predicted period-chip"></span>预测</span>
          </div>
        </div>`;
    },

    changePeriodMonth(delta) {
      const cur = this._periodMonth || Storage.today().slice(0,7);
      let [y, m] = cur.split('-').map(Number);
      m += delta;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      this._periodMonth = `${y}-${String(m).padStart(2,'0')}`;
      const panel = document.getElementById('sePeriod');
      if (panel) panel.innerHTML = this.renderPeriodTab(Storage.data.selfExploration, Storage.today());
    },

    // ---- 财务 ----
    renderFinanceTab(se, today) {
      const finance = se.finance || [];
      const monthStr = today.slice(0,7);
      const monthFinance = finance.filter(f => f.date.startsWith(monthStr));
      const monthExpense = monthFinance.filter(f => (f.type||'expense') === 'expense').reduce((s,f) => s + (f.amount||0), 0);
      const monthIncome = monthFinance.filter(f => f.type === 'income').reduce((s,f) => s + (f.amount||0), 0);
      const monthNet = monthIncome - monthExpense;

      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>本月收支汇总</div>
          <div class="se-finance-grid">
            <div class="se-finance-stat"><div class="se-finance-stat-label">支出</div><div class="se-finance-stat-val expense">¥${monthExpense.toFixed(2)}</div></div>
            <div class="se-finance-stat"><div class="se-finance-stat-label">收入</div><div class="se-finance-stat-val income">¥${monthIncome.toFixed(2)}</div></div>
            <div class="se-finance-stat"><div class="se-finance-stat-label">结余</div><div class="se-finance-stat-val ${monthNet>=0?'income':'expense'}">¥${monthNet.toFixed(2)}</div></div>
          </div>
          <div class="flex gap-2 mt-3">
            <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.recordFinance()">+ 记一笔</button>
            <button class="btn btn-outline" onclick="Sections.selfExploration.exportFinanceCSV()">⬇ CSV</button>
          </div>
        </div>
        ${monthFinance.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar"></span>本月明细 (${monthFinance.length})</div>${monthFinance.slice().reverse().map(f => `<div class="se-finance-item"><span class="se-finance-cat">${f.cat}</span><div class="se-finance-info"><div class="se-finance-amount ${(f.type||'expense')==='income'?'income':'expense'}">${(f.type==='income'?'+':'-')}¥${f.amount.toFixed(2)}</div>${f.note?`<div class="se-finance-note">${f.note}</div>`:''}<div class="se-finance-date">${f.date}</div></div></div>`).join('')}</div>` : ''}
      `;
    },

    // ---- 手账 ----
    renderJournalTab(se, today) {
      const entries = se.journal.entries || [];
      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--haze-blue);"></span>手账
            <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.selfExploration.addJournal()">📝 写手账</button>
          </div>
          ${entries.length > 0 ? entries.slice().reverse().slice(0, 8).map(e => `<div class="journal-entry" onclick="Sections.selfExploration.viewJournal('${e.id}')"><div class="journal-entry-title">${e.title}</div><div class="journal-entry-date">${e.date}</div></div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">📔</div><div class="empty-state-text">开始写你的第一篇手账吧</div></div>'}
        </div>
      `;
    },

    // ---- 操作方法 ----
    recordMood(mood) {
      const se = Storage.data.selfExploration;
      if (!se.self.emotions) se.self.emotions = [];
      const today = Storage.today();
      const idx = se.self.emotions.findIndex(e => e.date === today);
      if (idx >= 0) se.self.emotions[idx].mood = mood;
      else se.self.emotions.push({ date: today, mood });
      Storage.save();
      App.showToast(mood==='happy'?'😊 今天很开心':mood==='neutral'?'😐 平静的一天':'😢 记录下来了');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    addOOTD() {
      App.showModal('记录OOTD', `
        <div class="image-upload-area" onclick="document.getElementById('ootdImg').click()">
          <div class="upload-icon">📷</div>
          <div class="upload-text">上传OOTD照片</div>
        </div>
        <input type="file" id="ootdImg" accept="image/*" style="display:none;" onchange="Sections.selfExploration.handleImg(this,'ootd')">
        <div id="ootdPreview" class="image-preview-grid"></div>
        <input class="input-field mt-3" id="ootdNote" placeholder="穿搭备注（可选）">
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveOOTD()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    handleImg(input, type) {
      const f = input.files[0];
      if (!f) return;
      Storage.processImage(f, (id) => {
        // id 可以是 IndexedDB 图片ID（img_开头）或回退的 base64
        const previewEl = document.getElementById(type + 'Preview');
        if (previewEl) {
          previewEl.innerHTML = `<div class="image-preview"><img src="${id.startsWith('img_') ? '' : id}" ${id.startsWith('img_') ? `data-img-id="${id}"` : ''}></div>`;
          previewEl._imgData = id;
          // 如果是 IndexedDB ID，异步加载预览
          if (id.startsWith('img_')) {
            Storage.loadImage(id).then(src => {
              const imgEl = previewEl.querySelector('img');
              if (imgEl && src) imgEl.src = src;
            });
          }
        }
      });
    },

    saveOOTD() {
      const note = document.getElementById('ootdNote').value;
      const imgData = document.getElementById('ootdPreview')._imgData || '';
      Storage.data.selfExploration.self.appearance.ootd.push({ date: Storage.today(), note, img: imgData });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录OOTD');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    addClothes() {
      App.showModal('记录新购入衣服', `
        <div style="font-size:12px;color:var(--text-ink-muted);margin-bottom:8px;">粘贴淘宝/小红书/电商链接，自动解析信息</div>
        <input class="input-field" id="clothesLink" placeholder="粘贴商品链接">
        <button class="btn btn-outline mt-2" style="width:100%;" onclick="Sections.selfExploration.parseClothes()">🔍 解析链接</button>
        <div id="clothesResult" class="mt-3"></div>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveClothes()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    parseClothes() {
      const link = document.getElementById('clothesLink').value.trim();
      if (!link) { App.showToast('请先粘贴链接'); return; }
      document.getElementById('clothesResult').innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-ink-muted);">解析中...</div>';
      setTimeout(() => {
        document.getElementById('clothesResult').innerHTML = `
          <div style="color:var(--success);margin-bottom:8px;">✅ 已解析，请补充信息</div>
          <input class="input-field" id="clothesName" placeholder="衣服名称" value="">
          <input class="input-field mt-2" id="clothesPrice" type="number" placeholder="价格 (元)">
          <select class="input-field mt-2" id="clothesCat">
            <option value="上衣">上衣</option>
            <option value="下装">下装</option>
            <option value="外套">外套</option>
            <option value="配饰">配饰</option>
            <option value="鞋履">鞋履</option>
            <option value="连衣裙">连衣裙</option>
            <option value="其他">其他</option>
          </select>
          <input type="hidden" id="clothesLinkVal" value="${link}">
        `;
      }, 800);
    },

    saveClothes() {
      const name = document.getElementById('clothesName')?.value || '未命名';
      const price = document.getElementById('clothesPrice')?.value || '';
      const cat = document.getElementById('clothesCat')?.value || '上衣';
      const link = document.getElementById('clothesLinkVal')?.value || '';
      Storage.data.selfExploration.self.appearance.clothes.push({ id: 'cl-' + Date.now(), date: Storage.today(), name, price, cat, link });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录到「' + cat + '」分类');
      App.refresh();
    },

    viewClothes(id) {
      const item = Storage.data.selfExploration.self.appearance.clothes.find(c => (c.id||c.date) === id);
      if (!item) return;
      App.showModal(item.name || '衣服详情', `
        <div class="bm-detail-info">
          <div class="bm-detail-row"><span class="bm-detail-label">分类</span><span>${item.cat}</span></div>
          <div class="bm-detail-row"><span class="bm-detail-label">价格</span><span>${item.price ? '¥' + item.price : '未填写'}</span></div>
          <div class="bm-detail-row"><span class="bm-detail-label">购入日期</span><span>${item.date}</span></div>
          ${item.link ? `<div class="bm-detail-row"><span class="bm-detail-label">链接</span><span style="word-break:break-all;font-size:11px;">${item.link}</span></div>` : ''}
        </div>
        <div class="flex gap-3 mt-4">
          ${item.link ? `<button class="btn btn-outline flex-1" onclick="App.openExternal('${item.link}')">查看原链接</button>` : ''}
          <button class="btn btn-outline" onclick="App.closeModal()">关闭</button>
        </div>
      `);
    },

    addHair() {
      App.showModal('记录发型', `
        <div class="image-upload-area" onclick="document.getElementById('hairImg').click()">
          <div class="upload-icon">📷</div>
          <div class="upload-text">上传发型照片（可选）</div>
        </div>
        <input type="file" id="hairImg" accept="image/*" style="display:none;" onchange="Sections.selfExploration.handleImg(this,'hair')">
        <div id="hairPreview" class="image-preview-grid"></div>
        <input class="input-field mt-3" id="hairDesc" placeholder="发型描述（如：法式卷发、高马尾）">
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveHair()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveHair() {
      const desc = document.getElementById('hairDesc').value;
      const imgData = document.getElementById('hairPreview')._imgData || '';
      Storage.data.selfExploration.self.appearance.hair.push({ date: Storage.today(), desc, img: imgData });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录发型');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    addWeight() {
      const lastWeight = Storage.data.selfExploration.self.appearance.weight.slice(-1)[0];
      App.showModal('记录体重', `
        <input class="input-field" id="weightVal" type="number" step="0.1" placeholder="体重 (kg)" value="${lastWeight?lastWeight.value:''}">
        ${lastWeight ? `<div style="font-size:12px;color:var(--text-ink-muted);margin-top:6px;">上次记录：${lastWeight.value}kg (${lastWeight.date})</div>` : ''}
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveWeight()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveWeight() {
      const v = parseFloat(document.getElementById('weightVal').value);
      if (!v) { App.showToast('请输入体重'); return; }
      Storage.data.selfExploration.self.appearance.weight.push({ date: Storage.today(), value: v });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录体重');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    toggleDaily(icon, name) {
      if (name === '自定义') {
        this.addDailyCustom();
        return;
      }
      const se = Storage.data.selfExploration;
      const today = Storage.today();
      if (!se.daily) se.daily = [];
      // 检查今天是否已记录此类型
      const idx = se.daily.findIndex(d => d.date === today && d.name === name);
      if (idx >= 0) {
        // 已记录 → 取消（移除）
        se.daily.splice(idx, 1);
        Storage.save();
        App.showToast(`已取消 ${icon} ${name}`);
        App.refresh();
      } else {
        // 未记录 → 弹出上传照片+记录
        this.addDailyWithPhoto(icon, name);
      }
    },

    addDailyWithPhoto(icon, name) {
      App.showModal(`${icon} ${name}`, `
        <div class="image-upload-area" onclick="document.getElementById('dailyImg').click()">
          <div class="upload-icon">📷</div>
          <div class="upload-text">上传照片（可选）</div>
        </div>
        <input type="file" id="dailyImg" accept="image/*" style="display:none;" onchange="Sections.selfExploration.handleImg(this,'daily')">
        <div id="dailyPreview" class="image-preview-grid"></div>
        <input class="input-field mt-3" id="dailyNote" placeholder="备注（可选）">
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveDailyWithPhoto('${icon}','${name}')">记录</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveDailyWithPhoto(icon, name) {
      const note = document.getElementById('dailyNote').value;
      const imgData = document.getElementById('dailyPreview')._imgData || '';
      Storage.data.selfExploration.daily.push({ date: Storage.today(), icon, name, text: note, img: imgData });
      Storage.save();
      App.closeModal();
      App.showToast(`✅ ${icon} ${name}`);
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    addDailyCustom() {
      App.showModal('自定义日常记录', `
        <div class="flex gap-2 mb-3">
          <input class="input-field" id="dailyCustomName" placeholder="记录内容（如：看了一场电影）" autofocus style="flex:2;">
          <select class="input-field" id="dailyCustomIcon" style="flex:1;">
            <option value="📝">📝</option>
            <option value="🎉">🎉</option>
            <option value="☕">☕</option>
            <option value="🎬">🎬</option>
            <option value="🎵">🎵</option>
            <option value="💪">💪</option>
            <option value="🧘">🧘</option>
            <option value="✈️">✈️</option>
          </select>
        </div>
        <textarea class="input-field" id="dailyText" rows="3" placeholder="详细描述（可选）"></textarea>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveDailyCustom()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveDailyCustom() {
      const name = document.getElementById('dailyCustomName').value.trim();
      const icon = document.getElementById('dailyCustomIcon').value;
      const text = document.getElementById('dailyText').value;
      if (!name) { App.showToast('请输入记录内容'); return; }
      Storage.data.selfExploration.daily.push({ date: Storage.today(), icon, name, text });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    addSkill() {
      App.showModal('记录新技能', `
        <input class="input-field" id="skillName" placeholder="技能名称（如：学会了视频剪辑）" autofocus>
        <select class="input-field mt-3" id="skillLevel">
          <option value="入门">入门 - 刚学会基础</option>
          <option value="熟练">熟练 - 能独立完成</option>
          <option value="精通">精通 - 可以教别人</option>
        </select>
        <textarea class="input-field mt-3" id="skillNote" rows="3" placeholder="学习心得（可选）"></textarea>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveSkill()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveSkill() {
      const name = document.getElementById('skillName').value.trim();
      if (!name) { App.showToast('请输入技能名称'); return; }
      const level = document.getElementById('skillLevel').value;
      const note = document.getElementById('skillNote').value;
      Storage.data.selfExploration.self.skills.push({ date: Storage.today(), name, level, note });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 技能已记录');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    recordPeriod(date) {
      App.showModal('记录生理期', `
        <input class="input-field" id="periodDate" type="date" value="${date || Storage.today()}">
        <select class="input-field mt-3" id="periodFlow">
          <option value="量少">量少</option>
          <option value="量中">量中</option>
          <option value="量多">量多</option>
        </select>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.savePeriod()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    savePeriod() {
      Storage.data.selfExploration.period.records.push({ date: document.getElementById('periodDate').value, flow: document.getElementById('periodFlow').value });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录');
      App.refresh();
    },

    recordFinance() {
      App.showModal('记一笔', `
        <div class="fin-type-toggle" id="finTypeToggle">
          <button type="button" class="fin-type-btn active" data-type="expense" onclick="Sections.selfExploration.setFinType('expense',this)">支出</button>
          <button type="button" class="fin-type-btn" data-type="income" onclick="Sections.selfExploration.setFinType('income',this)">收入</button>
        </div>
        <input class="input-field mt-3" id="finAmount" type="number" placeholder="金额 (元)">
        <select class="input-field mt-3" id="finCat">
          <option value="餐饮">餐饮</option>
          <option value="交通">交通</option>
          <option value="购物">购物</option>
          <option value="娱乐">娱乐</option>
          <option value="居家">居家</option>
          <option value="工资">工资</option>
          <option value="理财">理财</option>
          <option value="其他">其他</option>
        </select>
        <input class="input-field mt-3" id="finNote" placeholder="备注（可选）">
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveFinance()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    setFinType(type, btn) {
      document.querySelectorAll('#finTypeToggle .fin-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn._finType = type;
      const el = document.getElementById('finTypeToggle');
      if (el) el.dataset.type = type;
    },

    saveFinance() {
      const a = parseFloat(document.getElementById('finAmount').value);
      if (!a || a <= 0) { App.showToast('请输入有效金额'); return; }
      const tgl = document.getElementById('finTypeToggle');
      const type = (tgl && tgl.dataset.type === 'income') ? 'income' : 'expense';
      Storage.data.selfExploration.finance.push({ date: Storage.today(), amount: a, cat: document.getElementById('finCat').value, note: document.getElementById('finNote').value, type });
      Storage.save();
      App.closeModal();
      App.showToast(type === 'income' ? '✅ 已记录收入' : '✅ 已记录支出');
      App.refresh();
    },

    exportFinanceCSV() {
      const finance = Storage.data.selfExploration.finance || [];
      if (finance.length === 0) { App.showToast('暂无财务数据可导出'); return; }
      const header = ['日期', '类型', '分类', '金额', '备注'];
      const rows = finance.slice().sort((a,b) => a.date < b.date ? -1 : 1).map(f => [
        f.date, f.type === 'income' ? '收入' : '支出', f.cat || '', (f.amount||0).toFixed(2), f.note || ''
      ]);
      const csv = [header, ...rows].map(r => r.map(c => {
        const s = String(c).replace(/"/g, '""');
        return /[",\n]/.test(s) ? '"' + s + '"' : s;
      }).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '月夕财务_' + Storage.today() + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      App.showToast('✅ CSV 已导出');
    },

    addJournal() {
      App.showModal('写手账', `
        <input class="input-field" id="journalTitle" placeholder="标题">
        <textarea class="input-field mt-3" id="journalContent" rows="6" placeholder="今天的故事..."></textarea>
        <div class="image-upload-area mt-3" onclick="document.getElementById('journalImg').click()">
          <div class="upload-icon">📷</div>
          <div class="upload-text">添加手账照片</div>
        </div>
        <input type="file" id="journalImg" accept="image/*" style="display:none;" onchange="Sections.selfExploration.handleImg(this,'journal')">
        <div id="journalPreview" class="image-preview-grid"></div>
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveJournal()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveJournal() {
      const t = document.getElementById('journalTitle').value.trim();
      if (!t) { App.showToast('请输入标题'); return; }
      const imgData = document.getElementById('journalPreview')?._imgData || '';
      Storage.data.selfExploration.journal.entries.push({ id: 'j-' + Date.now(), title: t, content: document.getElementById('journalContent').value, date: Storage.today(), img: imgData });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 手账已保存');
      App.triggerAutoCheckin('完成学习记录');
      App.refresh();
    },

    viewJournal(id) {
      const e = Storage.data.selfExploration.journal.entries.find(j => j.id === id);
      if (!e) return;
      const imgHtml = e.img ? (e.img.startsWith('img_') ? `<img data-img-id="${e.img}" src="" style="width:100%;border-radius:8px;margin-top:8px;">` : `<img src="${e.img}" style="width:100%;border-radius:8px;margin-top:8px;">`) : '';
      App.showModal(e.title, `<div style="color:var(--text-ink-muted);font-size:12px;margin-bottom:8px;">${e.date}</div><div style="line-height:1.8;white-space:pre-wrap;">${e.content || ''}</div>${imgHtml}`);
      if (e.img && e.img.startsWith('img_')) {
        Storage.loadImage(e.img).then(src => {
          const el = document.querySelector('.modal-body img[data-img-id]');
          if (el && src) el.src = src;
        });
      }
    }
  },

  // ==================== 发现 ====================
  discover: {
    /* ── 真实数据源 ──────────────────────────────────
       新闻 / AI / 股市 / 书影 全部来自 data/feeds.json，
       由 GitHub Actions 在服务端定时抓取（无 CORS 问题）。
       前端只负责读取 + 兜底，见 js/datasource.js。 */

    // 刷新（手动）
    refreshFeeds(btnId) {
      if (window.DataSource) DataSource.refresh(btnId);
    },

    // 打开板块时后台拉取最新 data/feeds.json：仅当服务端数据比内存中的更新时才原地重绘，
    // 这样点开「发现」即显示最新内容，无需再手动点刷新。
    _autoRefresh() {
      if (!window.DataSource) return;
      const before = (DataSource.raw && DataSource.raw.updatedAt) || '';
      DataSource.load(true).then(() => {
        const after = (DataSource.raw && DataSource.raw.updatedAt) || '';
        if (after && after !== before) this._repaint();
      }).catch(() => {});
    },

    // 把四个子面板的内容原地重绘为最新数据（不重载整页、不重置已选子标签）
    _repaint() {
      const map = {
        discoverNewsBody: () => this.renderNews(),
        discoverAIBody: () => this.renderAIFrontier(),
        discoverStockBody: () => this.renderStockInfo(),
        discoverReleaseBody: () => this.renderNewReleases(),
      };
      Object.keys(map).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = map[id]();
      });
    },

    render() {
      const html = `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--gold);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8l-4 8-4-4 8-4z"/></svg></span>发现</div>
          <div class="section-subtitle">探索更广阔的世界</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="discoverNews" onclick="App.bindSubTabs(this)">新闻时事</button>
          <button class="sub-tab" data-panel="discoverAI" onclick="App.bindSubTabs(this)">AI前沿</button>
          <button class="sub-tab" data-panel="discoverStock" onclick="App.bindSubTabs(this)">股市信息</button>
          <button class="sub-tab" data-panel="discoverRelease" onclick="App.bindSubTabs(this)">书影上新</button>
        </div>

        <div class="sub-panel" id="discoverNews">
          <div class="card">
            <div class="card-title"><span class="card-title-bar"></span>新闻时事<button class="btn btn-outline" id="refreshNewsBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshFeeds('refreshNewsBtn')">刷新</button></div>
            <div id="discoverNewsBody">${this.renderNews()}</div>
          </div>
        </div>

        <div class="sub-panel" id="discoverAI" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--haze-blue);"></span>AI前沿<button class="btn btn-outline" id="refreshAIBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshFeeds('refreshAIBtn')">刷新</button></div>
            <div id="discoverAIBody">${this.renderAIFrontier()}</div>
          </div>
        </div>

        <div class="sub-panel" id="discoverStock" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>股市信息<button class="btn btn-outline" id="refreshStockBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshFeeds('refreshStockBtn')">刷新</button></div>
            <div id="discoverStockBody">${this.renderStockInfo()}</div>
          </div>
        </div>

        <div class="sub-panel" id="discoverRelease" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>书影上新<button class="btn btn-outline" id="refreshReleaseBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshFeeds('refreshReleaseBtn')">刷新</button></div>
            <div id="discoverReleaseBody">${this.renderNewReleases()}</div>
          </div>
        </div>
      `;
      // 打开「发现」时后台拉取最新 data/feeds.json；若服务端数据已更新，原地重绘四个子面板（无需手动刷新）
      if (window.DataSource) setTimeout(() => this._autoRefresh(), 0);
      return html;
    },

    newsData: [
      { title:'国务院发布稳就业新政策：支持灵活就业与新业态', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'央行宣布降准0.5个百分点，释放长期资金约1万亿', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'2026年上半年GDP数据公布：同比增长5.3%', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'教育部：新学期起全面推行"双减2.0"政策', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'国产大飞机C939完成首次试飞，性能达国际领先', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'台风"杜苏芮"加强为超强台风，沿海多地发布预警', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'中国新能源汽车出口量上半年同比增长67%', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'医保新规：89种创新药纳入医保目录', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'全国高考改革新方案：2027年起实行"3+1+2"模式', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'嫦娥八号任务确定：将建立月球科研站基本型', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'楼市新政：多地取消限购，首付比例降至15%', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'2026年暑假旅游报告：出境游恢复至2019年120%', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'人工智能法草案二审：明确AI生成内容标注义务', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' },
      { title:'全国碳排放权交易市场扩容，纳入水泥等行业', source:'新华网', url:'https://www.news.cn/', date:'2026-07-27' },
      { title:'小米SU7 Ultra刷新纽北圈速纪录', source:'人民网', url:'https://www.people.com.cn/', date:'2026-07-27' }
    ],

    _formatRelative(isoStr) {
      if (!isoStr) return '';
      try {
        const diff = Date.now() - new Date(isoStr).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return '刚刚';
        if (min < 60) return min + ' 分钟前';
        const hr = Math.floor(min / 60);
        if (hr < 24) return hr + ' 小时前';
        const day = Math.floor(hr / 24);
        if (day < 7) return day + ' 天前';
        return new Date(isoStr).toLocaleDateString('zh-CN');
      } catch(e) { return ''; }
    },

    renderNews() {
      // 真实数据优先（data/feeds.json），无数据时回落到示例
      const live = window.DataSource ? DataSource.list('news') : [];
      const newsList = live.length ? live : this.newsData;
      const stamp = live.length && window.DataSource ? DataSource.stamp('news') : '';
      return stamp + newsList.map((n,i) => `
        <div class="news-list-item" onclick="App.openExternal('${n.url}')">
          <div class="news-list-num">${i+1}</div>
          <div class="news-list-content"><div class="news-list-title">${n.title}</div><div class="news-list-source">${n.source} · ${n.date}</div></div>
          ${actionButtons({section:'discover',title:n.title,summary:n.title,url:n.url,type:'news'})}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--text-ink-muted)" stroke-width="2" style="flex-shrink:0;"><path d="M9 18l6-6-6-6"/></svg>
        </div>`).join('');
    },

    aiFrontierData: [
      { title:'OpenAI GPT-5 Turbo 发布：推理速度提升5倍，价格降30%', source:'GitHub', url:'https://github.com/openai/openai-cookbook', date:'2026-07-27', summary:'GPT-5 Turbo采用稀疏注意力机制，在保持推理质量的前提下大幅降低计算成本。' },
      { title:'Anthropic Claude 4 支持500K上下文与深度思考模式', source:'GitHub', url:'https://github.com/anthropics/anthropic-cookbook', date:'2026-07-27', summary:'Claude 4扩展上下文至500K，新增深度思考链路处理复杂多步推理。' },
      { title:'Google Gemini 3 发布：原生支持视频理解与生成', source:'Google Blog', url:'https://blog.google/technology/ai/', date:'2026-07-27', summary:'Gemini 3实现原生视频理解与生成，支持实时视频对话。' },
      { title:'Meta 开源 Llama 4：405B参数，性能媲美GPT-5', source:'Meta AI', url:'https://ai.meta.com/blog/', date:'2026-07-27', summary:'Llama 4 405B开源模型在多项基准测试中接近GPT-5水平。' },
      { title:'Stable Diffusion 4 发布：8K高清图像生成', source:'Stability AI', url:'https://stability.ai/news', date:'2026-07-27', summary:'SD4支持8K分辨率图像生成，单张生成时间缩短至2秒。' },
      { title:'AI Agent 框架 LangChain 3.0 发布', source:'GitHub', url:'https://github.com/langchain-ai/langchain', date:'2026-07-27', summary:'LangChain 3.0引入可视化Agent构建器和多Agent协作系统。' },
      { title:'具身智能突破：Figure 03机器人实现全自主家务', source:'Figure AI', url:'https://www.figure.ai/', date:'2026-07-27', summary:'Figure 03人形机器人可自主完成做饭、清洁等复杂家务。' },
      { title:'AI编程助手 Cursor 2.0 支持全项目自动重构', source:'Cursor', url:'https://cursor.com/', date:'2026-07-27', summary:'Cursor 2.0可理解整个项目结构并自动执行大规模代码重构。' }
    ],

    renderAIFrontier() {
      const live = window.DataSource ? DataSource.list('ai') : [];
      const aiList = live.length ? live : this.aiFrontierData;
      const stamp = live.length && window.DataSource ? DataSource.stamp('ai') : '';
      return stamp + aiList.map(a => `
        <div class="ai-frontier-item">
          <div class="ai-frontier-header">
            <div class="ai-frontier-title">${a.title}</div>
            ${actionButtons({section:'discover',title:a.title,summary:a.summary||a.title,url:a.url,type:'ai'})}
          </div>
          <div class="ai-frontier-meta">${a.source || ''} ${a.date ? '· ' + a.date : ''}</div>
          ${a.summary ? `<div class="ai-frontier-summary">${a.summary}</div>` : ''}
          <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="ai-frontier-link">查看详情 →</a>
        </div>`).join('');
    },

    stockData: [
      { name:'上证指数', code:'000001', price:'3,287.65', change:'+1.23%', up:true },
      { name:'深证成指', code:'399001', price:'10,456.32', change:'+0.87%', up:true },
      { name:'创业板指', code:'399006', price:'2,156.78', change:'-0.32%', up:false },
      { name:'沪深300', code:'000300', price:'3,890.12', change:'+0.95%', up:true }
    ],

    renderStockInfo() {
      const live = window.DataSource ? DataSource.list('stock') : [];
      const list = live.length ? live : this.stockData;
      const stamp = live.length && window.DataSource
        ? `<div class="ds-stamp" style="text-align:center;">行情更新于 ${DataSource.relative(DataSource.updatedAt('stock'))}${DataSource.isStale('stock') ? '（源暂不可用，显示上次结果）' : ''}</div>`
        : '<div class="ds-stamp" style="text-align:center;">示例数据 · 联网后自动更新</div>';
      return `
        <div class="stock-grid">
          ${list.map(s => `
            <div class="stock-card ${s.up?'up':'down'}">
              <div class="stock-name">${s.name}</div>
              <div class="stock-price">${s.price}</div>
              <div class="stock-change ${s.up?'up':'down'}">${s.up?'▲':'▼'} ${s.change}</div>
            </div>`).join('')}
        </div>
        ${stamp}
        <a href="https://finance.eastmoney.com/" target="_blank" rel="noopener noreferrer" class="btn btn-outline mt-2" style="width:100%;">查看更多行情</a>
      `;
    },

    newReleasesData: [
      { type:'book', title:'余华新作《文城2》出版', date:'2026-07-25', desc:'余华时隔五年推出长篇新著，延续《文城》故事线，探索民国时代的人性与命运。', url:'https://book.douban.com/' },
      { type:'media', title:'《三体》电影版全球上映', date:'2026-07-20', desc:'张艺谋执导的《三体》电影版全球同步上映，IMDb评分8.7，被誉为中国科幻电影里程碑。', url:'https://movie.douban.com/' },
      { type:'book', title:'残雪获2026年诺贝尔文学奖提名', date:'2026-07-22', desc:'中国作家残雪再次进入诺贝尔文学奖短名单，其作品以先锋实验风格著称。', url:'https://book.douban.com/' },
      { type:'media', title:'《长安三万里2》定档暑期', date:'2026-07-18', desc:'追光动画《长安三万里》续作定档，延续唐诗视觉化叙事，讲述杜甫的故事。', url:'https://movie.douban.com/' }
    ],

    renderNewReleases() {
      const live = window.DataSource ? DataSource.list('releases') : [];
      const relList = live.length ? live : this.newReleasesData;
      const stamp = live.length && window.DataSource ? DataSource.stamp('releases') : '';
      return stamp + relList.map(r => `
        <div class="release-item">
          <div class="release-type ${r.type||'book'}">${r.type==='media'||r.type==='movie'?'🎬影视':r.type==='book'?'📖新书':'📰资讯'}</div>
          <div class="release-content">
            <div class="release-title">${r.title}</div>
            <div class="release-date">${r.date || ''}</div>
            ${r.desc||r.summary ? `<div class="release-desc">${r.desc||r.summary}</div>` : ''}
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="release-link">了解更多 →</a>
          </div>
          ${actionButtons({section:'discover',title:r.title,summary:r.desc||r.summary||r.title,url:r.url,type:'release'})}
        </div>`).join('');
    }
  },

  // ==================== 我的（个人中心） ====================
  profile: {
    render() {
      const ck = Storage.data.checkin || {streak:0,totalDays:0};
      const favs = Storage.data.favorites || [];
      const settings = Storage.data.settings;

      // 统计
      const stats = this.calcStats();

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--haze-blue);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>我的</div>
          <div class="section-subtitle">数据分析 · 收藏 · 设置</div></div>
        </div>

        <!-- 打卡概览 -->
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar"></span>打卡概览</div>
          <div class="profile-stats-grid">
            <div class="profile-stat"><div class="profile-stat-num">${ck.streak}</div><div class="profile-stat-label">连续打卡</div></div>
            <div class="profile-stat"><div class="profile-stat-num">${ck.totalDays}</div><div class="profile-stat-label">累计天数</div></div>
            <div class="profile-stat"><div class="profile-stat-num">${favs.length}</div><div class="profile-stat-label">收藏内容</div></div>
          </div>
        </div>

        <!-- 学习统计 -->
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>学习统计</div>
          ${this.renderStats(stats)}
        </div>

        <!-- 优化建议 -->
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--success);"></span>优化建议</div>
          ${this.renderSuggestions(stats)}
        </div>

        <!-- 我的收藏 -->
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>我的收藏 (${favs.length})</div>
          ${favs.length > 0 ? this.renderFavorites(favs) : '<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-text">还没有收藏内容，在各板块点击收藏按钮即可收藏</div></div>'}
        </div>

        <!-- 设置入口 -->
        <div class="card">
          <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>应用设置</div>
          <div class="settings-link" onclick="Sections.profile.showSettings()">⚙️ 个性化设置</div>
          <div class="settings-link" onclick="App.exportData()">📤 导出数据</div>
          <div class="settings-link" onclick="Sections.profile.importData()">📥 导入数据</div>
        </div>
      `;
    },

    calcStats() {
      const today = Storage.today();
      // 雅思
      const ieltsData = Storage.getDayData('ielts', today);
      const ieltsDone = ['vocabulary','bbc','duolingo'].filter(k => ieltsData[k]?.done).length;
      // AI学习
      const aiData = Storage.getDayData('aiStudy', today);
      const aiDone = Object.keys(aiData.notes||{}).length;
      // 播客
      const podData = Storage.getDayData('podcast', today);
      const podDone = Object.keys(podData.notes||{}).length;
      // 自媒体
      const smData = Storage.getDayData('selfMedia', today);
      const smDone = Object.keys(smData.notes||{}).length;

      // 本周统计
      let weekDone = 0;
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate()-i);
        const ds = Storage.formatDate(d);
        const id = Storage.getDayData('ielts', ds);
        weekDone += ['vocabulary','bbc','duolingo'].filter(k => id[k]?.done).length;
      }

      return { ieltsDone, ieltsTotal:3, aiDone, podDone, smDone, weekDone };
    },

    renderStats(s) {
      return `
        <div class="stat-row"><span class="stat-label">📚 雅思学习</span><span class="stat-value">${s.ieltsDone}/${s.ieltsTotal} 今日完成</span></div>
        <div class="stat-row"><span class="stat-label">🤖 AI学习</span><span class="stat-value">${s.aiDone} 篇已学习</span></div>
        <div class="stat-row"><span class="stat-label">🎙️ 播客</span><span class="stat-value">${s.podDone} 篇已听</span></div>
        <div class="stat-row"><span class="stat-label">📸 自媒体</span><span class="stat-value">${s.smDone} 篇已读</span></div>
        <div class="stat-row" style="border-top:1px solid var(--border-light);padding-top:8px;margin-top:4px;"><span class="stat-label">📅 本周雅思</span><span class="stat-value">${s.weekDone} 项完成</span></div>
      `;
    },

    renderSuggestions(s) {
      const tips = [];
      if (s.ieltsDone < s.ieltsTotal) tips.push(`📌 雅思还有 ${s.ieltsTotal - s.ieltsDone} 项未完成，建议先完成单词学习`);
      if (s.aiDone === 0) tips.push('📌 今日AI学习还未开始，建议利用碎片时间阅读');
      if (s.weekDone < 14) tips.push('📌 本周雅思完成数偏低，建议每天至少完成2项');
      if (tips.length === 0) tips.push('🎉 今日学习状态很好，继续保持！');

      return tips.map(t => `<div class="suggestion-item">${t}</div>`).join('');
    },

    renderFavorites(favs) {
      const grouped = {};
      favs.forEach(f => {
        const cat = f.section || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
      });
      const catNames = {aiStudy:'AI学习',reading:'阅读',podcast:'播客',selfMedia:'自媒体',discover:'发现',ielts:'雅思'};
      return Object.entries(grouped).map(([cat, items]) => `
        <div class="fav-group">
          <div class="fav-group-title">${catNames[cat]||cat}</div>
          ${items.map(f => `
            <div class="fav-item">
              <div class="fav-item-content">
                <div class="fav-item-title">${f.title}</div>
                ${f.summary ? `<div class="fav-item-summary">${f.summary.slice(0,80)}...</div>` : ''}
                <div class="fav-item-date">${f.date}</div>
              </div>
              <div class="fav-item-actions">
                ${f.url ? `<a href="${f.url}" target="_blank" rel="noopener noreferrer" class="action-btn">→</a>` : ''}
                <button class="action-btn" onclick="App.toggleFavorite({title:'${f.title.replace(/'/g,"\\'")}'})" title="取消收藏">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                </button>
              </div>
            </div>`).join('')}
        </div>`).join('');
    },

    showSettings() {
      const s = Storage.data.settings;
      const p = s.personalization;
      App.showModal('个性化设置', `
        <div class="settings-group">
          <div class="settings-row"><span class="settings-label">主色调（秘色）</span>
            <div class="color-picker-row">${['#2E6F7E','#7B9EA8','#5B8C5A','#8B6F47','#6B5B95'].map(c=>`<div class="color-swatch ${p.primaryColor===c?'selected':''}" style="background:${c};" onclick="Sections.profile.setColor('primaryColor','${c}')"></div>`).join('')}</div>
          </div>
          <div class="settings-row"><span class="settings-label">金色强调</span>
            <div class="color-picker-row">${['#D4A847','#E8C547','#C04830','#5B8C5A'].map(c=>`<div class="color-swatch ${p.accentColor===c?'selected':''}" style="background:${c};" onclick="Sections.profile.setColor('accentColor','${c}')"></div>`).join('')}</div>
          </div>
          <div class="settings-row"><span class="settings-label">滇红色块</span>
            <div class="color-picker-row">${['#C04830','#D85A42','#8B0000','#B22222'].map(c=>`<div class="color-swatch ${p.accentRed===c?'selected':''}" style="background:${c};" onclick="Sections.profile.setColor('accentRed','${c}')"></div>`).join('')}</div>
          </div>
        </div>
        <div class="settings-row mt-3"><span class="settings-label">字体</span>
          <select class="font-select" onchange="Sections.profile.setFont(this.value)">
            <option value="default" ${p.fontFamily==='default'?'selected':''}>默认</option>
            <option value="serif" ${p.fontFamily==='serif'?'selected':''}>宋体</option>
            <option value="kai" ${p.fontFamily==='kai'?'selected':''}>楷体</option>
          </select>
        </div>
        <div class="settings-row mt-3"><span class="settings-label">字号</span>
          <select class="size-select" onchange="Sections.profile.setFontSize(this.value)">
            <option value="small" ${p.fontSize==='small'?'selected':''}>小</option>
            <option value="medium" ${p.fontSize==='medium'?'selected':''}>中</option>
            <option value="large" ${p.fontSize==='large'?'selected':''}>大</option>
          </select>
        </div>

        <div class="settings-group mt-3">
          <div class="settings-row"><span class="settings-label">底部标签（最多 5 个）</span></div>
          <div id="tabConfigList">${App.tabCfgRender()}</div>
          <div class="settings-row mt-2">
            <button type="button" class="btn btn-primary" onclick="App.applyTabConfig()">保存底部标签</button>
            <button type="button" class="btn btn-outline" onclick="App.resetTabConfig()">恢复默认</button>
          </div>
          <div class="card-hint">勾选固定在底部栏的板块，用 ↑↓ 调整顺序；「首页」默认固定。单手即可直达高频板块。</div>
        </div>

        <div class="settings-group mt-3">
          <div class="settings-row"><span class="settings-label">提醒（Web Push）</span>
            <span id="pushStatusText">${App.getPushStatus() ? '已开启' : '未开启'}</span>
          </div>
          <div class="settings-row">
            <button type="button" class="btn btn-primary" onclick="App.enablePush()">开启提醒</button>
            <button type="button" class="btn btn-outline" onclick="App.disablePush()">关闭</button>
          </div>
          <div class="card-hint">iOS 16.4+ 需先把「月夕」添加到主屏幕。真正推送需在服务端（Supabase Edge Function / Cloudflare Worker）配置发送端，参见 js/app.js 中 enablePush 的 TODO 注释。</div>
        </div>
      `);
    },

    setColor(type, color) {
      Storage.data.settings.personalization[type] = color;
      Storage.save();
      App.applyPersonalization();
      App.showToast('✅ 颜色已更新');
    },

    setFont(font) {
      Storage.data.settings.personalization.fontFamily = font;
      Storage.save();
      App.applyPersonalization();
      App.showToast('✅ 字体已更新');
    },

    setFontSize(size) {
      Storage.data.settings.personalization.fontSize = size;
      Storage.save();
      App.applyPersonalization();
      App.showToast('✅ 字号已更新');
    },

    importData() {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json';
      input.onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
          if (Storage.importData(ev.target.result)) { App.showToast('✅ 导入成功'); App.init(); }
          else App.showToast('❌ 导入失败');
        };
        r.readAsText(f);
      };
      input.click();
    }
  },

  // ==================== 公共方法 ====================
  toggleDateGroup(el) { el.parentElement.classList.toggle('collapsed'); }
};

/* 同 app.js：顶层 const 不会挂到 window 上，
   index.html 里的 `window.Sections && ...` 守卫需要这个显式赋值。 */
window.Sections = Sections;
