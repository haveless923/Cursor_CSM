#!/bin/bash

echo "=========================================="
echo "CSM 系统外网访问 - 快速解决方案"
echo "=========================================="
echo ""

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 正在安装 cloudflared..."
    brew install cloudflared
    if [ $? -ne 0 ]; then
        echo "❌ 安装失败，请手动运行: brew install cloudflared"
        exit 1
    fi
    echo "✅ 安装完成"
    echo ""
fi

echo "✅ cloudflared 已安装"
echo ""
echo "⚠️  重要：请确保本地服务正在运行！"
echo "   如果没有运行，请先执行: npm run dev"
echo ""
read -p "按回车键继续..."

echo ""
echo "=========================================="
echo "正在启动内网穿透..."
echo "=========================================="
echo ""
echo "📌 前端服务 (端口 3000):"
echo "   下方会显示一个 https://xxxx.trycloudflare.com 的地址"
echo "   将这个地址告诉同事即可访问！"
echo ""
echo "   按 Ctrl+C 停止"
echo ""

# 启动前端穿透
cloudflared tunnel --url http://localhost:3000



