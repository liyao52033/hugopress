// assets/js/echarts-entry.js
// 1. 导入ECharts核心模块
import * as echarts from 'echarts/core';

// 2. 导入所需图表（日历+热力图）
import { HeatmapChart } from 'echarts/charts';

// 3. 导入交互组件（仅工具提示）
import {
    TooltipComponent,
    CalendarComponent,
    VisualMapComponent // 热力图依赖visualMap，必须导入
} from 'echarts/components';

// 4. 导入渲染器（Canvas是必选，否则图表空白）
import { CanvasRenderer } from 'echarts/renderers';

// 5. 注册所有用到的模块
echarts.use([
    CalendarComponent,
    HeatmapChart,
    TooltipComponent,
    VisualMapComponent,
    CanvasRenderer
]);

// 6. 挂载到window全局，保持原有代码调用逻辑不变
window.echarts = echarts;