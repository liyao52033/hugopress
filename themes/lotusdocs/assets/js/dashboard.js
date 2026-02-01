(function () {
    document.addEventListener('DOMContentLoaded', function () {
        initTabSwitching();
        initSearch();
        initFilterButtons();
        initLayoutToggle();
        initRuntimeUpdate();
        initSmartRecommend();
        initLazyLoading();
        initSkeletonLoading();
        initLoadMore();
        initCardClick();
    });

    function initTabSwitching() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const contentPanels = document.querySelectorAll('.content-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const tabId = this.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                contentPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === 'panel-' + tabId) {
                        panel.classList.add('active');
                        lazyLoadPanel(panel);
                    }
                });
            });
        });

        lazyLoadPanel(document.querySelector('.content-panel.active'));
    }

    function lazyLoadPanel(panel) {
        if (!panel || panel.getAttribute('data-lazy-loaded') === 'true') return;

        const images = panel.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
            }
        });

        panel.setAttribute('data-lazy-loaded', 'true');
    }

    function initSearch() {
        const searchInput = document.getElementById('quick-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase().trim();
            const articleCards = document.querySelectorAll('.article-card, .list-item, .featured-card');

            articleCards.forEach(card => {
                const title = card.querySelector('.article-title, .list-title, .featured-title');
                const excerpt = card.querySelector('.article-excerpt, .featured-excerpt');

                let match = false;

                if (title) {
                    const titleText = title.textContent.toLowerCase();
                    if (titleText.includes(query)) {
                        match = true;
                    }
                }

                if (excerpt && !match) {
                    const excerptText = excerpt.textContent.toLowerCase();
                    if (excerptText.includes(query)) {
                        match = true;
                    }
                }

                if (query === '') {
                    card.style.display = '';
                } else {
                    card.style.display = match ? '' : 'none';
                }
            });
        });

        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = '/search/?q=' + encodeURIComponent(query);
                }
            }
        });
    }

    function initFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const tabBtns = document.querySelectorAll('.tab-btn');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                tabBtns.forEach(tabBtn => {
                    tabBtn.classList.remove('active');
                    if (tabBtn.getAttribute('data-tab') === filter) {
                        tabBtn.classList.add('active');
                    }
                });

                const contentPanels = document.querySelectorAll('.content-panel');
                contentPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === 'panel-' + filter) {
                        panel.classList.add('active');
                    }
                });
            });
        });
    }

    function initLayoutToggle() {
        const layoutBtns = document.querySelectorAll('.layout-btn');
        const articleGrid = document.querySelector('.article-grid');

        if (!articleGrid) return;

        layoutBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const layout = this.getAttribute('data-layout');

                layoutBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                if (layout === 'grid') {
                    articleGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                } else if (layout === 'list') {
                    articleGrid.style.gridTemplateColumns = '1fr';
                }
            });
        });
    }

    function initRuntimeUpdate() {
        const runtimeElement = document.getElementById('site-runtime-days');
        if (!runtimeElement) return;

        const startDateStr = runtimeElement.getAttribute('data-start-date');
        if (!startDateStr || startDateStr === '0') return;

        function updateRuntime() {
            const startDate = new Date(startDateStr);
            const now = new Date();
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (runtimeElement) {
                runtimeElement.textContent = diffDays;
            }
        }

        updateRuntime();
        setInterval(updateRuntime, 86400000);
    }

    function initSmartRecommend() {
        const recommendList = document.getElementById('recommend-list');
        if (!recommendList) return;

        const recommendItems = Array.from(recommendList.querySelectorAll('.recommend-item'));
        const userTags = getUserTagsFromHistory();

        if (userTags.length > 0) {
            const scoredItems = recommendItems.map(item => {
                const itemTags = JSON.parse(item.getAttribute('data-tags') || '[]');
                const score = calculateTagScore(userTags, itemTags);
                return { item, score };
            });

            scoredItems.sort((a, b) => b.score - a.score);

            recommendList.innerHTML = '';
            scoredItems.slice(0, 5).forEach(({ item }) => {
                recommendList.appendChild(item);
            });
        }
    }

    function getUserTagsFromHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('articleHistory') || '[]');
            const tagCounts = {};

            history.forEach(article => {
                if (article.tags) {
                    article.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });

            return Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([tag]) => tag);
        } catch (e) {
            return [];
        }
    }

    function calculateTagScore(userTags, itemTags) {
        if (!itemTags || itemTags.length === 0) return 0;

        let score = 0;
        userTags.forEach(userTag => {
            if (itemTags.includes(userTag)) {
                score += 10;
            }
        });

        return score;
    }

    function trackArticleView(articleUrl, tags) {
        try {
            const history = JSON.parse(localStorage.getItem('articleHistory') || '[]');
            const existingIndex = history.findIndex(item => item.url === articleUrl);

            if (existingIndex >= 0) {
                history.splice(existingIndex, 1);
            }

            history.unshift({ url: articleUrl, tags, timestamp: Date.now() });

            if (history.length > 50) {
                history.pop();
            }

            localStorage.setItem('articleHistory', JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to track article view:', e);
        }
    }

    document.addEventListener('click', function (e) {
        const recommendItem = e.target.closest('.recommend-item');
        if (recommendItem) {
            const url = recommendItem.getAttribute('data-url');
            const tags = JSON.parse(recommendItem.getAttribute('data-tags') || '[]');
            trackArticleView(url, tags);
        }
    });

    function initCardClick() {
        const cards = document.querySelectorAll('.article-card, .list-item, .featured-card');
        cards.forEach(card => {
            card.addEventListener('click', function (e) {
                const url = this.getAttribute('data-url');
                if (url && !e.target.closest('a')) {
                    window.location.href = url;
                }
            });
        });
    }

    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');

                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
            });
        }
    }

    function initSkeletonLoading() {
        const skeletonWrapper = document.getElementById('skeleton-latest');
        const articleGrid = document.getElementById('article-grid-latest');

        if (!skeletonWrapper || !articleGrid) return;

        // 立即显示内容，移除不必要的延迟
        skeletonWrapper.classList.remove('loading');
        articleGrid.style.display = 'grid';

        const loadMoreBtn = document.getElementById('load-more-btn');
        const loadMoreContainer = document.getElementById('load-more-container');
        const totalArticles = parseInt(articleGrid.getAttribute('data-total')) || 0;
        const perPage = parseInt(articleGrid.getAttribute('data-per-page')) || 12;

        if (loadMoreBtn && loadMoreContainer && totalArticles > perPage) {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreContainer.style.display = 'block';
        }
    }

    function initLoadMore() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const loadMoreContainer = document.getElementById('load-more-container');
        const loadMoreLoading = document.getElementById('load-more-loading');
        const articleGrid = document.getElementById('article-grid-latest');

        if (!loadMoreBtn || !articleGrid) return;

        let currentPage = 1;
        const perPage = parseInt(articleGrid.getAttribute('data-per-page')) || 12;
        const totalArticles = parseInt(articleGrid.getAttribute('data-total')) || 0;
        const totalPages = Math.ceil(totalArticles / perPage);

        function updateLoadMoreButton() {
            if (currentPage >= totalPages) {
                loadMoreBtn.style.display = 'none';
                loadMoreContainer.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'inline-block';
                loadMoreContainer.style.display = 'block';
            }
        }

        function showPage(page) {
            const allCards = Array.from(articleGrid.querySelectorAll('.article-card'));
            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, allCards.length);

            allCards.forEach((card, index) => {
                if (index < endIndex) {
                    card.style.display = 'flex';
                    card.setAttribute('data-page', Math.floor(index / perPage) + 1);
                } else {
                    card.style.display = 'none';
                }
            });
        }

        loadMoreBtn.addEventListener('click', function () {
            loadMoreBtn.style.display = 'none';
            loadMoreLoading.style.display = 'block';

            setTimeout(() => {
                currentPage++;
                showPage(currentPage);

                loadMoreBtn.style.display = 'inline-block';
                loadMoreLoading.style.display = 'none';

                updateLoadMoreButton();
            }, 50);
        });

        showPage(1);
        updateLoadMoreButton();
    }
})();
