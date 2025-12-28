# Supabase 集成说明

## 📋 已完成的工作

### 1. HTML集成
- ✅ 在 `client/index.html` 中添加了 Supabase CDN 脚本
- ✅ 初始化了 Supabase 客户端（使用您提供的 URL 和密钥）

### 2. 服务文件创建
- ✅ `client/src/services/supabase.ts` - Supabase 核心服务文件
- ✅ `client/src/services/supabaseCustomers.ts` - 与现有 customers.ts 兼容的包装器

## 🔧 Supabase 服务功能

### 客户相关操作
- `getCustomersFromSupabase()` - 获取客户列表
- `createCustomerInSupabase()` - 创建客户
- `updateCustomerInSupabase()` - 更新客户
- `deleteCustomerFromSupabase()` - 删除客户

### 用户相关操作
- `loginWithSupabase()` - 用户登录
- `getCurrentUserFromSupabase()` - 获取当前用户信息

### 历史记录相关操作
- `getNextStepHistoryFromSupabase()` - 获取历史记录
- `createNextStepHistoryInSupabase()` - 创建历史记录

### 工具函数
- `getSupabaseClient()` - 获取 Supabase 客户端
- `testSupabaseConnection()` - 测试 Supabase 连接

## 📊 数据库表结构要求

在 Supabase 中需要创建以下表：

### 1. customers 表
```sql
CREATE TABLE customers (
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
  synced_at TIMESTAMPTZ
);
```

### 2. users 表
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. next_step_history 表
```sql
CREATE TABLE next_step_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  next_step TEXT NOT NULL,
  created_by BIGINT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 使用方式

### 方式1：直接使用 Supabase 服务（推荐用于新功能）

```typescript
import { 
  getCustomersFromSupabase, 
  createCustomerInSupabase 
} from '../services/supabase';

// 获取客户
const customers = await getCustomersFromSupabase({ category: '结单' });

// 创建客户
const newCustomer = await createCustomerInSupabase({
  customer_name: '测试客户',
  company_name: '测试公司',
  // ... 其他字段
});
```

### 方式2：使用兼容包装器（保持现有代码不变）

```typescript
// 在 customers.ts 中，可以逐步替换导入
// 从: import { getCustomers } from './customers';
// 到: import { getCustomers } from './supabaseCustomers';

// 现有代码无需修改，API完全兼容
const customers = await getCustomers({ category: '结单' });
```

## 🔄 迁移步骤

### 步骤1：在 Supabase 中创建表
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行上面的 SQL 语句创建表

### 步骤2：测试连接
```typescript
import { testSupabaseConnection } from './services/supabase';

// 在应用启动时测试
testSupabaseConnection().then(success => {
  if (success) {
    console.log('Supabase 连接成功！');
  } else {
    console.error('Supabase 连接失败！');
  }
});
```

### 步骤3：逐步迁移
1. 先在 Supabase 中创建表并测试连接
2. 可以选择性地使用 `supabaseCustomers.ts` 替换现有的 `customers.ts`
3. 或者直接在新功能中使用 Supabase 服务

## ⚙️ 配置说明

Supabase 配置已在 `client/index.html` 中设置：
- URL: `https://jpaurpkibrjwqthrcexc.supabase.co`
- Key: `sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB`

## 🔒 安全注意事项

1. **Row Level Security (RLS)**: 建议在 Supabase 中启用 RLS 策略
2. **API Key**: 当前使用的是 publishable key，适合前端使用
3. **密码加密**: 如果使用 Supabase Auth，密码会自动加密；如果使用自定义用户表，需要自己处理加密

## 📝 下一步

1. ✅ Supabase 客户端已集成
2. ⏳ 在 Supabase Dashboard 中创建表结构
3. ⏳ 测试连接和基本操作
4. ⏳ 逐步迁移现有功能到 Supabase
5. ⏳ 配置 RLS 策略（可选）

## 🐛 故障排除

### 问题1: Supabase 客户端未初始化
**解决方案**: 确保 `index.html` 中已正确加载 Supabase 脚本

### 问题2: 表不存在错误
**解决方案**: 在 Supabase Dashboard 中创建对应的表

### 问题3: 权限错误
**解决方案**: 检查 Supabase 的 RLS 策略，确保允许相应的操作

## 📚 参考资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)

