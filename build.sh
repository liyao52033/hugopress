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
rm -rf dist
# 运行 Hugo 构建（包含 PostCSS 处理和 JS 资源管道处理）
echo "正在运行 Hugo 构建..."
HUGO_ENVIRONMENT=production yarn run build

echo "✅ 打包完成"
