# 创建 Supabase 表结构 - 详细步骤

## 📋 准备工作

1. 确保您已经登录 Supabase Dashboard
2. 项目 URL: `https://jpaurpkibrjwqthrcexc.supabase.co`
3. 准备好 SQL 文件（已为您创建）

## 🚀 执行步骤

### 方法1：使用 SQL Editor（推荐）

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 登录您的账号
   - 选择项目：`jpaurpkibrjwqthrcexc`

2. **进入 SQL Editor**
   - 在左侧菜单中找到 "SQL Editor"
   - 点击进入

3. **创建新查询**
   - 点击 "New query" 按钮
   - 或者直接使用默认的查询编辑器

4. **复制 SQL 文件内容**
   - 打开项目中的 `supabase_schema_simple.sql` 文件
   - 复制全部内容（Ctrl+A / Cmd+A，然后 Ctrl+C / Cmd+C）

5. **粘贴并执行**
   - 将 SQL 内容粘贴到 SQL Editor 中
   - 点击 "Run" 按钮（或按 Ctrl+Enter / Cmd+Enter）
   - 等待执行完成

6. **验证结果**
   - 在左侧菜单中找到 "Table Editor"
   - 应该能看到以下表：
     - ✅ `users`
     - ✅ `customers`
     - ✅ `next_step_history`
     - ✅ `industry_news`
     - ✅ `news_favorites`

### 方法2：使用 Table Editor（手动创建）

如果 SQL 执行遇到问题，可以手动创建表：

1. 进入 "Table Editor"
2. 点击 "New table"
3. 按照 `supabase_schema_simple.sql` 中的字段定义逐个创建

## ✅ 验证表是否创建成功

执行以下 SQL 查询来验证：

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'customers', 'next_step_history', 'industry_news', 'news_favorites')
ORDER BY table_name;
```

应该返回 5 行数据。

## 🔍 检查表结构

可以查看每个表的详细结构：

```sql
-- 查看 customers 表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

## ⚠️ 常见问题

### 问题1：外键约束错误
**错误信息**: `relation "users" does not exist`

**解决方案**: 
- 确保先创建 `users` 表
- 按照 SQL 文件中的顺序执行（users → customers → next_step_history）

### 问题2：唯一约束错误
**错误信息**: `duplicate key value violates unique constraint`

**解决方案**: 
- 表可能已经存在，可以先删除再创建：
```sql
DROP TABLE IF EXISTS news_favorites CASCADE;
DROP TABLE IF EXISTS next_step_history CASCADE;
DROP TABLE IF EXISTS industry_news CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
- 然后重新执行 `supabase_schema_simple.sql`

### 问题3：触发器创建失败
**错误信息**: `function update_updated_at_column() already exists`

**解决方案**: 
- 这是正常的，函数已存在
- 可以忽略这个错误，或者先删除函数：
```sql
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 📝 初始化测试数据（可选）

创建表后，可以插入一些测试数据：

```sql
-- 插入测试用户（密码需要先加密，这里只是示例）
-- 实际使用时，应该使用 bcrypt 加密后的密码
INSERT INTO users (username, password, role) 
VALUES 
  ('admin', '$2a$10$YourHashedPasswordHere', 'admin'),
  ('member1', '$2a$10$YourHashedPasswordHere', 'member')
ON CONFLICT (username) DO NOTHING;
```

## 🎉 完成后的下一步

1. ✅ 表结构已创建
2. ⏳ 测试 Supabase 连接（应用启动时会自动测试）
3. ⏳ 开始使用 Supabase 服务
4. ⏳ 迁移现有数据（如果需要）

## 📞 需要帮助？

如果遇到问题：
1. 检查 Supabase Dashboard 中的错误日志
2. 查看 SQL Editor 中的执行结果
3. 确认项目 URL 和密钥是否正确

