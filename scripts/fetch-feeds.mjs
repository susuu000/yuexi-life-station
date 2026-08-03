/**
 * 月夕生活台 · 真实数据源抓取脚本
 *
 * 在 GitHub Actions（服务端）运行，绕开浏览器 CORS 限制，
 * 抓取结果写入 data/feeds.json，前端同源读取。
 *
 * 设计原则：
 * 1. 零依赖（Node 18+ 原生 fetch / TextDecoder）
 * 2. 每个源独立容错，单源失败不影响整体
 * 3. 抓取失败时保留上一次的有效数据，绝不写入空数组
 * 4. 每个板块附带 updatedAt 与 sources 状态，前端可展示时效
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'data/feeds.json');

// 浏览器 UA 用于 JSON API；RSS 站点普遍带 WAF，浏览器 UA 反而会被 403（量子位实测），
// 因此 RSS 抓取统一使用朴素的阅读器 UA。
const UA_BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const UA_RSS = 'Mozilla/5.0 (compatible; RSSReader/1.0)';
const TIMEOUT = 15000;
const MAX_AGE_DAYS = 60; // 超过此天数的条目视为源已停更，丢弃

const report = [];

/* ============ 基础工具 ============ */

async function httpGet(url, { headers = {}, encoding = 'utf-8', ua = UA_BROWSER } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'User-Agent': ua, 'Accept-Language': 'zh-CN,zh;q=0.9', ...headers },
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    if (encoding === 'utf-8') return await res.text();
    const buf = await res.arrayBuffer();
    return new TextDecoder(encoding).decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

/** 抓取 RSS 并解析（自动使用阅读器 UA） */
async function getRSS(url, sourceName, opts = {}) {
  return parseRSS(await httpGet(url, { ua: UA_RSS }), sourceName, opts);
}

/** 过滤掉过于陈旧的条目——用于识别已停更的 RSS 源 */
function freshOnly(items, days = MAX_AGE_DAYS) {
  const cutoff = Date.now() - days * 86400000;
  return items.filter((x) => {
    if (!x.date) return true;
    const t = new Date(x.date).getTime();
    return isNaN(t) ? true : t >= cutoff;
  });
}

/** 极简 RSS/Atom 解析（无依赖） */
function parseRSS(xml, sourceName = '', opts = {}) {
  const items = [];
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) || [];
  for (const block of blocks) {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      if (!m) return '';
      return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim());
    };
    let link = pick('link');
    if (!link) {
      const lm = block.match(/<link[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
    }
    const title = pick('title');
    if (!title) continue;
    const pub = pick('pubDate') || pick('published') || pick('updated') || pick('dc:date');
    const rawDesc = pick('description') || pick('summary') || pick('content');
    const it = {
      title: clip(title, 120),
      url: link,
      date: toDate(pub),
      source: sourceName,
      summary: clip(rawDesc, 160)
    };
    if (opts.rawSummary) it._raw = rawDesc;
    items.push(it);
  }
  return items;
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, '&');
}

