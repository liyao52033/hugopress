# 组件库文档站点（Hugo + LotusDocs 主题）

本仓库为基于 Hugo 的文档站点，使用 LotusDocs 主题做文档与组件说明展示。本文档说明项目结构、常用命令以及自定义能力（如代码块自动折叠）。

## 目录结构

```text
hugo-teek/
├─ archetypes/                 # Hugo 原型，hugo new 时用于初始化 Front Matter
├─ assets/                     # 源资源入口（SCSS/JS/图片等），经 Hugo Pipes 处理
├─ content/                    # 文档内容（Markdown）
│  └─ docs/                    # 各分类文档（指南/组件/后端/资源等）
├─ data/                       # 数据文件（YAML/JSON/TOML），模板中通过 .Site.Data 访问
├─ dist/                       # 构建产物或拷贝产物（非 Hugo 默认输出，仅参考）
├─ layouts/                    # 站点自定义模板（可覆盖主题同路径文件）
├─ dist/                     # 执行 `hugo` 后的静态输出目录
├─ static/                     # 静态资源（原样拷贝到 dist/）
├─ themes/
│  └─ lotusdocs/               # LotusDocs 主题
│     ├─ assets/               # 主题内资源
│     ├─ layouts/              # 主题模板与 partials
│     │  └─ partials/
│     │     └─ docs/footer/footer-scripts.html  # 代码块折叠功能在此增量注入
│     └─ static/               # 主题静态资源
├─ README.md
└─ config.* / config/          # 站点配置（BaseURL、菜单、主题参数等）
```

> 注：根据你的实际仓库可能略有差异，请以本地结构为准。

## themes/lotusdocs 目录详解

```text
themes/
└─ lotusdocs/
   ├─ archetypes/                         # 主题提供的内容原型（少用）
   ├─ assets/                             # 主题资源（参与 Hugo Pipes）
   │  ├─ scss/                            # 主题样式源文件
   │  ├─ js/                              # 主题 JS 源文件与组件
   │  └─ images/                          # 主题内引用的图像资源
   ├─ data/                               # 主题数据（可被站点覆盖）
   ├─ exampleSite/                        # 主题的示例站点（参考配置与内容）
   ├─ i18n/                               # 国际化翻译文件
   ├─ images/                             # 主题展示用图片（文档/预览）
   ├─ layouts/                            # 主题模板（可通过站点 layouts 覆盖）
   │  ├─ _default/                        # 默认单页/列表等模板
   │  ├─ docs/                            # 文档系统相关页面与局部模板
   │  │  ├─ index.html                    # 文档主页/列表模板（可能因版本不同而异）
   │  │  └─ single.html                   # 文档单页模板
   │  ├─ partials/                        # 可复用的局部模板
   │  │  ├─ docs/                         # 文档页面所用的 partials
   │  │  │  ├─ footer/                    # 文档页底部脚本与模块
   │  │  │  │  ├─ footer-scripts.html     # 我们增量注入了“代码块>400px自动折叠”样式与脚本
   │  │  │  │  └─ docsearch.html          # DocSearch 相关（按需启用）
   │  │  │  ├─ header/                    # 文档页头部（导航、搜索框等）
   │  │  │  ├─ sidebar/                   # 左侧目录/菜单
   │  │  │  └─ ...                        # 其他文档相关片段
   │  │  ├─ landing/                      # Landing 页（如首页 Hero、Features 等）
   │  │  │  └─ hero.html                  # Landing 页的 Hero 区域
   │  │  └─ ...                           # 主题内更多通用 partials
   │  ├─ shortcodes/                      # 短代码（Markdown 可直接使用）
   │  └─ _internal/                       # 主题内部使用的辅助模板（若存在）
   └─ static/                             # 主题静态资源（原样复制到 dist/）
      ├─ fonts/                           # 字体文件
      ├─ js/                              # 预构建/第三方 JS（由 partials 引用）
      │  ├─ app.js                        # 主题应用脚本
      │  ├─ dayjs.min.js                  # 时间库
      │  ├─ relativeTime.min.js           # dayjs 插件
      │  ├─ bootstrap.js                  # Bootstrap JS（经管道处理）
      │  ├─ docsearch.min.js              # DocSearch（可选）
      │  ├─ prism.js                      # Prism 高亮（当开启 prism 时）
      │  ├─ simple-scrollspy.min.js       # 目录滚动监听（可选）
      │  └─ scrollspy-script.js           # 目录高亮逻辑（我们在 footer-scripts 中引用）
      ├─ scss/                            # 若主题暴露 SCSS（视版本而定）
      └─ ...                              # 其他静态文件（图标、图片等）
```

