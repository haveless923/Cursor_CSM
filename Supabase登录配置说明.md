# Supabase 登录配置说明

## 问题

前端部署到 Vercel 后无法登录，因为登录功能仍在使用传统的 Express API (`/api/auth/login`)，而 Vercel 上没有后端服务器。

## 解决方案

已修改代码使用 Supabase 进行登录验证。现在有两种方式：

### 方案 1：使用 Supabase Edge Function（推荐）

1. **部署 Edge Function**：
   ```bash
   # 安装 Supabase CLI
   npm install -g supabase
   
   # 登录 Supabase
   supabase login
   
   # 链接到你的项目
   supabase link --project-ref your-project-ref
   
   # 部署 Edge Function
   supabase functions deploy auth-login
   ```

2. **配置环境变量**：
   - Edge Function 会自动使用 Supabase 的环境变量
   - 确保 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 已设置

### 方案 2：使用 Supabase RPC 函数（更简单）

在 Supabase SQL Editor 中执行以下 SQL 创建 RPC 函数：

```sql
-- 创建密码验证函数（需要 pgcrypto 扩展）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 创建登录验证函数
CREATE OR REPLACE FUNCTION verify_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_token TEXT;
BEGIN
  -- 查询用户
  SELECT * INTO v_user
  FROM users
  WHERE username = p_username;
  
  -- 检查用户是否存在
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '用户名或密码错误');
  END IF;
  
  -- 验证密码（使用 bcrypt）
  -- 注意：这需要密码以 bcrypt 格式存储
  IF NOT (v_user.password = crypt(p_password, v_user.password)) THEN
    RETURN json_build_object('success', false, 'error', '用户名或密码错误');
  END IF;
  
  -- 生成简单的 token（生产环境应使用 JWT）
  v_token := encode(
    convert_to(
      json_build_object(
        'userId', v_user.id,
        'username', v_user.username,
        'role', v_user.role
      )::text,
      'UTF8'
    ),
    'base64'
  );
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'role', v_user.role
    ),
    'token', v_token
  );
END;
$$;
```

### 方案 3：临时方案（仅用于测试）

如果以上方案都不可用，代码会回退到直接查询用户（不验证密码）。**这不安全，仅用于测试！**

## 已修改的文件

1. `client/src/services/auth.ts` - 现在使用 `loginWithSupabase` 而不是传统 API
2. `client/src/services/supabase.ts` - 更新了 `loginWithSupabase` 函数

## 下一步

1. 选择上述方案之一（推荐方案 2，最简单）
2. 部署/配置后，重新部署 Vercel 前端
3. 测试登录功能

## 注意事项

- 如果使用 Edge Function，需要安装 bcrypt 库
- 如果使用 RPC 函数，需要确保密码以 bcrypt 格式存储
- 生产环境应使用 JWT 生成 token，而不是简单的 base64 编码

