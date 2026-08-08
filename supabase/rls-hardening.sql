-- =====================================================================
--  月夕生活台 · Supabase RLS 加固 Runbook
-- =====================================================================
--  ⚠️ 本文件由 AI 生成，是一份**人工执行的操作手册**，不会被任何代码自动应用。
--     请登录 Supabase 后台 → SQL Editor，按节复制粘贴执行。
--
--  ⚠️ 为什么必须做：本项目是纯静态前端，anon key 直接硬编码在 js/config.js 里，
--     任何人打开浏览器 DevTools 都能拿到它，并用它直连 REST API。
--     也就是说 —— **RLS（行级安全）是这套数据唯一的一道防线**。
--     RLS 一旦缺失或只配了读侧策略，等于把所有用户的日记 / 打卡 / 收藏 / 经期记录
--     变成公开可读可写的数据库。
--
--  执行顺序建议：
--     (a) 只读诊断  → 先看清现状，不改任何东西
--     (b) 加固策略  → 幂等，可安全重复执行（推荐执行）
--     (c) 图片桶私有化 → **破坏性**，会让历史图片 URL 全部失效，默认不要执行
--
--  涉及四张表：user_settings / user_checkins / user_entries / user_collections
--  它们的主键各不相同，但都带 user_id 列，策略统一以 auth.uid() = user_id 为准：
--     user_settings     : user_id
--     user_checkins     : user_id + check_date
--     user_entries      : user_id + section + entry_date
--     user_collections  : user_id + collection_key   ← 注意主键列是 collection_key，不是 id
-- =====================================================================


-- =====================================================================
-- (a) 只读诊断 —— 不修改任何数据，先跑这一节看现状
-- =====================================================================

-- a-1. 四张表是否真的启用了 RLS？relrowsecurity 必须全部为 true。
--      只要有一行是 false，那张表就是完全裸奔的（策略写得再好也不生效）。
select relname, relrowsecurity
from pg_class
where relname in ('user_settings','user_checkins','user_entries','user_collections');

-- a-2. 逐条列出现有策略。
--      ★ 重点看 cmd = INSERT / UPDATE 这两行的 with_check 列：
--        · with_check 为 null            → 写侧无约束，任何人可以往别人的 user_id 下写数据（严重）
--        · with_check 不含 auth.uid() = user_id → 同样不安全
--      ★ 常见误区：用 anon key 去 select 别人的数据返回了 `200 []`，
--        很多人据此认为"RLS 没问题"。这只证明**读侧**被挡住了，
--        完全无法证明写侧安全 —— INSERT/UPDATE 的 with_check 缺失时，
--        攻击者照样能伪造 user_id 往你的表里塞数据或覆盖你的行。
--        写侧必须靠下面 a-2 的输出逐条确认，不能靠 200 [] 推断。
select tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('user_settings','user_checkins','user_entries','user_collections')
order by tablename, cmd;

-- a-3. 图片桶当前是否公开。public = true 表示桶内所有对象凭 URL 即可匿名访问
--      （URL 含随机路径，属于"知道链接就能看"，不是真正的访问控制）。
select id, name, public
from storage.buckets
where name = 'images';


-- =====================================================================
-- (b) 加固策略 —— 幂等，可安全重复执行（推荐）
-- =====================================================================
--  说明：
--   · 采用 `drop policy if exists ...; create policy ...;` 的写法保证幂等。
--     （`create policy if not exists` 仅 PostgreSQL 15+ 支持，且"已存在就跳过"
--       意味着**旧的错误策略会被原样保留**，反而掩盖问题；drop + create 才能确保
--       最终策略就是这里写的内容。）
--   · 每张表拆成 SELECT / INSERT / UPDATE / DELETE 四条策略，语义清晰、便于审计：
--       USING      → 决定"能看到 / 能作用于哪些已存在的行"（SELECT / UPDATE 旧值 / DELETE）
--       WITH CHECK → 决定"允许写入什么样的新行"（INSERT 新值 / UPDATE 新值）
--     UPDATE 两者都要写，否则可以把自己的行改成别人的 user_id（越权投毒）。
--   · AS PERMISSIVE 是默认值，这里显式写出以免与将来可能新增的 RESTRICTIVE 策略混淆。
--   · TO authenticated：只授权给已登录角色；anon 角色不匹配任何策略 = 一律拒绝。

-- 前置：确保四张表都启用了 RLS（启用后"无匹配策略"= 默认拒绝，这才是我们要的默认值）
alter table public.user_settings    enable row level security;
alter table public.user_checkins    enable row level security;
alter table public.user_entries     enable row level security;
alter table public.user_collections enable row level security;

-- ---------------------------------------------------------------
-- b-1. user_settings
-- ---------------------------------------------------------------
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  as permissive for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  as permissive for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  as permissive for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings
  as permissive for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- b-2. user_checkins
-- ---------------------------------------------------------------
drop policy if exists "user_checkins_select_own" on public.user_checkins;
create policy "user_checkins_select_own" on public.user_checkins
  as permissive for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_checkins_insert_own" on public.user_checkins;
create policy "user_checkins_insert_own" on public.user_checkins
  as permissive for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_checkins_update_own" on public.user_checkins;
