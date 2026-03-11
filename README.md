## 要求

- [Hugo **扩展**版（最低版本：0.150.0）](https://gohugo.io/getting-started/installing/)
- [git](https://git-scm.com/install/windows)
- [Go 1.25 ](https://go.dev/dl/)

   根据以上地址下载安装`git`和`go`

## 安装hugo

#### windows

首先安装[scoop](https://scoop.sh/)，打开 一个PowerShell终端 （ [Windows PowerShell 5.1](https://www.microsoft.com/en-us/download/details.aspx?id=54616)版本5.1以上或[PowerShell](https://aka.ms/powershell)），执行

```sh
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

然后安装hugo

```sh
scoop install hugo-extended
```

#### macos

```sh
brew install hugo-extended
```

#### linux

Ubuntu/debian

```sh
sudo apt install hugo-extended
```

centos

```sh
yum install hugo-extended -y
```

## 初始化项目

克隆模板

```sh
git clone https://cnb.cool/liyao52033/hugo-site
```

安装依赖

```sh
yarn
```

**注意**：如果您的站点已经有 git 存储库，您可以使用站点 git 存储库的路径来初始化您的站点，将`go.mod`中的module进行修改，例如`module github.com/<user>/<my-docs-site>/`。

现在，您可以从以下选项中选择将 Lotus Docs 主题添加到新站点的首选方法

## 安装选项

主题可通过以下方法之一安装：

- 作为hugo模块（推荐）
- 作为 Git 子模块
- 本地克隆主题文件

先修条件：

- `contentDir`项目文件夹中的存在，`scripts/add-frontmatter.js中`的`config.contentDir`目录需与此文件夹一致

### 安装为Hugo模块（推荐）

编辑 `hugo.toml` 配置文件，将[主题](https://cnb.cool/liyao52033/hugopress)和[Hugo Bootstrap模块](https://github.com/gohugoio/hugo-mod-bootstrap-scss)作为模块加入：

```toml
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'My New Hugo Site'
contentDir = 'content'
enableEmoji = true

[module]
    [[module.imports]]
        path = "cnb.cool/liyao52033/hugopress/v2"
        disable = false
```

### 作为 Git 子模块安装

从你的项目根节点执行以下 `git` 命令：

```sh
git init
git submodule add https://cnb.cool/liyao52033/hugopress themes/hugopress
```

编辑 `hugo.toml` 配置文件：

```toml
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'My New Hugo Site'
contentDir = 'content'
enableEmoji = true

[module]
    # uncomment line below for temporary local development of module
    # or when using a 'theme' as a git submodule
    replacements = "cnb.cool/liyao52033/hugopress -> hugopress"
    [[module.imports]]
        path = "cnb.cool/liyao52033/hugopress/v2"
        disable = false
```

### 本地安装

有些情况下，你可能更愿意自己定制和维护主题。在这种情况下，可以用`git`来克隆主题到 `themes/hugopress` 目录中：

```sh
git clone https://cnb.cool/liyao52033/hugopress themes/hugopress
```

编辑 `hugo.toml` 配置文件：

```toml
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'My New Hugo Site'

[module]
    # uncomment line below for temporary local development of module,
    # when using a 'theme' as a git submodule or git cloned files
    replacements = "cnb.cool/liyao52033/hugopress -> hugopress"
    [[module.imports]]
        path = "cnb.cool/liyao52033/hugopress/v2"
        disable = false
```

## 创建新内容并预览网站

导航到你 Hugo 项目的根节点，在`content/docs` 目录中创建一个Markdown文件 ，然后执行

```sh
yarn run dev
```

这会自动创建fromtmatter并在本地预览您的网站，默认如下，也可以自动修改`scripts/add-frontmatter.js`

```markdown
---
title: "Example Page"
tags:
categories:
date: 2023-08-21T09:11:30.000Z
url: /pages/6676cf
type: docs
description: 
cover: https://cnb.xiaoying.org.cn?random=/pages/ac8b70
weight: 100
license: true
twikoo: true
footer: false
---
```

根据你的需求，修改上述前置选项。



