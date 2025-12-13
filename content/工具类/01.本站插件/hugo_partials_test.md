---
title: hugo_partials测试
date: 2025-10-02 15:22:25
url: /pages/96a44734
type: docs
description: 本文详细讲解了 Hugo Partials 的定义、文件结构和基本用法，进而介绍了带参数、条件渲染、循环内容生成等高级技巧。文中强调了性能优化，推荐使用 partialCached 缓存机制，并提供了缓存键设计策略。通过响应式导航菜单、文章卡片和 SEO 组件等实际案例，展示了 Partials 的应用场景。文章还涵盖了错误处理、调试技巧及最佳实践，包括命名规范和文档编写，帮助开发者编写高效、清晰、可维护的模板代码。
weight: 110
tags: ["hugo"]
categories:
  - 工具类
  - 本站插件
author:
  name: liyao
  link: https://xiaoying.org.cn
---


# Hugo Partials 使用指南

## 什么是 Partials

Partials 是 Hugo 提供的一种模板复用机制，用于将可重复的模板片段提取出来，以便在多个页面或模板中复用。

- Partials 文件存放路径：`layouts/partials/`

- 文件可以是任意模板，如 `head.html`、`footer.html` 等。

## 基本使用方法

使用 `partial` 函数在模板中引入 partial：



- 第一个参数是 partial 文件名（相对于 `layouts/partials`）。
- 第二个参数 `.` 是传入的数据上下文，通常是当前页面对象。


## 最佳实践

### 命名规范

- 使用描述性名称：`article-card.html` 而不是 `card.html`
- 采用连字符分隔：`social-links.html`
- 按功能分类：`content/`, `site/`, `components/`

### 文档化


## 动态引入 Partials

Hugo 允许使用 `printf` 或其他字符串操作函数动态拼接 partial 路径：

## 使用 Scratch 临时存储路径

```go
{{ $.Scratch.Set "pathName" "components/header" }}
{{ partial (printf "%s.html" ($.Scratch.Get "pathName")) . }}
```

- `$.Scratch.Set`：设置临时变量。
- `$.Scratch.Get`：获取变量。
- `$` 表示全局上下文。

### 内容示例

**content/home.md**

```markdown
---
title: "首页"
type: "home"
---
欢迎来到首页。
```

**content/about.md**

```markdown
---
title: "关于"
type: "about"
---
这里是关于页面。
```

### baseof.html 动态加载 header



## 注意事项

1. **路径相对性**：partial 路径是相对于 `layouts/partials` 的。
2. **传参**：传入 partial 的上下文可以是 `.` 或 `dict`。
3. **动态路径**：要确保动态生成的 partial 路径存在，否则渲染会报错。
4. **缓存**：Hugo 会缓存 partial 输出，提高性能。
5. **单一职责**：每个 partial 只负责一个功能
6. **避免复杂逻辑**：将复杂处理移到调用方
7. **合理参数**：参数不宜过多
