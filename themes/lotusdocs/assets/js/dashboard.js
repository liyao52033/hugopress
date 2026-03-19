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
        initWeatherCard();
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

    function initWeatherCard() {
        const weatherCard = document.querySelector('.weather-card');
        if (!weatherCard) return;

        const WEATHER_KEY = window.WeatherConfig?.apiKey;
        const CACHE_KEY = 'weather_adcode';
        const CACHE_KEY_WEATHER = 'weather_data';
        const CACHE_DURATION = (window.WeatherConfig?.cacheDuration || 1) * 24 * 60 * 60 * 1000;

        const weatherIcons = {
            '晴天': {
                icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/>',
                gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            },
            '多云': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
                gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
            },
            '阴天': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
                gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'
            },
            '小雨': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 19v2"/><path d="M12 19v2"/><path d="M16 19v2"/>',
                gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
            },
            '中雨': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 19v2"/><path d="M12 19v2"/><path d="M16 19v2"/>',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            },
            '大雨': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 19v2"/><path d="M12 19v2"/><path d="M16 19v2"/><path d="M8 22v2"/><path d="M12 22v2"/><path d="M16 22v2"/>',
                gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            },
            '雷阵雨': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)'
            },
            '雪': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 19l-2 2"/><path d="M12 19l0 2"/><path d="M16 19l2 2"/><path d="M8 22l-2-2"/><path d="M12 22l0-2"/><path d="M16 22l2-2"/>',
                gradient: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)'
            },
            '雾': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M3 18h18"/><path d="M3 21h18"/>',
                gradient: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
            },
            '霾': {
                icon: '<path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3s1.3 3 3 3h11c1.7 0 3-1.3 3-3z"/><path d="M12 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M17.5 19c0-3-2.5-5-5.5-5"/><path d="M14 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M3 18h18"/><path d="M3 21h18"/>',
                gradient: 'linear-gradient(135deg, #a8a29e 0%, #78716c 100%)'
            }
        };

        function getWeatherIcon(weatherDesc) {
            for (const [key, value] of Object.entries(weatherIcons)) {
                if (weatherDesc.includes(key)) {
                    return value;
                }
            }
            return weatherIcons['晴天'];
        }

        function updateWeatherIcon(weatherDesc) {
            const iconData = getWeatherIcon(weatherDesc);
            const iconBg = document.getElementById('weather-icon-bg');
            if (iconBg) {
                iconBg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconData.icon}</svg>`;
                iconBg.style.background = iconData.gradient;
            }
        }

        async function getAdCodeFromIP() {
            try {
                const response = await fetch(`/ws/location/v1/ip/?key=${WEATHER_KEY}`);
                const data = await response.json();

                if (data.status === 0 && data.result && data.result.ad_info) {
                    return {
                        adcode: data.result.ad_info.adcode,
                        province: data.result.ad_info.province,
                        city: data.result.ad_info.city,
                        district: data.result.ad_info.district
                    };
                }
                throw new Error('获取 adcode 失败');
            } catch (error) {
                console.error('获取 adcode 失败:', error);
                return null;
            }
        }

        async function getWeatherByAdCode(adcode) {
            try {
                const response = await fetch(`/ws/weather/v1/?key=${WEATHER_KEY}&adcode=${adcode}&added_fields=alarm`);
                const data = await response.json();

                if (data.status === 0 && data.result && data.result.realtime && data.result.realtime.length > 0) {
                    return data.result.realtime[0];
                }
                throw new Error('获取天气失败');
            } catch (error) {
                console.error('获取天气失败:', error);
                return null;
            }
        }

        function updateWeatherUI(weatherData, locationInfo) {
            const loadingEl = document.getElementById('weather-loading');
            const errorEl = document.getElementById('weather-error');
            const contentEl = document.querySelector('.weather-content');

            if (!weatherData || !locationInfo) {
                if (loadingEl) loadingEl.style.display = 'none';
                if (contentEl) contentEl.style.display = 'none';
                if (errorEl) {
                    errorEl.style.display = 'flex';
                    const errorMsg = document.getElementById('error-message');
                    if (errorMsg) errorMsg.textContent = '获取天气信息失败，请稍后重试';
                }
                return;
            }

            const infos = weatherData.infos;
            const alarms = weatherData.alarms || [];

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';

            const locationText = document.getElementById('location-text');
            if (locationText) {
                locationText.textContent = `${locationInfo.province}${locationInfo.city}${locationInfo.district}`;
            }

            const tempEl = document.getElementById('weather-temp');
            if (tempEl) tempEl.textContent = `${infos.temperature}°C`;

            const descEl = document.getElementById('weather-desc');
            if (descEl) descEl.textContent = infos.weather;

            updateWeatherIcon(infos.weather);

            const updateEl = document.getElementById('weather-update');
            if (updateEl) updateEl.textContent = `更新时间：${weatherData.update_time}`;

            const windDirEl = document.getElementById('wind-direction');
            if (windDirEl) windDirEl.textContent = infos.wind_direction;

            const windPowerEl = document.getElementById('wind-power');
            if (windPowerEl) windPowerEl.textContent = infos.wind_power_v2 || infos.wind_power;

            const humidityEl = document.getElementById('humidity');
            if (humidityEl) humidityEl.textContent = `${infos.humidity}%`;

            const pressureEl = document.getElementById('air-pressure');
            if (pressureEl) pressureEl.textContent = `${infos.air_pressure}hPa`;

            const alarmsListEl = document.getElementById('alarms-list');
            const alarmsContainer = document.getElementById('weather-alarms');

            if (alarmsListEl && alarmsContainer) {
                const uniqueAlarms = alarms.filter((alarm, index, self) =>
                    index === self.findIndex(a =>
                        a.type_name === alarm.type_name &&
                        a.level_name === alarm.level_name 
                    )
                );

                if (uniqueAlarms.length > 0) {
                    alarmsContainer.style.display = 'block';
                    alarmsListEl.innerHTML = uniqueAlarms.map(alarm => `
                        <div class="alarm-item">
                            <div class="alarm-title">${alarm.type_name}${alarm.level_name}预警</div>
                            <div class="alarm-content">${alarm.pub_content}</div>
                        </div>
                    `).join('');
                } else {
                    alarmsContainer.style.display = 'none';
                }
            }
        }

        async function fetchWeather(showLoading = true) {
            const loadingEl = document.getElementById('weather-loading');
            if (showLoading && loadingEl) loadingEl.style.display = 'flex';

            try {
                let locationInfo = null;
                const cached = localStorage.getItem(CACHE_KEY);

                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION * 7) {
                        locationInfo = data;
                    } else {
                        localStorage.removeItem(CACHE_KEY);
                    }
                }

                if (!locationInfo) {
                    locationInfo = await getAdCodeFromIP();
                    if (locationInfo) {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({
                            data: locationInfo,
                            timestamp: Date.now()
                        }));
                    }
                }

                if (!locationInfo) {
                    updateWeatherUI(null, null);
                    return;
                }

                let weatherData = null;
                const cachedWeather = localStorage.getItem(CACHE_KEY_WEATHER);
                if (cachedWeather) {
                    const { data, timestamp } = JSON.parse(cachedWeather);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        weatherData = data;
                    } else {
                        localStorage.removeItem(CACHE_KEY_WEATHER);
                    }
                }


                if (!weatherData) {
                    weatherData = await getWeatherByAdCode(locationInfo.adcode);
                    if (weatherData) {
                        localStorage.setItem(CACHE_KEY_WEATHER, JSON.stringify({
                            data: weatherData,
                            timestamp: Date.now()
                        }));
                    } else {
                        updateWeatherUI(null, null);
                        return;
                    }

                }

                updateWeatherUI(weatherData, locationInfo);

            } catch (error) {
                console.error('获取天气信息失败:', error);
                updateWeatherUI(null, null);
            }
        }

        fetchWeather();

        setInterval(fetchWeather, 30 * 60 * 1000);

        const refreshBtn = document.getElementById('weather-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.classList.add('spinning');
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_KEY_WEATHER);
                await fetchWeather(true);
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            });
        }
    }
})();
