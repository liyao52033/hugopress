/**
 * 动态刷新“最后活动时间”和“已运行时间”
 * - 月/年采用日历差计算，不使用固定30天
 * - 页面加载时刷新一次
 */

(function () {
  function pad(n) { return n > 9 ? '' + n : '0' + n; }

  // 计算 from -> to 的日历差（年、月），以及毫秒差的天/小时/分钟/秒
  function calcDiff(fromMs, toMs) {
    const from = new Date(fromMs);
    const to = new Date(toMs);

    // 年（日历）差
    let years = to.getFullYear() - from.getFullYear();
    const toMonth = to.getMonth(), fromMonth = from.getMonth();
    const toDay = to.getDate(), fromDay = from.getDate();
    if (toMonth < fromMonth || (toMonth === fromMonth && toDay < fromDay)) {
      years--;
    }

    // 月（日历）差
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (toMonth - fromMonth);
    if (toDay < fromDay) {
      months--;
    }

    const ms = toMs - fromMs;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(ms / 86400000);

    return { years, months, days, hours, minutes, seconds };
  }

  // 相对时间的选择逻辑
  function formatRelative(fromMs, toMs) {
    const d = calcDiff(fromMs, toMs);
    if (d.years >= 1) return d.years + '年前';
    if (d.months >= 1) return d.months + '个月前';
    if (d.days >= 1) return d.days + '天前';
    if (d.hours >= 1) return d.hours + '小时前';
    if (d.minutes >= 1) return d.minutes + '分钟前';
    return '刚刚';
  }

  // k/w 格式化
  function formatWordCount(num) {
    if (typeof num !== 'number' || !isFinite(num)) return '';
    if (num < 1000) return String(num);
    if (num < 1000000) return Math.round(num / 100) / 10 + 'k';
    return Math.round(num / 10000) / 10 + 'w';
  }

  function render() {
    const nowMs = Date.now();

    // 最后活动时间
    document.querySelectorAll('span.badge.bg-success[data-lastmod]').forEach(function (el) {
      const lastmodUnix = parseInt(el.getAttribute('data-lastmod'), 10);
      if (!isNaN(lastmodUnix)) {
        const lastmodMs = lastmodUnix * 1000;
        el.textContent = formatRelative(lastmodMs, nowMs);
      }
    });

    // 已运行时间（显示天数）
    document.querySelectorAll('span.badge.bg-success[data-start]').forEach(function (el) {
      const startUnix = parseInt(el.getAttribute('data-start'), 10);
      if (!isNaN(startUnix)) {
        const startMs = startUnix * 1000;
        const days = Math.floor((nowMs - startMs) / 86400000);
        el.textContent = days >= 0 ? (days + ' 天') : '尚未开始';
      }
    });

    // 覆盖“本站总字数”（若构建阶段已注入）
    var totalEl = document.getElementById('site-total-words');
    if (totalEl && window.SITE_STATS && typeof window.SITE_STATS.totalWordCount === 'number') {
      totalEl.textContent = formatWordCount(window.SITE_STATS.totalWordCount) + ' 字';
    }
  }

  // 初次渲染与定时刷新
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      render();
    });
  } else {
    render();
  }
})();
