const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const fileCache = new Map();

function extractNumberFromName(name) {
  const match = name.match(/^(\d+)[.\-_]/);
  return match ? parseInt(match[1], 10) : 0;
}

function getFileFrontmatterData(filePath) {
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
}

function getMdFilesWithNumbers(dirPath, options = {}) {
  const { excludeNoWeight = false, excludeIndex = true } = options;

  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = fs.readdirSync(dirPath)
      .filter((file) => file.endsWith('.md'))
      .filter((file) => (excludeIndex ? file !== '_index.md' : true));

    return files
      .map((fileName) => {
        const filePath = path.join(dirPath, fileName);
        const fileNumber = extractNumberFromName(fileName);
        const frontmatter = getFileFrontmatterData(filePath);
        const hasWeight = frontmatter && typeof frontmatter.weight === 'number';

        return {
          name: fileName,
          number: fileNumber,
          path: filePath,
          hasWeight,
        };
      })
      .filter((fileInfo) => !excludeNoWeight || fileInfo.hasWeight);
  } catch (error) {
    console.warn(`无法读取目录 ${dirPath}: ${error.message}`);
    return [];
  }
}

function hasAnyWeightedFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return false;
    }

    const files = fs.readdirSync(dirPath)
      .filter((file) => file.endsWith('.md'))
      .filter((file) => file !== '_index.md');

    for (const fileName of files) {
      const filePath = path.join(dirPath, fileName);
      const frontmatter = getFileFrontmatterData(filePath);
      if (frontmatter && typeof frontmatter.weight === 'number') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn(`无法读取目录 ${dirPath}: ${error.message}`);
    return false;
  }
}

function getSubDirectoriesWithNumbers(parentDirPath) {
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
}

function calculateWeight(filePath, options = {}) {
  const {
    weightStep = 1,
    defaultWeight = 999,
    enableDebugLog = false,
  } = options;

  try {
    fileCache.delete(filePath);

    const currentDir = path.dirname(filePath);
    const parentDir = path.dirname(currentDir);
    const currentDirName = path.basename(currentDir);

    if (enableDebugLog) {
      console.log(`计算权重 - 当前文件: ${path.basename(filePath)}`);
      console.log(`当前目录: ${currentDirName} (${currentDir})`);
    }

    const mdFilesWithWeight = getMdFilesWithNumbers(currentDir, { excludeNoWeight: true });

    let baseWeight = 0;
    let referenceSource = '默认值';

    if (mdFilesWithWeight.length > 0) {
      const weights = mdFilesWithWeight.map((file) => {
        const frontmatter = getFileFrontmatterData(file.path);
        return frontmatter.weight || 0;
      });

      baseWeight = Math.max(...weights);
      referenceSource = '当前目录最大权重';

      if (enableDebugLog) {
        console.log(`当前目录有${mdFilesWithWeight.length}个有权重的文件`);
        console.log(`使用当前目录最大权重作为基准: ${baseWeight}`);
      }
    } else {
      if (enableDebugLog) {
        console.log('当前目录没有权重的文件，查找其他目录');
      }

      const siblingDirs = getSubDirectoriesWithNumbers(parentDir)
        .filter((dir) => dir.path !== currentDir)
        .filter((dir) => hasAnyWeightedFiles(dir.path));

      if (siblingDirs.length === 0) {
        referenceSource = '没有有权重的同级目录，使用默认权重';
        baseWeight = 0;

        if (enableDebugLog) {
          console.log(`没有有权重的同级目录，使用默认基准权重: ${baseWeight}`);
        }
      } else {
        const maxDirInfo = siblingDirs.reduce((max, dirInfo) => {
          return dirInfo.number > max.number ? dirInfo : max;
        }, { name: '', number: -1, path: '' });

        if (enableDebugLog) {
          console.log(`找到序号最大的目录: ${maxDirInfo.name} (序号: ${maxDirInfo.number})`);
        }

        const mdFilesInMaxDir = getMdFilesWithNumbers(maxDirInfo.path, { excludeNoWeight: true });

        if (mdFilesInMaxDir.length > 0) {
          const maxFileInMaxDir = mdFilesInMaxDir.reduce((max, fileInfo) => {
            return fileInfo.number > max.number ? fileInfo : max;
          }, { name: '', number: -1, path: '' });

          const frontmatter = getFileFrontmatterData(maxFileInMaxDir.path);
          baseWeight = frontmatter.weight || 0;
          referenceSource = `目录${maxDirInfo.name}中文件${maxFileInMaxDir.name}的权重`;

          if (enableDebugLog) {
            console.log(`在目录${maxDirInfo.name}中找到有权重的文件: ${maxFileInMaxDir.name}`);
            console.log(`使用该文件权重作为基准: ${baseWeight}`);
          }
        } else {
          referenceSource = '所有目录都没有权重的文件';
          baseWeight = 0;

          if (enableDebugLog) {
            console.log(`其他目录也没有权重的文件，使用默认基准权重: ${baseWeight}`);
          }
        }
      }
    }

    const currentFileName = path.basename(filePath);
    const currentFileNumber = extractNumberFromName(currentFileName);

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
}

module.exports = {
  calculateWeight,
  getMdFilesWithNumbers,
  getSubDirectoriesWithNumbers,
  hasAnyWeightedFiles,
  getFileFrontmatterData,
  extractNumberFromName,
};
