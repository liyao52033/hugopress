//Low light switcher
const mode = document.getElementById('mode')

if (mode !== null) {
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const updateBgOpacity = debounce(() => {
        const activeBgItem = document.querySelector('.body-bg-item.active');
        if (activeBgItem) {
            const theme = localStorage.getItem('theme');
            activeBgItem.style.opacity = theme === 'dark' ? 0.3 : 1;
        }
    }, 100);

    const observer = new MutationObserver((mutations, obs) => { 
        const activeBgItem = document.querySelector('.body-bg-item.active');
        if (activeBgItem) {
            updateBgOpacity();
            obs.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            localStorage.setItem('theme', 'dark');
            document.documentElement.setAttribute('data-dark-mode', '');
        } else {
            localStorage.setItem('theme', 'light');
            document.documentElement.removeAttribute('data-dark-mode');
        }
        updateBgOpacity();
    })
    mode.addEventListener('click', () => {
        document.documentElement.toggleAttribute('data-dark-mode');
        localStorage.setItem('theme', document.documentElement.hasAttribute('data-dark-mode') ? 'dark' : 'light');
        updateBgOpacity();
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-dark-mode', '');
    } else {
        document.documentElement.removeAttribute('data-dark-mode');
    }
    updateBgOpacity();
}