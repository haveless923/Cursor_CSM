#!/bin/bash

# CSM 系统启动脚本

echo "检查 Node.js 环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js"
    echo "   访问 https://nodejs.org/ 下载安装"
    echo "   或使用 Homebrew: brew install node"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装根目录依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装服务器依赖..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装客户端依赖..."
    cd client && npm install && cd ..
fi

echo ""
echo "🚀 启动开发服务器..."
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3001"
echo ""

npm run dev



