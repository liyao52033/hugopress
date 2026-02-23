/**
 * 优化版 HugoVIf - 减少主线程阻塞
 * 主要优化：
 * 1. 使用 requestIdleCallback 延迟初始化
 * 2. 分批处理容器，避免一次性处理大量DOM
 * 3. 使用 Intersection Observer 延迟加载不可见内容
 */
class HugoVIf {
    constructor() {
        this.cache = new Map();
        this.conditions = new Map();
        this.observer = null;
        this.initialized = false;
        this.initQueue = [];
        this.batchSize = 5; // 每批处理的容器数量
        this.batchDelay = 50; // 批次间延迟
    }

    // 延迟初始化入口
    init() {
        if (this.initialized) return;

        const containers = document.querySelectorAll('.v-if-container');
        if (!containers.length) {
            this.initialized = true;
            return;
        }

        // 转换为数组并分批处理
        this.initQueue = Array.from(containers);

        // 使用 requestIdleCallback 或 setTimeout 延迟处理
        this.scheduleBatchProcessing();

        // 添加全局点击事件监听
        this.setupSidebarLinkHandler();

        this.initialized = true;
    }

    // 调度分批处理
    scheduleBatchProcessing() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.processBatch(), { timeout: 1000 });
        } else {
            setTimeout(() => this.processBatch(), 50);
        }
    }

    // 分批处理容器
    processBatch() {
        if (this.initQueue.length === 0) return;

        const batch = this.initQueue.splice(0, this.batchSize);

        // 使用 requestAnimationFrame 确保不阻塞UI
        requestAnimationFrame(() => {
            batch.forEach(container => this.processContainer(container));

            // 如果还有剩余，继续处理下一批
            if (this.initQueue.length > 0) {
                setTimeout(() => this.processBatch(), this.batchDelay);
            }
        });
    }

    // 处理单个容器
    processContainer(container) {
        const name = container.dataset.vifName;
        const isLazy = container.dataset.isLazy === 'true';

        if (isLazy) {
            container._vifContent = this.decodeContent(container.dataset.content);
            container.dataset.content = '';
        } else {
            container._vifContent = container.innerHTML;
        }

        container._vifParent = container.parentNode;
        container._vifNextSibling = container.nextSibling;

        this.conditions.set(name, false);
        this.cache.set(name, container);

        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }

    // 纯 Base64 解码 + HTML 转义反转（兼容中文，无 URI 操作）
    decodeContent(encodedStr) {
        if (!encodedStr) return '';

        try {
            let base64Str = encodedStr
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const padLen = (4 - (base64Str.length % 4)) % 4;
            base64Str += '='.repeat(padLen);

            const rawData = window.atob(base64Str);
            const uint8Array = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; i++) {
                uint8Array[i] = rawData.charCodeAt(i);
            }
            let content = new TextDecoder('utf-8').decode(uint8Array);

            content = this.protectSpecialTags(content);
            content = this.unescapeHtml(content);
            content = this.restoreSpecialTags(content);

            return content;
        } catch (e) {
            console.warn(`v-if Base64 decode failed, fallback to HTML unescape:`, e);
            return this.unescapeHtml(encodedStr);
        }
    }

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

    unescapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#039;/g, "'")
            .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/&#([0-9]+);/g, (match, num) => String.fromCharCode(parseInt(num, 10)));
    }

    // 显示内容：使用 requestAnimationFrame 优化
    show(name) {
        const container = this.cache.get(name);
        if (!container) return;

        const parent = container._vifParent || document.body;

        if (container._vifContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = container._vifContent;

            const codeBlocks = tempDiv.querySelectorAll('pre code');
            codeBlocks.forEach(codeElement => {
                const originalHTML = codeElement.innerHTML;
                codeElement.textContent = originalHTML;
            });

            container.innerHTML = tempDiv.innerHTML;
            delete container._vifContent;
        }

        if (container._vifNextSibling) {
            parent.insertBefore(container, container._vifNextSibling);
        } else {
            parent.appendChild(container);
        }

        container.style.display = 'block';
        this.conditions.set(name, true);
        this.cache.delete(name);

        // 延迟执行后续操作，避免阻塞
        this.schedulePostShowTasks(container);
    }

    // 调度显示后的任务
    schedulePostShowTasks(container) {
        // 第一帧：基础渲染
        requestAnimationFrame(() => {
            if (window.codeBlockManager) {
                window.codeBlockManager.reinit();
            }

            // 第二帧：高亮和公式
            requestAnimationFrame(() => {
                if (window.Prism) {
                    window.Prism.highlightAll();
                }

                if (window.ImageHandler) {
                    window.ImageHandler.processImages(container);
                }

                this.initKaTeX();
                this.initMermaid();

                // 延迟刷新ScrollSpy
                setTimeout(() => {
                    this.refreshScrollSpyAfterUpdate();
                    const loadingIndicator = document.querySelector('.vif-loading');
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                }, 100);
            });
        });
    }

    hide(name) {
        const container = document.getElementById(`vif-container-${name}`);
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
            this.cache.set(name, container);
            this.conditions.set(name, false);
        }
    }

    toggle(name) {
        this.conditions.get(name) ? this.hide(name) : this.show(name);
    }

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

    initMermaid() {
        if (window.mermaid) {
            try {
                mermaid.init();
            } catch (error) {
                console.warn('Mermaid初始化失败:', error);
            }
        }
    }

    refreshScrollSpyAfterUpdate() {
        if (window.bootstrapScrollSpyInstance && window.forceResetMobileScrollSpy) {
            window.forceResetMobileScrollSpy();
        }
        if (typeof window.refreshScrollSpy === 'function') {
            window.refreshScrollSpy();
        }
    }

    setupSidebarLinkHandler() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('#toc a, #toc-mobile a');
            if (!link || !link.href) return;

            event.preventDefault();

            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const element = document.querySelector('.vif-loading');
            if (!element || element.style.display === 'none') return;

            const elementId = element.id;
            this.show(elementId);

            setTimeout(() => {
                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                const top = targetElement.getBoundingClientRect().top;
                window.scrollTo({
                    top: top + window.scrollY - 120,
                    behavior: 'smooth'
                });

                setTimeout(() => this.refreshScrollSpyAfterUpdate(), 100);
            }, 300);
        });
    }

    debounce(fn, delay = 100) {
        let timer = 0;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

// 全局初始化 - 使用 requestIdleCallback 延迟
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        window.hugoVIf = new HugoVIf();
        window.hugoVIf.init();
    }, { timeout: 2000 });
} else {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.hugoVIf = new HugoVIf();
            window.hugoVIf.init();
        }, 100);
    });
}
