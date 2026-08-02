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

const Sections = {

  // ==================== 首页 ====================
  home: {
    expandedSection: null,

    render() {
      const checkedIn = Storage.isCheckedIn();
      const ck = Storage.data.checkin || {streak:0,totalDays:0};

      const sections = [
        { id:'ielts', name:'雅思学习', icon:'📚', color:'var(--haze-blue)',
          subSections: [
            {id:'vocabulary', name:'单词学习', target:'ielts'},
            {id:'dialogue', name:'英语对话', target:'ielts'},
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

      return `
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
            <div class="checkin-status">${checkedIn?'今日已自动打卡':'学习任意板块后将自动打卡'}</div>
          </div>
          <div class="checkin-flame">${ck.streak>=3?'🔥':''}</div>
        </div>

        <div class="home-sections-grid-v2">
          ${sections.map(s => this.renderProgressCardV2(s)).join('')}
          <div id="homeSubSections"></div>
        </div>
      `;
    },

    renderProgressCardV2(s) {
      let done = 0, total = 0;
      const td = Storage.getTodayData(s.id==='ai-study'?'aiStudy':s.id==='self-media'?'selfMedia':s.id==='self-exploration'?'selfExploration':s.id);

      if (s.id === 'ielts') {
        const tasks = ['vocabulary','dialogue','bbc','duolingo'];
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
        { key:'dialogue', name:'英语对话练习', desc:'跳转豆包英语智能体', url:'https://www.doubao.com/chat/' },
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
                    <button class="btn btn-primary journal-btn" id="journalPlayBtn" onclick="Sections.ielts.playJournalAudio()">▶ 播放听力</button>
                    <button class="btn btn-outline journal-btn" onclick="Sections.ielts.toggleOriginal()">📄 查看原文</button>
                    <button class="btn btn-outline journal-btn" onclick="Sections.ielts.toggleTranslation()">🌐 点击翻译</button>
                    <a href="${journalArticle.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline journal-btn">🔗 原文链接</a>
                  </div>
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
                <textarea class="task-review" placeholder="听力复盘：听懂了多少？哪些词没抓住？" oninput="Sections.ielts.saveReview('bbc',this.value)">${td[t.key]?.review||''}</textarea>
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
                <textarea class="task-review" placeholder="复盘：今天学到了什么？" oninput="Sections.ielts.saveReview('${t.key}',this.value)">${td[t.key]?.review||''}</textarea>
              </div>
            </div>`;
          }).join('')}
        </div>
        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map(d => this.renderHistory(d)).join('')}</div>` : ''}
      `;
    },

    renderHistory(date) {
      const d = Storage.getDayData('ielts', date);
      const names = {vocabulary:'单词学习',dialogue:'英语对话练习',bbc:'外刊听力',duolingo:'多邻国'};
      const done = Object.keys(names).filter(k => d[k]?.done).length;
      return `<div class="date-group collapsed" data-date="${date}">
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

    // 外刊听力：播放音频（使用浏览器语音合成）
    playJournalAudio() {
      const article = this.getDailyJournal();
      if (!article || !article.audioText) { App.showToast('暂无音频内容'); return; }
      
      if (!('speechSynthesis' in window)) {
        App.showToast('当前浏览器不支持语音播放');
        return;
      }
      
      // 停止正在播放的语音
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(article.audioText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      const playBtn = document.getElementById('journalPlayBtn');
      if (playBtn) {
        playBtn.innerHTML = '⏸ 播放中...';
        playBtn.onclick = () => { window.speechSynthesis.cancel(); playBtn.innerHTML = '▶ 播放听力'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); };
      }
      
      utterance.onend = () => {
        if (playBtn) { playBtn.innerHTML = '▶ 播放听力'; playBtn.onclick = () => Sections.ielts.playJournalAudio(); }
      };
      
      window.speechSynthesis.speak(utterance);
      App.showToast('🔊 开始播放');
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
      if (d[key].done) App.triggerAutoCheckin();
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
      // 优先使用动态RSS数据（来自发现板块的AI刷新），回退到静态示例
      const cachedAI = Storage.data.discover?.ai;
      const useDynamic = cachedAI && cachedAI.length > 0;
      const newsList = useDynamic ? cachedAI : (td.news || this.sampleNews);
      const kb = this.knowledgeBase;
      const aiUpdatedAt = Storage.data.discover?.aiUpdatedAt;

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
            <button class="btn btn-outline" id="refreshAiStudyBtn" style="font-size:11px;padding:2px 10px;" onclick="Sections.aiStudy.refresh()">🔄 刷新资讯</button>
            ${aiUpdatedAt ? `<span style="font-size:11px;color:var(--text-ink-muted);margin-left:8px;">更新于 ${Sections.discover._formatRelative(aiUpdatedAt)}</span>` : ''}
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

        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map(d => this.renderHistory(d)).join('')}</div>` : ''}
      `;
    },

    switchAiTab(tab, btn) {
      document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('aiNewsPanel').style.display = tab === 'news' ? '' : 'none';
      document.getElementById('aiKbPanel').style.display = tab === 'kb' ? '' : 'none';
    },

    renderNewsCard(news, td, isSimple) {
      // 简单模式：RSS数据只有 title/url/date/source/summary，无 highlights/oneLiner/resources
      if (isSimple) {
        const noteId = news.id || ('rss-' + (news.url || news.title).substring(0, 50));
        const note = td.notes?.[noteId] || {};
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
            <textarea class="task-review mt-3" placeholder="写下你的学习笔记..." oninput="Sections.aiStudy.saveNote('${noteId}',this.value)">${note.text||''}</textarea>
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
          <textarea class="task-review mt-3" placeholder="写下你的学习笔记..." oninput="Sections.aiStudy.saveNote('${news.id}',this.value)">${note.text||''}</textarea>
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
      if (val && val.trim()) App.triggerAutoCheckin();
    },

    renderHistory(date) {
      const d = Storage.getDayData('aiStudy', date);
      const news = d.news || [];
      const done = news.filter(n => d.notes?.[n.id]).length;
      return `<div class="date-group collapsed"><div class="date-group-header" onclick="Sections.toggleDateGroup(this)"><div class="date-group-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="date-group-toggle"><path d="M6 9l6 6 6-6"/></svg>${date}<span class="date-group-badge">${done}/${news.length||0}</span></div></div><div class="date-group-body">${news.map(n => `<div class="task-item ${d.notes?.[n.id]?'task-done':''}" style="margin-bottom:6px;"><div class="task-checkbox ${d.notes?.[n.id]?'checked':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div><div class="task-content"><div class="task-name">${n.title}</div>${d.notes?.[n.id]?.text?`<div class="task-meta">${d.notes[n.id].text}</div>`:''}</div></div>`).join('')}</div></div>`;
    },

    async refresh() {
      const btn = document.getElementById('refreshAiStudyBtn');
      if (btn) { btn.textContent = '⏳ 刷新中'; btn.disabled = true; }
      App.showToast('正在获取最新 AI 资讯...');
      try {
        // 复用发现板块的 AI RSS 刷新逻辑
        await Sections.discover.refreshAI();
      } catch(e) {
        App.showToast('⚠️ 刷新失败: ' + e.message);
      }
      if (btn) { btn.textContent = '🔄 刷新资讯'; btn.disabled = false; }
    }
  },

  // ==================== 阅读（书影+打卡+公众号+三联中读） ====================
  reading: {
    render() {
      const bm = Storage.data.reading.bookMedia;
      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--earth);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></span>阅读</div>
          <div class="section-subtitle">书影 · 打卡 · 公众号 · 三联中读</div></div>
          <div class="flex gap-2">
            <button class="btn btn-outline" onclick="Sections.reading.addBookMedia('book')">+ 书籍</button>
            <button class="btn btn-outline" onclick="Sections.reading.addBookMedia('media')">+ 影视</button>
          </div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="readingBookMedia" onclick="App.bindSubTabs(this)">书影</button>
          <button class="sub-tab" data-panel="readingGzh" onclick="App.bindSubTabs(this)">公众号精选</button>
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
            <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>书影打卡</div>
            ${this.renderCheckinCalendar()}
          </div>
        </div>

        <div class="sub-panel" id="readingGzh" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>公众号精选</div>
            <div class="gzh-tabs">
              <button class="gzh-tab active" onclick="Sections.reading.switchGzh('dandu',this)">单读</button>
              <button class="gzh-tab" onclick="Sections.reading.switchGzh('kyx',this)">KnowYourself</button>
              <button class="gzh-tab" onclick="Sections.reading.switchGzh('heytea',this)">喜茶</button>
            </div>
            <div id="gzhContent">${this.renderGzhArticles('dandu')}</div>
          </div>
        </div>

        <div class="sub-panel" id="readingSanlian" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>三联中读 · 每周精选</div>
            ${this.renderSanlianArticles()}
          </div>
        </div>
      `;
    },

    switchReadingTab(tab, btn) {
      document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('readingBookMedia').style.display = tab === 'bookmedia' ? '' : 'none';
      document.getElementById('readingGzh').style.display = tab === 'gzh' ? '' : 'none';
      document.getElementById('readingSanlian').style.display = tab === 'sanlian' ? '' : 'none';
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
      return this.sanlianData.map(a => `
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

    renderGzhArticles(account) {
      const articles = this.gzhData[account] || [];
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
    followedPodcasts: ['高能量','文化有限','贤者时间','面基','大内密谈'],

    // 小宇宙热榜前5
    hotList: [
      { id:'pc-001', title:'聊聊2026下半年的AI趋势：从GPT-5到具身智能', podcaster:'硅谷101', duration:'58分', date:'2026-07-27',
        summary:'主播邀请AI领域投资人深度对谈，从GPT-5 Turbo发布聊到具身智能赛道，分析下半年最值得关注的三个AI方向：多模态Agent、AI硬件、垂直行业模型。',
        url:'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent('硅谷101') },
      { id:'pc-002', title:'我做自媒体三年赚了多少？全网最真实分享', podcaster:'半佛仙人', duration:'42分', date:'2026-07-27',
        summary:'半佛仙人首次公开自媒体收入结构和运营策略，从内容选题到变现路径全面拆解，对想做自媒体的人极具参考价值。',
        url:'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent('半佛仙人') },
      { id:'pc-003', title:'35岁被裁后，我开了一家年入百万的小店', podcaster:'故事FM', duration:'36分', date:'2026-07-26',
        summary:'一位前互联网大厂员工分享被裁后创业的真实经历，从选址到经营，从心理调适到财务规划，故事真实动人。',
        url:'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent('故事FM') },
      { id:'pc-004', title:'为什么年轻人开始流行"数字游民"？', podcaster:'忽左忽右', duration:'48分', date:'2026-07-26',
        summary:'探讨数字游民生活方式的兴起原因，从远程办公普及到价值观变迁，分析了这种生活方式的利弊和适合人群。',
        url:'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent('忽左忽右') },
      { id:'pc-005', title:'2026年中国消费趋势报告：5个值得关注的变化', podcaster:'商业就是这样', duration:'32分', date:'2026-07-26',
        summary:'基于最新消费数据，分析2026年中国消费市场的五大趋势：理性消费回归、国货持续崛起、体验经济升温、银发经济爆发、情绪价值定价。',
        url:'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent('商业就是这样') }
    ],

    render() {
      const today = Storage.today();
      const td = Storage.getDayData('podcast', today);
      const hist = Storage.getHistoryDates('podcast').filter(d => d !== today);

      // 根据关注列表生成关注更新
      const followList = this.followedPodcasts.map((name, i) => ({
        id: 'pc-follow-' + i,
        title: this._getFollowTitle(name),
        podcaster: name,
        duration: '30-50分',
        date: '2026-07-27',
        summary: this._getFollowSummary(name),
        url: 'https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent(name)
      }));

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:#7B3FF2;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg></span>播客</div>
          <div class="section-subtitle">本周精选 · 小宇宙</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="podcastHot" onclick="App.bindSubTabs(this)">小宇宙热榜</button>
          <button class="sub-tab" data-panel="podcastFollow" onclick="App.bindSubTabs(this)">我的关注</button>
        </div>

        <div id="podcastHot" class="sub-panel">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar" style="background:#7B3FF2;"></span>热榜 Top 5</div>
            ${this.hotList.map((p,i) => this.renderPodcastCard(p, td, i+1)).join('')}
          </div>
        </div>

        <div id="podcastFollow" class="sub-panel" style="display:none;">
          <div class="card mb-4">
            <div class="card-title">
              <span class="card-title-bar" style="background:var(--gold);"></span>关注更新
              <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.podcast.editFollowed()">编辑关注</button>
            </div>
            ${followList.map(p => this.renderPodcastCard(p, td)).join('')}
          </div>
        </div>

        ${hist.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>历史记录</div>${hist.map(d => this.renderHistory(d)).join('')}</div>` : ''}
      `;
    },

    _getFollowTitle(name) {
      const titles = {
        '高能量': '关于精力管理，这是我试过最有效的方法',
        '文化有限': '读书笔记怎么做？我的三套笔记系统',
        '贤者时间': '一个人住的第5年：我学会了这些事',
        '面基': '投资入门：普通人如何构建自己的投资体系',
        '大内密谈': '周末闲聊：最近看的好书好剧好播客'
      };
      return titles[name] || name + ' 最新一期';
    },

    _getFollowSummary(name) {
      const summaries = {
        '高能量': '分享一套实用的精力管理系统，从睡眠优化到注意力管理，帮助你在高强度工作中保持持续高效。',
        '文化有限': '主播分享了三套互补的读书笔记系统：卡片笔记法、主题阅读法、费曼输出法，适合不同类型的阅读需求。',
        '贤者时间': '独居5年的生活感悟，从学会独处到享受孤独，从生活技能到心灵成长，温柔而真实。',
        '面基': '从资产配置到风险管理的系统讲解，适合投资新手建立正确的投资框架，避免常见陷阱。',
        '大内密谈': '轻松的周末闲聊节目，主播分享了近期推荐的书、剧和播客，是发现好内容的绝佳渠道。'
      };
      return summaries[name] || '关注播客最新更新内容。';
    },

    renderPodcastCard(p, td, rank) {
      const note = td.notes?.[p.id] || {};
      return `
        <div class="podcast-item ${note.text?'listened':''}">
          <div class="podcast-header">
            ${rank ? `<div class="podcast-rank">${rank}</div>` : `<div class="podcast-source">${p.podcaster}</div>`}
            <div class="podcast-main">
              <div class="podcast-title">${p.title}</div>
              <div class="podcast-meta">${p.podcaster} · ${p.duration} · ${p.date}</div>
            </div>
            ${actionButtons({section:'podcast',title:p.title,summary:p.summary,url:p.url,type:'podcast'})}
          </div>
          <div class="podcast-summary">${p.summary}</div>
          <div class="podcast-actions-row">
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="podcast-play-btn">在小宇宙中收听 →</a>
          </div>
          ${note.text ? `<div class="podcast-note">📝 ${note.text}</div>` : ''}
          <input class="podcast-note-input" placeholder="记笔记..." oninput="Sections.podcast.saveNote('${p.id}',this.value)" value="${note.text||''}">
        </div>`;
    },

    editFollowed() {
      const current = this.followedPodcasts;
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
      this.followedPodcasts = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
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
      if (val && val.trim()) App.triggerAutoCheckin();
    },

    renderHistory(date) {
      const d = Storage.getDayData('podcast', date);
      const list = d.list || [];
      return `<div class="date-group collapsed"><div class="date-group-header" onclick="Sections.toggleDateGroup(this)"><div class="date-group-title"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="date-group-toggle"><path d="M6 9l6 6 6-6"/></svg>${date}<span class="date-group-badge">${list.length}篇</span></div></div><div class="date-group-body">${list.map(p => `<div class="podcast-item"><div class="podcast-header"><div class="podcast-main"><div class="podcast-title">${p.title}</div><div class="podcast-meta">${p.podcaster} · ${p.date}</div></div></div><div class="podcast-summary">${p.summary}</div></div>`).join('')}</div></div>`;
    }
  },

  // ==================== 自媒体 ====================
  selfMedia: {
    sampleRecos: [
      { id:'sm-001', title:'阴天拍人像？这5个光线技巧让画面更有质感', platform:'小红书', date:'2026-07-27',
        url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('阴天人像摄影'),
        summary:'详细讲解阴天环境下的人像拍摄技巧，包括利用自然散射光、反光板补光、后期调色方案。适合户外人像摄影爱好者。' },
      { id:'sm-002', title:'只用一盏灯拍出电影感人像｜附完整布光图', platform:'小红书', date:'2026-07-27',
        url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('电影感人像布光'),
        summary:'单灯布光教程，从灯位角度到色温控制，手把手教你用最简单的设备拍出电影级画面。附完整布光示意图。' }
    ],

    inspirations: [
      { id:'in-001', title:'夏日清凉感穿搭：白T+牛仔裤的10种穿法', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('夏日穿搭') },
      { id:'in-002', title:'一个人在咖啡馆拍照的9个姿势', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('咖啡馆拍照姿势') },
      { id:'in-003', title:'15秒短视频脚本模板：开箱测评类', source:'抖音热门', url:'https://www.douyin.com/search/' + encodeURIComponent('开箱测评脚本') },
      { id:'in-004', title:'如何拍出高级感美食照片？附修图参数', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('美食摄影技巧') },
      { id:'in-005', title:'vlog选题灵感：记录普通人的一天', source:'抖音热门', url:'https://www.douyin.com/search/' + encodeURIComponent('vlog选题') },
      { id:'in-006', title:'夏日饮品测评脚本：从拍摄到剪辑全流程', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('饮品测评') },
      { id:'in-007', title:'居家拍照背景布置方案：小空间也能出大片', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('居家拍照布置') },
      { id:'in-008', title:'情侣合照创意pose：自然不尴尬的拍摄技巧', source:'抖音热门', url:'https://www.douyin.com/search/' + encodeURIComponent('情侣合照') },
      { id:'in-009', title:'旅行vlog如何拍出电影感？构图+调色全攻略', source:'小红书热榜', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('旅行vlog电影感') },
      { id:'in-010', title:'30秒教你用手机拍出虚化背景人像', source:'抖音热门', url:'https://www.douyin.com/search/' + encodeURIComponent('手机虚化人像') }
    ],

    aesthetics: [
      { id:'ae-001', title:'极简日系人像', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('日系人像'), desc:'干净的光影、克制的色调，日系人像的美学精髓' },
      { id:'ae-002', title:'胶片质感街拍', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('胶片街拍'), desc:'胶片色彩与街头光影的完美结合' },
      { id:'ae-003', title:'电影感美食布光', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('电影感美食'), desc:'暗调美食摄影的高级感营造' },
      { id:'ae-004', title:'自然光人像合集', url:'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent('自然光人像'), desc:'不同时段自然光的人像效果对比' }
    ],

    render() {
      const today = Storage.today();
      const td = Storage.getDayData('selfMedia', today);
      const recos = td.recos || this.sampleRecos;

      return `
        <div class="section-header">
          <div><div class="section-title"><span class="section-title-icon" style="background:var(--red);"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z"/></svg></span>自媒体</div>
          <div class="section-subtitle">推荐 · 灵感 · 审美</div></div>
        </div>

        <div class="sub-tabs-bar">
          <button class="sub-tab active" data-panel="smReco" onclick="App.bindSubTabs(this)">今日推荐</button>
          <button class="sub-tab" data-panel="smInspiration" onclick="App.bindSubTabs(this)">今日灵感</button>
          <button class="sub-tab" data-panel="smAesthetic" onclick="App.bindSubTabs(this)">审美搭建</button>
        </div>

        <div id="smReco" class="sub-panel">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar"></span>今日推荐</div>
            ${recos.map(r => this.renderRecoCard(r, td)).join('')}
          </div>
        </div>

        <div id="smInspiration" class="sub-panel" style="display:none;">
          <div class="card mb-4">
            <div class="card-title"><span class="card-title-bar" style="background:var(--gold);"></span>今日灵感 · 十大选题</div>
            ${this.inspirations.map((ins,i) => `
              <div class="inspiration-item">
                <div class="inspiration-rank">${i+1}</div>
                <div class="inspiration-content">
                  <div class="inspiration-title">${ins.title}</div>
                  <div class="inspiration-source">${ins.source}</div>
                </div>
                <div class="item-actions">
                  <a href="${ins.url}" target="_blank" rel="noopener noreferrer" class="action-btn">→</a>
                  ${actionButtons({section:'selfMedia',title:ins.title,summary:'灵感选题',url:ins.url,type:'inspiration'})}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div id="smAesthetic" class="sub-panel" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:#7B3FF2;"></span>审美搭建</div>
            <div class="aesthetics-grid">
              ${this.aesthetics.map(ae => `
                <div class="aesthetic-card" onclick="App.openExternal('${ae.url}')">
                  <div class="aesthetic-placeholder">
                    <div style="font-size:32px;">🎨</div>
                    <div style="font-size:11px;color:var(--text-ink-muted);margin-top:4px;">点击查看</div>
                  </div>
                  <div class="aesthetic-info">
                    <div class="aesthetic-title">${ae.title}</div>
                    <div class="aesthetic-desc">${ae.desc}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderRecoCard(r, td) {
      const note = td.notes?.[r.id] || {};
      return `
        <div class="reco-item">
          <div class="reco-header">
            <div class="reco-platform">${r.platform}</div>
            <div class="reco-date">${r.date}</div>
            ${actionButtons({section:'selfMedia',title:r.title,summary:r.summary,url:r.url,type:'reco'})}
          </div>
          <div class="reco-title">${r.title}</div>
          <div class="reco-summary">${r.summary}</div>
          <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="reco-link">查看原内容 →</a>
          ${note.text ? `<div class="reco-note">📝 ${note.text}</div>` : ''}
        </div>`;
    }
  },

  // ==================== 自我探索 ====================
  selfExploration: {
    render() {
      const today = Storage.today();
      const se = Storage.data.selfExploration;

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
      const records = se.period.records || [];
      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>生理期记录
            <button class="btn btn-outline" style="font-size:11px;padding:2px 8px;margin-left:auto;" onclick="Sections.selfExploration.recordPeriod()">+ 记录</button>
          </div>
          ${records.length > 0 ? records.slice().reverse().slice(0, 6).map(r => `<div class="se-period-item"><span class="se-period-dot" style="background:${r.flow==='量多'?'var(--red)':r.flow==='量中'?'var(--gold)':'var(--earth-light)'};"></span><span class="se-period-date">${r.date}</span><span class="se-period-flow">${r.flow}</span></div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">🌸</div><div class="empty-state-text">点击记录生理期</div></div>'}
        </div>
      `;
    },

    // ---- 财务 ----
    renderFinanceTab(se, today) {
      const finance = se.finance || [];
      const todayFinance = finance.filter(f => f.date === today);
      const monthStr = today.slice(0,7);
      const monthFinance = finance.filter(f => f.date.startsWith(monthStr));
      const monthTotal = monthFinance.reduce((s,f) => s + (f.amount||0), 0);

      return `
        <div class="card mb-4">
          <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>本月支出</div>
          <div class="se-finance-total">¥${monthTotal.toFixed(2)}</div>
          <button class="btn btn-outline mt-2" style="width:100%;" onclick="Sections.selfExploration.recordFinance()">+ 记录消费</button>
        </div>
        ${monthFinance.length > 0 ? `<div class="card"><div class="card-title"><span class="card-title-bar"></span>本月明细 (${monthFinance.length})</div>${monthFinance.slice().reverse().map(f => `<div class="se-finance-item"><span class="se-finance-cat">${f.cat}</span><div class="se-finance-info"><div class="se-finance-amount">¥${f.amount.toFixed(2)}</div>${f.note?`<div class="se-finance-note">${f.note}</div>`:''}<div class="se-finance-date">${f.date}</div></div></div>`).join('')}</div>` : ''}
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
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
      App.triggerAutoCheckin();
      App.refresh();
    },

    recordPeriod() {
      App.showModal('记录生理期', `
        <input class="input-field" id="periodDate" type="date" value="${Storage.today()}">
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
      App.showModal('记录消费', `
        <input class="input-field" id="finAmount" type="number" placeholder="金额 (元)">
        <select class="input-field mt-3" id="finCat">
          <option value="餐饮">餐饮</option>
          <option value="交通">交通</option>
          <option value="购物">购物</option>
          <option value="娱乐">娱乐</option>
          <option value="居家">居家</option>
          <option value="其他">其他</option>
        </select>
        <input class="input-field mt-3" id="finNote" placeholder="备注（可选）">
        <div class="flex gap-3 mt-4">
          <button class="btn btn-primary flex-1" onclick="Sections.selfExploration.saveFinance()">保存</button>
          <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
        </div>
      `);
    },

    saveFinance() {
      const a = parseFloat(document.getElementById('finAmount').value);
      if (!a || a <= 0) { App.showToast('请输入有效金额'); return; }
      Storage.data.selfExploration.finance.push({ date: Storage.today(), amount: a, cat: document.getElementById('finCat').value, note: document.getElementById('finNote').value });
      Storage.save();
      App.closeModal();
      App.showToast('✅ 已记录');
      App.refresh();
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
      App.triggerAutoCheckin();
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
    // RSS 源配置
    rssSources: {
      news: [
        { name: '中新网', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
        { name: '人民网', url: 'http://www.people.com.cn/rss/politics.xml' }
      ],
      ai: [
        { name: '量子位', url: 'https://www.qbitai.com/feed' },
        { name: '36氪', url: 'https://36kr.com/feed' }
      ],
      releases: [
        { name: '豆瓣电影', url: 'https://www.douban.com/feed/review/movie' },
        { name: 'letterboxd', url: 'https://letterboxd.com/susuu000/rss/' }
      ]
    },

    // 通过 rss2json 代理获取 RSS（解决 CORS）
    async fetchRSS(rssUrl) {
      const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.status !== 'ok' || !data.items) return [];
      return data.items.map(item => ({
        title: item.title || '',
        url: item.link || '',
        date: item.pubDate ? item.pubDate.split(' ')[0] : '',
        source: data.feed ? (data.feed.title || '') : '',
        summary: (item.description || '').replace(/<[^>]+>/g, '').substring(0, 200)
      }));
    },

    // 刷新新闻时事
    async refreshNews() {
      const btn = document.getElementById('refreshNewsBtn');
      if (btn) { btn.textContent = '⏳ 刷新中'; btn.disabled = true; }
      try {
        let allItems = [];
        for (const src of this.rssSources.news) {
          try {
            const items = await this.fetchRSS(src.url);
            allItems = allItems.concat(items.slice(0, 8));
          } catch(e) { console.log(src.name + ' RSS 获取失败:', e.message); }
        }
        if (allItems.length > 0) {
          if (!Storage.data.discover) Storage.data.discover = {};
          Storage.data.discover.news = allItems.slice(0, 15);
          Storage.data.discover.newsUpdatedAt = new Date().toISOString();
          Storage.save();
          App.showToast('✅ 新闻已更新');
        } else {
          App.showToast('⚠️ 暂时无法获取新闻，显示缓存内容');
        }
      } catch(e) {
        App.showToast('⚠️ 刷新失败: ' + e.message);
      }
      if (btn) { btn.textContent = '🔄 刷新'; btn.disabled = false; }
      App.refresh();
    },

    // 刷新 AI 前沿
    async refreshAI() {
      const btn = document.getElementById('refreshAIBtn');
      if (btn) { btn.textContent = '⏳ 刷新中'; btn.disabled = true; }
      try {
        let allItems = [];
        for (const src of this.rssSources.ai) {
          try {
            const items = await this.fetchRSS(src.url);
            allItems = allItems.concat(items.slice(0, 6));
          } catch(e) { console.log(src.name + ' RSS 获取失败:', e.message); }
        }
        if (allItems.length > 0) {
          if (!Storage.data.discover) Storage.data.discover = {};
          Storage.data.discover.ai = allItems.slice(0, 12);
          Storage.data.discover.aiUpdatedAt = new Date().toISOString();
          Storage.save();
          App.showToast('✅ AI资讯已更新');
        } else {
          App.showToast('⚠️ 暂时无法获取AI资讯');
        }
      } catch(e) {
        App.showToast('⚠️ 刷新失败: ' + e.message);
      }
      if (btn) { btn.textContent = '🔄 刷新'; btn.disabled = false; }
      App.refresh();
    },

    // 刷新书影上新
    async refreshReleases() {
      const btn = document.getElementById('refreshReleaseBtn');
      if (btn) { btn.textContent = '⏳ 刷新中'; btn.disabled = true; }
      try {
        let allItems = [];
        for (const src of this.rssSources.releases) {
          try {
            const items = await this.fetchRSS(src.url);
            allItems = allItems.concat(items.slice(0, 6));
          } catch(e) { console.log(src.name + ' RSS 获取失败:', e.message); }
        }
        if (allItems.length > 0) {
          if (!Storage.data.discover) Storage.data.discover = {};
          Storage.data.discover.releases = allItems.slice(0, 10);
          Storage.data.discover.releasesUpdatedAt = new Date().toISOString();
          Storage.save();
          App.showToast('✅ 书影已更新');
        } else {
          App.showToast('⚠️ 暂时无法获取书影资讯');
        }
      } catch(e) {
        App.showToast('⚠️ 刷新失败: ' + e.message);
      }
      if (btn) { btn.textContent = '🔄 刷新'; btn.disabled = false; }
      App.refresh();
    },

    // 首次打开自动拉取（每天一次）
    async autoFetchIfNeeded() {
      if (!Storage.data.discover) Storage.data.discover = {};
      const today = Storage.today();
      const lastFetch = Storage.data.discover.lastAutoFetch || '';
      if (lastFetch === today) return; // 今天已自动拉取
      Storage.data.discover.lastAutoFetch = today;
      // 异步拉取，不阻塞渲染
      this.refreshNews().catch(()=>{});
      this.refreshAI().catch(()=>{});
      this.refreshReleases().catch(()=>{});
    },

    render() {
      // 首次打开自动拉取
      this.autoFetchIfNeeded();

      return `
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
            <div class="card-title"><span class="card-title-bar"></span>新闻时事<button class="btn btn-outline" id="refreshNewsBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshNews()">🔄 刷新</button></div>
            ${this.renderNews()}
          </div>
        </div>

        <div class="sub-panel" id="discoverAI" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--haze-blue);"></span>AI前沿<button class="btn btn-outline" id="refreshAIBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshAI()">🔄 刷新</button></div>
            ${this.renderAIFrontier()}
          </div>
        </div>

        <div class="sub-panel" id="discoverStock" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--red);"></span>股市信息</div>
            ${this.renderStockInfo()}
          </div>
        </div>

        <div class="sub-panel" id="discoverRelease" style="display:none;">
          <div class="card">
            <div class="card-title"><span class="card-title-bar" style="background:var(--earth);"></span>书影上新<button class="btn btn-outline" id="refreshReleaseBtn" style="font-size:11px;padding:2px 10px;margin-left:auto;" onclick="Sections.discover.refreshReleases()">🔄 刷新</button></div>
            ${this.renderNewReleases()}
          </div>
        </div>
      `;
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
      // 优先使用云端/缓存的动态数据，回退到静态数据
      const cached = Storage.data.discover?.news;
      const newsList = (cached && cached.length > 0) ? cached : this.newsData;
      const updatedAt = Storage.data.discover?.newsUpdatedAt;
      return (updatedAt ? `<div style="font-size:11px;color:var(--text-ink-muted);margin-bottom:6px;">更新于 ${this._formatRelative(updatedAt)}</div>` : '') + newsList.map((n,i) => `
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
      // 优先使用动态RSS数据，回退到静态数据
      const cached = Storage.data.discover?.ai;
      const aiList = (cached && cached.length > 0) ? cached : this.aiFrontierData;
      const updatedAt = Storage.data.discover?.aiUpdatedAt;
      return (updatedAt ? `<div style="font-size:11px;color:var(--text-ink-muted);margin-bottom:6px;">更新于 ${this._formatRelative(updatedAt)}</div>` : '') + aiList.map(a => `
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
      return `
        <div class="stock-grid">
          ${this.stockData.map(s => `
            <div class="stock-card ${s.up?'up':'down'}">
              <div class="stock-name">${s.name}</div>
              <div class="stock-price">${s.price}</div>
              <div class="stock-change ${s.up?'up':'down'}">${s.up?'🔴':'🟢'} ${s.change}</div>
            </div>`).join('')}
        </div>
        <div style="text-align:center;padding:10px;color:var(--text-ink-muted);font-size:12px;">数据更新于 2026-07-27 15:00</div>
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
      // 优先使用动态RSS数据，回退到静态数据
      const cached = Storage.data.discover?.releases;
      const relList = (cached && cached.length > 0) ? cached : this.newReleasesData;
      const updatedAt = Storage.data.discover?.releasesUpdatedAt;
      return (updatedAt ? `<div style="font-size:11px;color:var(--text-ink-muted);margin-bottom:6px;">更新于 ${this._formatRelative(updatedAt)}</div>` : '') + relList.map(r => `
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
      const ieltsDone = ['vocabulary','dialogue','bbc','duolingo'].filter(k => ieltsData[k]?.done).length;
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
        weekDone += ['vocabulary','dialogue','bbc','duolingo'].filter(k => id[k]?.done).length;
      }

      return { ieltsDone, ieltsTotal:4, aiDone, podDone, smDone, weekDone };
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
