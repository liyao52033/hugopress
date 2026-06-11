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

// 引入依赖（需先安装 gray-matter 和 dotenv）
const fs = require('fs');
const os = require('os');
const path = require('path');
const matter = require('gray-matter');
const { exec } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
require('dotenv').config();

const { getAllMdFiles } = require('./utils/md');
const {
  calculateWeight,
  getMdFilesWithNumbers,
  getSubDirectoriesWithNumbers,
  hasAnyWeightedFiles,
} = require('./utils/weight');

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
 * 获取文章前100字正文（保证段落完整）
 * @param {string} content - Markdown 内容
 * @param {number} maxLength - 最大长度（默认100）
 * @returns {string} 提取的正文摘要
 */
const getFirstParagraph = (content, maxLength = 100) => {
  // 移除 Markdown 格式
  let text = content
    .replace(/[#*`~\[\]]/g, '')      // 移除 Markdown 标记
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '')  // 移除链接
    .replace(/\n+/g, ' ')            // 换行转空格
    .trim();

  // 如果内容小于等于maxLength，直接返回
  if (text.length <= maxLength) {
    return text;
  }

  // 找到合适的截断点（优先在句子末尾截断）
  const truncatePoints = ['.', '。', '!', '！', '?', '？', ';', '；', ':', '：', '，', ',', ' '];
  let result = text.substring(0, maxLength);

  // 从末尾向前找合适的截断点
  for (let i = result.length - 1; i >= 0; i--) {
    if (truncatePoints.includes(result[i])) {
      result = result.substring(0, i + 1).trim();
      break;
    }
  }

  return result || text.substring(0, maxLength).trim();
};

const inferImageExtension = (contentType = '') => {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('image/jpeg') || normalized.includes('image/jpg')) return '.jpg';
  if (normalized.includes('image/webp')) return '.webp';
  return '.png';
};

const writeBufferToTempImage = (buffer, ext = '.png') => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hugopress-cover-'));
  const filePath = path.join(tempDir, `cover${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const writeResponseToTempImage = async (response) => {
  if (!response.body) {
    throw new Error('AI API 响应缺少 body');
  }

  const ext = inferImageExtension(response.headers.get('content-type') || '');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hugopress-cover-'));
  const filePath = path.join(tempDir, `cover${ext}`);

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(filePath));

  return filePath;
};

const extractImagePayload = (data) => {
  const firstItem = Array.isArray(data?.data) ? data.data[0] : null;

  return {
    b64_json: data?.b64_json || firstItem?.b64_json || null,
    url: data?.url || firstItem?.url || null,
  };
};

const cleanupTempImagePath = (filePath) => {
  if (!filePath) return;

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const dirPath = path.dirname(filePath);
  if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
    fs.rmdirSync(dirPath);
  }
};


/**
 * 调用 AI 文生图 API 生成图片
 * @param {string} prompt - 提示词
 * @returns {Promise<string|null>} 本地临时图片路径，失败返回 null
 */
const generateImageByAI = async (prompt) => {
  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未配置 AI_API_KEY，跳过AI封面生成');
    return null;
  }

  try {
    const response = await fetch(`${process.env.IMAGE_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: 'gpt-image-2',
        n: 1,
        size: '1024x1024',
        quality: "medium",
        response_format: "b64_json",
      })
    });

    if (!response.ok) {
      throw new Error(`AI API 请求失败: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('application/json')) {
      const data = await response.json();
      const { b64_json, url } = extractImagePayload(data);

      if (b64_json) {
        return writeBufferToTempImage(Buffer.from(b64_json, 'base64'));
      }

      if (url) {
        const imageResponse = await fetch(url, { method: 'GET' });
        if (!imageResponse.ok) {
          throw new Error(`下载图片失败: ${imageResponse.status}`);
        }
        return await writeResponseToTempImage(imageResponse);
      }

      return null;
    }

    return await writeResponseToTempImage(response);
  } catch (error) {
    console.error(`❌ AI生成图片失败: ${error.message}`);
    return null;
  }
};

/**
 * 上传图片到本地服务
 * @param {string} url - 图片URL
 * @returns {Promise<string|null>} 上传后的图片URL，失败返回null
 */
const uploadImage = async (url) => {
  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未配置 AI_API_KEY，跳过图片上传');
    return null;
  }
  try {
    const response = await fetch('http://127.0.0.1:36677/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ list: [url] })
    });

    if (!response.ok) {
      throw new Error(`上传接口请求失败: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.result) && data.result.length > 0) {
      return data.result[0];
    }

    if (data.urls && data.urls.length > 0) {
      return data.urls[0];
    }

    return null;
  } catch (error) {
    console.error(`❌ 图片上传失败: ${error.message}`);
    return null;
  }
};

/**
 * 调用AI生成封面图（单个）
 * @param {string} title - 文章标题
 * @param {string} content - 文章正文摘要
 * @returns {Promise<string|null>} 封面图URL，失败返回null
 */
