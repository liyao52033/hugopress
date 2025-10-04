# 快速搭好你的个人博客（Hugo + Lotus Docs）

## 一、它能做什么
- 开箱即用的文档站：`永久链接`、`代码块自动换行(行号自动增加)`、algolia搜索、分类页、归档页、标签页、关于页、[KaTex数学公式](https://lotusdocs.dev/docs/features/katex/)、[mermaid流程图](https://lotusdocs.dev/docs/features/mermaid/)等都已内置。
- 写 Markdown 就能生成页面，结构清晰。
- 一键本地预览，静态导出，构建极速，数百篇文章秒级编译，部署简单（GitHub Pages / Vercel / Netlify / 自有服务器）。

## 二、准备工作
- 用PowerShell terminal (version 5.1 or later) 安装[scoop包管理器](https://scoop.sh/)
  ```sh
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  
  Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
  ```

- 安装 Hugo 扩展版 ，安装后在终端执行：`hugo -v` 确认可用，参考[lotusdocs主题官网](https://lotusdocs.dev/docs/quickstart/)
  ```sh
  scoop install hugo-extended
  ```

- npm包管理器，推荐用yarn 

- 根目录新建.env填写需要的环境变量，然后用`yarn run dev`加载到配置文件中

- 打开一个终端工具（Windows 可用 PowerShell / Git Bash / CMD）。

## 三、3 步完成基本配置
1) 获取项目  
下载或 `git clone` [本仓库](https://github.com/liyao52033/hugopress)，然后在项目根目录打开终端。

2) 修改关键信息（文件：`hugo.toml`, `.env`,`themes/data/xxx`）,具体查看该文件详细注释
- 域名 baseURL：改成你的域名（必须含 `http://` 或 `https://`，建议末尾加 `/`）  
  例：`baseURL = 'https://your-domain.com/'`
- 网站标题 title：例：`title = '我的个人博客'`
- 可选：  
  - 代码高亮主题：`params.docs.prismTheme`（如 `lotusdocs`、`lucario`）  
  - 社交信息：`[params.social]`（如 `github`）  
  - 菜单导航：`[menu]` 区域可调整名称和链接

3) 启动本地预览
- 推荐：`yarn run server`  
  作用：先自动为 Markdown 添加/补齐 Front Matter，再启动本地服务（包含草稿和未来日期内容）。  
- 或使用原生命令：`hugo server -D`  
- 访问：`http://localhost:1313`

## 四、写文章与侧边栏（很重要）
- 单一侧边栏（全站统一）：把文章都放进 `content/docs` 目录。  
  例：`content/docs/post/my-first-post.md`
- 多侧边栏（不同导航配不同侧边栏）：`content` 下的每一个“一级目录”就是一个独立侧边栏，然后再`hugo.toml`配置导航栏
  例：`content/pages/*` 属于 “pages” 侧边栏，`content/backend/*` 属于 “backend” 侧边栏。
  
  ```toml
  //hugo.toml 导航栏配置，自动将指定的url所在content下的一级目录展示为一个单独的侧边栏
  [menu]
      [[menu.primary]]
          name  = "指南"
          url = "/pages/fe4521/" //其中某篇文章的永久链接
          identifier = "guide"   // 目录标识
          weight = 20            // 权重，越小越靠前
  
      [[menu.primary]]
      name  = "关于"
      url = "/about/"
      identifier = "about"
      weight = 60
      # 子菜单项
      [[menu.primary]]
      name  = "联系我们"
      url = "/about/"
      identifier = "contact"
      parent = "about"
      weight = 10
      [[menu.primary]]
      name  = "文章归档"
      url = "/archives/"
      identifier = "team"
      parent = "about" 
      weight = 20
  ```
  
  
- 自动 Front Matter：执行 `yarn run server` 时，会批量补齐文章 Front Matter（如 `title`、`date`、`type: docs`、`url`、`categories` 等），无需手写。
  ```yaml
  ---
  date: 2025-06-14 19:07:08 //文件创建时间 
  title: 本站主题包          // 文章一级标题
  url: /pages/9d746f       // 永久链接
  top: 1                   // 置顶，越小越靠前
  weight: 10               // 侧边栏排序，越小越靠前
  description: 描述        // 文章描述，AI摘要来源之一
  categories:             // 分类
    - 工具类
    - 本站插件
  author:                //作者
    name: liyao
    link: https://xiaoying.org.cn
  type: docs            //文章布局，md不在docs目录下时必填
  icon: celebration     // 文章标题图标
  tags:                 //标签
    - vitepress
  draft: true         // 是否为草稿，为false才能正常显示文章，或构建时包含草稿（-D）
  ---
  ```

  
- 快速新建文章
  - 手动：在对应目录新建 `.md` 文件（完成后建议先运行过一次 `yarn run server`，让 Front Matter 自动补齐）。  
  - Hugo 命令：`hugo new docs/my-first-post.md`（文件会生成在 `content/docs` 下，默认 `draft: true`）。

## 五、发布上线
1) 生成静态站点  
- 推荐：`yarn run build`（等同 `hugo -D -F`）  
- 输出目录：`dist`（已在配置中设置为 `publishDir`）

