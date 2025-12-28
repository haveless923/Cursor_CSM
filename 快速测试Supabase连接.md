# 快速测试 Supabase 连接

## 🚨 问题：file:// 协议的限制

直接通过 `file://` 打开HTML文件可能会有以下问题：
1. CORS限制
2. 某些浏览器安全策略
3. Supabase CDN可能无法加载

## ✅ 解决方案

### 方法1：通过HTTP服务器访问（推荐）

我已经为您启动了一个本地服务器：

1. **访问测试页面**：
   ```
   http://localhost:8080/test_supabase_simple.html
   ```

2. **或者访问完整测试页面**：
   ```
   http://localhost:8080/test_supabase_connection.html
   ```

### 方法2：在应用内测试（最简单）

1. **启动应用**：
   ```bash
   cd client
   npm run dev
   ```

2. **打开浏览器控制台**（F12）

3. **执行以下代码**：
   ```javascript
   // 检查Supabase是否加载
   console.log('Supabase对象:', window.supabase);
   
   // 如果存在，测试连接
   if (window.supabase) {
     const supabase = window.supabase.createClient(
       'https://jpaurpkibrjwqthrcexc.supabase.co',
       'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB'
     );
     
     // 测试查询
     supabase.from('customers').select('count').limit(1)
       .then(({ data, error }) => {
         if (error) {
           if (error.code === 'PGRST116') {
             console.log('⚠️ 连接正常，但表不存在（需要先创建表）');
           } else {
             console.error('❌ 连接失败:', error);
           }
         } else {
           console.log('✅ 连接成功！', data);
         }
       });
   } else {
     console.error('❌ Supabase未加载');
   }
   ```

### 方法3：使用简化测试页面

我已经创建了一个更简单的测试页面：`test_supabase_simple.html`

通过HTTP服务器访问：
```
http://localhost:8080/test_supabase_simple.html
```

## 🔍 诊断步骤

### 步骤1：检查Supabase脚本是否加载

在浏览器控制台执行：
```javascript
console.log(typeof window.supabase);
```

- 如果显示 `"object"` → ✅ 脚本已加载
- 如果显示 `"undefined"` → ❌ 脚本未加载

### 步骤2：检查网络请求

1. 打开开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 查找 `supabase-js` 的请求
   - 如果状态是 200 → ✅ 加载成功
   - 如果失败 → ❌ 网络问题

### 步骤3：测试基本连接

```javascript
// 在浏览器控制台执行
const supabase = window.supabase.createClient(
  'https://jpaurpkibrjwqthrcexc.supabase.co',
  'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB'
);

supabase.from('customers').select('count')
  .then(({ data, error }) => {
    console.log('结果:', { data, error });
  });
```

## 📊 预期结果

### ✅ 连接成功
- 看到 `data: []` 或 `data: [{...}]`
- 或者 `error.code === 'PGRST116'`（表不存在，但连接正常）

### ❌ 连接失败
- 网络错误
- CORS错误
- 认证错误

## 🎯 推荐操作

**最快的方法**：在应用内测试

1. 确保应用正在运行（`npm run dev`）
2. 打开 http://localhost:5173
3. 按 F12 打开控制台
4. 执行上面的测试代码

这样可以直接使用应用中的Supabase配置，最可靠！

