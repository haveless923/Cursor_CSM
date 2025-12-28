#!/bin/bash

# 使用 ngrok 启动外网访问

echo "=========================================="
echo "CSM 系统外网访问 (使用 ngrok)"
echo "=========================================="
echo ""

# 检查是否安装了 ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ 未找到 ngrok"
    echo ""
    echo "请先安装 ngrok："
    echo "  brew install ngrok"
    echo ""
    echo "然后注册账号并配置："
    echo "  1. 访问 https://ngrok.com/ 注册"
    echo "  2. 获取 authtoken"
    echo "  3. 运行: ngrok config add-authtoken 你的token"
    echo ""
    exit 1
fi

echo "✅ 找到 ngrok"
echo ""
echo "⚠️  重要提示："
echo "  由于前端和后端分离，需要同时穿透两个端口"
echo "  建议使用 ngrok 的配置文件方式（见 ngrok.yml）"
echo ""
echo "或者分别启动两个终端："
echo "  终端1: ngrok http 3000  (前端)"
echo "  终端2: ngrok http 3001  (后端)"
echo ""
echo "然后修改前端配置中的 API 地址为后端 ngrok 地址"
echo ""

# 启动前端
echo "正在启动前端穿透 (端口 3000)..."
echo "访问地址将在下方显示"
echo ""
ngrok http 3000




