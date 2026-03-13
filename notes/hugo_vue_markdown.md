# Hugo + Vue 多组件示例

本文档演示如何在 Hugo 中使用 Vue 3 UMD，全局初始化 Vue 环境，并通过拆分 Partial 使用多个组件，无需 import `ref` 或 `createApp`。

## 1. 全局 Vue 初始化 Partial

在 `layouts/partials/vue/init.html` 中写好以下公共 Vue 脚本，`baseof.html` 文件里引入 `init.html`

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script>
// 全局 Vue 对象已经包含 createApp、ref、computed 等 API
window.__hugoVueApps = window.__hugoVueApps || {};
window.__hugoGlobalComponents = {};

// 注册组件函数
function registerComponent(name, definition) {
  window.__hugoGlobalComponents[name] = definition;
}

// 挂载组件函数
function mountVueComponent(containerId, componentName, props = {}) {
  const comp = window.__hugoGlobalComponents[componentName];
  if (!comp) return console.warn("组件未注册:", componentName);
  const app = Vue.createApp(comp, props);
  app.mount(`#${containerId}`);
  window.__hugoVueApps[containerId] = app;
}
</script>
```

## 2. Vue 组件 Partial 示例

### 2.1 计数器组件 Partial (`layouts/partials/vue/counter.html`)

```html
<div id="counter-{{ .UniqueID }}">
  <my-counter msg="{{ .Title }}"></my-counter>
</div>

<script>
registerComponent('my-counter', {
  props: ['msg'],
  setup(props) {
    const count = Vue.ref(0);
    const double = Vue.computed(() => count.value * 2);
    function increment() { count.value++; }
    function decrement() { count.value--; }
    return { count, double, increment, decrement, props };
  },
  template: `
    <div style="border:1px solid #ccc;padding:8px;margin:6px;border-radius:6px;">
      <p>{{ props.msg }}</p>
      <p>当前值: {{ count }} | 双倍: {{ double }}</p>
      <button @click="increment">加一</button>
      <button @click="decrement">减一</button>
    </div>
  `
});

mountVueComponent("counter-{{ .UniqueID }}", "my-counter", { msg: "{{ .Title }}" });
</script>
```

### 2.2 问候组件 Partial (`layouts/partials/vue/hello.html`)

```html
<div id="hello-{{ .UniqueID }}">
  <hello-box msg="欢迎来到 Hugo + Vue"></hello-box>
</div>

<script>
registerComponent('hello-box', {
  props: ['msg'],
  setup(props) { return { props }; },
  template: `<div style="padding:6px;border:1px solid #999;border-radius:4px;margin:5px">{{ props.msg }}</div>`
});

mountVueComponent("hello-{{ .UniqueID }}", "hello-box", { msg: "欢迎来到 Hugo + Vue" });
</script>
```

## 3. Markdown 文件使用示例

```markdown
---
title: "Hugo + Vue UMD Markdown 示例"
date: 2025-09-16T19:00:00+08:00
---

# Hugo + Vue Markdown 使用示例

<!-- 全局 Vue 初始化 -->
{{ partial "vue/init.html" . }}

## 计数器组件
{{ partial "vue/counter.html" . }}

## 问候组件
{{ partial "vue/hello.html" . }}
```

------

## 4. Hugo 目录结构示例

```
layouts/
├─ _default/
│  └─ baseof.html       # 可全局引入 init.html
├─ partials/
│  └─ vue/
│     ├─ init.html      # 全局 Vue 初始化
│     ├─ counter.html   # 计数器组件 Partial
│     └─ hello.html     # 问候组件 Partial
content/
└─ posts/
   └─ demo.md           # 使用 Vue Partial 的 Markdown
```

------

✅ 特点：

1. 使用 Vue 3 UMD，无需 import `ref`、`computed`、`createApp`
2. 每个组件拆分 Partial，便于维护和复用
3. Markdown 文件只需调用 Partial 即可
4. 全局 Vue 脚本只需加载一次
