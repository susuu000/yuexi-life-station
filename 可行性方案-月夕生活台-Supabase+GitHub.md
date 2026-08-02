# 月夕生活台 · 云端迁移与工程化可行性方案（Supabase + GitHub）

> 目标：把"月夕生活台"的云端数据从腾讯云开发（CloudBase）迁移到 **Supabase**，并把项目源码接入 **GitHub**（源码托管 + 自动部署），实现「手机端（iOS 桌面版）+ 网页端」数据真正同步、长久可用、可随时迁移。

---

## 一、现状分析（基于线上版本实测）

我拉取了线上 `app.codebuddy.work` 的实际前端代码，确认当前架构如下：

- **前端形态**：纯静态 SPA，原生 HTML / CSS / JS，**无构建步骤**。
  - 文件：`index.html`、`css/style.css`、`js/storage.js`、`js/sync.js`、`js/sections.js`、`js/app.js`
  - 已配 `manifest.json`（PWA），支持 iOS「添加到主屏幕 = 桌面版呈现」（`apple-mobile-web-app-capable` 等 meta 已就位）。
- **本地存储**：`localStorage`（key `yuexi_life_data_v3`）存整份 JSON；图片走 `IndexedDB`（`yuexi_images`）。
- **当前云端（CloudBase / 腾讯云开发）**：
  - env `susu-d1guwhr5n70abfc5f`，**匿名登录**（`signInAnonymously`）。
  - 整份数据作为一个 JSON 大文档写入集合 `user_data` 的文档 `main`（单文档）。
  - `sync.js` 负责：连接、上传、拉取、按字段手工合并（`_mergeData`）、防抖自动上传。
  - **Publishable Key 直接写死在前端 JS 里（已暴露）**。

### 当前方案的关键问题
1. **图片不能跨设备同步**（最关键的痛点）：`sync.js._stripBase64` 在上传前会清空 base64，`img_` ID 只指向本地 IndexedDB。你在手机上拍的图，网页端看不到——这直接违背「数据可同步」的核心诉求。
2. **单文档大 JSON**：CloudBase 单文档 16MB 上限，数据越滚越大有风险；合并逻辑是手工 per-section 写死的，脆弱难维护。
3. **匿名 + Key 暴露**：数据安全完全依赖腾讯云环境的安全规则，没有真正的用户隔离与行级权限。
4. **平台锁定**：绑定 CodeBuddy 部署 + 腾讯云，想「长久使用、可迁移」存在锁定风险，换平台成本高。

---

## 二、可行性结论

✅ **完全可行，且收益明显。** 理由：

- 应用是**纯静态前端**，Supabase 官方 JS SDK（`@supabase/supabase-js`，有浏览器/CDN 版）可直接在前端调用，**无需自建后端服务器**。
- Supabase 自带 **Postgres + Auth + Realtime + Storage**，正好覆盖你「云端存储 / 跨设备同步 / 长久可用」的全部诉求，且免费额度对个人非常充裕。
- 静态站点 + GitHub 托管，部署零成本、可随时迁到任意平台（Vercel / Netlify / Cloudflare Pages 等）。

---

## 三、架构对比

| 维度 | 现状（CloudBase） | 目标（Supabase + GitHub） |
|---|---|---|
| 数据存储 | localStorage + 单 JSON 文档 | Postgres（表）+ localStorage 离线缓存 |
| 用户 / 权限 | 匿名，Key 暴露 | Supabase Auth（匿名→可升级邮箱）+ **RLS 行级安全** |
| 图片 | 本地 IndexedDB，**不跨设备** | Supabase Storage 私有桶，**真正跨设备** |
| 同步方式 | 手动 / 防抖上传 + 手工字段合并 | **Realtime 实时订阅** + 冲突友好合并 |
| 源码 / 部署 | 锁在 CodeBuddy 云 | GitHub 仓库 + Pages / Cloudflare Pages 自动部署 |
| 可迁移性 | 低 | 高（数据可导出，可自托管） |

---

## 四、推荐实施方案

### 4.1 数据模型：建议「先镜像、后规范化」两步走
- **阶段一（最小改动，快速上线）**：保留现有整份 JSON 结构，原样存进 Supabase 一张 `user_data` 表（`user_id` + `data` JSONB + `updated_at`），每行一个用户。现有所有字段与合并逻辑几乎不用动，风险最低，能立刻跑起来。**强烈建议从这步开始。**
- **阶段二（可选优化）**：把高频 / 需要实时协作的板块（打卡、日记、收藏、各板块日数据）拆成规范化表，用 RLS 隔离。收益是查询更稳、可独立实时订阅，但工作量较大，可在稳定后再做。

