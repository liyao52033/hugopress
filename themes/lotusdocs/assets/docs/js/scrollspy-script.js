//ScrollSpy - via https://github.com/kimyvgy/simple-scrollspy
window.onload = function () {
    // 检查 scrollSpy 函数是否已定义
    if (typeof scrollSpy === 'undefined') {
        console.error('scrollSpy 函数未定义，请确保 simple-scrollspy.min.js 已正确加载');
        return;
    }

    // 初始化 ScrollSpy
    initScrollSpy();

    // 添加全局刷新函数，供外部调用
    window.refreshScrollSpy = refreshScrollSpy;
}

// 初始化 ScrollSpy 函数
function initScrollSpy() {
    try {
        // 将初始scrollSpy实例保存到window.scrollSpyInstance中，以便后续可以正确销毁
        window.scrollSpyInstance = scrollSpy('#toc', {
            sectionClass: 'h2,h3,h4',
            menuActiveTarget: '#toc a', // 简化选择器
            offset: 120,
            smoothScroll: true,
            smoothScrollBehavior: function (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 点击侧边栏链接后更新 URL 锚点
                const id = element.getAttribute('id');
                if (id) {
                    window.history.pushState({}, '', `#${id}`);
                }
            },
            onActive: function (activeLink) {
                // 确保侧边栏显示当前高亮项
                const sidebarContainer = document.querySelector('.docs-toc');
                if (sidebarContainer && activeLink) {
                    const linkTop = activeLink.offsetTop;
                    const containerHeight = sidebarContainer.clientHeight;
                    const scrollTop = sidebarContainer.scrollTop;

                    // 只在元素不可见时滚动
                    if (linkTop < scrollTop || linkTop > scrollTop + containerHeight - 50) {
                        sidebarContainer.scrollTo({
                            top: linkTop - (containerHeight / 2),
                            behavior: 'smooth'
                        });
                    }

                    // 更新 URL 锚点
                    const href = activeLink.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        // 使用 replaceState 避免页面重新加载
                        window.history.replaceState({}, '', href);
                    }
                }
            }
        });
    } catch (error) {
        console.error('初始化 scrollSpy 时出错:', error);
    }
}

// 刷新 ScrollSpy 函数，用于 DOM 变化后更新
function refreshScrollSpy() {
    try {
        // 如果没有 scrollSpy 实例，则初始化一个新的
        if (!window.scrollSpyInstance) {
            initScrollSpy();
            return;
        }

        // 移除所有菜单项的active类，避免多个高亮
        document.querySelectorAll('#toc a.active').forEach(link => {
            link.classList.remove('active');
        });

        // 销毁旧实例
        window.scrollSpyInstance = null;

        // 等待DOM更新完成后再初始化
        requestAnimationFrame(() => {
            initScrollSpy();
        });
    } catch (error) {
        console.error('刷新 scrollSpy 时出错:', error);
    }
}


