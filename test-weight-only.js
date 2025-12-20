// 独立测试权重计算功能，不触发整个脚本的执行
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ======================================
// 权重计算相关函数（从add-frontmatter.js复制）
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
          console.log(`找到序号最大的同级目录: ${maxDirInfo.name} (序号: ${maxDirInfo.number})`);
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

// 测试函数
function testWeightCalculation(testFilePath) {
  console.log(`测试文件权重计算:`);
  console.log(`文件路径: ${testFilePath}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(testFilePath)) {
    console.error(`文件不存在: ${testFilePath}`);
    return;
  }
  
  // 检查文件是否有权重
  const frontmatter = getFileFrontmatter(testFilePath);
  const hasWeight = frontmatter && typeof frontmatter.weight === 'number';
  console.log(`文件是否有权重: ${hasWeight ? '是 (' + frontmatter.weight + ')' : '否'}`);
  
  // 计算权重
  const weight = calculateWeight(testFilePath, {
    weightStep: 10,
    defaultWeight: 9999,
    enableDebugLog: true
  });
  
  console.log(`计算出的权重: ${weight}`);
}

// 从命令行参数获取文件路径
const filePath = process.argv[2];
if (!filePath) {
  console.error('请提供文件路径作为参数');
  process.exit(1);
}

// 解析相对路径
const testFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);

// 执行测试
testWeightCalculation(testFilePath);