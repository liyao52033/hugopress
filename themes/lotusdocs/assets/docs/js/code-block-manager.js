/**
 * 优化版代码块管理器 - 减少主线程阻塞
 * 主要优化：
 * 1. 使用 Intersection Observer 延迟处理视口外代码块
 * 2. 更小的批处理大小和更长的延迟
 * 3. 使用 requestIdleCallback 延迟非关键处理
 * 4. 简化行号计算逻辑，减少计算量
 */
class CodeBlockManager {
    constructor() {
        this.selectors = ['.highlight', '.chroma'];
        this.initialized = false;

        // 性能限制配置 - 更保守的设置
        this.maxCodeBlocks = 10; // 减少每批处理的代码块数量
        this.maxLinesPerBlock = 500; // 减少每个代码块的最大行数
        this.processingBatchSize = 3; // 减少批处理大小
        this.batchDelay = 200; // 增加批次间延迟
        this.debounceDelay = 300; // 增加防抖延迟

        // Intersection Observer 配置
        this.intersectionObserver = null;
        this.pendingBlocks = new Set();
        this.processedBlocks = new Set();

        // 延迟初始化
        this.scheduleInit();
    }

    // 调度初始化
    scheduleInit() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.init(), { timeout: 2000 });
        } else {
            setTimeout(() => this.init(), 200);
        }
    }

    init() {
        if (this.initialized) return;

        if (!this.hasCodeBlockContent()) {
            this.initialized = true;
            return;
        }

        // 初始化 Intersection Observer
        this.setupIntersectionObserver();

        // 立即初始化所有功能（不再延迟）
        this.initAll();
        this.initialized = true;
    }

    hasCodeBlockContent() {
        return document.querySelector('pre>code') !== null;
    }

    // 设置 Intersection Observer 延迟处理视口外代码块
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // 如果不支持 IntersectionObserver，立即处理所有代码块
            this.processAllBlocksImmediately();
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const block = entry.target;
                    if (!this.processedBlocks.has(block)) {
                        this.pendingBlocks.add(block);
                        this.processPendingBlocks();
                    }
                    this.intersectionObserver.unobserve(block);
                }
            });
        }, {
            rootMargin: '200px', // 提前200px开始处理
            threshold: 0
        });

        // 观察所有代码块
        const blocks = this.findBlocks();
        blocks.forEach(block => {
            this.intersectionObserver.observe(block);
        });

        // 立即处理当前视口内的代码块（防止强制刷新后不显示）
        this.processVisibleBlocksImmediately();
    }

    // 立即处理当前可见的代码块
    processVisibleBlocksImmediately() {
        const blocks = this.findBlocks();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        
        blocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            // 如果代码块在视口内（或接近视口），立即处理
            if (rect.top < viewportHeight + 200 && rect.bottom > -200) {
                if (!this.processedBlocks.has(block)) {
                    this.processSingleBlock(block);
                    this.processedBlocks.add(block);
                }
            }
        });
    }

    // 立即处理所有代码块（降级方案）
    processAllBlocksImmediately() {
        const blocks = this.findBlocks();
        blocks.forEach(block => {
            if (!this.processedBlocks.has(block)) {
                this.processSingleBlock(block);
                this.processedBlocks.add(block);
            }
        });
    }

    // 处理待处理的代码块
    processPendingBlocks() {
        if (this.pendingBlocks.size === 0) return;

        const blocks = Array.from(this.pendingBlocks).slice(0, this.processingBatchSize);
        blocks.forEach(block => {
            this.processSingleBlock(block);
            this.pendingBlocks.delete(block);
            this.processedBlocks.add(block);
        });

        // 如果还有剩余，延迟处理
        if (this.pendingBlocks.size > 0) {
            setTimeout(() => this.processPendingBlocks(), this.batchDelay);
        }
    }

    // 处理单个代码块
    processSingleBlock(block) {
        // 检查是否已经有包装器
        if (block.parentElement && block.parentElement.classList.contains('cb-collapsible')) {
            return;
        }

        // 检查是否已经被Prism.js处理过
        if (block.parentElement && block.parentElement.classList.contains('code-toolbar')) {
            this.addLanguageLabelToToolbar(block);
            return;
        }

        this.wrapBlock(block);
    }

    wrapBlock(block) {
        const wrapper = document.createElement('div');
        const parent = block.parentNode;
        parent.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        const langLabel = document.createElement('div');
        const language = this.getLanguage(block).toUpperCase();
        langLabel.className = 'cb-language-label';
        langLabel.innerHTML = `
            <span class="cb-dot red"></span>
            <span class="cb-dot yellow"></span>
            <span class="cb-dot green"></span>
            <span class="cb-lang-text">${language}</span>
        `;
        wrapper.appendChild(langLabel);
    }

    getLanguage(block) {
        const classList = Array.from(block.classList);
        const langClass = classList.find(cls => cls.startsWith('language-'));

        if (langClass) {
            return langClass.replace(/^(language-|lang-)/, '');
        }

        const codeElement = block.querySelector('code');
        if (codeElement) {
            const codeClasses = Array.from(codeElement.classList);
            const codeLangClass = codeClasses.find(cls => cls.startsWith('language-'));
            if (codeLangClass) {
                return codeLangClass.replace(/^(language-|lang-)/, '');
            }
        }

        if (block.classList.contains('chroma')) {
            const langElement = block.querySelector('.lntd:first-child .ln');
            if (langElement && langElement.textContent.trim()) {
                return langElement.textContent.trim();
            }
        }

        return 'CODE';
    }

    addLanguageLabelToToolbar(block) {
        const existingLabel = block.parentElement.querySelector('.cb-language-label');
        if (existingLabel) return;

        const toolbar = block.parentElement.querySelector('.toolbar');
        if (!toolbar) return;

        const language = this.getLanguage(block).toUpperCase();
        const langLabel = document.createElement('div');
        langLabel.className = 'cb-language-label';
        langLabel.innerHTML = `
            <span class="cb-dot red"></span>
            <span class="cb-dot yellow"></span>
            <span class="cb-dot green"></span>
            <span class="cb-lang-text">${language}</span>
        `;

        toolbar.parentElement.insertBefore(langLabel, toolbar);
    }

    findBlocks() {
        const set = new Set();
        this.selectors.forEach(s => {
            document.querySelectorAll(s).forEach(el => set.add(el));
        });
        document.querySelectorAll('pre > code').forEach(code => {
            const pre = code.parentElement;
            if (!pre.closest(this.selectors.join(','))) {
                set.add(pre);
            }
        });
        return Array.from(set);
    }

    // 调度初始化所有功能
    scheduleInitAll() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.initAll(), { timeout: 3000 });
        } else {
            setTimeout(() => this.initAll(), 300);
        }
    }

    initAll() {
        this.initCodeBlocks();
        // 延迟添加行号
        setTimeout(() => this.addLineNumbers(), 200);
        // 触发 Prism 高亮
        this.highlightPrism();
    }

    // 触发 Prism.js 高亮
    highlightPrism() {
        if (window.Prism) {
         //   console.log('[CodeBlockManager] 触发 Prism 高亮');
            window.Prism.highlightAll();
        } else {
        //    console.log('[CodeBlockManager] Prism 未加载，等待...');
            // 等待 Prism 加载
            let attempts = 0;
            const checkPrism = () => {
                attempts++;
                if (window.Prism) {
              //      console.log('[CodeBlockManager] Prism 已加载，触发高亮');
                    window.Prism.highlightAll();
                } else if (attempts < 50) { // 最多等待 5 秒
                    setTimeout(checkPrism, 100);
                } else {
                    console.warn('[CodeBlockManager] Prism 加载超时');
                }
            };
            setTimeout(checkPrism, 100);
        }
    }

    initCodeBlocks() {
        const self = this;
        const blocks = this.findBlocks();

        // 分批处理
        let index = 0;
        function processBatch() {
            const batch = blocks.slice(index, index + self.processingBatchSize);
            batch.forEach(block => self.processSingleBlock(block));
            index += self.processingBatchSize;

            if (index < blocks.length) {
                setTimeout(processBatch, self.batchDelay);
            }
        }
        processBatch();
    }

    removeLineNumbers() {
        document.querySelectorAll('.wrap-line-numbers-rows').forEach(el => el.remove());
    }

    addLineNumbers() {
        const codeBlocks = document.querySelectorAll('.prism-codeblock pre, pre.wrap-line-numbers');
        if (!codeBlocks.length) return;

        const blocks = Array.from(codeBlocks);
        this.processAllBatches(blocks, 0);
    }

    processAllBatches(allCodeBlocks, globalIndex) {
        const currentBatch = allCodeBlocks.slice(globalIndex, globalIndex + this.maxCodeBlocks);
        if (currentBatch.length === 0) return;

        this.processBatch(currentBatch, 0, () => {
            const nextIndex = globalIndex + this.maxCodeBlocks;
            if (nextIndex < allCodeBlocks.length) {
                setTimeout(() => this.processAllBatches(allCodeBlocks, nextIndex), this.batchDelay);
            }
        });
    }

    processBatch(codeBlocks, startIndex, callback) {
        const endIndex = Math.min(startIndex + this.processingBatchSize, codeBlocks.length);

        requestAnimationFrame(() => {
            for (let i = startIndex; i < endIndex; i++) {
                this.processSingleCodeBlock(codeBlocks[i]);
            }

            if (endIndex < codeBlocks.length) {
                setTimeout(() => this.processBatch(codeBlocks, endIndex, callback), 0);
            } else if (callback) {
                callback();
            }
        });
    }

    processSingleCodeBlock(pre) {
        if (pre.querySelector('.wrap-line-numbers-rows')) return;

        const code = pre.querySelector('code');
        if (!code) return;

        const startAttr = pre.getAttribute('data-start');
        const startLine = startAttr ? parseInt(startAttr, 10) : 1;
        const enableLinenos = pre.getAttribute('data-linenos') === 'false';
        const enableClickHighlight = pre.getAttribute('data-click-highlight') === 'true';

        if (enableLinenos) {
            this.handleHighlightedLines(pre);
            return;
        }

        this.createLineNumbersWithCSS(pre, startLine, enableClickHighlight);
    }

    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    createLineNumbersWithCSS(pre, startLine, enableClickHighlight) {
        const code = pre.querySelector('code');
        if (!code) return;

        const textContent = code.textContent || '';
        const lines = textContent.split('\n');
        const maxLines = Math.min(lines.length, this.maxLinesPerBlock);

        const lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.className = 'wrap-line-numbers-rows';

        if (startLine !== 1) {
            lineNumbersWrapper.setAttribute('data-start', startLine.toString());
            lineNumbersWrapper.style.counterReset = `linenumber ${startLine - 1}`;
        }

        // 使用 DocumentFragment 批量创建
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < maxLines; i++) {
            const lineNumber = document.createElement('span');
            fragment.appendChild(lineNumber);
        }
        lineNumbersWrapper.appendChild(fragment);

        if (enableClickHighlight) {
            lineNumbersWrapper.addEventListener('click', (e) => {
                if (e.target.tagName === 'SPAN') {
                    e.stopPropagation();
                    const lineIndex = Array.from(lineNumbersWrapper.children).indexOf(e.target);
                    const line = startLine + lineIndex;
                    pre.setAttribute("data-wrapline", line);
                    this.handleHighlightedLines(pre);
                }
            });
        }

        pre.appendChild(lineNumbersWrapper);
        this.handleHighlightedLines(pre);
    }

    handleHighlightedLines(pre) {
        const wrapLine = pre.getAttribute('data-wrapline');
        if (!wrapLine) return;

        const lineNumbers = pre.querySelectorAll('.wrap-line-numbers-rows span');
        lineNumbers.forEach((span, index) => {
            const lineNumber = index + 1;
            span.classList.toggle('highlighted', lineNumber == wrapLine);
        });
    }

    // 清理资源
    cleanup(pre) {
        if (pre._lineNumberResizeObserver) {
            pre._lineNumberResizeObserver.disconnect();
            delete pre._lineNumberResizeObserver;
        }
    }

    // 重新初始化（供 v-if-core.js 调用）
    reinit() {
        // 使用 requestIdleCallback 延迟重新初始化
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.initCodeBlocks();
                this.addLineNumbers();
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                this.initCodeBlocks();
                this.addLineNumbers();
            }, 100);
        }
    }
}

// 创建全局实例 - 延迟初始化
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        window.codeBlockManager = new CodeBlockManager();
    }, { timeout: 2000 });
} else {
    setTimeout(() => {
        window.codeBlockManager = new CodeBlockManager();
    }, 200);
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeBlockManager;
}
