/* Template Name: LotusLabs Docs
   Author: Colin Wilson
   E-mail: colin@aigis.uk
   Created: October 2022
   Version: 1.0.0
   File Description: Main JS file of the docs template
*/


/*********************************/
/*         INDEX                 */
/*================================
 *     01.  Toggle Menus         *
 *     02.  Active Menu          *
 *     03.  Clickable Menu       *
 *     04.  Back to top          *
 *     05.  DD Menu              *
 *     06.  Active Sidebar Menu  *
 *     07.  ScrollSpy            *
 ================================*/


// Menu
// Toggle menu
function toggleMenu() {
    document.getElementById('isToggle').classList.toggle('open');
    var isOpen = document.getElementById('navigation')
    if (isOpen.style.display === "block") {
        isOpen.style.display = "none";
    } else {
        isOpen.style.display = "block";
    }
};

// Menu Active
function getClosest(elem, selector) {

    // Element.matches() polyfill
    if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function (s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            };
    }

    // Get the closest matching element
    for (; elem && elem !== document; elem = elem.parentNode) {
        if (elem.matches(selector)) return elem;
    }
    return null;

};

function activateMenu() {
    var menuItems = document.getElementsByClassName("sub-menu-item");
    if (menuItems) {

        var matchingMenuItem = null;
        for (var idx = 0; idx < menuItems.length; idx++) {
            if (menuItems[idx].href === window.location.href) {
                matchingMenuItem = menuItems[idx];
            }
        }

        if (matchingMenuItem) {
            matchingMenuItem.classList.add('active');
            var immediateParent = getClosest(matchingMenuItem, 'li');
            if (immediateParent) {
                immediateParent.classList.add('active');
            }

            var parent = getClosest(matchingMenuItem, '.parent-menu-item');
            if (parent) {
                parent.classList.add('active');
                var parentMenuitem = parent.querySelector('.menu-item');
                if (parentMenuitem) {
                    parentMenuitem.classList.add('active');
                }
                var parentOfParent = getClosest(parent, '.parent-parent-menu-item');
                if (parentOfParent) {
                    parentOfParent.classList.add('active');
                }
            } else {
                var parentOfParent = getClosest(matchingMenuItem, '.parent-parent-menu-item');
                if (parentOfParent) {
                    parentOfParent.classList.add('active');
                }
            }
        }
    }
}


// Sidebar Menu
function activateSidebarMenu() {
    var currentPath = location.pathname;
    var currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    if (document.getElementById("sidebar")) {
        var menuItems = document.querySelectorAll('#sidebar button[href]');
        var foundMatch = false;
        
        // 首先尝试匹配完整路径（frontmatter.url）
        for (var i = 0, len = menuItems.length; i < len; i++) {
            var href = menuItems[i].getAttribute("href");
            if (href === currentPath) {
                activateMenuItem(menuItems[i]);
                foundMatch = true;
                break;
            }
        }
        
        // 如果没有找到完整路径匹配，尝试匹配文件名
        if (!foundMatch && currentFile !== "") {
            for (var i = 0, len = menuItems.length; i < len; i++) {
                var href = menuItems[i].getAttribute("href");
                if (href.indexOf(currentFile) !== -1) {
                    activateMenuItem(menuItems[i]);
                    break;
                }
            }
        }
    }
}

function activateMenuItem(menuItem) {
    menuItem.parentElement.className += " active";
    if (menuItem.closest(".sidebar-submenu")) {
        menuItem.closest(".sidebar-submenu").classList.add("d-block");
    }
    if (menuItem.closest(".sidebar-dropdown")) {
        menuItem.closest(".sidebar-dropdown").classList.add("active");
    }
}

if (document.getElementById("close-sidebar")) {
    document.getElementById("close-sidebar").addEventListener("click", function () {
        document.getElementsByClassName("page-wrapper")[0].classList.toggle("toggled");
    });
}

 // Close Sidebar (mobile)
