// // //ScrollSpy - via https://github.com/kimyvgy/simple-scrollspy
window.onload = function () {
    scrollSpy('toc', {
        sectionClass: 'h2,h3,h4',
      //  menuActiveTarget: 'href',
        offset: 100, // 与导航栏高度匹配
        // scrollContainer: null,
        // smooth scroll
        smoothScroll: true,
        // smoothScrollBehavior: function(element) {
        //   //  console.log('run "smoothScrollBehavior"...', element)
        //     element.scrollIntoView({ behavior: 'smooth' })
        // }
    });

    // Update browser address bar with the current section's hash
    const sections = document.querySelectorAll('h2, h3, h4');
    const updateHash = () => {
        let currentSection = null;
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom > 100) {
                currentSection = section;
            }
        });
        if (currentSection && currentSection.id) {
            history.replaceState(null, null, `#${currentSection.id}`);
        }
    };

    window.addEventListener('scroll', updateHash);

    // 处理新标签页直接打开锚点的场景
    const initialHash = window.location.hash;
    if (initialHash) {
        const targetId = initialHash.slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // 手动补偿导航栏高度
            // 强制调整位置（考虑 offset）
            setTimeout(() => {
                const rect = targetElement.getBoundingClientRect();
                window.scrollBy(0, rect.top - 100); // 减去 offset
            }, 100); // 延迟确保滚动完成
        }
    }
    
};
