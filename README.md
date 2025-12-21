# CSM 客户成功管理系统

一个支持离线编辑和云端同步的智能客户成功管理系统。

## 功能特性

1. **离线/在线编辑**
   - 支持本地编辑和保存
   - 离线状态下可正常使用
   - 联网后自动同步到服务器

2. **用户管理系统**
   - 管理员账号（admin）
   - 5个成员账号（member1-5）
   - 基于JWT的认证机制

3. **客户记录管理**
   - 完整的CRUD操作
   - 字段包括：客户姓名、到期日期、联系人、名称、状态、跟进动作、Next Step、提测频率、最近提测、GPM、PPL使用等
   - 支持筛选和搜索
   - 表格视图展示

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- SQLite（本地数据库）
- JWT认证
- bcrypt密码加密

### 前端
- React + TypeScript
- Vite
- Ant Design UI组件库
- Dexie (IndexedDB) 本地存储
- React Router

## 安装和运行

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0

检查是否已安装：
```bash
node -v
npm -v
```

如果没有安装，请访问 https://nodejs.org/ 下载安装。

### 1. 安装依赖

**方法一：使用启动脚本（推荐）**
```bash
chmod +x start.sh
./start.sh
```
脚本会自动检查环境并安装所有依赖。

**方法二：手动安装**
```bash
# 安装根目录依赖
npm install

# 安装服务器依赖
cd server && npm install && cd ..

# 安装客户端依赖
cd client && npm install && cd ..
```

### 2. 配置环境变量（可选）

在 `server` 目录下创建 `.env` 文件（可选，有默认值）：

```env
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

### 3. 运行项目

**方法一：使用启动脚本**
```bash
./start.sh
```

**方法二：使用 npm 命令**
```bash
# 在根目录运行（同时启动前后端）
npm run dev

# 或分别启动
npm run dev:server  # 后端：http://localhost:3001
npm run dev:client  # 前端：http://localhost:3000
```

### 4. 访问系统

启动成功后：
- 前端地址：http://localhost:3000
- 后端地址：http://localhost:3001

在浏览器打开 http://localhost:3000 即可使用。

### 5. 常见问题

**无法打开 http://localhost:3000？**

1. 检查 Node.js 是否安装：`node -v`
2. 检查依赖是否安装：确认 `node_modules` 目录存在
3. 检查端口是否被占用
4. 查看终端错误信息
5. 详细说明请查看 `启动说明.md`

## 默认账号

- **管理员**：`admin` / `admin123`
- **成员1**：`member1` / `member1123`
- **成员2**：`member2` / `member2123`
- **成员3**：`member3` / `member3123`
- **成员4**：`member4` / `member4123`
- **成员5**：`member5` / `member5123`

## 数据同步机制

1. **本地优先**：所有操作先保存到本地IndexedDB
2. **自动同步**：每30秒自动同步一次（仅在在线时）
3. **手动同步**：点击"同步"按钮手动触发同步
4. **网络监听**：网络恢复时自动触发同步

## 项目结构

```
CSM_Cursor/
├── client/              # 前端应用
│   ├── src/
│   │   ├── db/         # 本地数据库（Dexie）
│   │   ├── services/   # API服务和同步逻辑
│   │   ├── pages/      # 页面组件
│   │   └── App.tsx     # 主应用
│   └── package.json
├── server/              # 后端服务
│   ├── src/
│   │   ├── db.ts       # 数据库配置
│   │   ├── routes/     # API路由
│   │   ├── middleware/ # 中间件
│   │   └── index.ts    # 服务器入口
│   └── package.json
├── data/                # 数据库文件（自动创建）
└── package.json         # 根配置
```

## 开发说明

- 数据库文件会自动创建在 `server/data/csm.db`
- 首次运行会自动创建默认用户账号
- 前端使用代理将 `/api` 请求转发到后端

## 后续扩展建议

1. 添加字段管理功能（动态字段配置）
2. 添加数据导出功能（Excel/CSV）
3. 添加权限管理（不同角色不同权限）
4. 添加数据统计和报表功能
5. 添加评论和子任务功能
6. 支持多租户（不同团队独立数据）


