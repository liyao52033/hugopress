const purgecss = require('@fullhuman/postcss-purgecss').default({
    content: [
        './hugo_stats.json',
        './layouts/**/*.html',
        './content/**/*.md',
        './themes/**/*.html'
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
        standard: [
            'show',
            'active',
            'collapsed',
            'collapsing',
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
            /^responsive:/
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
