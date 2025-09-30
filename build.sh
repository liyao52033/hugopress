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
yarn run clean && yarn run build
echo "✅ 打包完成"
