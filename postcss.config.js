const purgecss = require('@fullhuman/postcss-purgecss').default({
    content: ['./hugo_stats.json'],
    defaultExtractor: (content) => {
        const els = JSON.parse(content).htmlElements;
        return els.tags.concat(els.classes, els.ids);
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
            'in'
        ],
        deep: [/^chroma/, /^hljs/, /^prism/],
        greedy: [],
    }
});

module.exports = {
    plugins: [
        require('autoprefixer'),
        ...(process.env.HUGO_ENVIRONMENT === 'production' ? [purgecss] : [])
    ]
};
