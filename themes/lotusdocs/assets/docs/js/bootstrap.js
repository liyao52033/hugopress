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

window.Collapse = Collapse;
window.Dropdown = Dropdown;
window.Tooltip = Tooltip;

// 初始化所有下拉菜单
document.addEventListener('DOMContentLoaded', function() {
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new Dropdown(dropdownToggleEl));
});
