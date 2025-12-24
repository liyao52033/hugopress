// Import the Bootstrap components we want to use.
// See https://github.com/twbs/bootstrap/blob/main/js/index.umd.js
import Tab from "/js/bootstrap/src/tab";
import Collapse from "/js/bootstrap/src/collapse";
import Dropdown from "/js/bootstrap/src/dropdown";
import ScrollSpy from "js/bootstrap/src/scrollspy";
import Tooltip from "js/bootstrap/src/tooltip";

export default {
    Tab,
    Collapse,
    Dropdown,
    ScrollSpy,
    Tooltip
}

// 将 Bootstrap 组件暴露到全局，但不立即初始化
window.Collapse = Collapse;
window.Dropdown = Dropdown;
window.Tooltip = Tooltip;
window.ScrollSpy = ScrollSpy;

// 确保 bootstrap 对象在全局可用
window.bootstrap = {
    Tab,
    Collapse,
    Dropdown,
    ScrollSpy,
    Tooltip
};

// 按需初始化 Bootstrap 组件
document.addEventListener('DOMContentLoaded', function () {
    // 只在页面上有下拉菜单元素时才初始化 Dropdown
    const dropdownElements = document.querySelectorAll('.dropdown-toggle');
    if (dropdownElements.length > 0) {
        dropdownElements.forEach(dropdownToggleEl => new Dropdown(dropdownToggleEl));
    }

    // 只在页面上有工具提示元素时才初始化 Tooltip
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipElements.length > 0) {
        tooltipElements.forEach(tooltipEl => new Tooltip(tooltipEl));
    }
});
