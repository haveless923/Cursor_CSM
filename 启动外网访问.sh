#!/bin/bash

# CSM 系统外网访问启动脚本

echo "=========================================="
echo "CSM 系统外网访问配置"
echo "=========================================="
echo ""

# 检查是否安装了 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ 未找到 cloudflared"
    echo ""
    echo "请先安装 cloudflared："
    echo "  brew install cloudflared"
    echo ""
    echo "或者使用 ngrok："
    echo "  brew install ngrok"
    echo "  然后访问 https://ngrok.com/ 注册获取token"
    echo ""
    exit 1
fi

echo "✅ 找到 cloudflared"
echo ""
echo "正在启动内网穿透..."
echo ""

# 启动前端穿透
echo "前端服务 (端口 3000):"
cloudflared tunnel --url http://localhost:3000 &
FRONTEND_PID=$!
sleep 2

# 启动后端穿透
echo "后端服务 (端口 3001):"
cloudflared tunnel --url http://localhost:3001 &
BACKEND_PID=$!
sleep 2

echo ""
echo "=========================================="
echo "✅ 内网穿透已启动"
echo "=========================================="
echo ""
echo "请查看上面的 cloudflared 输出，找到类似以下格式的地址："
echo "  https://xxxx-xx-xx-xx-xx.trycloudflare.com"
echo ""
echo "⚠️  注意："
echo "  1. 前端地址：告诉同事访问这个地址"
echo "  2. 后端地址：需要配置到前端（见下方说明）"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT TERM
wait




