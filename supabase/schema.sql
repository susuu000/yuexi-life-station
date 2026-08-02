-- ============================================================
-- 月夕生活台 · Supabase 数据库结构（规范化拆分）
-- 在 Supabase 控制台 → SQL Editor 全选执行本文件即可。
-- 对应 src/js/config.js 中的表名 / 桶名。
-- ============================================================

-- 1) 设置表：每个用户一行，存 app 配置 / 个性化 / 侧边栏
create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) 打卡表：关系型，每个"用户+日期"一行（真正的关系建模）
create table if not exists public.user_checkins (
  user_id     uuid not null references auth.users(id) on delete cascade,
  check_date  date not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, check_date)
);

-- 3) 日志表：按"板块 + 日期"一行，payload 存该天的内容（JSONB 灵活承载各板块差异）
create table if not exists public.user_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  section     text not null,
  entry_date  date not null,
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (user_id, section, entry_date)
);

-- 4) 集合表：列表/单对象型数据（收藏、读书清单、自我探索各子项、资料、天气、星座等）
create table if not exists public.user_collections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  collection_key  text not null,
  items           jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now(),
  unique (user_id, collection_key)
);

-- ============================================================
-- 行级安全（RLS）：仅本人可读写自己的数据
-- ============================================================
alter table public.user_settings    enable row level security;
alter table public.user_checkins    enable row level security;
alter table public.user_entries     enable row level security;
alter table public.user_collections enable row level security;

-- 通用策略：user_id == 当前登录用户
create policy "settings_owner"   on public.user_settings    for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "checkins_owner"   on public.user_checkins    for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries_owner"    on public.user_entries     for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collections_owner" on public.user_collections for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============================================================
-- 实时订阅：让多设备秒级互相同步
-- ============================================================
alter publication supabase_realtime add table public.user_settings;
alter publication supabase_realtime add table public.user_checkins;
alter publication supabase_realtime add table public.user_entries;
alter publication supabase_realtime add table public.user_collections;

-- ============================================================
-- 图片存储桶：公开桶（UUID 文件名不可枚举），路径 = 用户ID/文件名
-- 仅本人可上传/删除自己目录下的对象；读为公开（供 <img src> 直接显示）。
-- ============================================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

create policy "images_select_public"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "images_insert_owner"
  on storage.objects for insert
  with check ( bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text );

create policy "images_delete_owner"
  on storage.objects for delete
  using ( bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text );

-- ============================================================
-- 可选：资料表（显示名等）。auth.users 已含 email，这里仅补充昵称。
-- ============================================================
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_owner" on public.profiles
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
