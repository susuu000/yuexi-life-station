# 月夕生活台（Yuexi Life Station）

一个纯前端的个人生活 / 学习工作台：雅思、AI 资讯、阅读、播客、自媒体、自我探索等板块的统一打卡与记录台。
支持 **iOS（添加到主屏幕＝桌面版）** 与 **网页端** 双端使用，数据通过 **Supabase** 云端保存并**多设备实时同步**。

> 技术栈：原生 HTML / CSS / JS（无构建步骤） + Supabase（Postgres + Auth + Realtime + Storage）。
> 源码托管在 GitHub，通过 GitHub Pages 免费部署。

---

## 一、准备 Supabase（云端数据库）

1. 注册并新建项目：<https://supabase.com> → New Project。
2. 打开 **SQL Editor**，把本仓库 `supabase/schema.sql` 全选执行。
   该脚本会建好 4 张表（`user_settings` / `user_checkins` / `user_entries` / `user_collections`）、
   开启 **行级安全（RLS，仅本人可读写）**、开启 **Realtime 实时同步**、并创建公开图片桶 `images`。
3. 记下 **Settings → API** 里的：
   - `Project URL`
   - `anon` / `public` key

## 二、填入配置

编辑仓库根目录的 `config.js`：

```js
const SUPABASE_URL = 'https://你的-project-ref.supabase.co';
const SUPABASE_ANON_KEY = '你的-anon-public-key';
```

> `anon` key 是**公开**密钥，本就该放在前端；数据安全由数据表的 RLS 保证，提交到 GitHub 也安全。

## 三、（可选）邮箱确认设置

Supabase 默认开启"注册需邮件确认"。两种处理方式任选：

- **省事**：Supabase → **Authentication → Providers → Email** 中关闭 `Confirm email`；
- **正规**：在 **Authentication → URL Configuration** 配置 SMTP，注册后去邮箱点确认链接再登录。

## 四、部署到 GitHub Pages

1. 把本仓库推送到 GitHub（main 分支）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **Deploy from a branch**，
   Branch 选 `main`、目录选 **/ (root)**，保存。
3. 稍等一两分钟，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

> 站点使用相对路径，放在仓库根目录即可直接被 Pages 托管，无需任何构建。

### 自定义域名（可选）

1. 在你的域名服务商处添加 CNAME 记录，指向 `<用户名>.github.io`。
2. Pages 设置里填写自定义域名并勾选 HTTPS（GitHub 会自动签发证书）。
3. 仓库根目录放一个 `CNAME` 文件，内容为你的域名（否则每次部署会被清掉）。

---

## 五、使用说明

- **iOS 桌面版**：用 Safari 打开站点 → 分享 → "添加到主屏幕"。之后从主屏幕图标进入即为全屏桌面版。
- **多设备同步**：在手机和网页端用**同一个邮箱**登录，数据自动实时互相同步（Realtime）。
- **图片跨设备**：在线时图片上传到 Supabase Storage，另一台设备直接可见；离线时回退为本地存储（仅本机）。
- **离线可用**：无网络时数据存于浏览器本地，恢复网络后自动同步。
- **仅本机模式**：不想登录也可点"稍后再说"，数据只存在当前浏览器（换设备不同步）。

## 六、从旧版迁移

旧版数据存在浏览器 `localStorage`。在已登录状态下，首次登录会自动把本机数据上传到云端；
若想手动触发，点右上角同步按钮即可。"导出 / 导入"功能仍保留，可用于备份。

## 七、目录结构

```
index.html          入口
css/style.css       样式
js/config.js        Supabase 配置（需自行填写）
js/storage.js       本地存储 / 离线层（localStorage + IndexedDB）
js/sync.js          Supabase 同步、邮箱登录、Realtime（核心）
js/sections.js      各板块渲染逻辑
js/app.js           应用主逻辑
js/auth.js          登录 / 注册 UI
js/sw.js            轻量 Service Worker（PWA 可安装 + 离线兜底）
manifest.json       PWA 配置
assets/icon.svg     图标
supabase/schema.sql 数据库建表 / RLS / Realtime / 存储桶
```

## 八、隐私与额度

- 数据通过 RLS 严格隔离，只有登录用户能访问自己的行。
- Supabase 免费额度（个人使用绰绰有余）：数据库 500MB、存储 1GB、带宽 2GB。
- 图片桶为**公开桶**，文件名使用 UUID 不可枚举；如需更强隐私，可改为私有桶 + 签名 URL（见 schema 注释）。
