// 图片点击放大

window.ImageHandler = {
    // 初始化图片处理
    init() {
        // 绑定全局点击事件，处理所有 .zoomable 元素
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('zoomable') ||
                e.target.closest('.zoomable')) {
                const element = e.target.classList.contains('zoomable') ?
                    e.target : e.target.closest('.zoomable');
                this.toggleZoom(element);
            }
        });

        // ESC键关闭放大图片
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeZoom();
            }
        });
    },

    // 图片缩放功能
    toggleZoom(element) {
        // 检查是否已存在遮罩层
        let overlay = document.querySelector('.image-overlay');

        if (overlay) {
            this.closeZoom();
        } else {
            this.openZoom(element);
        }
    },

    // 打开放大图片
    openZoom(element) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';

        // 克隆图片元素
        let clonedElement = this.cloneImageElement(element);

        // 添加点击关闭功能
        overlay.appendChild(clonedElement);
        overlay.onclick = () => this.closeZoom();

        // 添加到页面并激活
        document.body.appendChild(overlay);
        // 强制重绘以确保过渡效果
        overlay.offsetHeight;
        overlay.classList.add('active');
    },

    // 关闭放大图片
    closeZoom() {
        const overlay = document.querySelector('.image-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    },

    // 克隆图片元素
    cloneImageElement(element) {
        if (element.tagName === 'PICTURE') {
            return element.cloneNode(true);
        } else if (element.tagName === 'IMG') {
            const clonedElement = document.createElement('picture');
            const source = element.previousElementSibling;
            if (source && source.tagName === 'SOURCE') {
                clonedElement.appendChild(source.cloneNode(true));
            }
            clonedElement.appendChild(element.cloneNode(true));
            return clonedElement;
        } else if (element.classList.contains('svg-container')) {
            return element.cloneNode(true);
        }
        return element.cloneNode(true);
    },

    // 处理动态添加的图片
    processImages(container) {
        const images = container.querySelectorAll('img:not(.image-processed)');
        images.forEach(img => {
            img.classList.add('image-processed', 'post-image', 'zoomable');
            img.loading = 'lazy';
        });
    }
};

// 全局初始化
window.addEventListener('DOMContentLoaded', () => {
    window.ImageHandler.init();
});