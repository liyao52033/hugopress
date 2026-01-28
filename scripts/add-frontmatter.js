// 自动添加frontmatter
/**
 * 1、日期date为今天及以后不构建，要在启动参数后加 -F
 * 2、content下的直接子目录内的文章 weight 要逐级递增
 *
 * 
 */


/**
 * 自动添加 Markdown 文件的 frontmatter 元数据
 * @param {string} filePath - Markdown 文件的绝对路径
 * @param {object} options - 配置选项（如 title、date、url、weight 等）
 */

// 引入依赖（需先安装 gray-matter）
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { exec } = require('child_process');

// ======================================
// 核心工具函数（处理 frontmatter 逻辑）
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
// 权重计算相关函数
// ======================================

// 文件缓存，避免重复读取
const fileCache = new Map();

/**
 * 从名称中提取序号（支持"01.名称"或"1-名称"等格式）
 * @param {string} name - 文件名或目录名
 * @returns {number} 提取的序号
 */
const extractNumberFromName = (name) => {
  // 匹配开头的数字，支持格式如 "01.名称"、"1-名称"、"1_名称"等
  const match = name.match(/^(\d+)[.\-_]/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * 获取文件的frontmatter数据（带缓存）
 * @param {string} filePath - 文件路径
 * @returns {object} frontmatter数据
 */
const getFileFrontmatter = (filePath) => {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);
    fileCache.set(filePath, data);
    return data;
  } catch (error) {
    console.warn(`无法读取文件 ${filePath}: ${error.message}`);
    const emptyData = {};
    fileCache.set(filePath, emptyData);
    return emptyData;
  }
};

/**
 * 获取目录下所有md文件的序号信息
 * @param {string} dirPath - 目录路径
 * @param {object} options - 配置选项
 * @param {boolean} options.excludeNoWeight - 是否排除没有weight值的文件
 * @returns {Array} 文件信息数组 [{name, number, path, hasWeight}]
 */
const getMdFilesWithNumbers = (dirPath, options = {}) => {
  const { excludeNoWeight = false } = options;

  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md'));

    return files.map(fileName => {
      const filePath = path.join(dirPath, fileName);
      const fileNumber = extractNumberFromName(fileName);
      const frontmatter = getFileFrontmatter(filePath);
      const hasWeight = frontmatter && typeof frontmatter.weight === 'number';

      return {
        name: fileName,
        number: fileNumber,
        path: filePath,
        hasWeight: hasWeight
      };
    }).filter(fileInfo => {
      // 如果设置了excludeNoWeight，则只返回有weight值的文件
      return !excludeNoWeight || fileInfo.hasWeight;
    });
  } catch (error) {
    console.warn(`无法读取目录 ${dirPath}: ${error.message}`);
    return [];
  }
};

/**
 * 检查目录中是否有任何有权重的文件
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 是否有至少一个有权重的文件
 */
const hasAnyWeightedFiles = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return false;
    }

    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md'));

    for (const fileName of files) {
      const filePath = path.join(dirPath, fileName);
      const frontmatter = getFileFrontmatter(filePath);
      if (frontmatter && typeof frontmatter.weight === 'number') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn(`无法读取目录 ${dirPath}: ${error.message}`);
    return false;
  }
};

/**
 * 获取父目录下所有子目录的序号信息
 * @param {string} parentDirPath - 父目录路径
 * @returns {Array} 目录信息数组 [{name, number, path}]
 */
const getSubDirectoriesWithNumbers = (parentDirPath) => {
  try {
    if (!fs.existsSync(parentDirPath)) {
      return [];
    }

    const items = fs.readdirSync(parentDirPath);
    const dirs = [];

    for (const item of items) {
      const itemPath = path.join(parentDirPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const dirNumber = extractNumberFromName(item);
        dirs.push({ name: item, number: dirNumber, path: itemPath });
      }
    }

    return dirs;
  } catch (error) {
    console.warn(`无法读取父目录 ${parentDirPath}: ${error.message}`);
    return [];
  }
};

/**
 * 计算文件权重（基于目录序号和文件序号的复杂逻辑）
 * @param {string} filePath - 当前文件的绝对路径
 * @param {object} options - 配置选项
 * @returns {number} 计算出的权重值
 */