const generateCoverImage = async (title, content) => {
  const prompt = `根据以下文章内容生成一张适合作为博客封面的图片：

标题：${title}

内容摘要：${content}

要求：
1. 风格简约现代，适合技术博客
2. 图片清晰，色彩协调
3. 包含与内容相关的视觉元素`;

  const localPath = await generateImageByAI(prompt);
  if (!localPath) {
    return null;
  }

  try {
    return await uploadImage(localPath);
  } finally {
    cleanupTempImagePath(localPath);
  }
};

/**
 * 批量调用AI生成封面图（并行处理）
 * @param {Array<{title: string, content: string, filePath: string}>} tasks - 任务列表
 * @param {number} concurrency - 并发数（默认5）
 * @returns {Promise<Map<string, string|null>>} 结果映射（filePath -> coverUrl）
 */
const generateCoverImagesBatch = async (tasks, concurrency = 5) => {
  const results = new Map();
  const apiKey = process.env.IMAGE_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ 未配置 AI_API_KEY，跳过图片上传');
    tasks.forEach(task => results.set(task.filePath, null));
    return results;
  }

  // 构建所有提示词
  const prompts = tasks.map(task => {
    return `根据以下文章内容生成一张适合作为博客封面的图片：

标题：${task.title}

内容摘要：${task.content}

要求：
1. 风格简约现代，适合技术博客
2. 图片清晰，色彩协调
3. 包含与内容相关的视觉元素`;
  });

  console.log(`🚀 开始批量生成封面图，共 ${tasks.length} 个任务，并发数: ${concurrency}`);

  // 分批处理
  const batches = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    batches.push(tasks.slice(i, i + concurrency));
  }

  // 串行处理批次
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchPrompts = prompts.slice(batchIndex * concurrency, (batchIndex + 1) * concurrency);

    console.log(`📦 处理批次 ${batchIndex + 1}/${batches.length}，共 ${batch.length} 个任务`);
    // 并行调用 AI 生成图片
    const generationPromises = batchPrompts.map(async (prompt) => {
      return await generateImageByAI(prompt);
    });

    const coverUrls = await Promise.all(generationPromises);

    // 收集需要上传的图片（现在 coverUrls 里已经是本地临时文件路径）
    const uploadTasks = [];
    const uploadIndexMap = []; // 记录上传位置与原始任务的映射

    coverUrls.forEach((localPath, index) => {
      if (localPath) {
        uploadTasks.push(localPath);
        uploadIndexMap.push({ originalIndex: index, hasData: true });
      } else {
        uploadIndexMap.push({ originalIndex: index, hasData: false });
      }
    });

    // 批量上传图片
    let uploadResults = [];
    if (uploadTasks.length > 0) {
      try {
        const response = await fetch('http://127.0.0.1:36677/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ list: uploadTasks })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.result)) {
            uploadResults = data.result;
          } else {
            uploadResults = data.urls || [];
          }
        }
      } catch (error) {
        console.error(`❌ 批次 ${batchIndex + 1} 上传失败: ${error.message}`);
      } finally {
        uploadTasks.forEach(cleanupTempImagePath);
      }
    }

    // 将结果映射到对应的文件
    let uploadPointer = 0;
    uploadIndexMap.forEach(({ originalIndex, hasData }) => {
      const task = batch[originalIndex];
      let url = null;

      if (hasData) {
        url = uploadResults[uploadPointer] || null;
        uploadPointer += 1;
      }

      results.set(task.filePath, url);
      console.log(`  ${url ? '✅' : '❌'} "${task.title}" ${url ? '生成并上传成功' : '生成或上传失败，使用兜底方案'}`);
    });
  }

  return results;
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
// 处理 Markdown 内容中的标题数字前缀
// ======================================

/**
 * 移除 Markdown 标题中的数字前缀
 * @param {string} content - Markdown 内容
 * @returns {string} 处理后的内容
 */
