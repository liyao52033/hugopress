# AGENTS.md - HugoPress 项目开发指南

## 一、项目概述

- **项目类型**: Hugo 静态网站（基于 Lotus Docs 主题）
- **构建产物**: `dist/` 目录
- **包管理器**: **必须使用 yarn**（禁止使用 npm）
- **Hugo 版本**: 0.140.0+ extended（必须使用扩展版）
- **Node 版本**: 建议使用 Node 18+
- **主要内容**: 技术博客文档（Markdown 文件位于 `content/` 目录）

## 二、核心命令

### 开发环境
```bash
# 本地开发（自动补齐 Front Matter + 启动服务）- 推荐
yarn run server

# 清理并启动开发服务器
yarn run dev

# 仅 Hugo 原生预览（包含草稿和未来日期内容）
hugo server -D -F

# 访问地址：http://localhost:1313
```

### 生产构建
```bash
# 构建静态站点（输出到 dist/）
yarn run build

# 生产环境构建（包含 PostCSS 优化）
yarn run build:prod

# 清理构建产物
yarn run clean

# 部署到 EdgeOne
yarn run deploy
```

### 测试单个脚本
本项目无单元测试框架。测试脚本功能：
```bash
# 测试权重计算脚本（传入文件路径）
node test-weight-only.js <文件路径>

# 测试 Front Matter 自动补齐脚本
node scripts/add-frontmatter.js
```

## 三、项目结构

```
hugopress/
├── content/           # Markdown 内容目录
├── layouts/           # Hugo 模板文件
├── themes/lotusdocs/  # Lotus Docs 主题（git submodule）
├── assets/            # SCSS/JS 等资源文件
├── static/            # 静态资源（直接复制到 dist/）
├── scripts/           # Node.js 工具脚本
├── archetypes/        # 新建内容模板
├── dist/              # 构建输出目录
├── hugo.toml          # Hugo 主配置
├── package.json       # NPM 依赖和脚本
├── postcss.config.js  # PostCSS 配置
└── .env               # 环境变量
```

## 四、代码风格与约定

### Markdown Front Matter
```yaml
---
title: "文章标题"
date: 2025-01-01 12:00:00
url: /pages/abc123
type: docs
categories:
  - 分类 1
  - 分类 2
tags:
  - 标签 1
draft: true
weight: 10
top: 1
description: "文章描述"
author:
  name: 华总
  link: https://xiaoying.org.cn
icon: celebration
---
```

### 目录命名规范
- **带序号目录**: `01.名称 `、`02.名称`（用于排序）
- **无序号目录**: `_index.md` 作为目录索引
- **文件名**: 支持 `01.名称.md` 或 `1-名称.md` 格式

### CSS/SCSS 约定
- 使用 Bootstrap 5（通过 hugo-mod-bootstrap-scss 导入）
- 生产环境启用 PurgeCSS 清理未使用样式
- 自动添加浏览器前缀（Autoprefixer）
- safelist 配置见 `postcss.config.js`

### JavaScript 约定
- 使用 CommonJS（`require/module.exports`）
- 脚本文件位于 `scripts/` 目录
- 依赖安装：**必须使用 yarn add -D**

### Hugo 配置约定
- `hugo.toml` 为主配置文件
- 菜单配置在 `[menu]` 段
- 主题参数在 `[params.docs]` 段
- baseURL **必须** 含协议和末尾 `/`

## 五、Cursor/Trae 规则

项目包含 `.trae/rules/project_rules.md`：
1. 不要使用 npm，必须用 yarn 执行命令
2. 发现依赖缺失直接运行 `yarn add` 安装
3. 构建产物在 `dist/` 目录

## 六、新建内容

1. 在 `content/[目录]/` 下新建 `.md` 文件
2. 运行 `yarn run server` 自动补齐 Front Matter
3. 修改 `draft: false` 后生效

## 七、依赖管理

```bash
# 安装新依赖（开发依赖）
yarn add -D package-name

# 安装新依赖（生产依赖）
yarn add package-name

# 更新依赖
yarn upgrade

# 重新安装依赖
rm -rf node_modules yarn.lock && yarn install
```

## 八、调试与故障排查

### 构建样式错乱
1. 确认使用 Hugo extended 版本：`hugo version`
2. 清理并重新构建：`yarn run clean && yarn run build`
3. 检查 PostCSS 配置

### 新文章不显示
1. 检查 `draft: false`
2. 检查文件是否在 `content/` 目录下
3. 检查 front matter 格式
4. 检查是否加了 `-F` 参数

### 侧边栏不显示
1. 全站单一侧边栏：文章放 `content/docs/`
2. 多侧边栏：`content/` 下一级目录 = 独立侧边栏
3. 在 `hugo.toml` 的 `[menu]` 配置导航

### Hugo 模块问题
```bash
# 清理模块缓存
hugo mod clean

# 更新模块
hugo mod get -u
```

## 九、SEO 与性能

- 已启用 Algolia 搜索（需配置 API key）
- 已集成 Twikoo 评论系统
- 已配置 Plausible 统计分析
- 图片使用 lazyload 加载
- CSS 已启用 PurgeCSS 优化

## 十、重要提醒

⚠️ **禁止事项**：
- 不要使用 npm（必须用 yarn）
- 不要手动修改 `hugo_stats.json`
- 不要删除 `dist/` 目录

✅ **推荐做法**：
- 使用 `yarn run server` 而非 `hugo server`
- 使用 `draft: true` 标记未完成文章
