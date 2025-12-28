-- ============================================
-- 检查 Supabase 表是否存在
-- ============================================
-- 执行这个查询来查看哪些表已存在
-- ============================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'customers', 'next_step_history', 'industry_news', 'news_favorites') 
    THEN '✅ 已存在'
    ELSE '❌ 不存在'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'customers', 'next_step_history', 'industry_news', 'news_favorites')
ORDER BY 
  CASE table_name
    WHEN 'users' THEN 1
    WHEN 'customers' THEN 2
    WHEN 'next_step_history' THEN 3
    WHEN 'industry_news' THEN 4
    WHEN 'news_favorites' THEN 5
  END;

-- ============================================
-- 查看所有表（包括其他表）
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
   AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;

