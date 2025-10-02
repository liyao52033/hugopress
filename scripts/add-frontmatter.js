// 自动添加frontmatter

// 引入依赖（需先安装 gray-matter）
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ======================================
// 1. 核心工具函数（处理 frontmatter 逻辑）
// ======================================

/**
 * 获取 Markdown 标题（基于文件名，自动去除序号前缀如「01.」）
 * @param {string} filename - 文件名（如 "01.hello-world.md"）
 * @returns {string} 处理后的标题（如 "hello-world"）
 */
const getMdFileTitle = (filename) => {
  const nameWithoutExt = path.basename(filename, '.md'); // 去掉 .md 后缀
  return nameWithoutExt.replace(/^\d+\./, ''); // 去掉开头的「数字.」（如 01.、2.）
};

/**
 * 获取文件相对路径信息（基于 Hugo 的 content/ 目录）
 * @param {string} filePath - 文件绝对路径
 * @returns {object} { filePath: 绝对路径, relativePath: 相对于 content/ 的路径 }
 */
const getFileInfo = (filePath) => {
  const contentDir = path.resolve('content'); // Hugo 内容目录的绝对路径
  const relativePath = path.relative(contentDir, filePath).replace(/\\/g, "/"); // 统一为 / 分隔符
  return { filePath, relativePath };
};

/**
 * 创建 permalink（永久链接）
 * @param {string} permalinkPrefix - 链接前缀（如 "posts" 则生成 /posts/xxx）
 * @returns {string|undefined} 生成的 permalink（前缀为空时返回 undefined）
 */
const createPermalink = (permalinkPrefix) => {
  if (!permalinkPrefix) return;
  // 生成 6 位随机字符串作为唯一标识
  const randomStr = (Math.random() + Math.random()).toString(16).slice(2, 8);
  return `/${permalinkPrefix}/${randomStr}`;
};

/**
 * 创建分类（基于文件在 content/ 中的目录结构）
 * @param {boolean} flag - 是否启用分类生成（true 启用，false 不生成）
 * @param {object} fileInfo - 文件信息（来自 getFileInfo）
 * @param {string[]} ignore - 需要忽略的目录名（如 ["_index", "draft"]）
 * @returns {string[]} 分类数组（如 ["tech", "frontend"]）
 */
const createCategory = (flag = false, fileInfo, ignore = []) => {
  if (!flag) return [];

  const relativePathArr = fileInfo.relativePath.split("/");
  const categories = [];

  relativePathArr.forEach((item, index) => {
    // 跳过最后一项（文件名，只取目录作为分类）
    if (index === relativePathArr.length - 1) return;
    // 去掉目录名中的序号前缀（如 "01.tech" → "tech"）
    const cleanDirName = item.replace(/^\d+\./, "");
    // 忽略配置中的目录
    if (!ignore.includes(cleanDirName)) {
      categories.push(cleanDirName);
    }
  });

  // 若没有分类，返回空数组（Hugo 中可省略，也可改为 ["uncategorized"]）
  return categories.length ? categories : [];
};

/**
 * 格式化日期为 Hugo 兼容格式（yyyy-MM-dd）
 * @param {Date} date - 原始日期（如文件创建时间）
 * @returns {string} 格式化后的日期（如 "2024-05-20"）
 */
function formatDate(d, fmt = "yyyy-MM-dd hh:mm:ss") {
  if (!(d instanceof Date)) {
    d = new Date(d);
  }
  const o = {
    "M+": d.getMonth() + 1, // 月份
    "d+": d.getDate(), // 日
    "h+": d.getHours(), // 小时
    "m+": d.getMinutes(), // 分
    "s+": d.getSeconds(), // 秒
    "q+": Math.floor((d.getMonth() + 3) / 3), // 季度
    S: d.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, `${d.getFullYear()}`.substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length));
  }
  return fmt;
}


// ======================================
// 2. 核心逻辑：批量添加 frontmatter 到文件
// ======================================

/**
 * 批量为 Markdown 文件添加/补全 frontmatter
 * @param {string[]} filePaths - 需要处理的文件路径列表
 * @param {object} option - 配置选项
 * @param {string} [option.permalinkPrefix] - permalink 前缀（如 "posts"）
 * @param {boolean} [option.categories] - 是否生成分类（默认 false）
 * @param {string[]} [option.ignore] - 需要忽略的文件/目录名（默认 []）
 * @param {Function} [option.transform] - 自定义修改 frontmatter 的回调（可选）
 */
