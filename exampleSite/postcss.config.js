const path = require('path');

const purgecss = require('@fullhuman/postcss-purgecss').default({
    content: [
        path.join(__dirname, 'hugo_stats.json'),
        path.join(__dirname, 'layouts', '**', '*.html'),
        path.join(__dirname, 'content', '**', '*.md'),
        path.join(__dirname, 'themes', '**', '*.html')
    ],
    defaultExtractor: (content) => {
        if (content.endsWith('.json')) {
            try {
                const els = JSON.parse(content).htmlElements;
                return els.tags.concat(els.classes, els.ids);
            } catch (e) {
                return [];
            }
        }
        const matchers = [
            /[a-zA-Z0-9-_:\.]+/g
        ];
        return matchers.reduce((matches, matcher) => {
            const match = content.match(matcher);
            if (match) {
                matches = matches.concat(match);
            }
            return matches;
        }, []);
    },
    safelist: {
        // standard: 标准匹配 - 完全匹配整个类名、ID或标签名
        // 特点：最严格，只匹配完全相同的字符串
        // 适用场景：已知的、固定的类名
        // 示例：'show' 只匹配 class="show"，不匹配 class="show-active"
        standard: [
            'show',
            'active',
            'collapsed',
            'collapsing',
            'scrolled',
            /^dropdown/,
            /^modal/,
            /^offcanvas/,
            /^alert/,
            /^bs-tooltip/,
            /^DocSearch/,
            /^docsearch/,
            'docsearch-container',
            'docsearch-modal',
            'docsearch-input',
            'img-fluid',
            'lazyload',
            'fade',
            'in',
            'open',
            'closed',
            'visible',
            'hidden',
            'loading',
            'loaded',
            'error',
            'success',
            'warning',
            'info'
        ],
        // deep: 深度匹配 - 匹配类名、ID或标签名的一部分
        // 特点：使用正则表达式，匹配包含模式的字符串
        // 适用场景：有共同前缀或后缀的类名组
        // 示例：/^prism/ 匹配 prism、prism-codeblock、prism-theme 等
        deep: [
            /^chroma/,
            /^hljs/,
            /^prism/,
            /^mermaid/,
            /^docsearch/,
            /^bs-/,
            /^alert-/,
            /^btn-/,
            /^badge-/,
            /^bg-/,
            /^text-/,
            /^border-/,
            /^rounded-/,
            /^shadow-/,
            /^p-/,
            /^m-/,
            /^mt-/,
            /^mb-/,
            /^ms-/,
            /^me-/,
            /^pt-/,
            /^pb-/,
            /^ps-/,
            /^pe-/,
            /^d-/,
            /^flex-/,
            /^justify-/,
            /^align-/,
            /^order-/,
            /^col-/,
            /^row-/,
            /^h-/,
            /^w-/
        ],
        // greedy: 贪婪匹配 - 匹配整个选择器字符串（包括伪元素、伪类、属性选择器等）
        // 特点：最宽松，匹配包含模式的任何内容
        // 适用场景：复杂的选择器、伪元素、属性选择器等
        // 示例：/::before/ 匹配 .class::before、[data-attr]::before 等
        greedy: [
            /^transition-/,
            /^duration-/,
            /^ease-/,
            /^transform-/,
            /^scale-/,
            /^rotate-/,
            /^translate-/,
            /^hover:/,
            /^focus:/,
            /^active:/,
            /^disabled:/,
            /aria-expanded/
        ],
    },
    blocklist: [
        /^debug-/,
        /^test-/,
        /^unused-/,
        /^dev-/,
        /^temp-/,
        /^demo-/,
        /^example-/,
        /^sample-/,
        /^placeholder-/,
        /^mock-/,
        /^fake-/,
        /^dummy-/
    ]
});

module.exports = {
    plugins: [
        require('autoprefixer'),
        ...(process.env.HUGO_ENVIRONMENT === 'production' ? [purgecss] : [])
    ]
};
