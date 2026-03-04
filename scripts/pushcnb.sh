#!/bin/bash

# 强制手动输入 commit 信息
# read -p "请输入 commit 信息: " msg
# if [ -z "$msg" ]; then
#   echo "必须输入 commit 信息，脚本退出。"
#   exit 1
# fi

# 检查当前分支
branch=$(git branch --show-current)
if [ "$branch" != "bg" ]; then
  echo "当前分支不是 bg，请切换到 bg 分支再执行此脚本。"
  exit 1
fi

echo "分支检查通过"

# 检查是否有改动
# if git diff-index --quiet HEAD --; then
#   echo "没有未提交的改动，直接 push 到 CNB main..."
# else
#   git add .
#   git commit -m "$msg"
# fi

# push 到 CNB main
git push cnb bg:main

# git push origin bg
# git push -u origin bg

