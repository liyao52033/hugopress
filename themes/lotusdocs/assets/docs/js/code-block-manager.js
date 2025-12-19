/**
 * 精简版代码块管理器
 * 只处理行号和语言标签功能
 */
class CodeBlockManager {
    constructor() {
        this.selectors = ['.highlight', '.chroma'];
        this.initialized = false;

        // 性能限制配置
        this.maxCodeBlocks = 50; // 每批处理的代码块数量
        this.maxLinesPerBlock = 1000; // 每个代码块的最大行数
        this.processingBatchSize = 5; // 批处理大小，避免一次性处理太多
        this.batchDelay = 100; // 批次间延迟时间(毫秒)，避免连续处理导致页面卡顿
        this.debounceDelay = 200; // 防抖延迟时间(毫秒)，避免频繁更新行号

        // 延迟初始化，确保DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // 如果DOM已经加载，延迟一点时间确保其他脚本也加载完成
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        if (this.initialized) return;

        if (!this.hasCodeBlockContent()) {
            this.initialized = true;
            return;
        }
        this.initAll();
        this.initialized = true;
    }

    hasCodeBlockContent() {
        if (document.querySelector('pre>code')) {
                return true;
            }
        return false;
    }

    // 为代码块添加包装器和语言标签
    initCodeBlocks() {
        const self = this;

        function getLanguage(block) {
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

            return 'TS'; // 默认值
        }

        function findBlocks() {
            const set = new Set();
            self.selectors.forEach(s => document.querySelectorAll(s).forEach(el => set.add(el)));
            document.querySelectorAll('pre > code').forEach(code => {
                const pre = code.parentElement;
                if (!pre.closest(self.selectors.join(','))) set.add(pre);
            });
            return Array.from(set);
        }

        function wrapIfNeeded(block) {
            // 检查是否已经有包装器，避免重复包装
            if (block.parentElement && block.parentElement.classList.contains('cb-collapsible')) {
                return;
            }

            const wrapper = document.createElement('div');
            const parent = block.parentNode;
            parent.insertBefore(wrapper, block);
            wrapper.appendChild(block);

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



    // 行号功能相关方法
    removeLineNumbers() {
        document.querySelectorAll('.wrap-line-numbers-rows').forEach(function (el) {
            el.remove();
        });
    }

    addLineNumbers() {
        // 获取所有需要处理的代码块
        const allCodeBlocks = document.querySelectorAll('.prism-codeblock pre, pre.wrap-line-numbers');
        if (!allCodeBlocks.length) return;

        // 将所有代码块转换为数组，准备分批处理
        const codeBlocks = Array.from(allCodeBlocks);

        // 开始分批处理所有代码块
        this.processAllBatches(codeBlocks, 0);
    }

    // 分批处理所有代码块，确保所有代码块都能被处理
    processAllBatches(allCodeBlocks, globalIndex) {
        // 计算当前批次的代码块
        const currentBatch = allCodeBlocks.slice(globalIndex, globalIndex + this.maxCodeBlocks);

        if (currentBatch.length === 0) {
            console.log('所有代码块处理完成');
            return;
        }

      //  console.log(`处理第${Math.floor(globalIndex / this.maxCodeBlocks) + 1}批代码块，包含${currentBatch.length}个代码块`);

        // 处理当前批次
        this.processBatch(currentBatch, 0, () => {
            // 当前批次完成后，继续处理下一批次
            const nextIndex = globalIndex + this.maxCodeBlocks;

            if (nextIndex < allCodeBlocks.length) {
                // 延迟一段时间再处理下一批，避免连续处理导致页面卡顿
                setTimeout(() => {
                    this.processAllBatches(allCodeBlocks, nextIndex);
                }, this.batchDelay);
            } 
        });
    }

    // 批处理代码块，避免一次性处理太多导致页面卡顿
    processBatch(codeBlocks, startIndex, callback) {
        const endIndex = Math.min(startIndex + this.processingBatchSize, codeBlocks.length);

        // 使用requestAnimationFrame确保不阻塞UI
        requestAnimationFrame(() => {
            for (let i = startIndex; i < endIndex; i++) {
                this.processSingleCodeBlock(codeBlocks[i]);
            }

            // 如果还有更多代码块需要处理，继续下一批
            if (endIndex < codeBlocks.length) {
                // 使用setTimeout让出控制权，避免长时间阻塞
                setTimeout(() => this.processBatch(codeBlocks, endIndex, callback), 0);
            } else if (callback) {
                // 当前批次处理完成，调用回调函数
                callback();
            }
        });
    }

    // 处理单个代码块
    processSingleCodeBlock(pre) {
        // 检查是否已经添加了行号
        if (pre.querySelector('.wrap-line-numbers-rows')) {
            return;
        }

        const code = pre.querySelector('code');
        if (!code) return;

        // 获取配置
        const startAttr = pre.getAttribute('data-start');
        const startLine = startAttr ? parseInt(startAttr, 10) : 1;
        const enableLinenos = pre.getAttribute('data-linenos') === 'false';
        const enableClickHighlight = pre.getAttribute('data-click-highlight') === 'true';

        if (enableLinenos) {
            // 如果不启用行号，只处理默认高亮
            this.handleHighlightedLines(pre);
            return;
        }

        // 使用CSS计数器方法创建行号，确保与实际渲染行数对应
        this.createLineNumbersWithCSS(pre, startLine, enableClickHighlight);
    }

    // 防抖函数，避免频繁触发更新
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            // 清除之前的定时器
            clearTimeout(timeoutId);
            // 设置新的定时器
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // 使用简单可靠的方法创建行号，不考虑自动换行
    createLineNumbersWithCSS(pre, startLine, enableClickHighlight) {
        const code = pre.querySelector('code');
        if (!code) return;

        // 获取文本内容并计算行数
        const textContent = code.textContent || '';
        const lines = textContent.split('\n');

        // 限制最大行数，避免性能问题
        const maxLines = Math.min(lines.length, this.maxLinesPerBlock);

        // 创建行号容器
        const lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.className = 'wrap-line-numbers-rows';

        // 设置起始行号
        if (startLine !== 1) {
            lineNumbersWrapper.setAttribute('data-start', startLine.toString());
            lineNumbersWrapper.style.counterReset = `linenumber ${startLine - 1}`;
        }

        // 创建行号元素
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < maxLines; i++) {
            const lineNumber = document.createElement('span');
            fragment.appendChild(lineNumber);
        }
        lineNumbersWrapper.appendChild(fragment);

        // 处理点击高亮功能
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

    // 更新行号，确保与实际渲染行数对应
    updateLineNumbers(pre, lineNumbersWrapper, startLine) {
        const code = pre.querySelector('code');
        if (!code) return;

        // 使用更精确的方法计算实际渲染行数
        const actualLines = this.calculateActualRenderedLines(code);

        // 限制最大行数，避免性能问题
        const maxLines = Math.min(actualLines, this.maxLinesPerBlock);

        // 如果行数没有变化，不需要更新
        const currentLineCount = lineNumbersWrapper.children.length;
        if (currentLineCount === maxLines) {
            return;
        }

        // 清空现有行号
        lineNumbersWrapper.innerHTML = '';

        // 创建新的行号元素
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < maxLines; i++) {
            const lineNumber = document.createElement('span');
            fragment.appendChild(lineNumber);
        }
        lineNumbersWrapper.appendChild(fragment);

        // 更新高亮行
        this.handleHighlightedLines(pre);
    }

    // 清理资源，避免内存泄漏
    cleanup(pre) {
        if (pre._lineNumberResizeObserver) {
            pre._lineNumberResizeObserver.disconnect();
            delete pre._lineNumberResizeObserver;
        }

        if (pre._lineNumberResizeHandler) {
            window.removeEventListener('resize', pre._lineNumberResizeHandler);
            delete pre._lineNumberResizeHandler;
        }
    }
    calculateLinesOptimized(codeElement) {
        // 直接基于文本内容计算基本行数
        let codeText = codeElement.textContent || codeElement.innerText || '';

        // 清理文本，移除开头和结尾的空行
        codeText = codeText.replace(/^\n+/, '').replace(/\n+$/, '');

        // 如果没有内容，至少返回1行
        if (!codeText) return 1;

        // 计算基本行数
        const textLines = codeText.split('\n').length;

        // 检查CSS white-space属性，确定是否自动换行
        const computedStyle = getComputedStyle(codeElement);
        const whiteSpace = computedStyle.whiteSpace;

        // 如果设置为pre或nowrap，则不会自动换行，直接返回文本行数
        if (whiteSpace === 'pre' || whiteSpace === 'nowrap' || whiteSpace === 'pre-wrap') {
            return textLines;
        }

        // 对于可能自动换行的情况，使用临时测量方法
        return this.calculateActualRenderedLines(codeElement, codeText);
    }

    // 通过临时DOM测量实际渲染行数
    calculateActualRenderedLines(codeElement, codeText) {
        // 创建临时克隆元素进行精确测量
        const tempClone = codeElement.cloneNode(true);

        // 确保临时元素有相同的样式和尺寸
        tempClone.style.position = 'absolute';
        tempClone.style.visibility = 'hidden';
        tempClone.style.height = 'auto';
        tempClone.style.overflow = 'visible';
        tempClone.style.top = '-9999px';
        tempClone.style.left = '-9999px';
        tempClone.style.width = codeElement.offsetWidth + 'px'; // 使用相同的宽度

        // 将临时元素添加到DOM中
        document.body.appendChild(tempClone);

        try {
            // 获取临时元素的计算后样式
            const tempStyle = getComputedStyle(tempClone);

            // 如果行高是固定值，可以直接计算
            const lineHeight = parseFloat(tempStyle.lineHeight);
            const elementHeight = tempClone.offsetHeight;

            if (lineHeight > 0 && !isNaN(lineHeight)) {
                const calculatedLines = Math.round(elementHeight / lineHeight);
                document.body.removeChild(tempClone);
                return Math.max(calculatedLines, 1); // 至少返回1行
            }

            // 如果无法通过行高计算，使用字符数作为后备方案
            const containerWidth = tempClone.offsetWidth;
            const fontSize = parseFloat(tempStyle.fontSize) || 14;
            const fontFamily = tempStyle.fontFamily;

            // 创建测量元素来获取精确字符宽度
            const measureElement = document.createElement('span');
            measureElement.style.position = 'absolute';
            measureElement.style.visibility = 'hidden';
            measureElement.style.fontSize = fontSize + 'px';
            measureElement.style.fontFamily = fontFamily;
            measureElement.textContent = 'abcdefghijklmnopqrstuvwxyz';
            document.body.appendChild(measureElement);

            const avgCharWidth = measureElement.offsetWidth / 26;
            document.body.removeChild(measureElement);

            // 计算每行大致能容纳的字符数
            const charsPerLine = Math.max(1, Math.floor(containerWidth / avgCharWidth));

            // 计算总行数（考虑换行）
            const lines = codeText.split('\n');
            let totalLines = 0;

            for (const line of lines) {
                // 计算每行实际需要的显示行数
                const lineDisplayLines = Math.max(1, Math.ceil(line.length / charsPerLine));
                totalLines += lineDisplayLines;

                // 限制最大行数，避免性能问题
                if (totalLines > this.maxLinesPerBlock) {
                    totalLines = this.maxLinesPerBlock;
                    break;
                }
            }

            document.body.removeChild(tempClone);
            return totalLines;
        } catch (error) {
            // 出错时移除临时元素并返回基本行数
            if (tempClone.parentNode) {
                document.body.removeChild(tempClone);
            }
            console.warn('行数计算出错，使用基本行数:', error);
            return codeText.split('\n').length;
        }
    }

    handleHighlightedLines(pre) {
        // 处理高亮行的显示
        const wrapLine = pre.getAttribute('data-wrapline');
        if (wrapLine) {
            const lineNumbers = pre.querySelectorAll('.wrap-line-numbers-rows span');
            lineNumbers.forEach((span, index) => {
                const lineNumber = index + 1;
                if (lineNumber == wrapLine) {
                    span.classList.add('highlighted');
                } else {
                    span.classList.remove('highlighted');
                }
            });
        }
    }

    // 完整初始化所有功能
    initAll() {
        this.initCodeBlocks();
        // 延迟添加行号，确保DOM渲染完成
        setTimeout(() => {
            this.addLineNumbers();
        }, 100);
    }

    // 暴露给v-if-core.js调用的方法
    reinit() {
        this.initCodeBlocks();
        this.addLineNumbers();
    }
}

// 创建全局实例
window.codeBlockManager = new CodeBlockManager();

// 导出类以供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeBlockManager;
}

