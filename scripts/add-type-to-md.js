const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { getAllMdFiles } = require('./utils/md');

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);

    if (Object.prototype.hasOwnProperty.call(parsed.data, 'type')) {
      console.log(`✓ 已存在type字段: ${filePath}`);
      return false;
    }

    const nextData = { ...parsed.data, type: 'docs' };
    const nextContent = matter.stringify(parsed.content, nextData).replace(/'/g, "");

    if (nextContent === content) {
      console.log(`- 无需修改: ${filePath}`);
      return false;
    }

    fs.writeFileSync(filePath, nextContent, 'utf8');
    console.log(`✓ 已添加type字段: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ 处理文件时出错: ${filePath}`, error.message);
    return false;
  }
}

function main() {
  const contentDir = path.resolve('content');
  const markdownFiles = getAllMdFiles(contentDir, { ignoreFileNames: ['_index.md', 'index.md'] });

  console.log(`找到 ${markdownFiles.length} 个Markdown文件`);

  let processedCount = 0;
  for (const file of markdownFiles) {
    if (processFile(file)) {
      processedCount += 1;
    }
  }

  console.log(`\n处理完成！共修改了 ${processedCount} 个文件。`);
}

if (require.main === module) {
  main();
}