说明：

### themes/lotusdocs/layouts 全量结构

```text
themes/lotusdocs/layouts/
├─ 404.html
├─ index.html
├─ _default/
│  ├─ baseof.html
│  ├─ list.html
│  └─ single.html
├─ docs/
│  ├─ baseof.html
│  ├─ list.html
│  ├─ single.html
│  └─ _markup/
│     ├─ render-codeblock-mermaid.html
│     ├─ render-codeblock.html
│     ├─ render-heading.html
│     ├─ render-image.html
│     └─ render-link.html
├─ partials/
│  ├─ footer.html
│  ├─ google-fonts.html
│  ├─ head.html
│  ├─ header.html
│  ├─ docs/
│  │  ├─ breadcrumbs.html
│  │  ├─ doc-nav.html
│  │  ├─ footer.html
│  │  ├─ gitinfo.html
│  │  ├─ head.html
│  │  ├─ i18nlist.html
│  │  ├─ preload.html
│  │  ├─ sidebar.html
│  │  ├─ toc-mobile.html
│  │  ├─ toc.html
│  │  ├─ top-header.html
│  │  ├─ footer/
│  │  │  ├─ docsearch.html
│  │  │  ├─ feedback.html
│  │  │  ├─ flexsearch.html
│  │  │  ├─ footer-scripts.html
│  │  │  └─ katex.html
│  │  └─ head/
│  │     ├─ favicon.html
│  │     ├─ get-featured-image.html
│  │     ├─ opengraph.html
│  │     └─ twitter_cards.html
│  ├─ head/
│  │  ├─ favicon.html
│  │  └─ plausible.html
│  └─ landing/
│     ├─ feature_grid.html
│     ├─ hero.html
│     └─ image_compare.html
│     └─ image_text.html
├─ shortcodes/
│  ├─ alert.html
│  ├─ katex.html
│  ├─ markdownify.html
│  ├─ prism.html
│  ├─ tab.html
│  ├─ table.html
│  └─ tabs.html
```

#### 文件用途说明（themes/lotusdocs/layouts）

