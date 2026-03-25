const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { calculateWeight } = require('./scripts/utils/weight');

// 测试函数
function testWeightCalculation(testFilePath) {
  console.log(`测试文件权重计算:`);
  console.log(`文件路径: ${testFilePath}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(testFilePath)) {
    console.error(`文件不存在: ${testFilePath}`);
    return;
  }
  
  const frontmatter = matter(fs.readFileSync(testFilePath, 'utf-8')).data;
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
