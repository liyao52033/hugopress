// 小部件轮播控制器（中文注释：用于首页侧边栏友链等支持分页/循环展示的组件）
(function () {
    'use strict';

    class WidgetCarousel {
        constructor(element) {
            this.widget = element;
            this.wrapper = element.querySelector('.tk-carousel-wrapper');
            this.prevBtn = element.querySelector('.tk-carousel-prev');
            this.nextBtn = element.querySelector('.tk-carousel-next');
            this.currentPage = 0;
            this.isAnimating = false; // 中文注释：动画状态标记，防止快速连击
            this.isInitialized = false; // 中文注释：标记是否已初始化，避免首次加载动画

            // 中文注释：优先读取 data-items-per-page，自定义每页显示数量；默认 5
            const dataItemsPerPage = parseInt(element.getAttribute('data-items-per-page'), 10);
            this.itemsPerPage = Number.isFinite(dataItemsPerPage) && dataItemsPerPage > 0 ? dataItemsPerPage : 5;

            // 中文注释：读取是否自动播放以及播放间隔（默认 5000ms）
            const autoPlayAttr = element.getAttribute('data-auto-play');
            this.autoPlay = autoPlayAttr === '' || autoPlayAttr === 'true' || autoPlayAttr === '1';
            const dataInterval = parseInt(element.getAttribute('data-interval'), 10);
            this.autoPlayInterval = Number.isFinite(dataInterval) && dataInterval > 0 ? dataInterval : 5000;
            this.autoPlayTimer = null; // 中文注释：定时器句柄

            if (!this.wrapper) return;

            this.items = Array.from(this.wrapper.children);
            this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);

            // 中文注释：如果总页数不超过 1，隐藏控制按钮并让容器高度自适应（无需分页）
            if (this.totalPages <= 1) {
                if (this.prevBtn && this.nextBtn) {
                    this.prevBtn.style.display = 'none';
                    this.nextBtn.style.display = 'none';
                }
                // 添加 auto-height 类，让容器高度自适应
                this.wrapper.classList.add('auto-height');
                // 仍然显示所有内容
                this.items.forEach(item => { item.style.display = ''; });
                return;
            }

            this.init();
        }

        init() {
            // 中文注释：绑定左右按钮事件，支持循环翻页
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => {
                    this.prev();
                    this.resetAutoPlay(); // 中文注释：用户交互后重置自动播放，避免立即再次翻页
                });
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => {
                    this.next();
                    this.resetAutoPlay(); // 中文注释：用户交互后重置自动播放
                });
            }

            // 中文注释：初始化显示第一页内容（无动画）
            this.showPage(0, false); // 传入 false 表示不执行动画
            this.isInitialized = true; // 标记已初始化

            // 中文注释：自动播放相关事件绑定（鼠标悬停暂停、离开恢复，页面不可见暂停）
            if (this.autoPlay && this.totalPages > 1) {
                // 鼠标悬停暂停
                this.widget.addEventListener('mouseenter', () => this.stopAutoPlay());
                this.widget.addEventListener('mouseleave', () => this.startAutoPlay());

                // 页面可见性变化时暂停/恢复
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                        this.stopAutoPlay();
                    } else {
                        this.startAutoPlay();
                    }
                });

                // 启动自动播放
                this.startAutoPlay();
            }
        }

        showPage(pageIndex, animate = true) {
            // 中文注释：如果正在动画，忽略此次请求
            if (this.isAnimating) {
                return;
            }

            // 中文注释：循环处理页码，越界则回到最后或第一页
            if (pageIndex < 0) {
                pageIndex = this.totalPages - 1;
            } else if (pageIndex >= this.totalPages) {
                pageIndex = 0;
            }

            this.currentPage = pageIndex;
            const startIndex = pageIndex * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;

            // 中文注释：获取当前显示的项和即将显示的项
            const currentItems = this.items.filter(item => item.style.display !== 'none');
            const nextItems = [];
            for (let i = startIndex; i < endIndex && i < this.items.length; i++) {
                nextItems.push(this.items[i]);
            }

            // 中文注释：如果是初始加载或不需要动画，直接显示无动画
            if (!animate || currentItems.length === 0 || !this.isInitialized) {
                this.items.forEach(item => {
                    item.style.display = 'none';
                    item.classList.remove('fade-in', 'fade-out', 'fade-in-prepare', 'animating');
                });
                nextItems.forEach(item => {
                    item.style.display = '';
                });
                return;
            }

            // 中文注释：设置动画状态
            this.isAnimating = true;

            // 中文注释：第一步 - 批量读取所有高度（避免强制重排）
            // 先一次性读取所有几何属性，再统一写入样式
            const heights = currentItems.map(item => item.offsetHeight);

            // 中文注释：第二步 - 为旧元素添加 animating 类和定位
            currentItems.forEach((item, index) => {
                item.classList.add('animating');
                // 中文注释：移除动态宽度设置，让 CSS 的 width: 100% 和 right: 0 自然工作
                // 这样可以避免移动端因像素宽度计算不准确导致的宽度抖动问题
                // item.style.width = `${containerWidth}px`; // 已移除
                // item.style.maxWidth = '100%'; // 已移除，CSS 中已定义

                // 中文注释：使用缓存的高度计算位置（无额外重排）
                let topPosition = 0;
                for (let j = 0; j < index; j++) {
                    topPosition += heights[j] + 10; // 10px gap
                }
                item.style.top = `${topPosition}px`;
            });

            // 中文注释：第三步 - 显示新元素（透明状态）
            nextItems.forEach(item => {
                item.style.display = '';
                item.classList.add('fade-in-prepare');
            });

            // 中文注释：第四步 - 下一帧同时执行淡入淡出
            requestAnimationFrame(() => {
                // 旧元素淡出
                currentItems.forEach(item => {
                    item.classList.add('fade-out');
                });

                // 新元素淡入（带层叠延迟）
                nextItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.remove('fade-in-prepare');
                        item.classList.add('fade-in');
                    }, index * 35); // 每项延迟 35ms
                });
            });

            // 中文注释：第五步 - 动画结束后清理
            const animationDuration = 220 + nextItems.length * 35;
            setTimeout(() => {
                // 隐藏并清理旧元素
                currentItems.forEach(item => {
                    item.style.display = 'none';
                    item.style.top = ''; // 清除 top 属性
                    // 中文注释：不再清理 width 和 maxWidth，因为已不再动态设置
                    item.classList.remove('fade-out', 'fade-in', 'animating');
                });

                // 清除新元素的动画类
                nextItems.forEach(item => {
                    item.classList.remove('fade-in', 'fade-in-prepare');
                });

                this.isAnimating = false; // 中文注释：重置动画状态
            }, animationDuration);
        }

        prev() {
            this.showPage(this.currentPage - 1);
        }

        next() {
            this.showPage(this.currentPage + 1);
        }

        // 中文注释：启动自动播放（按设定间隔调用 next）
        startAutoPlay() {
            if (!this.autoPlay || this.totalPages <= 1) return;
            if (this.autoPlayTimer) return; // 已在播放则不重复启动
            this.autoPlayTimer = setInterval(() => {
                this.next();
            }, this.autoPlayInterval);
        }

        // 中文注释：停止自动播放
        stopAutoPlay() {
            if (this.autoPlayTimer) {
                clearInterval(this.autoPlayTimer);
                this.autoPlayTimer = null;
            }
        }

        // 中文注释：重置自动播放（用于用户点击或其他交互后）
        resetAutoPlay() {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    // 中文注释：初始化页面中的所有 data-carousel 轮播组件
    document.addEventListener('DOMContentLoaded', function () {
        const carouselWidgets = document.querySelectorAll('[data-carousel]');

        carouselWidgets.forEach(widget => {
            new WidgetCarousel(widget);
        });
    });
})();