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

// Initialize back-to-top functionality
document.addEventListener('DOMContentLoaded', function () {
    backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        // Add click event listener
        backToTopButton.addEventListener('click', topFunction);

        // Add throttled scroll event listener
        const throttledToggle = throttle(toggleBackToTopButton, 100);
        window.addEventListener('scroll', throttledToggle);

        // Initialize on page load
        toggleBackToTopButton();
    }
});