### 4.2 认证
- 用 Supabase **匿名登录**（`signInAnonymously`），零门槛，等同现在体验，拿到稳定 `user_id`。
- 后续可在「我的」页加邮箱登录 / 密码，把匿名账户关联升级，实现多设备同一身份。

### 4.3 图片（重点改进）
- 图片改存 **Supabase Storage 私有桶**，按 `user_id/日期/文件名` 组织，前端用签名 URL 读取。
- 彻底解决「手机拍的图网页看不到」的问题，直接兑现「数据可同步」。

### 4.4 实时同步（体验质变）
- 利用 Supabase **Realtime**：一个设备改了数据，其他设备（手机 / 网页）秒级收到变更并刷新。
- 比现在的「防抖上传 + 手动开关同步」体验好很多，且天然支持多设备同时在线。

### 4.5 GitHub 与部署
- 把完整源码（含改后的 Supabase 版）放进 GitHub **私有仓库**。
- 部署三选一（推荐 **Cloudflare Pages** 或 **GitHub Pages**，免费且简单）：
  - **GitHub Pages**：免费、最简单，配合 GitHub Actions 自动部署；SPA 需注意 base path。
  - **Cloudflare Pages / Vercel / Netlify**：对 SPA、自定义域名、HTTPS 更友好，连 GitHub 即自动部署。
- Supabase 的 URL 和 anon key 作为前端公开变量（**anon key 本就该暴露，安全靠 RLS**），可写进 `config.js` 或构建环境变量，无需进 GitHub Secrets（纯前端）。

---

## 五、迁移步骤（分阶段）

1. **准备 Supabase**：注册项目 → 建 `user_data` 表 → 建 Storage 私有桶 → 配 RLS（仅本人可读写自己行）。
2. **本地镜像源码**：把线上静态站点完整拉到本地工作区（已是公开静态资源，可直接抓取）。
3. **改造 `sync.js`**：用 Supabase SDK 替换 CloudBase 调用——初始化、匿名登录、`upsert` 整份数据、Realtime 订阅、`onDataChange` 改为触发 upsert；图片走 Storage。
4. **改造 `storage.js`**：保留 localStorage 作为离线缓存与首屏速度，云端作为唯一真相源（authoritative）。
5. **数据迁移**：在现运行 app 里「导出数据」，用一次性脚本 / 页面把现有 JSON 写入 Supabase 对应 `user_id` 行。
6. **部署 + 绑定域名**：推 GitHub，配置 Pages / Cloudflare 部署，保留 PWA（manifest + 苹果 meta）以保证 iOS 桌面版体验。
7. **验证**：手机 Safari（添加到主屏幕）+ 桌面浏览器，两边同时改，验证实时同步与图片跨设备。

---

## 六、风险与注意事项

- **免费额度**：Supabase 免费层 500MB 数据库 / 1GB 存储 / 2GB 带宽，个人使用绰绰有余；图片多可压缩或按需清理。
- **anon key 暴露**：这是 Supabase 设计使然，关键在 **RLS 必须配好**——只让本人访问自己行，否则数据会泄露。
- **iOS 呈现**：现有 `apple-mobile-web-app-capable` + manifest 已支持「添加到主屏幕 = 桌面版」，迁移时务必保留。
- **离线优先**：localStorage 仍是首屏与离线保障，网络恢复后由 Supabase 同步，断网也能用。
- **实时冲突**：多设备同秒改同一字段仍是「后写覆盖」，但 Realtime + 按板块合并可大幅降低冲突概率；阶段二规范化后更可控。

---

## 七、工作量估算

- **阶段一**（Supabase 替换 + 图片上云 + 一次性迁移 + GitHub 部署）：约 **1–2 天**工程（含联调）。
- **阶段二**（规范化 + 邮箱登录）：按需，约 **额外 1–2 天**。

---

## 八、需要你确认的关键决策（影响方案细节）

1. **数据模型**：先走「整份 JSON 镜像」（快、稳）还是直接规范化？
2. **部署平台**：GitHub Pages（最简单）/ Cloudflare Pages（推荐，SPA + 域名友好）/ Vercel / Netlify？
3. **登录方式**：先保持匿名（零门槛），还是顺带做邮箱登录？
4. **是否现在就动手**：我可以先把线上源码完整镜像到本地、搭好 Supabase 接入骨架，再交你填 Key 联调。

> 说明：当前工作区是空的（源码在 CodeBuddy 云端部署）。无论哪种方案，第一步都是把线上静态资源完整镜像到本地，这一步不需要你提供任何凭据，我可以直接完成。
