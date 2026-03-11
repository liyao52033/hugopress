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

        const paginationContainer = document.getElementById('pagination-container');
        const totalArticles = parseInt(articleGrid.getAttribute('data-total')) || 0;
        const perPage = parseInt(articleGrid.getAttribute('data-per-page')) || 12;

        if (paginationContainer && totalArticles > perPage) {
            paginationContainer.style.display = 'flex';
            // 更新总条数显示
            const paginationTotal = document.getElementById('pagination-total');
            if (paginationTotal) {
                paginationTotal.textContent = '共 ' + totalArticles + ' 条';
            }
        }
    }

    function initLoadMore() {
        const articleGrid = document.getElementById('article-grid-latest');
        const paginationContainer = document.getElementById('pagination-container');
        const paginationNumbers = document.getElementById('pagination-numbers');
        const paginationPrev = document.getElementById('pagination-prev');
        const paginationNext = document.getElementById('pagination-next');
        const paginationInput = document.getElementById('pagination-input');
        const paginationGoto = document.getElementById('pagination-goto');

        if (!articleGrid || !paginationContainer) return;

        let currentPage = 1;
        const perPage = parseInt(articleGrid.getAttribute('data-per-page')) || 12;
        const totalArticles = parseInt(articleGrid.getAttribute('data-total')) || 0;
        const totalPages = Math.ceil(totalArticles / perPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        function renderPaginationNumbers() {
            if (!paginationNumbers) return;
            paginationNumbers.innerHTML = '';

            const maxVisiblePages = 5;
            let startPage = 1;
            let endPage = totalPages;

            if (totalPages > maxVisiblePages) {
                const halfVisible = Math.floor(maxVisiblePages / 2);
                if (currentPage <= halfVisible + 1) {
                    startPage = 1;
                    endPage = maxVisiblePages - 1;
                } else if (currentPage >= totalPages - halfVisible) {
                    startPage = totalPages - maxVisiblePages + 2;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - halfVisible + 1;
                    endPage = currentPage + halfVisible - 1;
                }
            }

            // 第一页
            if (startPage > 1) {
                addPageButton(1);
                if (startPage > 2) {
                    addEllipsis();
                }
            }

            // 中间页码
            for (let i = startPage; i <= endPage; i++) {
                addPageButton(i);
            }

            // 最后一页
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    addEllipsis();
                }
                addPageButton(totalPages);
            }
        }

        function addPageButton(page) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn pagination-number' + (page === currentPage ? ' active' : '');
            btn.textContent = page;
            btn.addEventListener('click', () => goToPage(page));
            paginationNumbers.appendChild(btn);
        }

        function addEllipsis() {
            const span = document.createElement('span');
            span.className = 'pagination-ellipsis';
            span.textContent = '...';
            paginationNumbers.appendChild(span);
        }

        function updatePaginationButtons() {
            if (paginationPrev) paginationPrev.disabled = currentPage === 1;
            if (paginationNext) paginationNext.disabled = currentPage === totalPages;
            if (paginationInput) paginationInput.value = currentPage;
            renderPaginationNumbers();
        }

        function showPage(page, shouldScroll = false) {
            const allCards = Array.from(articleGrid.querySelectorAll('.article-card'));
            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, allCards.length);

            // 性能优化：先读取布局属性，再批量修改样式，避免强制重排
            let content, elementPosition;
            if (shouldScroll) {
                // 先读取布局属性（在修改样式之前）
                content = document.querySelector('.multi-content');
                if (content) {
                    elementPosition = content.getBoundingClientRect().top;
                }
            }

            // 批量修改样式（使用 CSS 类替代直接操作 style）
            allCards.forEach((card, index) => {
                if (index >= startIndex && index < endIndex) {
                    card.classList.remove('hidden');
                    card.classList.add('visible');
                } else {
                    card.classList.remove('visible');
                    card.classList.add('hidden');
                }
            });

            // 只在用户交互时滚动到内容顶部
            if (shouldScroll && content && elementPosition !== undefined) {
                const offset = 80;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }

        function goToPage(page) {
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            showPage(currentPage, true);
            updatePaginationButtons();
        }

        // 上一页
        if (paginationPrev) {
            paginationPrev.addEventListener('click', () => {
                if (currentPage > 1) {
                    goToPage(currentPage - 1);
                }
            });
        }

        // 下一页
        if (paginationNext) {
            paginationNext.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    goToPage(currentPage + 1);
                }
            });
        }

        // 跳转按钮
        if (paginationGoto && paginationInput) {
            paginationGoto.addEventListener('click', () => {
                const page = parseInt(paginationInput.value);
                if (page && page >= 1 && page <= totalPages) {
                    goToPage(page);
                }
            });

            paginationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const page = parseInt(paginationInput.value);
                    if (page && page >= 1 && page <= totalPages) {
                        goToPage(page);
                    }
                }
            });
        }

        // 初始化
        showPage(1);
        updatePaginationButtons();
    }
})();
