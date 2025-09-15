const { spawn } = require('child_process');
const http = require('http');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

// Hugo 开发服务器
const hugoServer = 'http://localhost:1313';
// 代理端口
const proxyPort = 8080;
// API 前缀
const apiPrefix = '/coze';
// 实际 API 服务器地址
const apiServer = 'https://vp.xiaoying.org.cn';

// 启动 Hugo
console.log('正在启动 Hugo 开发服务器...');
const hugoProcess = spawn('hugo', ['server', '--disableFastRender'], {
    stdio: 'inherit', // 直接输出到控制台
    shell: true
});

hugoProcess.on('close', (code) => {
    console.log(`Hugo 退出，代码: ${code}`);
});

// 启动代理
http.createServer((req, res) => {
    if (req.url.startsWith(apiPrefix)) {
        // API 请求 -> 远程 API
        proxy.web(req, res, { target: apiServer, changeOrigin: true, secure: false });
    } else {
        // 其他请求 -> Hugo
        proxy.web(req, res, { target: hugoServer, changeOrigin: true, secure: false });
    }
}).listen(proxyPort, () => {
    console.log(`代理已启动: http://localhost:${proxyPort}`);
    console.log(`静态资源 -> ${hugoServer}`);
    console.log(`${apiPrefix} -> ${apiServer}`);
});

// 捕获代理错误
proxy.on('error', (err, req, res) => {
    console.error('代理错误:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('代理出错: ' + err.message);
});
