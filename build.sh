# build.sh（生产打包用）
#!/usr/bin/env bash
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo "✅ .env 文件已加载"
else
  echo "⚠️ 未找到 .env 文件，将使用系统环境变量"
fi
if ! command -v hugo &> /dev/null; then
  echo "❌ hugo 命令未找到，请先安装 Hugo"
  exit 1
fi
echo "🔨 开始打包..."

# 1. 优化 JavaScript 文件
echo "📦 正在优化 JavaScript 文件..."
yarn run build:js
yarn run build:js:theme

# 2. 运行 Hugo 构建
echo "🏗️ 正在运行 Hugo 构建..."
yarn run build

# 3. 优化 CSS 文件（使用 PostCSS + PurgeCSS）
echo "🎨 正在优化 CSS 文件..."
postcss dist/**/*.css --dir dist/ --env production

# 4. 清理临时文件（可选，根据需要添加）
echo "🧹 正在清理临时文件..."
rm -rf static/js/dist static/js/theme

echo "✅ 打包完成"
