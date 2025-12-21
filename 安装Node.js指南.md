# Node.js 安装指南

## 方法一：使用 Homebrew 安装（推荐，macOS）

### 1. 安装 Homebrew（如果还没有）

在终端运行：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安装过程中会要求输入密码。

### 2. 安装 Node.js

```bash
brew install node
```

### 3. 验证安装

```bash
node -v
npm -v
```

应该能看到版本号，例如：
- node v20.x.x
- npm 10.x.x

---

## 方法二：直接下载安装包（最简单）

### 1. 访问 Node.js 官网

打开浏览器访问：https://nodejs.org/

### 2. 下载 LTS 版本

- 点击下载 "LTS"（长期支持版本）
- 选择 macOS 安装包（.pkg 文件）

### 3. 安装

- 双击下载的 .pkg 文件
- 按照安装向导完成安装
- 安装完成后重启终端

### 4. 验证安装

打开新的终端窗口，运行：
```bash
node -v
npm -v
```

---

## 方法三：使用 nvm（Node Version Manager）

如果你需要管理多个 Node.js 版本：

### 1. 安装 nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### 2. 重新加载 shell 配置

```bash
source ~/.zshrc
# 或
source ~/.bash_profile
```

### 3. 安装 Node.js

```bash
nvm install --lts
nvm use --lts
```

### 4. 验证安装

```bash
node -v
npm -v
```

---

## 安装完成后

安装完 Node.js 后，回到项目目录运行：

```bash
cd /Users/bonnie/CSM_Cursor
./start.sh
```

或者手动启动：

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
npm run dev
```

---

## 常见问题

### 问题1：命令找不到

如果安装后仍然提示 `node: command not found`：

1. 关闭并重新打开终端
2. 检查 PATH 环境变量：
   ```bash
   echo $PATH
   ```
3. 如果使用 Homebrew，可能需要添加路径：
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
   source ~/.zshrc
   ```

### 问题2：权限问题

如果遇到权限错误，可能需要使用 sudo（不推荐）：
```bash
sudo npm install -g npm
```

### 问题3：版本问题

确保安装的 Node.js 版本 >= 16.0.0：
```bash
node -v  # 应该显示 v16.x.x 或更高版本
```

---

## 推荐版本

- **Node.js**: v18.x.x 或 v20.x.x (LTS)
- **npm**: 会自动随 Node.js 一起安装

安装完成后，运行 `./start.sh` 启动项目！



