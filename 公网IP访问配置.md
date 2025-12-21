# 公网IP直接访问配置指南

参考 http://58.33.84.228:5173/ 的实现方式，配置系统通过公网IP直接访问。

## 🎯 实现效果

- 前端：`http://你的公网IP:3000`
- 后端：`http://你的公网IP:3001`
- 同事直接通过公网IP访问，无需内网穿透

## 📋 配置步骤

### 方案一：如果你有公网IP的服务器

#### 1. 在服务器上部署

```bash
# 上传代码到服务器
scp -r /Users/bonnie/CSM_Cursor user@你的服务器IP:/path/to/

# SSH登录服务器
ssh user@你的服务器IP

# 安装依赖
cd /path/to/CSM_Cursor
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 启动服务
npm run dev
```

#### 2. 配置防火墙

```bash
# 开放端口（以Ubuntu为例）
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

#### 3. 访问

- 前端：`http://你的公网IP:3000`
- 后端API会自动使用：`http://你的公网IP:3001`

---

### 方案二：本地电脑有公网IP（路由器端口转发）

如果你的本地电脑有公网IP，需要配置路由器端口转发。

#### 1. 获取你的公网IP

```bash
# 查看公网IP
curl ifconfig.me
# 或访问 https://whatismyipaddress.com/
```

#### 2. 配置路由器端口转发

1. 登录路由器管理界面（通常是 192.168.1.1）
2. 找到"端口转发"或"虚拟服务器"设置
3. 添加规则：
   - **前端端口**：外部端口 3000 → 内部端口 3000 → 你的内网IP（如 172.20.10.2）
   - **后端端口**：外部端口 3001 → 内部端口 3001 → 你的内网IP
4. 保存设置

#### 3. 配置macOS防火墙

```bash
# 允许Node.js接收传入连接
# 系统设置 > 网络 > 防火墙 > 选项 > 允许传入连接
```

#### 4. 启动服务

```bash
cd /Users/bonnie/CSM_Cursor
npm run dev
```

#### 5. 访问

- 前端：`http://你的公网IP:3000`
- 系统会自动使用 `http://你的公网IP:3001` 作为后端API

---

### 方案三：使用云服务器（推荐长期使用）

#### 推荐云服务商

1. **阿里云** - https://www.aliyun.com/
2. **腾讯云** - https://cloud.tencent.com/
3. **AWS** - https://aws.amazon.com/
4. **DigitalOcean** - https://www.digitalocean.com/（国外）

#### 部署步骤

1. **购买云服务器**
   - 选择配置：1核2G内存即可
   - 操作系统：Ubuntu 22.04 或 CentOS 7+

2. **配置安全组**
   - 开放端口：3000（前端）、3001（后端）
   - 开放SSH端口：22

3. **部署代码**
   ```bash
   # 在服务器上
   git clone 你的代码仓库
   # 或使用 scp 上传
   
   cd CSM_Cursor
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

4. **使用 PM2 保持服务运行**
   ```bash
   npm install -g pm2
   
   # 启动后端
   cd server
   pm2 start "npm run dev" --name csm-server
   
   # 启动前端
   cd ../client
   pm2 start "npm run dev" --name csm-client
   
   # 查看状态
   pm2 status
   ```

5. **配置域名（可选）**
   - 购买域名
   - 配置DNS解析到服务器IP
   - 使用Nginx反向代理

---

## 🔧 当前配置说明

我已经修改了代码，使其能够：

1. **自动检测访问方式**：
   - 如果通过IP地址访问（如 `http://58.33.84.228:3000`）
   - 后端API会自动使用相同IP的3001端口（`http://58.33.84.228:3001`）

2. **服务器配置**：
   - 前端：监听 `0.0.0.0:3000`（所有网络接口）
   - 后端：监听 `0.0.0.0:3001`（所有网络接口）

3. **代理配置**：
   - 如果通过域名访问，使用Vite代理（`/api` → `localhost:3001`）
   - 如果通过IP访问，直接使用IP:3001

---

## ⚠️ 重要提示

1. **安全性**：
   - 公网IP暴露意味着任何人都可以访问
   - 建议添加：
     - 登录验证（已有）
     - HTTPS加密（使用Nginx + Let's Encrypt）
     - 防火墙限制IP访问

2. **稳定性**：
   - 本地电脑关机后无法访问
   - 建议使用云服务器或保持电脑24小时运行

3. **性能**：
   - 本地电脑作为服务器，性能有限
   - 多人同时访问可能影响电脑性能

---

## 🚀 快速测试

1. **获取你的公网IP**：
   ```bash
   curl ifconfig.me
   ```

2. **确保服务运行**：
   ```bash
   cd /Users/bonnie/CSM_Cursor
   npm run dev
   ```

3. **配置端口转发**（如果有路由器）

4. **访问测试**：
   - 在浏览器输入：`http://你的公网IP:3000`
   - 应该能看到登录页面

---

## 📝 总结

参考 http://58.33.84.228:5173/ 的实现：
- ✅ 前端通过公网IP:3000访问
- ✅ 后端API自动使用公网IP:3001
- ✅ 代码已配置自动检测
- ✅ 只需配置网络和防火墙

**现在你可以：**
1. 获取公网IP
2. 配置端口转发（如果需要）
3. 启动服务
4. 告诉同事访问地址

需要我帮你检查当前配置或准备部署脚本吗？



