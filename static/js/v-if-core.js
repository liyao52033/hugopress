class HugoVIf {
    constructor() {
        this.cache = new Map();
        this.conditions = new Map();
        this.observer = null;
        // 延迟初始化，避免阻塞首屏渲染
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // 纯 Base64 解码 + HTML 转义反转（兼容中文，无 URI 操作）
    decodeContent(encodedStr) {
        if (!encodedStr) return '';

        try {
            // 步骤1：处理 Base64 填充和 URL 安全字符
            let base64Str = encodedStr
                .replace(/-/g, '+')  // 替换 URL 安全的 Base64 字符
                .replace(/_/g, '/');
            // 补全 Base64 填充符 =
            const padLen = (4 - (base64Str.length % 4)) % 4;
            base64Str += '='.repeat(padLen);

            // 步骤2：Base64 解码为二进制
            const rawData = window.atob(base64Str);
            // 步骤3：转换为 UTF-8 字符串（兼容中文）
            const uint8Array = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; i++) {
                uint8Array[i] = rawData.charCodeAt(i);
            }
            let content = new TextDecoder('utf-8').decode(uint8Array);

            // 步骤4：反转义 HTML 特殊字符
            content = this.unescapeHtml(content);
            return content;
        } catch (e) {
            // 终极降级：直接反转义 HTML，不做 Base64 解码
            console.warn(`v-if Base64 decode failed, fallback to HTML unescape:`, e);
            return this.unescapeHtml(encodedStr);
        }
    }

    // 纯 HTML 转义反转函数（无 URI 依赖）
    unescapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#039;/g, "'")
            .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
            })
            .replace(/&#([0-9]+);/g, (match, num) => {
                return String.fromCharCode(parseInt(num, 10));
            });
    }

    // 初始化：缓存DOM并移除初始节点
    init() {
        const containers = document.querySelectorAll('.v-if-container');
        if (!containers.length) return;

        containers.forEach(container => {
            const name = container.dataset.vifName;
            const isLazy = container.dataset.isLazy === 'true';

            // 核心修复：使用纯 Base64 + HTML 解码逻辑
            if (isLazy) {
                // 直接解码 data-content，无 URI 操作
                container._vifContent = this.decodeContent(container.dataset.content);
                container.dataset.content = ''; // 清空缓存，释放内存
            } else {
                container._vifContent = container.innerHTML;
            }

            // 保存原始父节点和插入位置
            container._vifParent = container.parentNode;
            container._vifNextSibling = container.nextSibling;

            // 初始状态：移除节点并缓存
            this.conditions.set(name, false);
            this.cache.set(name, container);
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        this.bindEvents();
    }

    // 绑定滚动/视口事件（保持不变）
    bindEvents() {
        // 滚动触发：防抖处理
        const scrollHandler = this.debounce(() => {
            document.querySelectorAll('[data-trigger-type="scroll"]').forEach(container => {
                const name = container.dataset.vifName;
                const triggerPx = parseInt(container.dataset.scrollTrigger) || 500;
                if (window.scrollY >= triggerPx && !this.conditions.get(name)) {
                    this.show(name);
                }
            });
        }, 100);
        window.addEventListener('scroll', scrollHandler);

        // 视口触发：Intersection Observer
        if (document.querySelectorAll('[data-trigger-type="viewport"]').length) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const name = entry.target.dataset.vifName;
                        if (!this.conditions.get(name)) {
                            this.show(name);
                            this.observer.unobserve(entry.target); // 触发后取消观察
                        }
                    }
                });
            }, { threshold: 0.1 });

            // 监听所有视口触发的容器
            document.querySelectorAll('[data-trigger-type="viewport"]').forEach(container => {
                const threshold = parseFloat(container.dataset.threshold) || 0.1;
                this.observer.observe(container);
            });
        }
    }

    // 显示内容：插入DOM并渲染缓存内容（修复DOM插入位置）
    show(name) {
        const container = this.cache.get(name);
        if (!container) return;

        // 获取原始父节点
        const parent = container._vifParent || document.body;
        // 渲染缓存内容
        if (container._vifContent) {
            container.innerHTML = container._vifContent;
            delete container._vifContent;
        }
        // 插入DOM到原始位置
        if (container._vifNextSibling) {
            parent.insertBefore(container, container._vifNextSibling);
        } else {
            parent.appendChild(container);
        }
        container.style.display = 'block';
        // 更新状态
        this.conditions.set(name, true);
        this.cache.delete(name);

        // 初始化代码高亮和其他功能
        this.initCodeBlocks();
        this.initPrism();
        this.initLineNumbers();
        this.initKaTeX();
        this.initMermaid();
    }


    /**
     * 检测页面是否有代码块（需高亮的<pre><code>）
     */
    hasCodeBlockContent() {
        // 匹配多种形式的代码块：
        // 1. 标准形式：<pre><code class="language-*">
        // 2. 直接的<code>元素：<code class="language-*">
        // 3. 其他高亮容器：<div class="highlight">或<div class="chroma">
        // 4. 特别检查Vue和HTML相关代码块
        const selectors = [
            'pre > code[class*="language-"]',
            'code[class*="language-"]',
            '.highlight',
            '.chroma',
            '[class*="language-vue"]',
            '[class*="language-html"]'
        ];

        for (const selector of selectors) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        return false;
    }

    // 为代码块添加包装器和语言标签
    initCodeBlocks() {

        const WRAP_CLASS = 'cb-collapsible';
        const selectors = ['.highlight', '.chroma'];

        // 从class中提取编程语言
        function getLanguage(block) {
            // 检查常见的代码块标记模式
            const classList = Array.from(block.classList);

            // 查找类似language-xxx或lang-xxx的class
            const langClass = classList.find(cls =>
                cls.startsWith('language-')
            );

            if (langClass) {
                return langClass.replace(/^(language-|lang-)/, '');
            }

            // 检查code标签内的语言信息
            const codeElement = block.querySelector('code');
            if (codeElement) {
                const codeClasses = Array.from(codeElement.classList);
                const codeLangClass = codeClasses.find(cls =>
                    cls.startsWith('language-')
                );
                if (codeLangClass) {
                    return codeLangClass.replace(/^(language-|lang-)/, '');
                }
            }

            // 检查chroma代码块的语言
            if (block.classList.contains('chroma')) {
                const langElement = block.querySelector('.lntd:first-child .ln');
                if (langElement && langElement.textContent.trim()) {
                    return langElement.textContent.trim();
                }
            }

            return 'ts'; // 默认值
        }

        function findBlocks() {
            const set = new Set();
            selectors.forEach(s => document.querySelectorAll(s).forEach(el => set.add(el)));
            document.querySelectorAll('pre > code').forEach(code => {
                const pre = code.parentElement;
                if (!pre.closest(selectors.join(','))) set.add(pre);
            });
            return Array.from(set);
        }

        function wrapIfNeeded(block) {
            if (block.closest('.' + WRAP_CLASS)) return;

            // 创建包装器
            const wrapper = document.createElement('div');
            const parent = block.parentNode;
            parent.insertBefore(wrapper, block);
            wrapper.appendChild(block);

            // 添加语言标签
            const langLabel = document.createElement('div');
            const language = getLanguage(block).toUpperCase();
            langLabel.className = 'cb-language-label';
            langLabel.innerHTML = `
          <span class="cb-dot red"></span>
          <span class="cb-dot yellow"></span>
          <span class="cb-dot green"></span>
          <span class="cb-lang-text">${language}</span>
          `;
            wrapper.appendChild(langLabel);
        }

        findBlocks().forEach(wrapIfNeeded);
    }

    // 重新初始化Prism代码高亮
    initPrism() {
        // 确保DOM完全渲染后再执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initPrism());
            return;
        }

        // 检查Prism是否可用且包含必要的语言定义
        if (this.isPrismReady()) {
            // 使用requestAnimationFrame确保DOM渲染完成
            requestAnimationFrame(() => {
                try {
                    // 1. 预处理代码块，确保所有需要高亮的代码块都有正确的语言标识
                    this.preprocessCodeBlocks();

                    // 2. 使用Prism.highlightAll()一次性处理所有代码块
                    // 这是Prism.js最可靠的方法，避免了直接调用highlightElement的兼容性问题
                    try {
                        window.Prism.highlightAll();
                    } catch (error) {
                        // 备选方案：尝试更简单的方式
                        this.fallbackHighlight();
                    }
                } catch (error) {
                    console.warn('Prism高亮初始化出错:', error);
                }
            });
        } else {
            // 如果Prism还没完全加载完成，增加重试次数和延迟
            let retryCount = 0;
            const maxRetries = 8;

            const retryInit = () => {
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        if (this.isPrismReady()) {
                            this.initPrism();
                        } else {
                            retryInit();
                        }
                    }, 300 * retryCount); // 指数退避，增加延迟时间
                } else {
                    console.warn('Prism加载失败或缺少必要语言定义，无法执行代码高亮');
                    console.log('当前Prism状态:', {
                        prismAvailable: !!window.Prism,
                        languagesAvailable: !!window.Prism?.languages,
                        markupLanguage: !!window.Prism?.languages.markup,
                        vueLanguage: !!window.Prism?.languages.vue
                    });
                }
            };

            retryInit();
        }
    }

    // 检查Prism是否完全加载并包含必要的语言定义
    isPrismReady() {
        if (!window.Prism) {
            return false;
        }

        if (!window.Prism.languages) {
            return false;
        }

        // 检查是否包含必要的语言定义
        // 至少需要markup语言（用于HTML）
        if (!window.Prism.languages.markup) {
            return false;
        }

        // 检查Prism是否有highlightAll方法
        if (typeof window.Prism.highlightAll !== 'function') {
            return false;
        }

        return true;
    }

    // 预处理代码块，确保所有需要高亮的代码块都有正确的语言标识
    preprocessCodeBlocks() {
        // 获取所有可能包含代码块的容器
        const containers = document.querySelectorAll('.highlight, .chroma, .prism-codeblock');

        // 1. 处理容器内的代码块
        containers.forEach(container => {
            const codeEls = container.querySelectorAll('code');
            codeEls.forEach(codeEl => {
                // 如果code元素没有语言类，尝试从容器推断
                if (!codeEl.classList.toString().match(/language-|lang-/)) {
                    // 检查容器是否有语言标识
                    const containerLang = [...container.classList].find(cls =>
                        cls.startsWith('language-') || cls.startsWith('lang-')
                    );

                    if (containerLang) {
                        codeEl.classList.add(containerLang);
                    } else {
                        // 尝试从data-language属性获取
                        const dataLang = container.getAttribute('data-language') ||
                            container.querySelector('[data-language]')?.getAttribute('data-language');
                        if (dataLang) {
                            codeEl.classList.add(`language-${dataLang}`);
                        }
                    }
                }
            });
        });

        // 2. 处理直接的code元素
        const directCodeBlocks = document.querySelectorAll('code[class*="language-"]');
        directCodeBlocks.forEach(codeBlock => {
            // 特殊处理HTML代码块，确保添加markup类
            if (codeBlock.classList.contains('language-html') && !codeBlock.classList.contains('language-markup')) {
                codeBlock.classList.add('language-markup');
            }

            // 确保Vue代码块有正确的类
            if (codeBlock.classList.contains('language-vue') ||
                codeBlock.textContent.includes('.vue') ||
                codeBlock.textContent.includes('<template>') ||
                codeBlock.textContent.includes('<script>')) {
                if (!codeBlock.classList.contains('language-vue')) {
                    codeBlock.classList.add('language-vue');
                }
            }
        });
    }

    // 备选高亮方案，当highlightAll失败时使用
    fallbackHighlight() {
        try {
            // 只选择有明确语言类的code元素
            const codeBlocks = document.querySelectorAll('code[class*="language-"]');

            // 确保我们只处理可见的代码块
            const visibleBlocks = Array.from(codeBlocks).filter(block => {
                return block.offsetHeight > 0 && block.offsetWidth > 0;
            });

            visibleBlocks.forEach(block => {
                // 简单检查Prism.languages是否存在对应的语言
                const langClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
                if (langClass) {
                    const lang = langClass.replace('language-', '');
                    if (window.Prism.languages[lang]) {
                        // 手动应用高亮
                        // 使用innerHTML而非textContent以保留HTML结构
                        const grammar = window.Prism.languages[lang];
                        const content = block.innerHTML;
                        const highlighted = window.Prism.highlight(content, grammar, lang);
                        block.innerHTML = highlighted;
                        block.classList.add('language-' + lang);
                    }
                }
            });
        } catch (error) {
            console.warn('备选高亮方案也失败:', error);
        }
    }

    // 行号功能相关方法
    removeLineNumbers() {
        document.querySelectorAll('.wrap-line-numbers-rows').forEach(function (el) {
            el.remove();
        });
    }

    addLineNumbers() {
        document.querySelectorAll('.prism-codeblock pre').forEach((pre) => {
            // 检查是否已经添加了行号
            if (pre.querySelector('.wrap-line-numbers-rows')) {
                return;
            }

            const code = pre.querySelector('code');
            if (!code) return;

            // 获取配置
            const block = pre.closest('.prism-codeblock');
            const startAttr = pre.getAttribute('data-start');
            const startLine = startAttr ? parseInt(startAttr, 10) : 1;
            const enableLinenos = pre.getAttribute('data-linenos') === 'false';
            const enableClickHighlight = pre.getAttribute('data-click-highlight') === 'true';

            if (enableLinenos) {
                // 如果不启用行号，只处理默认高亮
                this.handleHighlightedLines(pre);
                return;
            } else {
                // 等待一帧确保渲染完成
                requestAnimationFrame(() => {
                    const totalLines = this.calculateActualLines(code);

                    // 创建行号容器
                    const lineNumbersWrapper = document.createElement('span');
                    lineNumbersWrapper.className = 'wrap-line-numbers-rows';

                    if (startLine !== 1) {
                        lineNumbersWrapper.setAttribute('data-start', startLine.toString());
                        lineNumbersWrapper.style.counterReset = `linenumber ${startLine - 1}`;
                    }

                    // 生成行号
                    for (let i = 0; i < totalLines; i++) {
                        const lineNumber = document.createElement('span');
                        lineNumbersWrapper.appendChild(lineNumber);

                        // 点击高亮开关
                        if (enableClickHighlight) {
                            lineNumber.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const line = startLine + i;
                                pre.setAttribute("data-wrapline", line);
                                this.handleHighlightedLines(pre);
                            });
                        }
                    }

                    pre.appendChild(lineNumbersWrapper);
                    // 处理高亮行
                    this.handleHighlightedLines(pre);
                });
            }
        });
    }

    calculateActualLines(codeElement) {
        // 方法1: 基于内容高度计算
        const codeHeight = codeElement.offsetHeight;
        const computedStyle = getComputedStyle(codeElement);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

        const contentHeight = codeHeight - paddingTop - paddingBottom;
        const calculatedLines = Math.round(contentHeight / lineHeight);

        // 方法2: 基于文本内容计算
        let codeText = codeElement.textContent || codeElement.innerText;
        codeText = codeText.replace(/^\n+/, '').replace(/\n+$/, '');
        const textLines = codeText ? codeText.split('\n').length : 1;

        // 方法3: 自动换行计算
        let wrappedLines = textLines;
        if (computedStyle.whiteSpace.includes('wrap')) {
            wrappedLines = this.calculateWrappedLines(codeElement, codeText);
        }

        // 优先使用高度计算结果，但不少于文本行数
        return Math.max(calculatedLines, textLines);
    }

    calculateWrappedLines(codeElement, codeText) {
        if (!codeText) return 1;

        const lines = codeText.split('\n');
        const computedStyle = getComputedStyle(codeElement);
        const codeWidth = codeElement.offsetWidth -
            (parseFloat(computedStyle.paddingLeft) || 0) -
            (parseFloat(computedStyle.paddingRight) || 0);

        const measurer = document.createElement('div');
        measurer.style.cssText = computedStyle.cssText;
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.height = 'auto';
        measurer.style.width = codeWidth + 'px';
        measurer.style.whiteSpace = 'pre-wrap';
        measurer.style.wordBreak = 'break-word';
        document.body.appendChild(measurer);

        let totalLines = 0;
        const lineHeight = parseFloat(computedStyle.lineHeight);

        lines.forEach(line => {
            measurer.textContent = line || ' ';
            const actualHeight = measurer.offsetHeight;
            const wrappedCount = Math.max(1, Math.round(actualHeight / lineHeight));
            totalLines += wrappedCount;
        });

        document.body.removeChild(measurer);
        return totalLines;
    }

    handleHighlightedLines(pre) {
        const highlightData = pre.getAttribute('data-wrapline');
        if (!highlightData) return;

        pre.querySelectorAll('.line-highlight-overlay').forEach(el => el.remove());

        const code = pre.querySelector('code');
        if (!code) return;

        const codeLines = code.textContent.replace(/^\n+|\n+$/g, '').split('\n');
        const lineHeight = parseFloat(getComputedStyle(code).lineHeight);

        const ranges = highlightData.split(',');
        ranges.forEach(range => {
            let start, end;
            if (range.includes('-')) {
                [start, end] = range.split('-').map(n => parseInt(n, 10));
            } else {
                start = end = parseInt(range, 10);
            }

            for (let i = start; i <= end; i++) {
                const overlay = document.createElement('div');
                overlay.className = 'line-highlight-overlay';

                let topOffset = 0;
                for (let j = 0; j < i; j++) {
                    topOffset += this.calculateWrappedLines(code, codeLines[j]) * lineHeight;
                }
                overlay.style.top = topOffset - 4 + 'px';
                overlay.style.height = this.calculateWrappedLines(code, codeLines[i - 1]) * lineHeight + 'px';

                pre.appendChild(overlay);
            }
        });
    }

    // 初始化行号功能
    initLineNumbers() {
        // if (!this.hasCodeBlockContent()) return;
        this.removeLineNumbers();
        this.addLineNumbers();
    }

    // 检测页面是否包含KaTeX公式内容
    hasKaTeXContent() {
        const contentEl = document.getElementById("content");
        if (!contentEl) return false;
        // 检测是否包含KaTeX分隔符（$$/$/\(/\[）
        const katexRegex = /(\$\$|\$|\\\(|\\\[)/;
        return katexRegex.test(contentEl.textContent);
    }

    // 检测页面是否包含Mermaid图表
    hasMermaidContent() {
        return document.querySelector('div.mermaid, pre.mermaid, code.mermaid') !== null;
    }

    // 初始化KaTeX（按需）
    initKaTeX() {
        if (!this.hasKaTeXContent()) {
            return;
        }

        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(document.getElementById("content"), {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.warn('KaTeX渲染失败:', error);
            }
        }
    }

    // 初始化Mermaid（按需）
    initMermaid() {
        if (!this.hasMermaidContent()) {
            return;
        }

        if (typeof mermaid !== 'undefined') {
            try {
                mermaid.init();
            } catch (error) {
                console.warn('Mermaid渲染失败:', error);
            }
        }
    }

    // 隐藏内容：移除DOM并缓存（保持不变）
    hide(name) {
        const container = document.getElementById(`vif-container-${name}`);
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
            this.cache.set(name, container);
            this.conditions.set(name, false);
        }
    }

    // 手动切换：显示/隐藏切换（保持不变）
    toggle(name) {
        this.conditions.get(name) ? this.hide(name) : this.show(name);
    }

    // 防抖工具函数（保持不变）
    debounce(fn, delay = 100) {
        let timer = 0;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

// 全局初始化
window.addEventListener('DOMContentLoaded', () => {
    window.hugoVIf = new HugoVIf();
});