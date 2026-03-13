// edgeone图片处理边缘函数，配合themes\lotusdocs\layouts\docs\_markup\render-image.html实现图片边缘处理

async function handleEvent(event) {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif'];
    const isImage = imageExtensions.some(ext => pathname.endsWith(ext));
    const option = { eo: { image: {}, cache: {} } };
    let targetFormat = null;

    // 获取【原图的真实后缀】，用于判断是否跳过转换
    const originalFileExt = imageExtensions.find(ext => pathname.endsWith(ext))?.replace('.', '') || '';

    if (isImage) {
        // 从请求头/URL参数获取显示尺寸（优先取前端传递的目标尺寸）
        const targetWidth = parseInt(url.searchParams.get('w')) || null;
        const viewportWidth = request.headers.get('Viewport-Width') || '1920';
        const useWidth = targetWidth && !isNaN(targetWidth) ? targetWidth : parseInt(viewportWidth) || 1920;

        // 从imageExtensions自动生成input_formats（去点处理）
        const inputFormats = imageExtensions.map(ext => ext.replace('.', ''));

        // 配置EdgeOne智能裁剪+格式转换【核心保留：动画保留+GIF支持】
        option.eo.image = {
            enable: true,
            width: useWidth,
            auto_orient: true,
            input_formats: inputFormats,
            preserve_animation: true, // 核心：GIF转AVIF/WebP 保留动画
        };

        // AVIF/WebP转换+压缩
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('image/avif') && originalFileExt !== 'avif') {
            // 仅当【请求AVIF】且【原图不是AVIF】时，才执行AVIF转换
            targetFormat = 'avif';
            option.eo.image.format = targetFormat;
            option.eo.image.quality = 65;
        } else if (accept.includes('image/webp') && originalFileExt !== 'webp') {
            // 仅当【请求WebP】且【原图不是WebP】时，才执行WebP转换
            targetFormat = 'webp';
            option.eo.image.format = targetFormat;
            option.eo.image.quality = 75;
        } else {
            // 原图是AVIF/WebP 或 无匹配格式 → 沿用原图格式，不转换
            targetFormat = originalFileExt;
        }

        // 缓存配置
        option.eo.cache.ttl = 30 * 24 * 3600;
        option.eo.cache.ignoreNoCacheHeader = true;
        option.eo.cache.cacheKey = 'path';
    }

    try {
        const response = await fetch(request, option);
        if (isImage && response.ok) {
            const headers = new Headers(response.headers);
            const originalFileName = decodeURIComponent(pathname.split('/').pop() || 'download-image');

            // 自动替换文件后缀为【转换后的格式】
            const getFileNameWithNewExt = (fileName, newExt) => {
                const dotIndex = fileName.lastIndexOf('.');
                return dotIndex > -1 ? fileName.substring(0, dotIndex) + '.' + newExt : fileName + '.' + newExt;
            };
            const newFileName = getFileNameWithNewExt(originalFileName, targetFormat);
            const encodedFileName = encodeURIComponent(newFileName);

            // 强制下载头+MIME类型修正
            headers.set('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);

            // 定义基础mime映射表（处理非标准映射，比如jpg/jpeg都对应image/jpeg）
            const baseMimeMap = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp',
                avif: 'image/avif',
                bmp: 'image/bmp'
            };

            // 生成完整的mimeTypeMap
            const mimeTypeMap = imageExtensions.reduce((map, ext) => {
                const key = ext.replace('.', '');
                map[key] = baseMimeMap[key] || `image/${key}`;
                return map;
            }, {});

            // 优先使用映射表中的MIME类型
            const mimeType = mimeTypeMap[targetFormat] || headers.get('Content-Type') || 'image/jpeg';
            headers.set('Content-Type', mimeType);

            // 强制刷新缓存
            headers.set('Cache-Control', 'public, max-age=2592000');
            headers.set('Expires', new Date(Date.now() + 2592000000).toUTCString());

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
        }
        return response;
    } catch (error) {
        // 异常兜底：降级为WebP+保留动画
        console.error('Image convert error:', error);
        if (isImage) {
            targetFormat = 'webp';
            option.eo.image = {
                enable: true,
                width: 1920,
                auto_orient: true,
                preserve_animation: true,
                format: targetFormat,
                quality: 75
            };
            const fallbackResponse = await fetch(request, option);
            return fallbackResponse;
        }
        return fetch(request);
    }
}

addEventListener('fetch', event => {
    event.passThroughOnException();
    event.respondWith(handleEvent(event));
});