- 404.html：404 错误页模板。
- index.html：站点首页模板（主题默认首页）。
- _default/baseof.html：默认基础布局（其他页面通过 block/define 继承）。
- _default/list.html：列表页模板（如章节列表）。
- _default/single.html：单页模板（默认的内容页渲染）。
- docs/baseof.html：文档系统基础布局（文档页共用的骨架）。
- docs/list.html：文档列表页模板（文档目录页）。
- docs/single.html：文档详情页模板（Markdown 文档正文）。
- docs/_markup/render-codeblock.html：代码块渲染（语法高亮包装，非 mermaid）。
- docs/_markup/render-codeblock-mermaid.html：渲染 Mermaid 代码块为图。
- docs/_markup/render-heading.html：标题渲染（处理锚点、编号等）。
- docs/_markup/render-image.html：图片渲染（可处理懒加载、样式）。
- docs/_markup/render-link.html：链接渲染（外链新窗口、相对链接处理等）。
- partials/footer.html：全站页脚片段。
- partials/google-fonts.html：Google Fonts 字体加载片段。
- partials/head.html：全站 head 片段（meta、资源预加载）。
- partials/header.html：全站页头片段（站点顶部导航）。
- partials/docs/breadcrumbs.html：文档页面包屑导航。
- partials/docs/doc-nav.html：文档页上一页/下一页导航。
- partials/docs/footer.html：文档页页脚（与全站 footer 配合）。
- partials/docs/gitinfo.html：显示 Git 信息（最近更新时间、作者等）。
- partials/docs/head.html：文档页 head（覆盖或追加文档相关资源）。
- partials/docs/i18nlist.html：多语言文档切换列表。
- partials/docs/preload.html：预加载资源（如首屏必要 CSS/JS）。
- partials/docs/sidebar.html：左侧文档目录树。
- partials/docs/toc-mobile.html：移动端目录（TOC）组件。
- partials/docs/toc.html：桌面端目录（TOC）组件。
- partials/docs/top-header.html：文档页顶部条（标题/工具等）。
- partials/docs/footer/docsearch.html：DocSearch 脚本注入（若启用）。
- partials/docs/footer/feedback.html：文档反馈模块（点赞/问题反馈）。
- partials/docs/footer/flexsearch.html：本地搜索 FlexSearch 支持。
- partials/docs/footer/footer-scripts.html：文档页底部脚本集合；本项目在此增量注入“代码块超 400px 自动折叠”的样式与脚本。
- partials/docs/footer/katex.html：KaTeX 数学公式支持。
- partials/docs/head/favicon.html：文档页 Favicon 设置。
- partials/docs/head/get-featured-image.html：获取文档特色图。
- partials/docs/head/opengraph.html：OpenGraph 社交卡片元数据。
- partials/docs/head/twitter_cards.html：Twitter Cards 元数据。
- partials/head/favicon.html：全站 Favicon 设置。
- partials/head/plausible.html：Plausible 分析脚本。
- partials/landing/feature_grid.html：着陆页 Feature Grid 模块。
- partials/landing/hero.html：着陆页 Hero 模块。
- partials/landing/image_compare.html：图片对比模块（比较滑块）。
- partials/landing/image_text.html：图片+文本模块。
- shortcodes/alert.html：提示框短代码（在 Markdown 中使用）。
- shortcodes/katex.html：KaTeX 公式短代码。
- shortcodes/markdownify.html：将内容 markdown 化渲染的短代码。
- shortcodes/prism.html：Prism 高亮短代码（主题可选用）。
- shortcodes/tab.html：单个 Tab 短代码（配合 tabs 使用）。
- shortcodes/table.html：表格短代码（样式化表格）。
- shortcodes/tabs.html：Tabs 容器短代码。
- 站点可以在项目根的 layouts/ 中用相同路径放置文件来覆盖主题对应模板。
- 我们的“代码块自动折叠”增量改动位于：
  - themes/lotusdocs/layouts/partials/docs/footer/footer-scripts.html 末尾，插入了一个样式块与脚本块；
  - 如需调整高度阈值、遮罩或按钮样式，请在该文件中搜索 `LIMIT`、`.cb-collapsible`、`.cb-toggle-btn`。

## 开发与预览

- 本地开发启动
  - 安装 Hugo（建议扩展版 Hugo Extended）。
  - 在项目根目录运行：
    ```
    hugo server
    ```
  - 访问 http://localhost:1313 查看站点。

- 生产构建
  ```
  hugo
  ```
  构建输出位于 `dist/` 目录，将其部署到任意静态站点服务（Nginx、OSS、GitHub Pages 等）。

## 搜索与目录

- LotusDocs 集成了 DocSearch（如需启用，需在站点配置中设置 `Site.Params.docsearch.appID` 与 `apiKey`）。
- 目录与滚动高亮由 `themes/lotusdocs/layouts/partials/docs/footer/footer-scripts.html` 注入的脚本控制（滚动监听、侧边栏定位等）。

## 自定义：代码块高度超过 400px 自动折叠

我们对主题做了非侵入式增强，使代码块在高度超过 400px 时自动折叠，并显示底部渐变与“展开/收起”按钮。

- 实现位置
  - 文件：`themes/lotusdocs/layouts/partials/docs/footer/footer-scripts.html`
  - 方式：在该 partial 末尾增量插入了 `<style>` 与 `<script>`（不改动原有逻辑）。

- 生效范围
  - 匹配 `.highlight`、`.chroma` 容器，以及裸 `pre > code` 结构。
  - 初始超过 400px 的代码块会被包裹到 `.cb-collapsible` 容器内，显示底部渐变与“展开/收起”按钮。

- 交互说明
  - 点击按钮可在“展开/收起”间切换；展开后移除高度限制与遮罩。