const writeFrontmatterToFile = (filePaths, option) => {
  const { transform, permalinkPrefix, categories, ignore = [] } = option;

  for (const filePath of filePaths) {
    if (!filePath.endsWith(".md")) continue;

    const fileName = path.basename(filePath);
    if (ignore.includes(fileName)) {
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data: existingFrontmatter, content: markdownContent } = matter(fileContent);

      const fileStat = fs.statSync(filePath);
      const fileInfo = getFileInfo(filePath);

      // 默认 frontmatter（只会在缺失时补充，不覆盖已有字段）
      const defaultFrontmatter = {
        title: getMdFileTitle(fileName),
        date: formatDate(fileStat.birthtime || fileStat.atime),
        url: createPermalink(permalinkPrefix),
        type: "docs",
        description: "",
        weight: 999,
        tags: [],
        categories: createCategory(categories, fileInfo, ignore),
        author: {
          name: "liyao",
          link: "https://xiaoying.org.cn",
        },
      };

      // 先复制已有 frontmatter
      let finalFrontmatter = { ...existingFrontmatter };
      let hasChange = false;

      // 遍历 defaultFrontmatter，只补缺失
      Object.keys(defaultFrontmatter).forEach((key) => {
        if (!(key in existingFrontmatter)) {
          finalFrontmatter[key] = defaultFrontmatter[key];
          hasChange = true;
        }
      });

      // 自定义 transform（可选）
      if (typeof transform === "function") {
        const transformed = transform(finalFrontmatter, fileInfo);
        if (transformed && Object.keys(transformed).length > 0) {
          finalFrontmatter = { ...finalFrontmatter, ...transformed };
          hasChange = true;
        }
      }

      if (!hasChange) {
        continue;
      }

      // 写入更新后的 frontmatter
      const frontmatterStr = matter.stringify("", finalFrontmatter).replace(/'/g, "");
      const newFileContent = `${frontmatterStr}${markdownContent}`;
      fs.writeFileSync(filePath, newFileContent, "utf-8");

      console.log(`✅ 成功更新 frontmatter：${filePath}`);
    } catch (error) {
      console.error(`❌ 处理文件失败：${filePath}`, error.message);
    }
  }
};


// ======================================
// 3. 自动执行逻辑（脚本运行时触发）
// ======================================

/**
 * 递归获取指定目录下所有 .md 文件
 * @param {string} dir - 目标目录（如 content/）
 * @returns {string[]} 所有 .md 文件的绝对路径列表
 */
const getAllMdFiles = (dir) => {
  let fileList = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      fileList = [...fileList, ...getAllMdFiles(fullPath)];
    } else if (file.endsWith('.md')) {
      // 收集 .md 文件路径
      fileList.push(fullPath);
    }
  });

  return fileList;
};

// 脚本入口：配置参数 + 执行处理
(() => {
  // 1. 配置参数（可根据你的需求修改）
  const config = {
    permalinkPrefix: "pages", // permalink 前缀（如 "posts" → /posts/xxx），不需要则设为 undefined
    categories: true, // 是否根据目录结构生成分类（true 生成，false 不生成）
    ignore: ["_index.md", "index.md", "pages"], // 忽略的文件/目录（_index.md 是 Hugo 索引文件，建议忽略）
    // 自定义转换 frontmatter（可选，根据需求修改）
    transform: (frontmatter, fileInfo) => {
       
    }
  };

  // 2. 获取 content/ 目录下所有 .md 文件
  const contentDir = path.resolve("content"); // Hugo 内容目录（默认是项目根目录下的 content）
  if (!fs.existsSync(contentDir)) {
    console.error(`❌ 未找到 Hugo 内容目录：${contentDir}`);
    process.exit(1); // 退出脚本，避免报错
  }
  const mdFiles = getAllMdFiles(contentDir);

  // 3. 执行 frontmatter 处理
  if (mdFiles.length === 0) {
    console.log(`ℹ️ content/ 目录下没有 .md 文件`);
    return;
  }
  writeFrontmatterToFile(mdFiles, config);
})();
