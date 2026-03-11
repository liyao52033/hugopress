// Throttle function to optimize scroll event handling
function throttle(func, delay) {
    let inProgress = false;
    return function () {
        if (!inProgress) {
            func();
            inProgress = true;
            setTimeout(() => {
                inProgress = false;
            }, delay);
        }
    };
}

// Cache DOM element
var backToTopButton = null;

// Back to top functionality
function topFunction() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide back-to-top button based on scroll position
function toggleBackToTopButton() {
    if (backToTopButton) {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }
}

// Initialize back-to-top functionality - 延迟初始化避免强制重排
function initBackToTop() {
    backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        // Add click event listener
        backToTopButton.addEventListener('click', topFunction);

        // Add throttled scroll event listener
        const throttledToggle = throttle(toggleBackToTopButton, 100);
        window.addEventListener('scroll', throttledToggle, { passive: true });

        // Initialize on page load - 使用 RAF 延迟执行
        requestAnimationFrame(toggleBackToTopButton);
    }
}

// 延迟初始化，避免阻塞首次渲染
document.addEventListener('DOMContentLoaded', function () {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(initBackToTop, { timeout: 150 });
    } else {
        setTimeout(initBackToTop, 50);
    }
});
