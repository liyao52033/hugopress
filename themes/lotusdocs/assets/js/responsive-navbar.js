/**
 * Responsive Navbar JavaScript - 移动端优化版
 * 优化点：
 * 1. 移动端完全移除布局读取，避免强制重排
 * 2. 保留 Intersection Observer 处理滚动状态（性能最好）
 * 3. Bootstrap 处理菜单展开/折叠，我们只处理锚点滚动和点击关闭
 * 4. 桌面端保留下拉菜单悬停效果
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const navbar = document.querySelector('.top-header, #topnav');
    const collapse = document.querySelector('#navbarNav');
    const toggler = document.querySelector('.navbar-toggler');
    const dropdowns = document.querySelectorAll('.dropdown');

    if (!navbar) return;

    // ========== 滚动状态检测（Intersection Observer） ==========
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:50px;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden;';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
        function (entries) {
            navbar.classList.toggle('scrolled', !entries[0].isIntersecting);
        },
        { threshold: 0 }
    );
    observer.observe(sentinel);

    // ========== 桌面端下拉菜单悬停效果 ==========
    // 只在桌面端添加悬停效果（不读取布局属性）
    if (dropdowns.length > 0) {
        dropdowns.forEach(function (dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');

            if (!toggle || !menu) return;

            let hoverTimeout;

            dropdown.addEventListener('mouseenter', function () {
                clearTimeout(hoverTimeout);
                // 使用 matchMedia 检测桌面端，不读取 window.innerWidth
                if (window.matchMedia('(min-width: 992px)').matches) {
                    menu.classList.add('show');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            dropdown.addEventListener('mouseleave', function () {
                hoverTimeout = setTimeout(function () {
                    if (window.matchMedia('(min-width: 992px)').matches) {
                        menu.classList.remove('show');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }, 100);
            });
        });
    }

    // ========== 移动端锚点链接处理 ==========
    // Bootstrap 处理了菜单展开，我们只需要处理：
    // 1. 锚点滚动偏移
    // 2. 点击导航后关闭菜单

    if (collapse) {
        document.addEventListener('click', function (e) {
            const link = e.target.closest('a[href^="#"]');

            // 处理锚点链接
            if (link) {
                const targetId = link.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();

                        // 使用 scrollIntoView，CSS 控制偏移
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            }

            // 点击导航链接后关闭移动端菜单
            // 延迟执行，让链接跳转先发生
            const navLink = e.target.closest('.mobile-nav-menu .nav-link');
            if (navLink && !navLink.classList.contains('dropdown-toggle')) {
                setTimeout(function () {
                    if (collapse.classList.contains('show')) {
                        // 使用 Bootstrap 的 Collapse API 关闭
                        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                            const bsCollapse = bootstrap.Collapse.getInstance(collapse);
                            if (bsCollapse) {
                                bsCollapse.hide();
                            }
                        }
                        if (toggler) {
                            toggler.setAttribute('aria-expanded', 'false');
                        }
                    }
                }, 10);
            }
        });
    }
});
