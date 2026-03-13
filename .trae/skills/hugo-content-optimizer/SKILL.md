---
name: "hugo-content-optimizer"
description: "为 Hugo 项目更新图标和生成文章摘要。当用户要求更新图标、生成摘要或优化 content 目录时调用此 skill。"
---

# Hugo 内容优化器

此 skill 专门用于 Hugo 项目的内容优化，包括：
1. 为 `_index.md` 文件推荐并更新合适的 Google Fonts 图标
2. 为没有 description 的文章生成摘要
3. 清理 frontmatter 中的冗余字段（permalink、titleTag、autoSort）

## 使用场景

**调用此 skill 的情况：**
- 用户要求更新图标
- 用户要求生成文章摘要
- 用户要求优化 content 目录
- 用户说"更新图标和摘要"等类似需求

## 工作流程

### 步骤 1：确定处理范围
- 如果用户提供了文件夹路径，使用该路径
- 如果用户未提供，使用 `content` 目录

### 步骤 2：使用 Python 脚本处理

运行 main.py 脚本来执行优化：

```bash
python .trae/skills/hugo-content-optimizer/main.py --path <目录路径>
```

例如：
- 处理整个 content 目录：`python .trae/skills/hugo-content-optimizer/main.py`
- 处理特定目录：`python .trae/skills/hugo-content-optimizer/main.py --path content/01.前端`

### 步骤 3：向用户报告处理结果

脚本会输出详细的处理结果，包括：
- 更新的文件数量和列表
- 错误信息（如有）

## 功能说明

### 1. 图标推荐规则

根据文件夹类型推荐合适的 Google Fonts 图标：

#### 一级分类
| 文件夹 | 推荐图标 |
|--------|----------|
| `01.前端` | `code` |
| `02.后端` | `storage` |
| `05.嵌入式` | `memory` |
| `06.python` | `terminal` |

#### 前端子文件夹
| 文件夹 | 推荐图标 |
|--------|----------|
| `05.知识点` | `lightbulb` |
| `08.代码调试` | `bug_report` |
| `10.vue2` | `view_module` |
| `15.vue3` | `view_comfy` |
| `20.typescript` | `data_object` |

#### 后端子文件夹
| 文件夹 | 推荐图标 |
|--------|----------|
| `01.springboot` | `coffee` |
| `10.服务器相关` | `dns` |
| `15.腾讯云cos对象操作` | `cloud_upload` |

#### 嵌入式子文件夹
| 文件夹 | 推荐图标 |
|--------|----------|
| `01.基础知识` | `school` |

#### Python子文件夹
| 文件夹 | 推荐图标 |
|--------|----------|
| `10.数据分析` | `analytics` |
| `20.爬虫` | `search` |

#### 其他文件夹
| 文件夹 | 推荐图标 |
|--------|----------|
| `组件` | `menu_book` |
| `组件/02.基础组件` | `extension` |
| `组件/05.Form表单组件` | `edit_note` |
| `组件/08.Feedback反馈组件` | `rate_review` |
| `组件/10.hooks` | `settings_suggest` |
| `工具类` | `build` |
| `docs` | `rocket_launch` |
| `backend` | `code` |
| `backend/2.通用模块` | `integration_instructions` |
| `backend/10.其他模块` | `widgets` |

### 2. Frontmatter 清理规则

在生成摘要时，如果 frontmatter 中存在以下冗余字段，需要删除：

| 字段名 | 说明 |
|--------|------|
| `permalink` | 永久链接字段，Hugo 会自动生成 |
| `titleTag` | 标题标签字段，非标准 frontmatter 字段 |
| `autoSort` | 自动排序字段，非标准 frontmatter 字段 |

### 3. 摘要生成规则

根据文章内容生成合适的 description：

#### 摘要格式要求
- **长度**：80-150 个中文字符
- **内容要点**：
  - 文章/插件/工具的主要功能和用途
  - 核心特性或优势
  - 使用场景或解决的问题
- **语言**：中文
- **格式**：
  - 以"本文介绍"、"一个为..."或直接描述开头
  - 使用逗号或句号分隔不同要点
  - 突出核心功能和价值
  - 语言简洁流畅，易于理解
