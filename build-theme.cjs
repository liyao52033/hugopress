const { glob } = require('glob');
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const green = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const cyan = s => `\x1b[36m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;

// 获取所有 JS 文件，递归匹配
const all = glob.sync('themes/lotusdocs/**/*.js');

// 排除指定文件
const excludes = ['bootstrap.js', 'mermaid.min.js', 'prism-kumir.min.js', 'relativeTime.min.js'];
const entryPoints = all.filter(file =>
    !excludes.some(ex => file.endsWith(ex))
);

esbuild.build({
    entryPoints,
    bundle: true,
    minify: true,
    splitting: true,
    treeShaking: true,
    format: 'esm',
    outdir: 'static/js/theme',
    metafile: true,
    external: ['@params'],
}).then(result => {
    const stats = [];

    for (const entry of entryPoints) {
        // 保留目录结构
        const relativePath = path.relative('themes/lotusdocs', entry);
        const outFile = path.join('static/js/theme', relativePath);

        // 确保输出目录存在
        fs.mkdirSync(path.dirname(outFile), { recursive: true });

        if (!fs.existsSync(outFile)) continue;

        const originalSize = fs.statSync(entry).size;
        const outSize = fs.statSync(outFile).size;
        const ratio = originalSize > 0 ? Math.round((1 - outSize / originalSize) * 100) : 0;

        // 自动跳过压缩率为0的文件
        if (ratio === 0) continue;

        stats.push({
            file: relativePath,
            originalSize,
            outSize,
            ratio
        });
    }

    // 按压缩率从大到小排序
    stats.sort((a, b) => b.ratio - a.ratio);

    console.log('\n=== 构建结果（原始大小 → 压缩后大小）===\n');

    stats.forEach(({ file, originalSize, outSize, ratio }) => {
        const ratioStr = ratio > 50 ? red(`${ratio}%`) : `${ratio}%`;
        console.log(
            `${green(file).padEnd(40)}  原 ${yellow((originalSize / 1024).toFixed(2) + ' KB').padEnd(10)} → ${cyan((outSize / 1024).toFixed(2) + ' KB').padEnd(10)}  (压缩率 ${ratioStr})`
        );
    });

    console.log('\n======================================\n');
}).catch(err => {
    console.error(err);
    process.exit(1);
});
