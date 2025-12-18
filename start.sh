#!/usr/bin/env bash

# 加载 .env 文件
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo "✅ .env 文件已加载"
else
  echo "⚠️ 未找到 .env 文件，将使用系统环境变量"
fi

# 检查 hugo 是否安装
if ! command -v hugo &> /dev/null; then
  echo "❌ hugo 命令未找到，请先安装 Hugo"
  exit 1
fi

yarn run dev:prod
