# Vercel 部署说明

## 🚨 当前问题

前端已部署到 Vercel，但无法登录，因为后端服务器还在本地运行。

## ✅ 解决方案

### 方案 1：配置 Vercel 环境变量（推荐）

1. **登录 Vercel 控制台**
   - 访问 https://vercel.com
   - 进入你的项目设置

2. **添加环境变量**
   - 进入项目 → Settings → Environment Variables
   - 添加以下环境变量：
     ```
     VITE_API_URL = https://你的后端服务器地址/api
     ```
   
   例如：
   - 如果后端部署在 Railway: `https://your-app.railway.app/api`
   - 如果后端部署在 Render: `https://your-app.onrender.com/api`
   - 如果使用内网穿透: `https://your-backend-tunnel.trycloudflare.com/api`

3. **重新部署**
   - 在 Vercel 控制台点击 "Redeploy"
   - 或者推送新的代码到 Git

### 方案 2：部署后端到云服务

#### 选项 A：部署到 Railway（推荐，简单）

1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 创建新项目 → Deploy from GitHub repo
4. 选择你的仓库
5. 设置根目录为 `server`
6. 设置启动命令：`npm start`
7. 获取部署后的 URL
8. 在 Vercel 环境变量中设置 `VITE_API_URL` 为 `https://your-app.railway.app/api`

#### 选项 B：部署到 Render

1. 访问 https://render.com
2. 创建新的 Web Service
3. 连接 GitHub 仓库
4. 设置：
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
5. 获取 URL 并配置到 Vercel

#### 选项 C：使用内网穿透（临时方案）

如果后端暂时无法部署，可以使用内网穿透：

1. **在本地启动后端**：
   ```bash
   cd server
   npm start
   ```

2. **使用 Cloudflare Tunnel 暴露后端**：
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```
   会得到一个地址，例如：`https://xxxx.trycloudflare.com`

3. **在 Vercel 环境变量中设置**：
   ```
   VITE_API_URL = https://xxxx.trycloudflare.com/api
   ```

⚠️ **注意**：内网穿透地址会变化，且需要本地电脑一直运行。

### 方案 3：使用 Vercel Serverless Functions（高级）

可以将后端 API 改写为 Vercel Serverless Functions，这样前后端都在 Vercel 上。

## 🔍 检查当前配置

在浏览器控制台（F12）中运行：
```javascript
console.log('API Base URL:', localStorage.getItem('backend_url') || '使用默认配置');
```

## 📝 临时解决方案（仅用于测试）

如果暂时无法配置环境变量，可以在浏览器控制台手动设置：

1. 打开部署在 Vercel 的前端页面
2. 按 F12 打开开发者工具
3. 在 Console 中输入：
   ```javascript
   localStorage.setItem('backend_url', 'https://你的后端地址');
   location.reload();
   ```

⚠️ **注意**：这个设置只对当前浏览器有效，刷新页面后需要重新设置。

## 🎯 推荐流程

1. **短期**：使用内网穿透 + Vercel 环境变量
2. **长期**：将后端部署到 Railway 或 Render，然后配置 Vercel 环境变量

