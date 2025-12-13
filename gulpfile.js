import gulp from 'gulp';
import * as critical from 'critical';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

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
      { width: 1024, height: 768 } // 平板
    ],
    // 提取关键CSS
    extract: true,
    // 内联关键CSS
    inline: true,
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

// 清理旧的critical CSS任务（可选）
function cleanCriticalCSS() {
  return Promise.resolve();
}

// 生成并内联Critical CSS任务
function generateCriticalCSS() {
  return new Promise((resolve, reject) => {
    glob(config.src).then(files => {
      if (files.length === 0) {
        console.log('⚠️  未找到HTML文件，请先运行hugo build命令生成HTML文件');
        resolve();
        return;
      }

      console.log(`📋 找到 ${files.length} 个HTML文件，开始处理...`);

      // 分批处理HTML文件，每批2个文件，避免内存溢出
      const batchSize = 2;
      const batches = [];
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
      }

      // 依次处理每批文件
      let currentBatch = 0;
      const processBatch = async () => {
        if (currentBatch >= batches.length) {
          console.log('🎉 所有HTML文件处理完成！');
          resolve();
          return;
        }

        const batch = batches[currentBatch];
        console.log(`📦 正在处理第 ${currentBatch + 1}/${batches.length} 批，共 ${batch.length} 个文件`);

        // 并行处理当前批的文件
        const batchPromises = batch.map(file => {
          return new Promise((resolveFile, rejectFile) => {
            console.log(`🔄 正在处理: ${file}`);

            critical.generate({
              ...config.critical,
              src: file,
              base: config.dest,
              css: glob.sync('dist/**/*.css')
            })
              .then(output => {
                // 将处理结果写回原文件
                fs.writeFileSync(file, output.html);
                console.log(`✅ 处理完成: ${file}`);
                resolveFile();
              })
              .catch(error => {
                console.error(`❌ 处理失败: ${file}`, error);
                // 继续处理其他文件，不中断整个流程
                resolveFile();
              });
          });
        });

        await Promise.all(batchPromises);
        currentBatch++;
        processBatch();
      };

      processBatch();
    }).catch(err => {
      reject(err);
    });
  });
}

// 主任务：清理 -> 生成Critical CSS
gulp.task('critical-css', gulp.series(cleanCriticalCSS, generateCriticalCSS));

// 默认任务
gulp.task('default', gulp.series('critical-css'));

// 监听文件变化的开发任务
gulp.task('watch', () => {
  gulp.watch(config.src, gulp.series('critical-css'));
});
