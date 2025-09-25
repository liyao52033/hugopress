## 统计页面字数
这段代码 <span>📖 {{ len (.Content | plainify) }} </span> 计算的是页面内容经过纯文本处理后的字符总数（包括所有文字、数字、符号等），具体特点如下：

统计范围：
会包含正文中的所有文字（中文、英文等）
会包含代码块中的内容（因为 plainify 只是去除 HTML 标签，不会过滤代码）
会包含标点符号、空格等所有字符
不包含 HTML 标签本身（因为 plainify 会剥离 HTML 标签）
与其他统计方式的区别：
和 .WordCount 相比：它统计的是 "字符数" 而非 "词数"，且包含代码内容
和 .FuzzyWordCount 相比：它是精确的字符计数，而非模糊的 "词数" 估算

例如，一段包含 "Hello 世界" 的文本：

len (.Content | plainify) 会返回 8（5 个英文 + 1 个空格 + 2 个中文）
.WordCount 会返回 2（按词统计）

如果你想基于总字符数计算阅读时间（适合中文等单字表意的语言），可以这样使用：

```html
{{ $charCount := len (.Content | plainify) }}
{{ $readingSpeed := .Site.Params.reading_speed | default 300 }}  <!-- 按字符/分钟计算 -->
{{ $readingTime := math.Ceil (div (float $charCount) $readingSpeed) }}
<span>📖 {{ $charCount }} 字符 · {{ $readingTime }} 分钟阅读</span>
```

这种方式对于中文内容往往更准确，因为中文通常按 "字"（字符）计算阅读速度，而不是按 "词"。


## .Site.Pages 和 .Site.RegularPages 的区别
在 Hugo 中，.Site.Pages 和 .Site.RegularPages 是两个常用的页面集合变量，它们的主要区别在于包含的页面类型不同：
1. .Site.Pages
包含内容：站点中所有类型的页面，包括：
常规内容页（如文章、文档等，即 RegularPages）
首页（Homepage）
分类页（Taxonomy，如标签页、分类页）
分类列表页（Taxonomy Term，如所有标签的列表页）
其他特殊页面（如 404 页、自定义页面类型等）
适用场景：需要遍历站点中所有页面（无论类型）时使用，例如统计全站所有页面的总数。
2. .Site.RegularPages
包含内容：仅包含「常规内容页」，即：
存放在 content/ 目录下的具体内容文件（如 content/posts/、content/docs/ 中的 markdown 文件）
排除首页、分类页、分类列表页等「非内容页」
本质：RegularPages 是 .Site.Pages 的一个子集，等价于 where .Site.Pages "Kind" "page"（Kind 为 page 表示常规内容页）。
适用场景：需要统计或处理具体文章 / 文档时使用，例如计算所有文章的总字数、列出最新文章等。
举例说明
假设站点结构如下：

plaintext
content/
├── posts/           # 文章（RegularPages）
│   ├── post1.md
│   └── post2.md
├── docs/            # 文档（RegularPages）
│   └── doc1.md
├── tags/            # 标签页（Taxonomy，非RegularPages）
└── _index.md        # 首页（Homepage，非RegularPages）

.Site.Pages 包含：post1.md、post2.md、doc1.md、标签页、首页（共 5 个）
.Site.RegularPages 包含：post1.md、post2.md、doc1.md（共 3 个）
总结
用 .Site.RegularPages 处理「实际内容页」（文章、文档等）
用 .Site.Pages 处理「所有页面」（包括特殊页面）

在统计文章数量、计算内容字数等场景中，RegularPages 更常用，因为它能精准过滤掉非内容页面。


## Markdown 渲染短代码
在 Hugo 中，Markdown 渲染是通过 .Page.RenderString() 函数实现的。
这个函数会把 Markdown 内容渲染成 HTML，并返回结果。
如果必须用 .Page.RenderString（比如 alert 内需要 Markdown 解析），那应该在 内容还没渲染成 HTML 之前 做替换：
html
预览
{{ $rawContent := .RawContent }}

{{ $pattern := `(?ms)::: *(info|warning|danger|success|primary|default)\s*\n(.*?)\n:::` }}
{{ $replacement := `{{< alert type="$1" >}}\n$2\n{{< /alert >}}` }}

{{ $newContent := replaceRE $pattern $replacement $rawContent }}

{{ $newContent | .Page.RenderString }}
这里的关键是用 .RawContent（原始 Markdown 文本）而不是 .Content（已渲染的 HTML）。
这样 .Page.RenderString 只会渲染一次，不会破坏 codeblock。

这样就能正确解析代码块中的短代码了，使用跟vp一样::: info ... :::
