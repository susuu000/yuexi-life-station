/* ============================================
   config.js - 月夕生活台 运行配置
   ----------------------------------------------------
   把下面两项替换成你自己的 Supabase 项目信息即可：
   1) 打开 https://supabase.com → 你的项目 → Settings → API
   2) Project URL  -> 填到 SUPABASE_URL
   3) anon / public key -> 填到 SUPABASE_ANON_KEY
   注意：anon key 是"公开"密钥，本就该放在前端，安全由数据表的
   RLS（行级安全）保证，所以提交到 GitHub 也没问题。
   ============================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

/* 表名 / 存储桶名（需与 supabase/schema.sql 一致） */
const SB_TABLES = {
  settings:    'user_settings',
  checkins:    'user_checkins',
  entries:     'user_entries',
  collections: 'user_collections'
};
const SB_BUCKET = 'images';

/* 是否启用实时同步（多设备秒级刷新）。如不需要可改为 false 以减少请求。 */
const SB_REALTIME = true;