- 可配置项（在同文件样式/脚本中调整）
  - 折叠阈值：脚本中的 `LIMIT`（默认 400）。
  - 遮罩高度：`.cb-collapsible::after { height: 3rem; }`。
  - 按钮样式：`.cb-toggle-btn` 规则。
  - 深浅色适配：`html.dark` 下的渐变与按钮背景。

- 设计细节
  - 为避免遮挡代码内容：按钮采用 `position: sticky; bottom: 0;`，容器有 `padding-bottom` 预留空间；遮罩层 `z-index` 低于按钮。
  - 该增强为运行时 DOM 包裹，不需要改动 Markdown 内容。

## 常见问题

- 修改样式/脚本后未生效
  - 清理浏览器缓存并硬刷新；如开启了 Hugo 缓存，可尝试重启 `hugo server`。
- 某个页面不想折叠
  - 可在自定义 CSS 中覆盖：
    ```
    .cb-collapsible { max-height: none !important; overflow: visible !important; }
    .cb-collapsible::after, .cb-toggle-btn { display: none !important; }
    ```
- 代码块未识别为可折叠
  - 确认生成的 HTML 是否包含 `.highlight`/`.chroma` 或 `pre > code` 结构；如果有额外外层包装，可能需要扩展选择器。

## 二次开发建议

- 新增页面/文档
  - 在 `content/` 下按分类新建 Markdown 文件；必要时在 `archetypes/` 中添加对应原型。
- 覆盖主题模板
  - 在 `layouts/` 下使用与主题相同的相对路径放置模板，即可覆盖主题默认实现。
- 资源管道
  - 将自定义的 SCSS/JS 放入 `assets/`，通过 Hugo Pipes 在模板中 `resources.Get`、`js.Build` 等方式构建。


### 新增其它 HTML 模板的接入方式

- 新增页面级模板
  - 单页模板：在站点层创建 `layouts/_default/single.html`，或为特定分区创建 `layouts/SECTION/single.html`
  - 列表页模板：`layouts/_default/list.html` 或 `layouts/SECTION/list.html`
  - 骨架模板：`layouts/_default/baseof.html`（提供全局布局骨架）
  - 继承用法示例（在 `single.html` 中继承 `baseof` 的 block）：
    ```go
    {{ define "main" }}
      <main class="container">
        {{ .Content }}
      </main>
    {{ end }}
    ```

- 在 baseof 或局部 partial 中引用自定义 partial
  - 新增 partial：`layouts/partials/custom/footer-extra.html`
  - 在文档页尾部插入（推荐覆盖站点层的 `layouts/partials/docs/footer.html`）：
    ```go
    {{ partial "custom/footer-extra.html" . }}
    ```
  - 若确需在骨架层注入（影响全站），可在 `layouts/_default/baseof.html` 的 `<body>` 底部加入：
    ```go
    {{ partial "custom/footer-extra.html" . }}
    ```

- 新增短代码（shortcodes）
  - 创建：`layouts/shortcodes/notice.html`
  - 示例内容：
    ```html
    <div class="notice">{{ .Inner }}</div>
    ```
  - 在 Markdown 中使用：
    ```text
    {{< notice >}}
    这里是提醒内容
    {{< /notice >}}
    ```

- 主题与站点层覆盖优先级
  - 优先级：站点层 `layouts/...` > 主题层 `themes/lotusdocs/layouts/...`
  - 覆盖步骤：将主题文件按相同相对路径复制到站点层进行修改
    - 从：`themes/lotusdocs/layouts/partials/docs/footer/footer-scripts.html`
    - 到：`layouts/partials/docs/footer/footer-scripts.html`
  - 还原主题默认：删除站点层对应文件，主题版本即恢复生效

- 与本项目“代码块 > 400px 自动折叠”的关系
  - 功能已通过主题 `partials/docs/footer/footer-scripts.html` 自动包含到文档页，无需在 `baseof.html` 手动引入
  - 若要调整或停用，请在站点层复制同路径文件覆盖，或在自定义 CSS 中覆盖 `.cb-collapsible`、`.cb-toggle-btn` 等样式