function clip(s, n) {
  if (!s) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function toDate(str) {
  if (!str) return today();
  const d = new Date(str);
  if (isNaN(d.getTime())) return today();
  return fmt(d);
}

function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function today() { return fmt(new Date()); }

/** 统一执行包装：失败只记录不抛出 */
async function task(name, fn) {
  const t0 = Date.now();
  try {
    const data = await fn();
    const n = Array.isArray(data) ? data.length : (data ? 1 : 0);
    if (!n) throw new Error('空结果');
    report.push({ name, ok: true, count: n, ms: Date.now() - t0 });
    console.log(`✅ ${name}: ${n} 条 (${Date.now() - t0}ms)`);
    return data;
  } catch (e) {
    report.push({ name, ok: false, error: e.message, ms: Date.now() - t0 });
    console.log(`❌ ${name}: ${e.message} (${Date.now() - t0}ms)`);
    return null;
  }
}

function dedupe(items, keyFn = (x) => x.title) {
  const seen = new Set();
  return items.filter((x) => {
    const k = keyFn(x);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ============ 各板块抓取 ============ */

/** 百度实时热搜（结构：data.cards[0].content[0].content[]） */
async function baiduHot() {
  const j = JSON.parse(await httpGet('https://top.baidu.com/api/board?platform=wise&tab=realtime'));
  const card = (j.data?.cards || [])[0];
  // 该接口存在两种嵌套形态，做兼容
  let list = card?.content || [];
  if (list.length && Array.isArray(list[0]?.content)) list = list[0].content;
  return list
    .filter((c) => c && (c.word || c.query))
    .map((c) => ({
      word: c.word || c.query,
      url: c.url || c.rawUrl || ('https://www.baidu.com/s?wd=' + encodeURIComponent(c.word || c.query)),
      desc: c.desc || '',
      hot: c.hotScore || c.hotChange || ''
    }));
}

/** 知乎日报 */
async function zhihuDaily() {
  const j = JSON.parse(await httpGet('https://news-at.zhihu.com/api/4/news/latest'));
  return (j.stories || [])
    .filter((s) => s.title && s.url)
    .map((s) => ({
      title: clip(s.title, 120), url: s.url, date: today(),
      source: '知乎日报', summary: clip(s.hint || '', 60)
    }));
}

/**
 * 新闻时事：中新网（实时）+ 知乎日报 + 百度热搜
 * 注：人民网 RSS 停更于 2025-06、新浪 RSS 停更于 2018，已实测确认并移除。
 */
async function fetchNews() {
  const out = [];

  const rssList = [
    ['中新网·要闻', 'https://www.chinanews.com.cn/rss/scroll-news.xml'],
    ['中新网·国内', 'https://www.chinanews.com.cn/rss/china.xml'],
    ['中新网·社会', 'https://www.chinanews.com.cn/rss/society.xml'],
    ['中新网·国际', 'https://www.chinanews.com.cn/rss/world.xml']
  ];
  for (const [name, url] of rssList) {
    const r = await task('news:' + name, async () => freshOnly(await getRSS(url, name)));
    if (r) out.push(...r.slice(0, 6));
  }

  const zhihu = await task('news:知乎日报', zhihuDaily);
  if (zhihu) out.push(...zhihu.slice(0, 5));

  const baidu = await task('news:百度热搜', async () => {
    const list = await baiduHot();
    return list.map((c) => ({
      title: clip(c.word, 120), url: c.url, date: today(),
      source: '百度热搜', summary: clip(c.desc, 100)
    }));
  });
  if (baidu) out.push(...baidu.slice(0, 6));

  return dedupe(out).slice(0, 26);
}

/** AI 前沿：量子位 + 36氪 */
async function fetchAI() {
  const out = [];
  for (const [name, url] of [
    ['量子位', 'https://www.qbitai.com/feed'],
    ['36氪', 'https://36kr.com/feed']
  ]) {
    const r = await task('ai:' + name, async () => freshOnly(await getRSS(url, name)));
    if (r) out.push(...r.slice(0, 10));
  }
  // 36氪 是综合科技源，优先保留含 AI 关键词的
  const kw = /AI|人工智能|大模型|智能体|Agent|GPT|机器人|算力|芯片|OpenAI|Claude|Gemini|具身/i;
  const hit = out.filter((x) => kw.test(x.title + x.summary));
  const rest = out.filter((x) => !kw.test(x.title + x.summary));
  return dedupe([...hit, ...rest]).slice(0, 16);
}

/** 股市：腾讯行情（GBK） */
async function fetchStock() {
  return await task('stock:腾讯行情', async () => {
    const codes = 's_sh000001,s_sz399001,s_sz399006,s_sh000300,s_sh000016,s_sz399005';
    const txt = await httpGet('https://qt.gtimg.cn/q=' + codes, { encoding: 'gbk' });
    const out = [];
    for (const seg of txt.split(';')) {
      const m = seg.match(/v_s_[a-z]{2}\d+="([^"]+)"/);
      if (!m) continue;
      const f = m[1].split('~');
      // 格式: 市场~名称~代码~当前价~涨跌额~涨跌幅~成交量(手)~成交额(万)~~总市值
      if (f.length < 6) continue;
      const chg = parseFloat(f[5]);
      out.push({
        name: f[1], code: f[2],
        price: Number(f[3]).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%',
        amount: f[8] ? (Number(f[8]) / 10000).toFixed(0) + '亿' : '',
        up: chg >= 0
      });
    }
    return out;
  });
}

/** 播客热榜：Apple 中国区热门节目 */
async function fetchPodcastHot() {
  return await task('podcast:Apple中国热榜', async () => {
    const j = JSON.parse(await httpGet('https://rss.applemarketingtools.com/api/v2/cn/podcasts/top/10/podcasts.json'));
    return (j.feed?.results || []).map((p, i) => ({
      id: 'ap-' + (p.id || i),
      rank: i + 1,
      title: p.name,
      podcaster: p.artistName || '',
      artwork: p.artworkUrl100 || '',
      genre: (p.genres || []).map((g) => g.name).filter((n) => n !== '播客').join(' / '),
      date: (j.feed?.updated || '').slice(0, 10) || today(),
      url: p.url || ('https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent(p.name)),
      summary: `${p.artistName || ''}${p.genres?.length ? ' · ' + p.genres.map(g => g.name).filter(n => n !== '播客').join('/') : ''} · Apple 播客中国区排名第 ${i + 1}`
    }));
  });
}

/** 关注播客最新单集：iTunes Search 拿 feedUrl → 抓 RSS 首条 */
async function fetchPodcastFollow(names) {
  const out = [];
  for (const name of names) {
    const r = await task('podcast:关注·' + name, async () => {
      const sj = JSON.parse(await httpGet(
        `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&media=podcast&country=CN&limit=1`
      ));
      const hit = (sj.results || [])[0];
      if (!hit) throw new Error('未搜到该播客');
      let latest = null;
      if (hit.feedUrl) {
        try {
          const xml = await httpGet(hit.feedUrl);
          latest = parseRSS(xml, name)[0] || null;
        } catch { /* feed 抓取失败则退回节目信息 */ }
      }
      return [{
        id: 'pf-' + (hit.collectionId || name),
        title: latest?.title || (hit.collectionName + ' 最新一期'),
        podcaster: hit.artistName || name,
        artwork: hit.artworkUrl100 || '',
        duration: '',
        date: latest?.date || (hit.releaseDate || '').slice(0, 10) || today(),
        summary: clip(latest?.summary || hit.collectionName || '', 150),
        url: latest?.url || hit.collectionViewUrl || ('https://www.xiaoyuzhoufm.com/search?q=' + encodeURIComponent(name))
      }];
    });
    if (r) out.push(...r);
  }
  return out;
}

/** 三联生活周刊：解析首页 Nuxt SSR 内联数据 */
async function fetchSanlian() {
  return await task('sanlian:三联生活周刊', async () => {
    const html = await httpGet('https://www.lifeweek.com.cn/');
    const idx = html.indexOf('__NUXT__');
    if (idx < 0) throw new Error('未找到 NUXT 数据');
    const body = html.slice(idx, idx + 400000);
    const out = [];
    // 匹配 contentId 与 title 邻近出现的片段
    const re = /contentId:(\d+)[\s\S]{0,600}?title:"([^"]{4,80})"/g;
    let m;
    while ((m = re.exec(body)) && out.length < 40) {
      const id = m[1];
      const title = decodeEntities(m[2].replace(/\\u002F/g, '/'));
      if (!title || /^[\d\s]*$/.test(title)) continue;
      out.push({
        id: 'sl-' + id,
        title: clip(title, 100),
        date: today(),
        source: '三联生活周刊',
        summary: '',
        url: `https://www.lifeweek.com.cn/news?currentId=${id}&currentIdShow=y`
      });
    }
    return dedupe(out).slice(0, 12);
  });
}

/**
 * 豆瓣书评/影评清洗
 * 原始标题形如「生活就是一个骗局 (评论: 主唱死了)」，摘要含富文本 JSON 残渣。
 */
/**
 * 从豆瓣 description 里的富文本 JSON（draft-js 结构）抽出真实正文。
 * 结构形如：书名 (评价: 力荐) {"entityMap":{...},"blocks":[{"text":"..."}]}
 * 该 JSON 常被源截断，因此解析失败时退化为正则逐段抓 "text"。
 */
function unescapeJsonish(s) {
  return String(s)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n|\\r|\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function doubanBody(raw) {
  if (!raw) return '';
  const i = raw.search(/\{\s*"(entityMap|blocks)"/);
  if (i < 0) return '';
  const json = raw.slice(i);
  const pushText = (arr) => arr.map((b) => (b && b.text) || '').filter(Boolean).join(' ');
  try {
    const o = JSON.parse(json);
    if (Array.isArray(o.blocks)) return pushText(o.blocks);
  } catch { /* 源常在中途截断，走宽松正则 */ }
  const out = [];
  // 允许最后一段没有闭合引号（被源截断的情况）
  const re = /"text"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|$)/g;
  let m;
  while ((m = re.exec(json))) {
    const t = unescapeJsonish(m[1]).replace(/\.{3}$/, '').trim();
    if (t) out.push(t);
  }
  return out.join(' ');
}

function cleanDouban(items) {
  return items.map((x) => {
    const m = x.title.match(/^(.*?)\s*[（(]评论:\s*(.+?)[）)]\s*$/);
    const subject = m ? m[2].trim() : '';
    const reviewTitle = m ? m[1].trim() : x.title;

    // 评分：力荐 / 推荐 / 还行 / 较差 / 很差
    const rateM = (x._raw || x.summary || '').match(/评价[:：]\s*(力荐|推荐|还行|较差|很差)/);
    const rating = rateM ? rateM[1] : '';

    let sum = doubanBody(x._raw);
    if (!sum) {
      // 原始前缀形如："某某评论: 书名 (链接)\n评价: 力荐\n\n"
      sum = (x._raw || x.summary || '')
        .replace(/\{\s*"?(entityMap|blocks)[\s\S]*$/i, '')
        .replace(/^[\s\S]*?评价[:：]\s*(力荐|推荐|还行|较差|很差)?\s*/, '')
        .replace(/^[\s\S]{0,60}?评论[:：]\s*/, '');
    }
    sum = sum
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\\u[0-9a-f]{4}/gi, '')
      .replace(/\\+u?[0-9a-fA-F]{0,3}\s*$/, '')   // 被源截断的半个转义序列
      .replace(/[{}\[\]"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const out = {
      ...x,
      title: subject ? `${subject}｜${reviewTitle}` : reviewTitle,
      subject,
      rating,
      summary: clip(sum, 140)
    };
    delete out._raw;
    return out;
  });
}

/**
 * 订阅精选（原「公众号精选」位）
 *
 * 说明：微信公众号没有官方 RSS，社区镜像（wechat2rss / RSSHub 公共实例）
 * 实测已全部失效（404 / 超时），因此本板块改为聚合「可公开访问」的优质中文源，
 * 并在前端提供自定义 RSS 订阅入口，用户可粘贴自建的公众号 RSS 地址。
 */
async function fetchSubscriptions() {
  const groups = {};

  const defs = [
    ['thinking', '思想文化', [['豆瓣·书评精选', 'https://www.douban.com/feed/review/book', 'douban']]],
    ['psychology', '心理成长', [['知乎日报', null, 'zhihu']]],
    ['lifestyle', '生活方式', [
      ['中新网·生活', 'https://www.chinanews.com.cn/rss/life.xml', 'rss'],
      ['中新网·财经', 'https://www.chinanews.com.cn/rss/finance.xml', 'rss']
    ]]
  ];

  for (const [key, label, sources] of defs) {
    const items = [];
    for (const [name, url, kind] of sources) {
      const r = await task(`sub:${label}·${name}`, async () => {
        if (kind === 'zhihu') return await zhihuDaily();
        const list = freshOnly(await getRSS(url, name, { rawSummary: kind === 'douban' }));
        return kind === 'douban' ? cleanDouban(list) : list;
      });
      if (r) items.push(...r.slice(0, 8));
    }
    groups[key] = { label, items: dedupe(items).slice(0, 10) };
  }
  return groups;
}

/** 自媒体灵感：抖音热搜 + 百度热搜 + B站排行 + 头条热榜 */
async function fetchInspiration() {
  const out = [];

  const douyin = await task('inspiration:抖音热搜', async () => {
    const j = JSON.parse(await httpGet('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/'));
    return (j.word_list || []).map((w) => ({
      title: w.word,
      source: '抖音热搜',
      heat: w.hot_value ? (w.hot_value / 10000).toFixed(0) + '万' : '',
      url: 'https://www.douyin.com/search/' + encodeURIComponent(w.word)
    }));
  });
  if (douyin) out.push(...douyin.slice(0, 8));

  const baidu = await task('inspiration:百度热搜', async () => {
    const list = await baiduHot();
    return list.map((c) => ({
      title: c.word,
      source: '百度热搜',
      heat: c.hot ? (Number(c.hot) / 10000).toFixed(0) + '万' : '',
      url: c.url
    }));
  });
  if (baidu) out.push(...baidu.slice(0, 6));

  const toutiao = await task('inspiration:头条热榜', async () => {
    const j = JSON.parse(await httpGet('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc'));
    return (j.data || []).map((d) => ({
      title: d.Title,
      source: '头条热榜',
      heat: d.HotValue ? (Number(d.HotValue) / 10000).toFixed(0) + '万' : '',
      url: d.Url || ('https://so.toutiao.com/search?keyword=' + encodeURIComponent(d.Title))
    }));
  });
  if (toutiao) out.push(...toutiao.slice(0, 6));

  const bili = await task('inspiration:B站排行', async () => {
    const j = JSON.parse(await httpGet('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all'));
    return (j.data?.list || []).map((v) => ({
      title: v.title,
      source: 'B站热门',
      heat: v.stat?.view ? (v.stat.view / 10000).toFixed(0) + '万播放' : '',
      url: 'https://www.bilibili.com/video/' + v.bvid
    }));
  });
  if (bili) out.push(...bili.slice(0, 6));

  return dedupe(out).slice(0, 20);
}

/** 书影上新：豆瓣书评 + 影评（清洗后） */
async function fetchReleases() {
  const out = [];
  for (const [name, url, type] of [
    ['豆瓣·书评', 'https://www.douban.com/feed/review/book', 'book'],
    ['豆瓣·影评', 'https://www.douban.com/feed/review/movie', 'media']
  ]) {
    const r = await task('releases:' + name, async () => {
      const items = cleanDouban(freshOnly(await getRSS(url, name, { rawSummary: true })));
      return items.map((x) => ({ ...x, type, desc: x.summary }));
    });
    if (r) out.push(...r.slice(0, 8));
  }
  return dedupe(out).slice(0, 14);
}

/* ============ 主流程 ============ */

async function main() {
  console.log('开始抓取 · ' + new Date().toISOString());

  // 读取上一次结果，用于失败回填
  let prev = {};
  try {
    prev = JSON.parse(await readFile(OUT_FILE, 'utf-8'));
    console.log('已加载上次结果，更新于', prev.updatedAt);
  } catch { console.log('无历史数据，首次抓取'); }

  // 覆盖前端默认关注，前端按 podcaster 名字匹配；保持与前端 followedPodcasts 一致
  const followNames = [
    '来都来了', '不合时宜', '文化有限', '忽左忽右', '东腔西调'
  ];

  const [news, ai, stock, podHot, podFollow, sanlian, subs, inspiration, releases] = await Promise.all([
    fetchNews(), fetchAI(), fetchStock(), fetchPodcastHot(),
    fetchPodcastFollow(followNames), fetchSanlian(), fetchSubscriptions(),
    fetchInspiration(), fetchReleases()
  ]);

  const now = new Date().toISOString();
  const keep = (fresh, key) => {
    const has = Array.isArray(fresh) ? fresh.length > 0 : !!fresh;
    if (has) return { data: fresh, updatedAt: now, stale: false };
    const old = prev[key];
    if (old?.data) return { ...old, stale: true };
    return { data: Array.isArray(fresh) ? [] : null, updatedAt: now, stale: true };
  };

  const result = {
    updatedAt: now,
    news: keep(news, 'news'),
    ai: keep(ai, 'ai'),
    stock: keep(stock, 'stock'),
    podcastHot: keep(podHot, 'podcastHot'),
    podcastFollow: keep(podFollow, 'podcastFollow'),
    sanlian: keep(sanlian, 'sanlian'),
    subscriptions: keep(subs && Object.keys(subs).length ? subs : null, 'subscriptions'),
    inspiration: keep(inspiration, 'inspiration'),
    releases: keep(releases, 'releases'),
    report
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  const ok = report.filter((r) => r.ok).length;
  console.log(`\n完成：${ok}/${report.length} 个源成功，已写入 data/feeds.json`);
}

main().catch((e) => { console.error('致命错误:', e); process.exit(1); });