const removeHeadingNumbers = (content) => {
  // 只处理以数字开头的标题
  // 支持格式：
  // - 阿拉伯数字：1. 标题 、1、标题 、1.1 标题
  // - 中文数字：一、标题 、二. 标题 、十一、标题
  // - 括号数字：(1) 标题 、（1）标题 、(1)标题 、（1）标题（括号后无空格）
  // - 支持全角和半角标点

  // 数字部分（阿拉伯数字或中文数字）
  const numberPart = '(?:\\d+(?:\\.\\d+)*|[零一二三四五六七八九十百千万亿]+)';
  // 括号（中英文）
  const brackets = '[\\(\\（]';
  const bracketsEnd = '[\\)\\）]';
  // 标点符号
  const punctuation = '[.。．\\-、,，]';

  // 匹配模式：
  // 1. 数字 + 可选标点 + 空格 + 标题
  // 2. 括号 + 数字 + 括号 + 可选空格 + 标题
  const pattern = new RegExp(
    `^(#{1,6})\\s+(?:${brackets}${numberPart}${bracketsEnd}\\s*|${numberPart}(?:${punctuation})?\\s+)(.+)$`,
    'gm'
  );

  return content.replace(pattern, (match, hashes, title) => {
    const cleanTitle = title.trim();
    return `${hashes} ${cleanTitle}`;
  });
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
 * @param {boolean} [option.enableAiCover] - 是否启用AI封面生成（默认 true）
 * @param {number} [option.coverConcurrency] - AI封面生成并发数（默认5）
 */
const writeFrontmatterToFile = async (filePaths, option) => {
  const {
    transform,
    permalinkPrefix,
    categories,
    ignore = [],
    enableAiCover = true,
    coverConcurrency = 5
  } = option;

  // 第一阶段：收集需要生成封面的任务
  const coverTasks = [];
  const fileDataMap = new Map();

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
      const title = getMdFileTitle(fileName);

      // 存储文件数据供后续使用
      fileDataMap.set(filePath, {
        fileName,
        existingFrontmatter,
        markdownContent,
        fileStat,
        fileInfo,
        title
      });

      // 如果缺少 cover 字段且启用了AI封面生成，添加到任务列表
      if (enableAiCover && !existingFrontmatter.cover) {
        contentSummary = existingFrontmatter.description || getFirstParagraph(markdownContent);
        coverTasks.push({
          filePath,
          title,
          content: contentSummary
        });
      }
    } catch (error) {
      console.error(`❌ 读取文件失败：${filePath}`, error.message);
    }
  }

  // 第二阶段：批量生成封面图（并行处理）
  let coverResults = new Map();
  if (coverTasks.length > 0) {
    coverResults = await generateCoverImagesBatch(coverTasks, coverConcurrency);
  }

  // 第三阶段：写入 frontmatter（串行处理，避免文件写入冲突）
  for (const [filePath, data] of fileDataMap) {
    try {
      const { fileName, existingFrontmatter, markdownContent, fileStat, fileInfo, title } = data;

      // 生成兜底封面URL
      const fallbackCover = `https://cnb.xiaoying.org.cn?random=${createPermalink(permalinkPrefix)}`;

      // 获取AI生成的封面（如果有）
      const aiCoverUrl = coverResults.get(filePath) || null;

      // 默认 frontmatter（只会在缺失时补充，不覆盖已有字段）
      const defaultFrontmatter = {
        title: title,
        date: formatDate(fileStat.birthtime || fileStat.atime),
        url: createPermalink(permalinkPrefix),
        type: "docs",
        description: "",
        license: true,
        twikoo: true,
        footer: false,
        cover: aiCoverUrl || fallbackCover, // AI生成的封面或兜底方案
        weight: calculateWeight(filePath, {
          weightStep: option.weightStep || 10,
          defaultWeight: option.defaultWeight || 9999,
          enableDebugLog: option.enableDebugLog || false
        }),
        tags: createCategory(categories, fileInfo, ignore),
        categories: createCategory(categories, fileInfo, ignore),
        author: {
          name: "华总",
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

      // 处理 Markdown 内容中的标题数字前缀
      const processedContent = removeHeadingNumbers(markdownContent);
      const contentChanged = processedContent !== markdownContent;

      // 自定义 transform（可选）
      if (typeof transform === "function") {
        const transformed = transform(finalFrontmatter, fileInfo);
        if (transformed && Object.keys(transformed).length > 0) {
          finalFrontmatter = { ...finalFrontmatter, ...transformed };
          hasChange = true;
        }
      }

      if (!hasChange && !contentChanged) {
        continue;
      }

      // 写入更新后的 frontmatter
      const frontmatterStr = matter.stringify("", finalFrontmatter).replace(/'/g, "");
      const newFileContent = `${frontmatterStr}${processedContent}`;
      fs.writeFileSync(filePath, newFileContent, "utf-8");

      if (contentChanged) {
        console.log(`✅ 成功更新 frontmatter 并移除标题数字：${filePath}`);
      } else {
        console.log(`✅ 成功更新 frontmatter：${filePath}`);
      }
    } catch (error) {
      console.error(`❌ 处理文件失败：${filePath}`, error.message);
    }
  }
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
async function rmCachedIfExists(path, removeGitCached) {
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

async function main() {
  // 1. 配置参数（可根据你的需求修改）
  const config = {
    permalinkPrefix: "pages", // permalink 前缀（如 "posts" → /posts/xxx），不需要则设为 undefined
    categories: true, // 是否根据目录结构生成分类（true 生成，false 不生成）
    ignore: ["_index.md", "index.md", "pages"], // 忽略的文件/目录（_index.md 是 Hugo 索引文件，建议忽略）
    // 权重计算配置
    weightStep: 10, // 权重递增步长
    defaultWeight: 9999, // 默认权重（当无法计算时使用）
    removeGitCached: true, // 是否移除加密文章的 Git 缓存
    enableDebugLog: false, // 是否启用调试日志
    enableAiCover: true, // 是否启用AI封面生成
    coverConcurrency: 5, // AI封面生成并发数（建议根据服务器性能调整）
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
  await writeFrontmatterToFile(mdFiles, config);
}

if (require.main === module) {
  main();
}

// 导出函数供外部使用
module.exports = {
  calculateWeight,
  getMdFilesWithNumbers,
  getSubDirectoriesWithNumbers,
  hasAnyWeightedFiles,
  inferImageExtension,
  cleanupTempImagePath,
  generateImageByAI,
  uploadImage,
  generateCoverImage,
  generateCoverImagesBatch
};
