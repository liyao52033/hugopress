
# Hugo Partials 使用指南

## 1. 什么是 Partials

Partials 是 Hugo 提供的一种模板复用机制，用于将可重复的模板片段提取出来，以便在多个页面或模板中复用。

- Partials 文件存放路径：
```
layouts/partials/
```
- 文件可以是任意模板，如 `head.html`、`footer.html` 等。

## 2. 基本使用方法

使用 `partial` 函数在模板中引入 partial：

```go
{{ partial "head.html" . }}
```

- 第一个参数是 partial 文件名（相对于 `layouts/partials`）。
- 第二个参数 `.` 是传入的数据上下文，通常是当前页面对象。

### 示例

**layouts/partials/head.html**

```html
<head>
    <meta charset="utf-8">
    <title>{{ .Title }}</title>
</head>
```

**layouts/_default/baseof.html**

```go
<!DOCTYPE html>
<html lang="zh-CN">
{{ partial "head.html" . }}
<body>
    {{ block "main" . }}{{ end }}
</body>
</html>
```

## 3. 带参数的 Partials

可以在调用时传入自定义参数：

```go
{{ partial "alert.html" (dict "Type" "warning" "Message" "这是警告信息") }}
```

**layouts/partials/alert.html**

```html
<div class="alert alert-{{ .Type }}">
    {{ .Message }}
</div>
```

## 4. 动态引入 Partials

Hugo 允许使用 `printf` 或其他字符串操作函数动态拼接 partial 路径：

```go
{{ $pathName := "components/header" }}
{{ partial (printf "%s.html" $pathName) . }}
```

### 示例

假设我们有多个 header partial：

```
layouts/partials/components/header-home.html
layouts/partials/components/header-about.html
```

根据页面类型动态加载：

```go
{{ $pageType := .Type }}
{{ partial (printf "components/header-%s.html" $pageType) . }}
```

## 5. 使用 Scratch 临时存储路径

```go
{{ $.Scratch.Set "pathName" "components/header" }}
{{ partial (printf "%s.html" ($.Scratch.Get "pathName")) . }}
```

- `$.Scratch.Set`：设置临时变量。
- `$.Scratch.Get`：获取变量。
- `$` 表示全局上下文。

## 6. 示例项目结构

```
my-hugo-site/
├── layouts/
│   ├── _default/
│   │   └── baseof.html
│   └── partials/
│       ├── head.html
│       ├── footer.html
│       ├── alert.html
│       └── components/
│           ├── header-home.html
│           └── header-about.html
├── content/
│   ├── _index.md
│   ├── home.md
│   └── about.md
```

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

```go
<!DOCTYPE html>
<html lang="zh-CN">
{{ partial "head.html" . }}
<body>
    {{ $pageType := .Type }}
    {{ partial (printf "components/header-%s.html" $pageType) . }}
    {{ block "main" . }}{{ end }}
    {{ partial "footer.html" . }}
</body>
</html>
```

## 7. 注意事项

1. **路径相对性**：partial 路径是相对于 `layouts/partials` 的。
2. **传参**：传入 partial 的上下文可以是 `.` 或 `dict`。
3. **动态路径**：要确保动态生成的 partial 路径存在，否则渲染会报错。
4. **缓存**：Hugo 会缓存 partial 输出，提高性能。