const calculateWeight = (filePath, options = {}) => {
  const {
    weightStep = 1,
    defaultWeight = 999,
    enableDebugLog = false
  } = options;

  try {
    // 清除当前文件的缓存，确保获取最新信息
    fileCache.delete(filePath);

    // 1. 获取当前文件所在目录信息
    const currentDir = path.dirname(filePath);
    const parentDir = path.dirname(currentDir);
    const currentDirName = path.basename(currentDir);

    if (enableDebugLog) {
      console.log(`计算权重 - 当前文件: ${path.basename(filePath)}`);
      console.log(`当前目录: ${currentDirName} (${currentDir})`);
    }

    // 2. 获取当前目录中有权重的文件
    const mdFilesWithWeight = getMdFilesWithNumbers(currentDir, { excludeNoWeight: true });

    let baseWeight = 0;
    let referenceSource = "默认值";

    if (mdFilesWithWeight.length > 0) {
      // 当前目录有权重的文件，使用当前目录的最大权重作为基准
      const weights = mdFilesWithWeight.map(file => {
        const frontmatter = getFileFrontmatter(file.path);
        return frontmatter.weight || 0;
      });

      baseWeight = Math.max(...weights);
      referenceSource = "当前目录最大权重";

      if (enableDebugLog) {
        console.log(`当前目录有${mdFilesWithWeight.length}个有权重的文件`);
        console.log(`使用当前目录最大权重作为基准: ${baseWeight}`);
      }
    } else {
      // 当前目录没有权重的文件，查找其他目录
      if (enableDebugLog) {
        console.log(`当前目录没有权重的文件，查找其他目录`);
      }

      // 获取同级目录（排除当前目录和没有权重文件的目录）
      const siblingDirs = getSubDirectoriesWithNumbers(parentDir)
        .filter(dir => dir.path !== currentDir)
        .filter(dir => hasAnyWeightedFiles(dir.path));

      if (siblingDirs.length === 0) {
        // 没有同级目录或有权重文件的目录，使用默认权重
        referenceSource = "没有有权重的同级目录，使用默认权重";
        baseWeight = 0;

        if (enableDebugLog) {
          console.log(`没有有权重的同级目录，使用默认基准权重: ${baseWeight}`);
        }
      } else {
        // 找到序号最大的目录
        const maxDirInfo = siblingDirs.reduce((max, dirInfo) => {
          return dirInfo.number > max.number ? dirInfo : max;
        }, { name: '', number: -1, path: '' });

        if (enableDebugLog) {
          console.log(`找到序号最大的目录: ${maxDirInfo.name} (序号: ${maxDirInfo.number})`);
        }

        // 在最大序号目录中找到有权重的文件
        const mdFilesInMaxDir = getMdFilesWithNumbers(maxDirInfo.path, { excludeNoWeight: true });

        if (mdFilesInMaxDir.length > 0) {
          // 找到序号最大的文件
          const maxFileInMaxDir = mdFilesInMaxDir.reduce((max, fileInfo) => {
            return fileInfo.number > max.number ? fileInfo : max;
          }, { name: '', number: -1, path: '' });

          // 获取该文件的权重
          const frontmatter = getFileFrontmatter(maxFileInMaxDir.path);
          baseWeight = frontmatter.weight || 0;
          referenceSource = `目录${maxDirInfo.name}中文件${maxFileInMaxDir.name}的权重`;

          if (enableDebugLog) {
            console.log(`在目录${maxDirInfo.name}中找到有权重的文件: ${maxFileInMaxDir.name}`);
            console.log(`使用该文件权重作为基准: ${baseWeight}`);
          }
        } else {
          // 其他目录也没有权重的文件
          referenceSource = "所有目录都没有权重的文件";
          baseWeight = 0;

          if (enableDebugLog) {
            console.log(`其他目录也没有权重的文件，使用默认基准权重: ${baseWeight}`);
          }
        }
      }
    }

    // 3. 获取当前文件的序号
    const currentFileName = path.basename(filePath);
    const currentFileNumber = extractNumberFromName(currentFileName);

    // 4. 计算最终权重
    const finalWeight = baseWeight + (currentFileNumber * weightStep);

    if (enableDebugLog) {
      console.log(`当前文件: ${currentFileName} (序号: ${currentFileNumber})`);
      console.log(`计算公式: ${baseWeight} + (${currentFileNumber} * ${weightStep}) = ${finalWeight}`);
      console.log(`参考来源: ${referenceSource}`);
      console.log('---');
    }

    return finalWeight;
  } catch (error) {
    console.error(`计算权重时出错: ${error.message}`);
    return defaultWeight;
  }
};

// ======================================
// 核心逻辑：批量添加 frontmatter 到文件
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
        weight: calculateWeight(filePath, {
          weightStep: option.weightStep || 10,
          defaultWeight: option.defaultWeight || 9999,
          enableDebugLog: option.enableDebugLog || false
        }),
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

// ======================================
// 处理加密文件的 .gitignore 更新及 Git 缓存清除
// ======================================

/**
 * 辅助函数：转义 Shell 命令参数（处理空格、特殊字符）
 * @param {string} arg - 要转义的参数
 * @returns {string} 转义后的参数
 */
function escapeShellArg(arg) {
  return `"${arg.replace(/"/g, '\\"')}"`;
}

/**
 * 异步判断指定路径是否存在 Git 缓存（是否被 Git 追踪）
 * @param {string} path - 要检查的文件/目录路径（如 '.' 表示全部，'dist' 表示dist目录）
 * @returns {Promise<boolean>} true=有缓存，false=无缓存
 */
