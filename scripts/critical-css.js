#!/usr/bin/env node

const critical = require('critical');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

// 配置选项
const config = {
  // 源HTML文件目录
  src: 'dist/**/*.html',
  // 输出目录（保持原有结构）
  dest: 'dist',
  // Critical CSS配置
  critical: {
    // 视口尺寸
    dimensions: [
      { width: 375, height: 667 }, // 移动端
      { width: 1024, height: 768 }, // 平板
      { width: 1920, height: 1080 } // 桌面端
    ],
    // 提取关键CSS
    extract: true,
    // 内联关键CSS
    inline: true,
    // 异步加载非关键CSS
    asynchronous: true,
    // 忽略CSS规则（可选）
    ignore: {
      atrule: ['@font-face', '@import'],
      rule: [/^\.no-critical/],
      decl: (node, value) => {
        return value.indexOf('url') !== -1;
      }
    }
  }
};

/**
 * 生成并内联Critical CSS
 */
async function generateCriticalCSS() {
  try {
    // 查找所有HTML文件
    const files = await new Promise((resolve, reject) => {
      glob(config.src, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(files);
      });
    });

    if (files.length === 0) {
      console.log('⚠️  未找到HTML文件，请先运行hugo build命令生成HTML文件');
      return;
    }

    console.log(`📋 找到 ${files.length} 个HTML文件，开始处理...`);

    // 并行处理所有HTML文件
    const results = await Promise.allSettled(
      files.map(async (file) => {
        console.log(`🔄 正在处理: ${file}`);
        
        await critical.generate({
          ...config.critical,
          src: file,
          dest: file,
          base: config.dest,
          css: glob.sync('public/**/*.css')
        });
        
        console.log(`✅ 处理完成: ${file}`);
        return file;
      })
    );

    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`\n📊 处理结果：`);
    console.log(`✅ 成功：${successful} 个文件`);
    console.log(`❌ 失败：${failed} 个文件`);
    
    if (failed > 0) {
      console.log('\n❌ 失败详情：');
      results
        .filter(r => r.status === 'rejected')
        .forEach(r => console.error(r.reason));
    }

    console.log('\n🎉 所有HTML文件处理完成！');
  } catch (error) {
    console.error('❌ 处理过程中发生错误：', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始执行Critical CSS批量处理...');
  console.log('====================================');
  
  await generateCriticalCSS();
  
  console.log('====================================');
  console.log('✨ Critical CSS批量处理已完成！');
}

// 执行主函数
main();
