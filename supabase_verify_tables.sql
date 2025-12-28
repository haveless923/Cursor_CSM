-- ============================================
-- 验证 Supabase 表是否创建成功
-- ============================================
-- 执行这个查询来检查表是否存在
-- ============================================

-- 方法1：检查所有表
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 方法2：检查特定表是否存在
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'customers', 'next_step_history', 'industry_news', 'news_favorites')
ORDER BY table_name;

-- 方法3：检查表结构（以customers为例）
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- 方法4：检查所有表的行数
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
  'customers' as table_name,
  COUNT(*) as row_count
FROM customers
UNION ALL
SELECT 
  'next_step_history' as table_name,
  COUNT(*) as row_count
FROM next_step_history
UNION ALL
SELECT 
  'industry_news' as table_name,
  COUNT(*) as row_count
FROM industry_news
UNION ALL
SELECT 
  'news_favorites' as table_name,
  COUNT(*) as row_count
FROM news_favorites;

