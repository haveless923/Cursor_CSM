# 手动安装 cloudflared

由于自动安装遇到网络问题，请按照以下步骤手动安装：

## 方法一：使用 Homebrew（推荐）

1. **先安装 Homebrew**（如果还没有）：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装 cloudflared**：
   ```bash
   brew install cloudflared
   ```

## 方法二：直接下载二进制文件

1. **访问下载页面**：
   - 打开浏览器访问：https://github.com/cloudflare/cloudflared/releases/latest
   - 找到 `cloudflared-darwin-arm64`（Apple Silicon）或 `cloudflared-darwin-amd64`（Intel）

2. **下载并安装**：
   ```bash
   # 下载到当前目录
   cd /Users/bonnie/CSM_Cursor
   
   # 下载（Apple Silicon）
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64 -o cloudflared
   
   # 或下载（Intel）
   # curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64 -o cloudflared
   
   # 添加执行权限
   chmod +x cloudflared
   
   # 移动到系统路径（可选）
   # sudo mv cloudflared /usr/local/bin/
   ```

3. **使用**：
   ```bash
   # 如果移动到了系统路径
   cloudflared tunnel --url http://localhost:3000
   
   # 或者使用当前目录的文件
   ./cloudflared tunnel --url http://localhost:3000
   ```

## 方法三：使用其他内网穿透工具

如果 cloudflared 安装困难，可以使用：

### ngrok（需要注册）

1. 访问 https://ngrok.com/ 注册账号
2. 下载：https://ngrok.com/download
3. 配置：`ngrok config add-authtoken 你的token`
4. 使用：`ngrok http 3000`

### localtunnel（无需安装，使用 npm）

```bash
# 如果已安装 Node.js
npx localtunnel --port 3000
```

---

## 安装完成后

运行以下命令启动内网穿透：

```bash
cloudflared tunnel --url http://localhost:3000
```

会显示一个地址，例如：`https://xxxx.trycloudflare.com`

将这个地址告诉同事即可！