create policy "user_checkins_update_own" on public.user_checkins
  as permissive for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_checkins_delete_own" on public.user_checkins;
create policy "user_checkins_delete_own" on public.user_checkins
  as permissive for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- b-3. user_entries（主键 user_id + section + entry_date）
-- ---------------------------------------------------------------
drop policy if exists "user_entries_select_own" on public.user_entries;
create policy "user_entries_select_own" on public.user_entries
  as permissive for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_entries_insert_own" on public.user_entries;
create policy "user_entries_insert_own" on public.user_entries
  as permissive for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_entries_update_own" on public.user_entries;
create policy "user_entries_update_own" on public.user_entries
  as permissive for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_entries_delete_own" on public.user_entries;
create policy "user_entries_delete_own" on public.user_entries
  as permissive for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- b-4. user_collections（主键 user_id + collection_key，注意不是 id）
-- ---------------------------------------------------------------
drop policy if exists "user_collections_select_own" on public.user_collections;
create policy "user_collections_select_own" on public.user_collections
  as permissive for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_collections_insert_own" on public.user_collections;
create policy "user_collections_insert_own" on public.user_collections
  as permissive for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_collections_update_own" on public.user_collections;
create policy "user_collections_update_own" on public.user_collections
  as permissive for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_collections_delete_own" on public.user_collections;
create policy "user_collections_delete_own" on public.user_collections
  as permissive for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- b-5. 执行后复验：重新跑 a-2，确认每张表都有 4 条策略，
--      且 INSERT / UPDATE 两行的 with_check 都是 (auth.uid() = user_id)。
-- ---------------------------------------------------------------
select tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('user_settings','user_checkins','user_entries','user_collections')
order by tablename, cmd;

-- b-6. 客户端回归自测（应用侧，不在此文件执行）：
--      登录后依次验证 → 修改设置能存 / 打卡能写 / 日志能存 / 收藏能增删 / 换设备能同步。
--      若某处开始报 42501 (permission denied)，说明该表的 upsert 缺少对应的
--      INSERT 或 UPDATE 策略（upsert = INSERT ... ON CONFLICT DO UPDATE，两者都要）。


-- =====================================================================
-- (c) 图片桶私有化 —— 破坏性操作，默认不要执行
-- =====================================================================
--  ############################  警  告  ############################
--  执行下面这条 UPDATE 会立刻产生以下后果：
--
--   1. **所有历史 public 图片 URL 立即失效**。
--      本应用把 getPublicUrl 返回的固定 URL 直接存进了 Storage.data
--      （OOTD、书影封面、日记配图等），桶转私有后这些 URL 全部返回 400/404，
--      表现为满屏裂图，且**存量数据里的 URL 不会自动迁移**。
--
--   2. 必须同步修改前端：把 js/sync.js 顶部的
--         const SB_BUCKET_PRIVATE = false;
--      改为
--         const SB_BUCKET_PRIVATE = true;
--      并让所有读图路径改走 await Sync.getImageUrl(path)（签名 URL，有效期 1 小时）。
--      注意签名 URL 会过期，**不能再把它存进 Storage.data**，必须渲染时现取；
--      因此存量数据需要从"存完整 URL"迁移成"存桶内相对 path"，这是一次数据迁移工作量。
--
--   3. 还需要为 storage.objects 配置 RLS 策略，否则登录用户也读不到自己的图。
--
--  结论：仅在你确认"可以接受历史图片失效 / 愿意重新上传"，并且已经排期做
--        URL→path 的数据迁移时，才执行这一节。否则保持 public 现状。
--  ##################################################################

-- update storage.buckets set public = false where name = 'images';

-- 若确实执行了上面的私有化，配套的对象级策略（同样按 uid 目录隔离）：
-- 本应用上传路径形如 '<uid>/<timestamp>_<rand>.jpg'，
-- 所以用路径第一段与 auth.uid() 比对即可做到"只能读写自己目录下的图"。
--
-- alter table storage.objects enable row level security;
--
-- drop policy if exists "images_read_own" on storage.objects;
-- create policy "images_read_own" on storage.objects
--   as permissive for select to authenticated
--   using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- drop policy if exists "images_insert_own" on storage.objects;
-- create policy "images_insert_own" on storage.objects
--   as permissive for insert to authenticated
--   with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- drop policy if exists "images_update_own" on storage.objects;
-- create policy "images_update_own" on storage.objects
--   as permissive for update to authenticated
--   using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text)
--   with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- drop policy if exists "images_delete_own" on storage.objects;
-- create policy "images_delete_own" on storage.objects
--   as permissive for delete to authenticated
--   using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- 注意：uploadImage 用的是 upsert: true，等价于 INSERT + UPDATE，两条策略缺一不可。


-- =====================================================================
--  回滚提示
-- =====================================================================
--  (b) 节的策略如需回滚，逐条 drop 即可，例如：
--      drop policy if exists "user_settings_select_own" on public.user_settings;
--  但请注意：删光策略而 RLS 仍启用 = 所有访问被拒绝（应用会全线 42501）；
--  RLS 关闭（alter table ... disable row level security）= 数据完全裸奔。
--  两种"回滚"都不是安全状态，正确做法是修正策略而不是移除策略。
