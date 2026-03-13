# css
### 内联关键CSS
对于页面首屏（above-the-fold）所需的最小CSS，您可以将其直接内联到HTML中。这样可以避免额外的网络请求，让浏览器更快地渲染首屏内容。
### 异步加载非关键CSS
对于那些不是首屏立即需要的CSS，可以使用下列异步加载方式，或者使用 JavaScript 动态加载。
```html
<link rel="preload" as="style" href="/css/non-critical.css" onload="this.onload=null;this.rel='stylesheet'">
```
```html
<link rel="preload" href="bundle.css" as="style">  <!-- 预加载：告诉浏览器提前下载 -->
<link rel="stylesheet" href="bundle.css" media="print" onload="this.media='all'">  <!-- 异步加载：不阻塞渲染 -->
```
### 拆分CSS文件
将大的CSS文件拆分成更小的文件，每个文件只包含特定部分（例如，特定页面或组件）所需的样式。这样，浏览器只需要下载和解析当前页面所需的CSS。
### 媒体查询
使用媒体查询 `(<link rel="stylesheet" media="...">)` 来标记只适用于特定设备或条件（例如打印样式）的CSS，这样浏览器就不会在不适用的情况下阻塞渲染。
### CSS压缩和优化
确保您的CSS文件经过了压缩和优化，移除了不必要的空格、注释和重复的样式，以减小文件大小。


## JS
### 优化 JavaScript 执行
识别并分解长时间任务，通常，长时间任务是由于执行了复杂的 JavaScript 代码。尝试将这些长任务分解成更小的、异步的任务，或者利用 requestIdleCallback 等 API 在浏览器空闲时执行低优先级工作，避免阻塞主线程。
### 减少主线程上的 JavaScript 执行时间：
- 延迟加载非关键 JavaScript：将那些在页面首次渲染时不需要的 JavaScript 代码标记为 defer 或 async，或者通过动态导入（dynamic import）的方式按需加载。
- 优化 JavaScript 代码效率：检查代码中是否有循环迭代次数过多、DOM 操作频繁或计算密集型的任务。
- 减少第三方脚本的影响：根据 ThirdParties 洞察，您的页面中存在第三方脚本。考虑延迟加载它们，或者仅加载对首次渲染至关重要的脚本。


## 1. 处理长时间任务（Long Task）

针对耗时的长时间任务，核心优化方向如下：

### 1.1 分解任务

将该长任务拆分为多个小任务：

- 若为计算密集型任务，使用 `requestIdleCallback` 或 `setTimeout` 拆分执行，利用浏览器空闲时段完成，避免阻塞主线程。

### 1.2 异步化操作

将非关键 JavaScript 操作转为异步执行：

- 使用 `async/await` 语法优化异步逻辑；
- 对于独立的计算任务，可使用 Web Workers 脱离主线程执行，彻底避免阻塞。

### 下一步分析

需查看该长任务的详细调用树，定位具体耗时代码段。

## 2. 优化渲染相关活动

主线程耗时占比中，渲染类操作占用大量时间：

- Layout（布局）：358 毫秒（自用时间）
- Paint（绘制）：212 毫秒（自用时间）
- Layerize（分层）：161 毫秒（自用时间）
- Recalculate style（样式重计算）：124 毫秒（自用时间）

### 2.1 减少不必要的布局和样式计算

1. 避免强制同步布局 / 重排（Layout Thrashing）：

   - 禁止在 JavaScript 循环中交替读写 DOM 布局属性（如 `offsetHeight`、`offsetWidth`、`getComputedStyle`），此类操作会强制浏览器每次迭代都重新计算布局，大幅增加耗时。

   

2. 简化 CSS 选择器和规则：

   - 复杂的 CSS 选择器（如多层嵌套、通配符）和庞大的样式表会增加浏览器样式计算的开销，建议精简选择器层级、合并重复规则。

   

3. 使用 CSS Containment：

   - 对大型 / 复杂组件添加 `contain` CSS 属性（如 `contain: layout paint;`），限制浏览器布局和样式计算的范围，仅针对组件内部更新，避免全局重计算。

   

### 2.2 优化绘制和合成

1. 提升元素到单独的合成层：

   - 对动画 / 频繁变化的元素，优先使用 `transform` 或 `opacity` 属性（仅触发合成层更新），而非 `top`/`left` 等触发布局的属性，减少绘制范围。

   

2. 动画属性避坑：

   - 禁止在动画中使用会触发布局（Layout）或绘制（Paint）的属性，仅使用合成层属性完成动画。

   

## 3. 减少 JavaScript 对主线程的阻塞

即使 LCP（最大内容绘制）元素为文本，主线程被 JavaScript 阻塞也会导致 LCP 延迟，优化建议：

### 3.1 延迟加载非关键 JavaScript

- 审查所有脚本文件，将 LCP 渲染非必需的脚本标记为 `defer` 或 `async`；
- 或在 `DOMContentLoaded` 事件触发后动态加载非关键脚本。

### 3.2 优化第三方脚本

- 第三方汇总显示 `localhost` 来源脚本占用 176 毫秒主线程时间，需确认该脚本归属（自研 / 第三方库）；
- 对非 LCP 必需的第三方脚本，采用延迟加载 / 按需加载策略。

### 3.3 代码分割（Code Splitting）

- 将大型 JavaScript 包拆分为更小的代码块，仅按需加载当前页面所需模块，减少初始加载时主线程的处理压力。

## 整体下一步建议

1. 深入分析长时间任务（[Long task](#r-28794)）的调用栈，定位核心耗时逻辑；
2. 排查导致布局、样式计算、绘制耗时过高的具体代码段；
3. 针对上述两点输出具体的代码级优化方案。

------

### 总结

1. 核心优化方向：拆分长任务（异步 / 空闲执行）、减少渲染层开销（避免布局抖动 / 简化 CSS / 优化动画）、降低 JS 主线程阻塞（延迟加载 / 代码分割）；
2. 关键分析步骤：定位长任务具体耗时代码、排查渲染耗时的核心原因；
3. 实操建议：优先使用不触发重排 / 重绘的属性（transform/opacity）、合理利用异步 API（requestIdleCallback/Web Workers）、精简 CSS/JS 体积。