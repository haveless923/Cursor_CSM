#!/bin/bash

# 使用 localtunnel 快速启动（无需安装额外工具）

echo "=========================================="
echo "CSM 系统外网访问 - 使用 localtunnel"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js"
    exit 1
fi

echo "✅ Node.js 已安装"
echo ""
echo "⚠️  确保本地服务正在运行："
echo "   cd /Users/bonnie/CSM_Cursor"
echo "   npm run dev"
echo ""
read -p "按回车键继续..."

echo ""
echo "=========================================="
echo "正在启动 localtunnel..."
echo "=========================================="
echo ""
echo "📌 下方会显示一个地址，例如："
echo "   https://xxxx.loca.lt"
echo ""
echo "   将这个地址告诉同事即可访问！"
echo ""
echo "   按 Ctrl+C 停止"
echo ""

# 启动 localtunnel
npx localtunnel --port 3000




