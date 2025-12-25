// ToC Mobile Menu (Bootstrap 5 Dropdown with ScrollSpy)
const scrollArea = document.getElementById('content');
const tocBtn = document.getElementById('toc-dropdown-btn');

// 初始化 ScrollSpy 并挂载到 window.bootstrapScrollSpyInstance
window.bootstrapScrollSpyInstance = new bootstrap.ScrollSpy(document.body, {
    target: '.dropdown-menu',
    offset: 10,
    rootMargin: '0px 0px -25%'
});

// 监听 ScrollSpy 激活事件
scrollArea.addEventListener("activate.bs.scrollspy", function () {
    var currentItem = document.querySelector('.dropdown-menu li > a.active');
    if (currentItem) tocBtn.innerHTML = currentItem.innerHTML;
});

// 监听下拉菜单展开/收起事件
tocBtn.addEventListener('shown.bs.dropdown', event => {
    tocBtn.style.borderBottom = 'none';
    tocBtn.style.borderRadius = '4px 4px 0 0';
});

tocBtn.addEventListener('hidden.bs.dropdown', event => {
    tocBtn.style.borderBottom = '1px solid var(--alert-border-color)';
    tocBtn.style.borderRadius = '4px';
});

function debounce(fn, delay = 100) {
    let timer = 0;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 增强的ScrollSpy重置功能（用于v-if内容更新后）
window.forceResetMobileScrollSpy = function () {
    // 完全销毁现有实例
    if (window.bootstrapScrollSpyInstance) {
        window.bootstrapScrollSpyInstance.dispose();
        window.bootstrapScrollSpyInstance = null;
    }

    // 清除所有活动状态
    document.querySelectorAll('.dropdown-menu li > a.active').forEach(link => {
        link.classList.remove('active');
    });

    // 手动初始化滚动监听器
    setTimeout(() => {

        // 移除之前的滚动监听器，避免重复
        if (window.scrollHandler) {
            window.removeEventListener("scroll", window.scrollHandler);
        }

        // 添加滚动监听器，手动设置当前可见 section 的 active
        window.scrollHandler = function () {
            const links = document.querySelectorAll('.dropdown-menu li > a[href^="#"]');
            let activeLink = null;
            let minDistance = Infinity;
            links.forEach(link => {
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const rect = targetElement.getBoundingClientRect();
                    // 计算元素顶部与视口顶部的距离，取绝对值，选择最近的
                    const distance = Math.abs(rect.top);
                    if (rect.top < 0 && distance < minDistance) {
                        minDistance = distance;
                        activeLink = link;
                    }
                }
            });
            if (activeLink) {
                // 清除所有 active 类
                document.querySelectorAll('.dropdown-menu li > a.active').forEach(a => a.classList.remove('active'));
                // 设置新 active
                activeLink.classList.add('active');
                tocBtn.innerHTML = activeLink.innerHTML;
            }
        };
        window.addEventListener("scroll", debounce(window.scrollHandler));

    }, 50);
}