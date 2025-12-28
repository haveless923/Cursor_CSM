-- ============================================
-- 在 Supabase 中创建测试用户
-- ============================================
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 确保 users 表存在
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 禁用 RLS（如果还没禁用）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 删除现有用户（如果需要重新创建）
-- DELETE FROM users WHERE username IN ('admin', 'member1', 'member2', 'member3', 'member4', 'member5');

-- 创建管理员账号（密码: admin123）
-- 注意：这里使用明文密码，实际应该使用 bcrypt 加密
-- 为了快速测试，暂时使用明文
INSERT INTO users (username, password, role) 
VALUES ('admin', 'admin123', 'admin')
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role;

-- 创建成员账号（密码: member1123, member2123 等）
INSERT INTO users (username, password, role) 
VALUES 
  ('member1', 'member1123', 'member'),
  ('member2', 'member2123', 'member'),
  ('member3', 'member3123', 'member'),
  ('member4', 'member4123', 'member'),
  ('member5', 'member5123', 'member')
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role;

-- 验证用户已创建
SELECT id, username, role, created_at FROM users ORDER BY username;