async function hasGitCached(path) {
  const command = `git ls-files ${escapeShellArg(path)}`;

  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      // 处理严重错误（如非 Git 仓库）
      if (error) {
        // 非 Git 仓库的错误码通常是 128，单独处理
        if (error.code === 128) {
          reject(new Error('当前目录不是 Git 仓库，请先执行 git init'));
          return;
        }
        reject(new Error(`检查 Git 缓存失败：${error.message}\n错误详情：${stderr}`));
        return;
      }
      // 若 stdout 非空，说明有缓存；空则无缓存
      resolve(stdout.trim() !== '');
    });
  });
}

/**
 * 异步执行 git rm -rf --cached 命令
 * @param {string} path - 要移除缓存的文件/目录路径
 * @returns {Promise<string>} 命令执行结果
 */
async function gitRmCachedAsync(path) {
  const command = `git rm -rf --cached ${escapeShellArg(path)}`;

  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`执行 Git 命令失败：${error.message}\n错误详情：${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * 核心逻辑：有缓存才执行 git rm -rf --cached
 * @param {string} path - 目标文件/目录路径
 */
async function rmCachedIfExists(path, removeGitCached)  {
  try {
    // 第一步：检查是否有缓存
    const cached = await hasGitCached(path);
    if (!cached) {
      return;
    }
    // 第二步：有缓存则执行移除命令
    if (removeGitCached) {
      await gitRmCachedAsync(path);
      console.log(`已成功移除 "${path}" 的 Git 缓存`);
    }
  } catch (err) {
    console.error('操作失败：', err.message);
  }
}

/**
 * 检查并更新 .gitignore 文件，添加 private: true 的 Markdown 文件
 * @param {object} frontmatter - 文件的 frontmatter 数据
 * @param {string} filePath - Markdown 文件路径
 */
const addToGitignore = (frontmatter, filePath, removeGitCached) => {
  try {
    // 1. 检查 .gitignore 文件是否存在
    const gitignorePath = path.resolve('.gitignore');
    let gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf-8')
      : '';
    
    const gitignoreHeader = '# Private files (auto-generated by add-frontmatter.js)\n\n';
    const gitignoreFooter = '# End of private files section\n';

    // 2. 提取现有的私有文件部分
    const privateFilesRegex = /# Private files \(auto-generated by add-frontmatter\.js\)\n[\s\S]*?# End of private files section\n/g;
    const existingPrivateSection = gitignoreContent.match(privateFilesRegex);
    
    // 3. 移除旧的私有文件部分
    gitignoreContent = gitignoreContent.replace(privateFilesRegex, '');

    // 4. 收集所有私有文件路径
    let privateFiles = [];
    if (existingPrivateSection) {
      // 从现有部分提取文件路径
      const sectionContent = existingPrivateSection[0];
      privateFiles = sectionContent
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.trim());
    }

    // 5. 添加当前私有文件（如果需要）
    if (frontmatter.private === true) {
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      rmCachedIfExists(relativePath, removeGitCached);
      
      // 检查文件是否已存在于私有文件列表中
      if (!privateFiles.includes(relativePath)) {
        privateFiles.push(relativePath);
        console.log(`✅ 已添加 ${relativePath} 到 .gitignore 文件`);
      }
    }

    // 6. 重新构建私有文件部分
    if (privateFiles.length > 0) {
      const privateFilesSection = `${gitignoreHeader}${privateFiles.join('\n')}\n\n${gitignoreFooter}`;
      gitignoreContent += privateFilesSection;
      fs.writeFileSync(gitignorePath, gitignoreContent.trim() + '\n', 'utf-8');
    }
  } catch (error) {
    console.error(`更新 .gitignore 文件时出错：${error.message}`);
  }
};

// ======================================
// 自动执行逻辑（脚本运行时触发）
// ======================================

// 脚本入口：配置参数 + 执行处理
(() => {
  // 1. 配置参数（可根据你的需求修改）
  const config = {
    permalinkPrefix: "pages", // permalink 前缀（如 "posts" → /posts/xxx），不需要则设为 undefined
    categories: true, // 是否根据目录结构生成分类（true 生成，false 不生成）
    ignore: ["_index.md", "index.md", "pages"], // 忽略的文件/目录（_index.md 是 Hugo 索引文件，建议忽略）
    // 权重计算配置
    weightStep: 1, // 权重递增步长
    defaultWeight: 9999, // 默认权重（当无法计算时使用）
    removeGitCached: false, // 是否移除加密文章的 Git 缓存
    enableDebugLog: false, // 是否启用调试日志
    // 自定义转换 frontmatter（可选，根据需求修改）
    transform: (frontmatter, fileInfo) => {

      addToGitignore(frontmatter, fileInfo.filePath, config.removeGitCached);

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

// 导出函数供外部使用
module.exports = {
  calculateWeight,
  getMdFilesWithNumbers,
  getSubDirectoriesWithNumbers,
  hasAnyWeightedFiles
};