2) 部署任意静态空间  
- GitHub Pages / Vercel / Netlify / 自有服务器均可。把 `dist` 整目录作为网站根目录发布。

3) 绑定域名  
- 在托管平台设置自定义域名；到域名 DNS 添加解析（常见为 CNAME 或 A 记录）。  
- 确保 `hugo.toml` 的 `baseURL` 与实际访问域名完全一致（含协议和末尾 `/`）。

## 六、项目命令与脚本说明
- `yarn run server`  
  - 执行：`node scripts/add-frontmatter.js` → `hugo server --disableFastRender -D -F`  
  - 作用：先为 `content` 下所有 `.md` 自动补齐/修复 Front Matter，再开启本地预览（包含草稿与未来日期内容）。

- `yarn run build`  
  - 执行：`hugo -D -F`  
  - 作用：构建静态站点到 `dist`（包含草稿与未来日期，便于预发检查）。

- `yarn run dev`  
  - 执行：`bash start.sh`  
  - 作用：读取 `.env`（若存在）、检查 Hugo，然后串行执行 `yarn run clean && yarn run server`。

- `yarn run build:prod`（最终构建命令）
  - 执行：`bash build.sh`（如存在）  
  - 作用：生产构建（按你的 `build.sh` 定义为准）。

- `yarn run clean`  
  - 执行：`hugo --cleanDestinationDir`  
  - 作用：清理 `dist` 目录。

- `yarn run proxy`  
  - 执行：`node scripts/proxy.js`（脚本存在于 `scripts/proxy.js`）  
  - 作用：本地代理（按脚本实现为准）。

- `scripts/add-frontmatter.js`  
  - 会为 `content` 下所有 `.md` 文件自动补齐 Front Matter（只补缺，不覆盖已有值）。  
  - 默认写入：`title`、`date`、`url`（随机短链，前缀默认为 `pages`）、`type: "docs"`、`categories`（依据目录层级）等常用字段。  
  - 忽略列表：`_index.md`、`index.md`、`pages`。
- `start.sh`  
  - 可读取 `.env`（若存在），并检查 `hugo` 是否安装，然后执行：`yarn run clean && yarn run server`。

## 七、常见问题（FAQ）
- 本地正常，上线样式错乱？  
  - 使用 Hugo 扩展版 Extended；确保部署产物为 `dist`；每次变更后重新构建再发布。

- 新文章不显示？  
  - 草稿默认 `draft: true`。要上线请改为 `draft: false`，或构建时包含草稿（`-D`）。  
  - 文件需放在 `content` 下（建议 `content/docs` 或对应一级目录）。  
  - 需要菜单入口可在 `hugo.toml` 的 `[menu]` 添加。

- 侧边栏不对？  
  - 全站一个侧边栏：把文章都放 `content/docs`。  
  - 多侧边栏：`content` 下每个一级目录对应一个侧边栏，请把文章放入相应目录。

- 域名绑定失败或跳转异常？  
  - `baseURL` 必须与最终访问域名完全一致（含协议和末尾 `/`）。  
  - 托管平台域名设置与 DNS 解析都要完成。

- 想换主题色/字体/代码高亮？  
  - `hugo.toml` 的 `[params]` 可调整字体；`[params.docs].prismTheme` 可快速更换代码高亮主题。

## 八、常用命令速查
- 本地预览（自动补齐 Front Matter）：`yarn run server`  
- 清理并预览：`yarn run dev`（内部会 `clean → server`）  
- 构建：`yarn run build`（输出到 `dist`）  
- 纯 Hugo 预览：`hugo server -D`  
- 纯 Hugo 构建：`hugo`

## 九、参考资料

[hugo官网](https://gohugo.io/getting-started/quick-start/)

[lotusdocs主题官网](https://lotusdocs.dev/docs/quickstart/)

[hugo手册](https://jimmysong.io/book/hugo-handbook/site-structure/url-management/)
