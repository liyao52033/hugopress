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

            // 步骤4：保护template和script标签，防止在HTML处理中丢失
            content = this.protectSpecialTags(content);

            // 步骤5：反转义 HTML 特殊字符
            content = this.unescapeHtml(content);

            // 步骤6：恢复被保护的标签
            content = this.restoreSpecialTags(content);

            return content;
        } catch (e) {
            // 终极降级：直接反转义 HTML，不做 Base64 解码
            console.warn(`v-if Base64 decode failed, fallback to HTML unescape:`, e);
            return this.unescapeHtml(encodedStr);
        }
    }

    // 保护特殊标签，防止在HTML处理中丢失
    static specialTags = ['template', 'script', 'html', 'body'];
    protectSpecialTags(content) {
        HugoVIf.specialTags.forEach(tag => {
            const startReg = new RegExp(`<${tag}([^>]*)>`, 'gi');
            const endReg = new RegExp(`</${tag}>`, 'gi');
            content = content.replace(startReg, (match, attrs) => `__${tag.toUpperCase()}_START__${btoa(attrs)}__`);
            content = content.replace(endReg, `__${tag.toUpperCase()}_END__`);
        });
        return content;
    }

    // 恢复被保护的标签
    restoreSpecialTags(content) {
        HugoVIf.specialTags.forEach(tag => {
            const startReg = new RegExp(`__${tag.toUpperCase()}_START__([^_]*)__`, 'g');
            const endReg = new RegExp(`__${tag.toUpperCase()}_END__`, 'g');
            content = content.replace(startReg, (match, encodedAttrs) => {
                try {
                    const attrs = atob(encodedAttrs);
                    return `<${tag}${attrs}>`;
                } catch (e) {
                    return `<${tag}>`;
                }
            });
            content = content.replace(endReg, `</${tag}>`);
        });
        return content;
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
    }

    // 显示内容：插入DOM并渲染缓存内容（修复DOM插入位置）
    show(name) {
        const container = this.cache.get(name);
        if (!container) return;

        // 获取原始父节点
        const parent = container._vifParent || document.body;
        // 渲染缓存内容 - 特殊处理代码块，保留所有标签
        if (container._vifContent) {
            // 创建临时div元素用于解析HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = container._vifContent;

            // 处理所有代码块，将其内容作为纯文本处理
            const codeBlocks = tempDiv.querySelectorAll('pre code');
            codeBlocks.forEach(codeElement => {
                const originalHTML = codeElement.innerHTML;
                // 将代码内容作为纯文本处理，保留所有标签
                codeElement.textContent = originalHTML;
            });

            // 将处理后的内容设置到容器
            container.innerHTML = tempDiv.innerHTML;
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

        // 初始化代码块行号和语言标签
        if (window.codeBlockManager) {
            window.codeBlockManager.reinit();
            window.Prism.highlightAll();
        }

        // 处理图片
        if (window.ImageHandler) {
            window.ImageHandler.processImages(container);
        }

        // 初始化KaTeX数学公式
        this.initKaTeX();

        // 初始化Mermaid图表
        this.initMermaid();
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

    // 初始化KaTeX数学公式
    initKaTeX() {
        if (window.katex && window.renderMathInElement) {
            try {
                renderMathInElement(document.body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '\\(', right: '\\)', display: false }
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.warn('KaTeX初始化失败:', error);
            }
        }
    }

    // 初始化Mermaid图表
    initMermaid() {
        if (window.mermaid) {
            try {
                mermaid.init();
            } catch (error) {
                console.warn('Mermaid初始化失败:', error);
            }
        }
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