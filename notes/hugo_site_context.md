# Hugo 上下文变量：.Site vs site

## 概述

在 Hugo 模板中，`.Site` 和 `site` 都可以访问站点配置信息，但它们的使用场景和作用域有所不同。

## 区别对比

| 特性 | `.Site` | `site` |
|------|---------|--------|
| **类型** | 通过上下文访问的属性 | Hugo 全局变量 |
| **作用域** | 依赖于当前上下文 `.` | 始终可用，不受上下文影响 |
| **访问方式** | 上下文属性访问 | 全局变量访问 |
| **适用场景** | 上下文明确且稳定时使用 | 上下文可能变化时使用 |

## 为什么会报错？

### 场景示例：sidebar.html（with 语句改变上下文）

在 `themes/lotusdocs/layouts/partials/docs/sidebar.html` 中：

```html
{{ with resources.Get "images/logos/logo.svg" }}
{{ .Content | safeHTML }}
<span>{{ site.Title }}</span>
{{ end }}
```

**问题分析**：
- `with` 语句会将上下文 `.` 设置为表达式的结果
- 在 `with` 内部，`.` 变成了资源对象（logo.svg）
- 此时使用 `.Site.Title` 会报错，因为资源对象没有 `Site` 属性
- 使用 `site.Title` 可以正常工作，因为 `site` 是全局变量

### 场景示例：sidebar.html（range 循环改变上下文）

在 `themes/lotusdocs/layouts/partials/docs/sidebar.html` 中：

```html
{{ $currentPage := . -}}  <!-- 保存原始上下文 -->
{{ $section := $currentPage.Section -}}

{{ range (where .Site.Sections.ByWeight "Section" "in" $section) }}
{{ $child_pages := union .Sections .Pages }}
{{ range $child_pages.ByWeight }}  <!-- ← 这里 . 被重新赋值为页面对象 -->
```

**问题分析**：
- 外层 `range` 中，`.` 是 Section 对象
- 内层 `range` 中，`.` 变成了当前迭代的 Page 对象
- 此时使用 `.Site` 会报错，因为 Page 对象没有 `Site` 属性

### 场景示例：login/single.html（顶层代码）

在 `themes/lotusdocs/layouts/login/single.html` 中：

```html
<title>Login | {{ .Site.Title }}</title>
```

**正常工作原因**：
- 整个模板中，`.` 始终是页面上下文
- 没有 `with` 或 `range` 改变上下文
- `.Site.Title` 可以正常访问

### 场景示例：docs/single.html（define 语句）

在 `themes/lotusdocs/layouts/docs/single.html` 中：

```html
{{ define "main" }}
    {{ $vifConfig := .Site.Data.vif.config }}  <!-- ✅ 可以使用 .Site }}
{{ end }}
```

**正常工作原因**：
- `define` 只是定义模板，不立即执行
- 模板内的上下文 `.` 取决于调用时传入的参数
- 在 Hugo 中，`define "main"` 被调用时传入的是页面上下文
- 所以 `.` 仍然是页面对象，可以正常使用 `.Site`

## 解决方案

### 方案 1：使用 `site` 全局变量（推荐）

```html
<span>{{ site.Title }}</span>
```

**优点**：
- 简单直接，不受上下文影响
- Hugo 官方推荐在上下文可能变化的地方使用
- 代码更简洁易读

**缺点**：
- 无明显缺点

### 方案 2：保存原始上下文

```html
{{ $site := .Site -}}
...
<span>{{ $site.Title }}</span>
```

**优点**：
- 明确控制作用域
- 适合需要多次使用的情况

**缺点**：
- 需要额外变量声明
- 增加代码复杂度

### 方案 3：使用 `$.Site`（从根上下文访问）

```html
<span>{{ $.Site.Title }}</span>
```

**优点**：
- 简洁，明确从根上下文访问

**缺点**：
- 在某些深度嵌套场景中可能不适用
- 可读性稍差

## 哪些语句会改变上下文？

### 会改变上下文 `.` 的语句

