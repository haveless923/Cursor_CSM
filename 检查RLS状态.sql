-- ============================================
-- 检查 users 表的 RLS 状态
-- ============================================
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 检查 RLS 是否启用
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 或者使用这个查询
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS 已启用'
    ELSE 'RLS 已禁用'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 如果 RLS 仍然启用，执行以下命令禁用
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 再次检查
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS 已启用 ❌'
    ELSE 'RLS 已禁用 ✅'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 检查表中是否有数据
SELECT COUNT(*) as user_count FROM users;

-- 列出所有用户
SELECT id, username, role FROM users ORDER BY username;

