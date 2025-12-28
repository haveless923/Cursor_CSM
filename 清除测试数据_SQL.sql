-- 清除Supabase中的测试数据（成交客户和潜在客户）
-- ⚠️ 警告：此操作不可逆，请谨慎使用！
-- 在Supabase Dashboard的SQL Editor中执行

-- 1. 先查看要删除的数据（建议先执行此查询确认）
SELECT 
  id, 
  company_name, 
  category, 
  status,
  created_at
FROM customers
WHERE category IN ('结单', '试用/谈判/高意向', '建联中', '静默')
ORDER BY created_at DESC;

-- 2. 查看要删除的数据数量
SELECT 
  category,
  COUNT(*) as count
FROM customers
WHERE category IN ('结单', '试用/谈判/高意向', '建联中', '静默')
GROUP BY category;

-- 3. 删除测试数据（确认无误后执行）
-- DELETE FROM customers
-- WHERE category IN ('结单', '试用/谈判/高意向', '建联中', '静默');

-- 4. 验证删除结果
-- SELECT COUNT(*) as remaining_customers FROM customers;

