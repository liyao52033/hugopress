export default async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // 1. 获取用户真实 IP
    const clientIp = request.eo?.clientIp || request.headers.get('x-forwarded-for')?.split(',')[0].trim();

    if (url.pathname.startsWith('/ws/location/v1/ip') || url.pathname.startsWith('/ws/weather/v1')) {
        // 2. 构造目标 URL
        const targetUrlObj = new URL('https://apis.map.qq.com' + url.pathname + url.search);

        // 3. 核心修复：如果是定位接口且请求中没带 ip 参数，则手动补上用户 IP
        if (url.pathname.includes('/v1/ip') && !targetUrlObj.searchParams.has('ip')) {
            targetUrlObj.searchParams.set('ip', clientIp);
        }

        // 4. 构建并发送请求
        const newRequest = new Request(targetUrlObj.toString(), {
            method: request.method,
            headers: request.headers,
        });
        newRequest.headers.set('Host', 'apis.map.qq.com');

        return fetch(newRequest);
    }

    return context.next();
}