/**
 * Responsive Navbar JavaScript - 性能优化版（Intersection Observer 版）
 * 优化点：
 * 1. 使用 Intersection Observer 替代 scroll 监听（性能最佳）
 * 2. 批量 DOM 读写，避免强制同步布局
 * 3. 事件节流/防抖，减少处理频率
 * 4. 缓存 DOM 查询结果
 * 5. 使用 passive 事件监听器
 * 6. 使用 requestAnimationFrame 批量处理样式更改
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ========== 缓存 DOM 元素 ==========
    const elements = {
        navbar: document.querySelector('.top-header, #topnav'),
        navbarToggler: document.querySelector('.navbar-toggler'),
        navbarCollapse: document.querySelector('.navbar-collapse'),
        legacyToggle: document.getElementById('isToggle'),
        navigation: document.getElementById('navigation'),
        dropdowns: document.querySelectorAll('.dropdown'),
        anchorLinks: document.querySelectorAll('a[href^="#"]'),
        navLinks: document.querySelectorAll('.navbar-collapse li:not(.dropdown) > a')
    };

    // 提前返回如果主要元素不存在
    if (!elements.navbar) return;

    // 性能优化：延迟读取布局属性，避免在 DOMContentLoaded 时强制重排
    // 使用 requestIdleCallback 或 setTimeout 延迟到浏览器空闲时执行
    const layoutCache = {
        navbarHeight: 70, // 默认值，避免首次读取时强制重排
        isMobile: window.innerWidth < 992,
        isLargeDesktop: window.innerWidth >= 1200
    };

    // 延迟读取实际高度，避免阻塞初始渲染
    // 使用双重 RAF 确保在布局稳定后读取
    function updateLayoutCache() {
        if (!elements.navbar) return;
        // 使用 getBoundingClientRect 代替 offsetHeight，性能更好
        const rect = elements.navbar.getBoundingClientRect();
        layoutCache.navbarHeight = rect.height || 70;
    }

    // 使用双重 requestAnimationFrame 确保在布局稳定后执行
    requestAnimationFrame(function () {
        requestAnimationFrame(updateLayoutCache);
    });

    // ========== 工具函数 ==========

    /**
     * 节流函数 - 限制函数执行频率
     */
    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 防抖函数 - 延迟执行直到停止触发
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ========== 滚动处理（Intersection Observer 版 - 性能最佳） ==========

    /**
     * 使用 Intersection Observer 检测滚动位置
     * 相比 scroll 事件，IO 不会阻塞主线程，性能更好
     */
    function initScrollObserver() {
        // 创建一个不可见的哨兵元素来检测滚动位置
        const sentinel = document.createElement('div');
        sentinel.style.cssText = `
            position: absolute;
            top: 50px;
            left: 0;
            width: 1px;
            height: 1px;
            pointer-events: none;
            visibility: hidden;
            z-index: -1;
        `;
        sentinel.setAttribute('aria-hidden', 'true');
        document.body.prepend(sentinel);

        // 使用 Intersection Observer 检测哨兵元素是否可见
        const observer = new IntersectionObserver(
            function (entries) {
                // 批量样式更改：当哨兵不可见时（滚动超过50px），添加 scrolled 类
                const isScrolled = !entries[0].isIntersecting;
                elements.navbar.classList.toggle('scrolled', isScrolled);
            },
            {
                threshold: 0,
                rootMargin: '0px 0px 0px 0px'
            }
        );

        observer.observe(sentinel);

        // 返回清理函数
        return function cleanup() {
            observer.disconnect();
            sentinel.remove();
        };
    }

    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
        initScrollObserver();
    } else {
        // 降级方案：使用 RAF + passive 监听器（旧浏览器）
        const scrollState = {
            lastScrollTop: 0,
            ticking: false
        };

        function updateScrollState() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (Math.abs(scrollTop - scrollState.lastScrollTop) < 5) {
                scrollState.ticking = false;
                return;
            }

            scrollState.lastScrollTop = scrollTop;

            const shouldBeScrolled = scrollTop > 50;
            const isScrolled = elements.navbar.classList.contains('scrolled');

            if (shouldBeScrolled !== isScrolled) {
                elements.navbar.classList.toggle('scrolled', shouldBeScrolled);
            }

            scrollState.ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!scrollState.ticking) {
                requestAnimationFrame(updateScrollState);
                scrollState.ticking = true;
            }
        }, { passive: true });
    }

    // ========== Resize 处理（防抖 + 避免强制重排） ==========

    let resizeRafId = null;

    const handleResize = debounce(function () {
        // 取消之前的 RAF
        if (resizeRafId) {
            cancelAnimationFrame(resizeRafId);
        }

        // 使用 RAF 批量处理，避免强制重排
        resizeRafId = requestAnimationFrame(function () {
            // 只读取不会触发布局的属性（innerWidth）
            const newIsMobile = window.innerWidth < 992;
            const newIsLargeDesktop = window.innerWidth >= 1200;

            // 批量 DOM 操作：切换到桌面时关闭移动端菜单
            if (!newIsMobile && elements.navbarCollapse) {
                const isMenuOpen = elements.navbarCollapse.classList.contains('show');
                if (isMenuOpen) {
                    elements.navbarCollapse.classList.remove('show');
                    if (elements.navbarToggler) {
                        elements.navbarToggler.setAttribute('aria-expanded', 'false');
                    }
                }
            }

            // 批量重置下拉菜单状态
            const openDropdowns = document.querySelectorAll('.navbar-nav .dropdown-menu.show');
            if (openDropdowns.length > 0) {
                openDropdowns.forEach(function (menu) {
                    menu.classList.remove('show');
                    const toggle = menu.previousElementSibling;
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            // 延迟读取会触发重排的属性（在样式写入完成后）
            requestAnimationFrame(function () {
                layoutCache.isMobile = newIsMobile;
                layoutCache.isLargeDesktop = newIsLargeDesktop;
                // 只在必要时读取 offsetHeight
                if (elements.navbar) {
                    layoutCache.navbarHeight = elements.navbar.offsetHeight;
                }
            });
        });
    }, 150);

    window.addEventListener('resize', handleResize, { passive: true });

    // ========== 移动端菜单处理（Bootstrap 兼容版） ==========

    if (elements.navbarToggler && elements.navbarCollapse) {
        // 检查是否是 Bootstrap Collapse 类型（data-bs-toggle="collapse"）
        const isBootstrapCollapse = elements.navbarToggler.getAttribute('data-bs-toggle') === 'collapse';

        // 如果是 Bootstrap Collapse，让 Bootstrap 完全处理，我们只监听状态变化
        if (isBootstrapCollapse && typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            // Bootstrap 会处理点击，我们只需要监听菜单状态变化
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isShown = elements.navbarCollapse.classList.contains('show');
                        elements.navbarToggler.setAttribute('aria-expanded', String(isShown));
                    }
                });
            });

            observer.observe(elements.navbarCollapse, { attributes: true });

            // 点击外部关闭菜单（仅在 Bootstrap 未处理时）
            // 使用延迟检查，避免与 Bootstrap 的点击处理冲突
            let clickTimeout;
            document.addEventListener('click', function (e) {
                if (!layoutCache.isMobile) return;
                if (!elements.navbarCollapse.classList.contains('show')) return;

                // 检查点击目标是否是汉堡按钮本身（如果是，让 Bootstrap 处理）
                if (elements.navbarToggler.contains(e.target) || e.target === elements.navbarToggler) {
                    return;
                }

                const isClickInsideNav = elements.navbarCollapse.contains(e.target);

                if (!isClickInsideNav) {
                    // 延迟关闭，避免与 Bootstrap 的展开动画冲突
                    clearTimeout(clickTimeout);
                    clickTimeout = setTimeout(function () {
                        // 再次检查菜单是否仍然展开（可能 Bootstrap 已经处理了）
                        if (elements.navbarCollapse.classList.contains('show')) {
                            const bsCollapse = bootstrap.Collapse.getInstance(elements.navbarCollapse);
                            if (bsCollapse) {
                                bsCollapse.hide();
                            } else {
                                elements.navbarCollapse.classList.remove('show');
                                elements.navbarToggler.setAttribute('aria-expanded', 'false');
                            }
                        }
                    }, 10);
                }
            });
        } else {
            // 非 Bootstrap 场景：手动处理点击
            elements.navbarToggler.addEventListener('click', function (e) {
                e.preventDefault();

                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                const newState = !isExpanded;

                elements.navbarCollapse.classList.toggle('show', newState);
                this.setAttribute('aria-expanded', String(newState));
            });

            // 点击外部关闭菜单
            document.addEventListener('click', function (e) {
                if (!layoutCache.isMobile) return;
                if (!elements.navbarCollapse.classList.contains('show')) return;

                const isClickInsideNav = elements.navbarCollapse.contains(e.target) ||
                    elements.navbarToggler.contains(e.target);

                if (!isClickInsideNav) {
                    elements.navbarCollapse.classList.remove('show');
                    elements.navbarToggler.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // ========== 平滑滚动（优化版） ==========

    // 使用事件委托减少监听器数量
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (!targetElement || !elements.navbar) return;

        e.preventDefault();

        // 使用缓存的高度值，避免强制同步布局
        const targetPosition = targetElement.offsetTop - layoutCache.navbarHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    });

    // ========== 下拉菜单处理（批量事件委托） ==========

    const needsDropdownFallback = (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) &&
        (typeof window.Dropdown === 'undefined');

    if (needsDropdownFallback) {
        // 使用事件委托处理所有下拉菜单交互
        document.addEventListener('click', function (e) {
            const toggle = e.target.closest('.dropdown-toggle');
            const dropdown = e.target.closest('.dropdown');

            if (toggle && dropdown) {
                e.preventDefault();

                const menu = dropdown.querySelector('.dropdown-menu');
                if (!menu) return;

                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

                // 批量关闭其他下拉菜单（先读取所有状态，再批量写入）
                const openMenus = document.querySelectorAll('.dropdown-menu.show');
                openMenus.forEach(function (otherMenu) {
                    if (otherMenu !== menu) {
                        otherMenu.classList.remove('show');
                        const otherToggle = otherMenu.previousElementSibling;
                        if (otherToggle) {
                            otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                // 批量更新当前下拉菜单
                menu.classList.toggle('show', !isExpanded);
                toggle.setAttribute('aria-expanded', String(!isExpanded));
            } else if (!e.target.closest('.dropdown')) {
                // 点击外部，批量关闭所有下拉菜单
                const openMenus = document.querySelectorAll('.dropdown-menu.show');
                if (openMenus.length > 0) {
                    openMenus.forEach(function (menu) {
                        menu.classList.remove('show');
                        const toggle = menu.previousElementSibling;
                        if (toggle) {
                            toggle.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
            }
        });
    }

    // ========== 桌面端悬停效果（优化版） ==========

    // 只在初始化时是大桌面才添加悬停效果
    if (layoutCache.isLargeDesktop && elements.dropdowns.length > 0) {
        const dropdownElements = Array.from(elements.dropdowns);

        dropdownElements.forEach(function (dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');

            if (!toggle || !menu) return;

            let hoverTimeout;

            dropdown.addEventListener('mouseenter', function () {
                clearTimeout(hoverTimeout);
                // 再次检查屏幕尺寸（可能已改变）
                if (window.innerWidth >= 992) {
                    menu.classList.add('show');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            dropdown.addEventListener('mouseleave', function () {
                hoverTimeout = setTimeout(function () {
                    if (window.innerWidth >= 992) {
                        menu.classList.remove('show');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }, 100);
            });
        });
    }

    // ========== 导航链接点击处理（移动端关闭菜单） ==========

    if (elements.navbarCollapse && elements.navLinks.length > 0) {
        const navLinkElements = Array.from(elements.navLinks);

        navLinkElements.forEach(function (link) {
            link.addEventListener('click', function () {
                if (layoutCache.isMobile && elements.navbarCollapse.classList.contains('show')) {
                    elements.navbarCollapse.classList.remove('show');
                    elements.navbarToggler.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // ========== 旧版兼容（保留 toggleMenu 函数） ==========

    if (elements.legacyToggle && elements.navigation) {
        window.toggleMenu = function () {
            const isActive = elements.legacyToggle.classList.contains('active');
            elements.legacyToggle.classList.toggle('active', !isActive);
            elements.navigation.classList.toggle('show', !isActive);
        };
    }
    
});
