/**
 * Responsive Navbar JavaScript
 * Handles mobile navigation interactions for both homepage and docs pages
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Get navbar elements - works for both #topnav and #top-header
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navbar = document.querySelector('.top-header, #topnav');
    
    // Legacy toggle support for older homepage implementation
    const legacyToggle = document.getElementById('isToggle');
    const navigation = document.getElementById('navigation');
    
    // Modern Bootstrap navbar toggle (for both homepage and docs)
    if (navbarToggler && navbarCollapse) {
        
        // Only add click handler if Bootstrap is not available
        if ((typeof bootstrap === 'undefined' || !bootstrap.Collapse) && (typeof window.Collapse === 'undefined')) {
            // Add click handler for navbar toggler (fallback only)
            navbarToggler.addEventListener('click', function(e) {
                e.preventDefault();
                
                const isExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
                
                // Fallback for when Bootstrap is not available
                if (isExpanded) {
                    navbarCollapse.classList.remove('show');
                    navbarToggler.setAttribute('aria-expanded', 'false');
                } else {
                    navbarCollapse.classList.add('show');
                    navbarToggler.setAttribute('aria-expanded', 'true');
                }
            });
        }
      
        // Only add these event listeners if Bootstrap is not available
        if ((typeof bootstrap === 'undefined' || !bootstrap.Collapse) && (typeof window.Collapse === 'undefined')) {
            // Close mobile menu when clicking outside
            document.addEventListener('click', function(e) {
                if (window.innerWidth < 992) {
                    const isClickInsideNav = navbarCollapse.contains(e.target) || navbarToggler.contains(e.target);
                    
                    if (!isClickInsideNav && navbarCollapse.classList.contains('show')) {
                        // Fallback
                        navbarCollapse.classList.remove('show');
                        navbarToggler.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            
            // Handle window resize
            window.addEventListener('resize', function() {
                // Close mobile menu when switching to desktop
                if (window.innerWidth >= 992 && navbarCollapse.classList.contains('show')) {
                    // Fallback
                    navbarCollapse.classList.remove('show');
                    navbarToggler.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Reset dropdown behavior on desktop (for all pages)
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 992) {
                document.querySelectorAll('.navbar-nav .dropdown-menu.show').forEach(function(menu) {
                    menu.classList.remove('show');
                    menu.previousElementSibling.setAttribute('aria-expanded', 'false');
                });
            }
        });
    }
    
    // Legacy toggle function for backward compatibility (homepage)
    if (legacyToggle && navigation) {
        window.toggleMenu = function() {
            const isActive = legacyToggle.classList.contains('active');
            
            if (isActive) {
                legacyToggle.classList.remove('active');
                navigation.classList.remove('show');
            } else {
                legacyToggle.classList.add('active');
                navigation.classList.add('show');
            }
        };
    }
    
    // Smooth scroll adjustment for fixed navbar
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement && navbar) {
                e.preventDefault();
                
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to navbar
    if (navbar) {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add/remove scrolled class for styling
            if (scrollTop > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Handle dropdown menus - only add fallback if Bootstrap is not available
    if ((typeof bootstrap === 'undefined' || !bootstrap.Dropdown) && (typeof window.Dropdown === 'undefined')) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
         
            if (toggle && menu) {
                // Click handler for dropdown toggle (fallback only)
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                    
                    // Close all other dropdowns first
                    document.querySelectorAll('.dropdown-menu.show').forEach(function(otherMenu) {
                        if (otherMenu !== menu) {
                            otherMenu.classList.remove('show');
                            otherMenu.previousElementSibling.setAttribute('aria-expanded', 'false');
                        }
                    });
                    
                    if (isExpanded) {
                        menu.classList.remove('show');
                        toggle.setAttribute('aria-expanded', 'false');
                    } else {
                        menu.classList.add('show');
                        toggle.setAttribute('aria-expanded', 'true');
                    }
                });
            }
        });
        
        // Close dropdowns when clicking outside (fallback only)
        document.addEventListener('click', function(e) {
            const isDropdownClick = e.target.closest('.dropdown');
            if (!isDropdownClick) {
                document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
                    menu.classList.remove('show');
                    const toggle = menu.previousElementSibling;
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
    }
    
    // Desktop hover effect for all pages
    if (window.innerWidth >= 992) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
         
            if (toggle && menu) {
                dropdown.addEventListener('mouseenter', function() {
                    if (window.innerWidth >= 992) {
                        menu.classList.add('show');
                        toggle.setAttribute('aria-expanded', 'true');
                    }
                });
                
                dropdown.addEventListener('mouseleave', function() {
                    if (window.innerWidth >= 992) {
                        menu.classList.remove('show');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
    }
});
