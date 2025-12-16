// edgeone图片处理边缘函数，配合themes\lotusdocs\layouts\docs\_markup\render-image.html实现图片边缘处理

async function handleEvent(event) {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const isImage = imageExtensions.some(ext => pathname.endsWith(ext));
    const option = { eo: { image: {}, cache: {} } };

    if (isImage) {

        // 1. 从请求头/URL参数获取显示尺寸（优先取前端传递的目标尺寸）
        // 方式1：前端通过URL参数传递显示宽度（如?w=1598）
        const targetWidth = parseInt(url.searchParams.get('w')) || null;
        // 方式2：从浏览器Viewport推测（备选方案）
        const viewportWidth = request.headers.get('Viewport-Width') || '1920';

        // 2. 配置自适应尺寸裁剪
        option.eo.image.enable = true;
        // 优先用前端传递的目标宽度，否则用Viewport宽度，最大不超过原图
        option.eo.image.width = targetWidth || parseInt(viewportWidth) || 1920;
        // 自动按宽度等比缩放高度（保持比例）
        option.eo.image.auto_orient = true;

        // 配置EdgeOne智能裁剪+格式转换
        option.eo.image = {
            enable: true,
            width: targetWidth, // 自动计算的目标宽度
            auto_orient: true, // 保持图片方向
            input_formats: ['png', 'jpg', 'jpeg'] // 支持的原图格式
        };

        // AVIF/WebP转换+压缩
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('image/avif')) {
            option.eo.image.format = 'avif';
            option.eo.image.quality = 65;
        } else if (accept.includes('image/webp')) {
            option.eo.image.format = 'webp';
            option.eo.image.quality = 75;
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
            const fileName = decodeURIComponent(pathname.split('/').pop() || 'download-image');
            const encodedFileName = encodeURIComponent(fileName);

            // 强制下载头+MIME类型修正
            headers.set('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
            const actualFormat = option.eo.image.format || 'jpeg';
            const mimeTypeMap = {
                webp: 'image/webp',
                avif: 'image/avif',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif'
            };
            const mimeType = mimeTypeMap[actualFormat] || headers.get('Content-Type') || 'image/jpeg';
            headers.set('Content-Type', mimeType);

            // 强制刷新缓存（避免旧缓存干扰）
            headers.set('Cache-Control', 'public, max-age=2592000');
            headers.set('Expires', new Date(Date.now() + 2592000000).toUTCString());

            // 返回处理后的响应
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });
        }
        // 非图片/响应异常时返回原响应
        return response;
    } catch (error) {
        // 异常兜底：仅用WebP转换（确保核心功能不挂）
        console.error('Image convert error:', error);
        if (isImage) {
            option.eo.image.format = 'webp'; // 降级为稳定的WebP
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