| 语句 | 说明 | 示例 |
|------|------|------|
| `range` | 遍历数组/切片/字典，每次迭代改变 `.` | `{{ range .Pages }}` |
| `with` | 条件性地改变上下文（当条件为真时） | `{{ with .Params }}` |
| `block` | 定义模板块，上下文由调用时传入的参数决定 | `{{ block "main" . }}` |
| `define` | 定义模板，上下文由调用时传入的参数决定 | `{{ define "sidebar" }}` |

### 不会改变上下文 `.` 的语句

| 语句 | 说明 | 示例 |
|------|------|------|
| `if` | 条件判断，不改变上下文 | `{{ if .Params.show }}` |
| `else` | else 分支，不改变上下文 | `{{ else }}` |
| `else if` | else if 分支，不改变上下文 | `{{ else if .Params.hide }}` |
| `partial` | 调用 partial，上下文取决于传入的参数 | `{{ partial "sidebar" . }}` |
| `template` | 调用模板，上下文取决于传入的参数 | `{{ template "sidebar" . }}` |

### `define` 与 `with`/`range` 的关键区别

```html
<!-- define：定义时不改变上下文，调用时决定 -->
{{ define "main" }}
    {{ $vifConfig := .Site.Data.vif.config }}  <!-- ✅ 可以使用 .Site }}
{{ end }}

<!-- 调用时传入页面上下文 -->
{{ block "main" . }}  <!-- 这里的 . 是页面上下文 -->
{{ end }}

<!-- with：立即改变上下文 -->
{{ with resources.Get "logo.svg" }}
    {{ .Content | safeHTML }}  <!-- ✅ . 是资源对象 -->
    <!-- {{ .Site.Title }} ❌ 会报错 -->
{{ end }}

<!-- range：立即改变上下文 -->
{{ range .Pages }}
    {{ .Title }}  <!-- ✅ . 是页面对象 -->
    <!-- {{ .Site.Title }} ❌ 会报错 -->
{{ end }}
```

## 最佳实践

### 何时使用 `.Site`

- 顶层代码（不在任何语句内）
- `if` 语句内（`if` 不改变上下文）
- `else`/`else if` 分支内
- `define`/`block` 模板内（调用时传入页面上下文）
- 上下文明确且稳定的场景

### 何时使用 `site`

- `with` 语句内
- `range` 循环内
- partials 中（上下文取决于调用时传入的参数）
- 上下文可能被改变的场景
- 不确定当前上下文时

### 简单记忆法则

| 场景 | 推荐做法 |
|------|---------|
| 顶层代码 | 用 `.Site` ✅ |
| `if` 语句内 | 用 `.Site` ✅ |
| `with` 语句内 | 用 `site` 或 `$.Site` ✅ |
| `range` 循环内 | 用 `site` 或 `$.Site` ✅ |
| `define`/`block` 内 | 用 `.Site`（调用时传入页面上下文）✅ |
| partials 中 | 用 `site` 或 `$.Site` ✅ |

**最简单、最安全的做法**：在 partials 中始终使用 `site` 或 `$.Site`，因为 partials 的上下文完全取决于调用时传入的参数，无法保证是什么。

### 代码示例对比

```html
<!-- 不推荐：在 range 中使用 .Site -->
{{ range .Pages }}
  {{ .Title }} - {{ .Site.Title }}  <!-- 可能报错 -->
{{ end }}

<!-- 推荐：使用 site 全局变量 -->
{{ range .Pages }}
  {{ .Title }} - {{ site.Title }}  <!-- 始终有效 -->
{{ end }}

<!-- 推荐：保存上下文 -->
{{ $site := .Site }}
{{ range .Pages }}
  {{ .Title }} - {{ $site.Title }}  <!-- 始终有效 -->
{{ end }}
```

## 其他全局变量

Hugo 还提供了其他类似的全局变量：

| 全局变量 | 说明 |
|---------|------|
| `site` | 站点配置信息 |
| `hugo` | Hugo 版本信息 |
| `now` | 当前时间 |
| `i18n` | 国际化函数 |

## 总结

- **`.Site`**：依赖上下文，适合简单场景
- **`site`**：全局变量，适合复杂场景
- **推荐原则**：不确定时优先使用 `site`，避免上下文变化导致的错误

## 参考资料

- [Hugo 官方文档 - Variables](https://gohugo.io/variables/)
- [Hugo 官方文档 - Context](https://gohugo.io/templates/introduction/#the-context-dot)
