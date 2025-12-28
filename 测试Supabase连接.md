# 测试 Supabase 连接 - 完整指南

## 🎯 测试方法总览

有多种方式可以测试 Supabase 连接，从简单到复杂：

1. **浏览器控制台测试**（最快）
2. **HTML测试页面**（可视化）
3. **应用内测试**（集成测试）
4. **SQL Editor测试**（数据库层面）

---

## 方法1：浏览器控制台测试（推荐，最快）

### 步骤：

1. **打开您的应用页面**（http://localhost:5173）
2. **打开浏览器开发者工具**（F12 或 Cmd+Option+I）
3. **切换到 Console 标签**
4. **粘贴并执行以下代码**：

```javascript
// 检查Supabase是否已加载
if (window.supabase) {
  console.log('✅ Supabase已加载');
  
  // 创建客户端
  const supabase = window.supabase.createClient(
    'https://jpaurpkibrjwqthrcexc.supabase.co',
    'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB'
  );
  
  // 测试连接 - 查询customers表
  supabase.from('customers').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ 表不存在，但连接正常（需要先创建表）');
        } else {
          console.error('❌ 连接失败:', error);
        }
      } else {
        console.log('✅ 连接成功！可以访问数据库');
        console.log('数据:', data);
      }
    });
} else {
  console.error('❌ Supabase未加载，请检查index.html');
}
```

### 预期结果：

- ✅ **成功**: 看到 "连接成功！可以访问数据库"
- ⚠️ **表不存在**: 看到 "表不存在，但连接正常"（这是正常的，如果表还没创建）
- ❌ **失败**: 看到错误信息

---

## 方法2：使用HTML测试页面（可视化）

### 步骤：

1. **打开项目中的测试文件**：
   - 文件位置：`test_supabase_connection.html`
   - 在浏览器中打开（双击文件，或拖到浏览器）

2. **点击测试按钮**：
   - "测试基本连接" - 测试连接是否正常
   - "检查表是否存在" - 检查所有表
   - "测试查询表" - 测试查询功能
   - "测试插入数据" - 测试写入功能
   - "运行所有测试" - 一键测试所有功能

3. **查看测试结果**：
   - 绿色 = 成功 ✅
   - 红色 = 失败 ❌
   - 蓝色 = 信息 ℹ️

---

## 方法3：应用内测试（集成测试）

### 步骤：

1. **启动应用**：
```bash
cd client
npm run dev
```

2. **打开应用**：http://localhost:5173

3. **查看浏览器控制台**：
   - 应用启动时会自动测试连接
   - 应该看到：`✅ Supabase 连接成功！` 或 `⚠️ Supabase 连接失败`

4. **手动测试**（在浏览器控制台）：
```javascript
// 使用应用中的Supabase客户端
import { testSupabaseConnection } from './services/supabase';
testSupabaseConnection().then(success => {
  console.log(success ? '✅ 连接成功' : '❌ 连接失败');
});
```

---

## 方法4：SQL Editor测试（数据库层面）

### 步骤：

1. **打开 Supabase Dashboard**
2. **进入 SQL Editor**
3. **执行以下查询**：

```sql
-- 测试1: 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'customers';

-- 测试2: 查询表数据
SELECT COUNT(*) as total FROM customers;

-- 测试3: 查看表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;
```

---

## 🔍 常见测试场景

### 场景1：测试基本连接

```javascript
const supabase = window.supabase.createClient(
  'https://jpaurpkibrjwqthrcexc.supabase.co',
  'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB'
);

// 简单查询
supabase.from('customers').select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ 错误:', error);
    } else {
      console.log('✅ 连接成功');
    }
  });
```

### 场景2：测试表是否存在

```javascript
const tables = ['users', 'customers', 'next_step_history'];

for (const table of tables) {
  supabase.from(table).select('count').limit(1)
    .then(({ error }) => {
      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table} 表不存在`);
      } else {
        console.log(`✅ ${table} 表存在`);
      }
    });
}
```

### 场景3：测试插入数据

```javascript
const testData = {
  customer_name: '测试客户',
  company_name: '测试公司',
  category: '公海'
};

supabase.from('customers').insert([testData])
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ 插入失败:', error);
    } else {
      console.log('✅ 插入成功:', data);
    }
  });
```

### 场景4：测试查询数据

```javascript
supabase.from('customers')
  .select('*')
  .limit(10)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ 查询失败:', error);
    } else {
      console.log('✅ 查询成功，找到', data.length, '条记录');
      console.log('数据:', data);
    }
  });
```

---

## ✅ 成功标志

如果看到以下任何一条，说明连接成功：

1. ✅ `Supabase 连接成功！`
2. ✅ `可以访问数据库`
3. ✅ `查询成功`
4. ✅ 能够查询到数据（即使表是空的）

---

## ❌ 常见错误及解决方案

### 错误1: `Supabase客户端未初始化`

**原因**: index.html 中未正确加载 Supabase 脚本

**解决**: 检查 `client/index.html` 中是否有：
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 错误2: `relation "customers" does not exist` (PGRST116)

**原因**: 表还未创建

**解决**: 在 Supabase Dashboard 的 SQL Editor 中执行 `supabase_schema_simple.sql`

### 错误3: `Invalid API key`

**原因**: API密钥错误

**解决**: 检查 Supabase URL 和 Key 是否正确

### 错误4: `Network Error` 或 `CORS Error`

**原因**: 网络问题或CORS配置

**解决**: 
- 检查网络连接
- 检查 Supabase 项目设置中的 CORS 配置

---

## 🎯 快速测试清单

- [ ] 打开浏览器控制台
- [ ] 检查 `window.supabase` 是否存在
- [ ] 执行基本连接测试
- [ ] 检查表是否存在
- [ ] 测试查询功能
- [ ] 测试插入功能（可选）

---

## 📞 需要帮助？

如果测试失败，请提供：
1. 错误信息（完整）
2. 使用的测试方法
3. 浏览器控制台的完整输出