if (!window.matchMedia('(min-width: 1024px)').matches) {
    if (document.getElementById("close-sidebar")) {
        const closeSidebar = document.getElementById("close-sidebar");
        const sidebar = document.getElementById("sidebar");
        // 仅在初始为移动端时选择链接集合
        const sidebarMenuLinks = Array.from(document.querySelectorAll(".sidebar-root-link,.sidebar-nested-link"));
        // 点击空白区域关闭（仅移动端）
        document.addEventListener('click', function(elem) {
            if (!closeSidebar.contains(elem.target) && !sidebar.contains(elem.target)) {
                document.getElementsByClassName("page-wrapper")[0].classList.add("toggled");
            }
        });
        // 点击侧栏链接后关闭：再次校验视口，防止桌面端误触发
        sidebarMenuLinks.forEach(menuLink => {
            menuLink.addEventListener("click", function (ev) {
                // 只有在当前为移动端时才折叠
                const isMobileNow = !window.matchMedia('(min-width: 1024px)').matches;
                if (isMobileNow) {
                    document.getElementsByClassName("page-wrapper")[0].classList.add("toggled");
                }
            }, { passive: true });
        });
    }
} else {
    // 如果进入页面时是桌面端，不为链接绑定折叠逻辑，确保点击不会折叠
}

// Clickable Menu
if (document.getElementById("navigation")) {
    var elements = document.getElementById("navigation").getElementsByTagName("a");
    for (var i = 0, len = elements.length; i < len; i++) {
        elements[i].onclick = function (elem) {
            if (elem.target.getAttribute("href") === "javascript:void(0)") {
                var submenu = elem.target.nextElementSibling.nextElementSibling;
                submenu.classList.toggle('open');
            }
        }
    }
}

if (document.getElementById("sidebar")) {
    var elements = document.getElementById("sidebar").getElementsByTagName("button");
    for (var i = 0, len = elements.length; i < len; i++) {
        elements[i].onclick = function (elem) {
            // 只处理没有href或href为javascript:void(0)的按钮（折叠/展开按钮）
            var href = elem.target.getAttribute("href");
            if (!href || href === "javascript:void(0)") {
                elem.target.parentElement.classList.toggle("active");
                elem.target.nextElementSibling.classList.toggle("d-block");
            }
            // 对于有实际链接的按钮，让浏览器正常处理导航
        }
    }
}

// Menu sticky
function windowScroll() {
    var navbar = document.getElementById("topnav");
    if (navbar === null) {

    } else if (document.body.scrollTop >= 50 ||
        document.documentElement.scrollTop >= 50) {
        navbar.classList.add("nav-sticky");
    } else {
        navbar.classList.remove("nav-sticky");
    }
}

window.addEventListener('scroll', (ev) => {
    ev.preventDefault();
    windowScroll();
})

// back-to-top
var mybutton = document.getElementById("back-to-top");
window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (mybutton != null) {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
            mybutton.style.display = "block";
        } else {
            mybutton.style.display = "none";
        }
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

// dd-menu
if (document.getElementsByClassName("dd-menu")) {
    var ddmenu = document.getElementsByClassName("dd-menu");
    for (var i = 0, len = ddmenu.length; i < len; i++) {
        ddmenu[i].onclick = function (elem) {
            elem.stopPropagation();
        }
    }
}

// Active Sidebar - 使用修改后的函数
activateSidebarMenu();

// Last Modified Date of current page (relative time format)
if (document.getElementById("relativetime")) {
    dayjs.extend(window.dayjs_plugin_relativeTime);
    const modId = document.getElementById('relativetime');
    let modAgo = dayjs(modId.getAttribute('data-authdate')).fromNow();
    document.getElementById("relativetime").innerHTML = modAgo;
};

// Initialize Bootstrap Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl))

/**
 * Sanitize and encode all HTML in a user-submitted string
 * https://portswigger.net/web-security/cross-site-scripting/preventing
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
var sanitizeHTML = function (str) {
	return str.replace(/[^\w. ]/gi, function (c) {
		return '&#' + c.charCodeAt(0) + ';';
	});
};
