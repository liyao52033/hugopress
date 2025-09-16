Bootstrap 提供了多种预定义的按钮类型（主题样式），用于在不同场景下传递不同的语义和视觉效果。以下是 Bootstrap 5 中的主要按钮类型及其用途：
1. 主要按钮（Primary）
类名：btn-primary
特点：蓝色背景，用于强调主要操作（如 “提交”“确认”），是页面中最醒目的按钮类型。
示例：
html
预览
<button class="btn btn-primary">主要按钮</button>

2. 次要按钮（Secondary）
类名：btn-secondary
特点：灰色背景，用于次要操作，视觉优先级低于 primary，不抢眼但明确可点击。
示例：
html
预览
<button class="btn btn-secondary">次要按钮</button>

3. 成功按钮（Success）
类名：btn-success
特点：绿色背景，用于表示操作成功或正向结果（如 “保存成功”“完成”）。
示例：
html
预览
<button class="btn btn-success">成功按钮</button>

4. 危险 / 警告按钮（Danger）
类名：btn-danger
特点：红色背景，用于危险或不可逆操作（如 “删除”“取消”），提醒用户注意。
示例：
html
预览
<button class="btn btn-danger">删除</button>

5. 警告按钮（Warning）
类名：btn-warning
特点：黄色 / 橙色背景，用于需要用户注意的操作（如 “确认修改”“即将过期”）。
示例：
html
预览
<button class="btn btn-warning">警告按钮</button>

6. 信息按钮（Info）
类名：btn-info
特点：浅蓝色背景，用于提供信息或辅助操作（如 “查看详情”“帮助”）。
示例：
html
预览
<button class="btn btn-info">查看详情</button>

7. 浅色按钮（Light）
类名：btn-light
特点：浅灰色背景，适用于浅色背景下的操作，视觉对比较弱但保持可识别性。
示例：
html
预览
<button class="btn btn-light">浅色按钮</button>

8. 深色按钮（Dark）
类名：btn-dark
特点：深灰色 / 近黑色背景，适用于深色背景下的操作，或需要突出但不抢主按钮风头的场景。
示例：
html
预览
<button class="btn btn-dark">深色按钮</button>

9. 链接样式按钮（Link）
类名：btn-link
特点：无背景和边框，样式类似普通文本链接，但保持按钮的交互特性（如点击反馈、尺寸一致性）。
示例：
html
预览
<button class="btn btn-link">链接样式按钮</button>

通用说明：
所有按钮必须包含基础类 btn，否则不会应用 Bootstrap 按钮样式。
按钮类型可与尺寸类（如 btn-sm 小按钮、btn-lg 大按钮）结合使用，例如：btn btn-primary btn-lg。
支持 <button> 标签和 <a> 标签（用于链接），例如：<a href="#" class="btn btn-success">跳转链接</a>。

通过选择合适的按钮类型，可增强页面的语义化和用户体验，让用户直观理解操作的含义和重要性。