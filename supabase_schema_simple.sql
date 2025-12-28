-- ============================================
-- CSM 系统 Supabase 数据库表结构（简化版 - 不使用RLS）
-- ============================================
-- 使用方法：
-- 1. 登录 Supabase Dashboard: https://supabase.com/dashboard
-- 2. 选择您的项目: jpaurpkibrjwqthrcexc
-- 3. 进入 SQL Editor
-- 4. 复制粘贴以下SQL并执行
-- ============================================

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. 客户表 (customers)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  company_name TEXT,
  city TEXT,
  customer_source TEXT,
  customer_source_other TEXT,
  custom_tags TEXT,
  due_date TEXT,
  contact_person TEXT,
  position TEXT,
  name TEXT,
  financial_capacity TEXT,
  customer_rating INTEGER DEFAULT 0,
  status TEXT DEFAULT '公海',
  category TEXT DEFAULT '公海',
  follow_up_action TEXT,
  next_step TEXT,
  got_online_projects TEXT,
  pipeline_status TEXT,
  service_expiry_date TEXT,
  has_mini_game BOOLEAN DEFAULT false,
  mini_game_name TEXT,
  mini_game_platforms TEXT,
  mini_game_url TEXT,
  gpm_status TEXT,
  projects TEXT,
  requirement_list TEXT,
  owner_id BIGINT,
  project_link TEXT,
  notes TEXT,
  created_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  CONSTRAINT fk_customers_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at DESC);

-- ============================================
-- 3. 历史记录表 (next_step_history)
-- ============================================
CREATE TABLE IF NOT EXISTS next_step_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  next_step TEXT NOT NULL,
  created_by BIGINT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_history_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_history_customer_id ON next_step_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON next_step_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_created_by ON next_step_history(created_by);

-- ============================================
-- 4. 行业新闻表 (industry_news)
-- ============================================
CREATE TABLE IF NOT EXISTS industry_news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  publish_date TEXT,
  summary TEXT,
  relevance_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_source ON industry_news(source);
CREATE INDEX IF NOT EXISTS idx_news_publish_date ON industry_news(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_relevance_score ON industry_news(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_url ON industry_news(url);

-- ============================================
-- 5. 新闻收藏表 (news_favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS news_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  news_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_news FOREIGN KEY (news_id) REFERENCES industry_news(id) ON DELETE CASCADE,
  CONSTRAINT uq_favorites_user_news UNIQUE (user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON news_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_news_id ON news_favorites(news_id);

-- ============================================
-- 6. 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_industry_news_updated_at ON industry_news;
CREATE TRIGGER update_industry_news_updated_at
  BEFORE UPDATE ON industry_news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！
-- ============================================
-- 执行完成后，检查表是否创建成功：
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
-- ============================================

