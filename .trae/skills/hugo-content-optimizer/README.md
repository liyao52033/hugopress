# Hugo 内容优化器

这是一个用于优化 Hugo 项目内容的 Python 脚本。

## 功能

1. **图标更新**：根据文件夹名称自动为 `_index.md` 文件推荐并更新合适的 Google Fonts 图标
2. **摘要生成**：为没有 description 的文章自动生成摘要
3. **Frontmatter 清理**：清理冗余字段（permalink、titleTag、autoSort）

## 使用方法

### 基本用法

```bash
# 在项目根目录下运行，处理 content 目录
python main.py

# 指定特定目录
python main.py --path content/01.前端
```

### 参数说明

- `--path`：要处理的目录路径，默认为 `content`

## 图标推荐规则

脚本内置了图标推荐规则，根据文件夹名称自动匹配合适的图标，例如：

- `01.前端` → `code`
- `02.后端` → `storage`
- `15.vue3` → `view_comfy`
- 等等...

## 注意事项

- 脚本只使用 Python 标准库，无需安装额外依赖
- 建议在使用前备份重要文件
- 脚本会在控制台输出处理结果和错误信息
