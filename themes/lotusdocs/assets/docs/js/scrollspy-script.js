//ScrollSpy - via https://github.com/kimyvgy/simple-scrollspy
window.onload = function () {
    // 检查 scrollSpy 函数是否已定义
    if (typeof scrollSpy === 'undefined') {
        console.error('scrollSpy 函数未定义，请确保 simple-scrollspy.min.js 已正确加载');
        return;
    }

    try {
        scrollSpy('#toc', {
            sectionClass: 'h2,h3,h4',
            menuActiveTarget: '#toc a', // 简化选择器
            offset: 120,
            smoothScroll: true,
            smoothScrollBehavior: function (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
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
                }
            }
        });
    } catch (error) {
        console.error('初始化 scrollSpy 时出错:', error);
    }
}


