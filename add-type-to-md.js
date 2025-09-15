const fs = require('fs');
const path = require('path');

// 递归查找所有Markdown文件
function findMarkdownFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            findMarkdownFiles(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// 检查frontmatter是否包含type字段
function hasTypeField(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        return frontmatter.includes('\ntype:') || frontmatter.startsWith('type:');
    }
    return false;
}

// 添加type: docs字段到frontmatter
function addTypeField(content) {
    // 匹配frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        // 检查是否已经存在type字段
        if (!hasTypeField(content)) {
            // 在frontmatter末尾添加type: docs
            const newFrontmatter = frontmatter + '\ntype: docs';
            const newContent = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
            return newContent;
        }
    }
    
    return content; // 如果没有frontmatter或已有type字段，则不修改
}

// 处理单个文件
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (hasTypeField(content)) {
            console.log(`✓ 已存在type字段: ${filePath}`);
            return false;
        }
        
        const newContent = addTypeField(content);
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✓ 已添加type字段: ${filePath}`);
            return true;
        } else {
            console.log(`- 无需修改: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ 处理文件时出错: ${filePath}`, error.message);
        return false;
    }
}

// 主函数
function main() {
    const contentDir = path.join(__dirname, 'content');
    const markdownFiles = findMarkdownFiles(contentDir);
    
    console.log(`找到 ${markdownFiles.length} 个Markdown文件`);
    
    let processedCount = 0;
    
    for (const file of markdownFiles) {
        if (processFile(file)) {
            processedCount++;
        }
    }
    
    console.log(`\n处理完成！共修改了 ${processedCount} 个文件。`);
}

main();