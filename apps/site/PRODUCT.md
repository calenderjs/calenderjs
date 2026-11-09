# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

前端开发者，处于"评估是否在自己项目里采用 CalenderJS"的阶段。来官网的核心任务：看能力演示、判断能不能满足需求、决定要不要接入，然后走 quick start 或 docs 完成集成。不是普通终端用户或非技术决策者。

## Product Purpose

CalenderJS 是基于 Web Components 的日历组件库，配套 Event DSL（声明式文本语法）定义事件类型、校验规则、权限行为，多视图（月/周/日）展示。官网的成功 = 访客能在几分钟内判断"这个库适不适合我"，并顺利走到 quick start 或 demo。

## Positioning

两个同等重要、互相独立的差异点，不能只强调一个：

1. **Event DSL 声明式校验/权限** — 文本 DSL 定义事件类型、字段校验规则、`editable`/`canPerform` 等权限门，这是 FullCalendar、react-big-calendar 等同类库没有的能力。
2. **原生 Web Components，框架无关** — `<wsx-calendar>` 不绑定 React/Vue，可直接用；现有的 React 封装（`@calenderjs/react`）只是薄封装层，不是必须依赖。

## Operating Context

- 多语言站点（zh/en），通过 i18next 驱动，`public/locales/{en,zh}/*.json`。
- 文档站用 `@wsxjs/wsx-press` 从 Markdown 生成（`public/docs/`），非本次重设范围（内容结构不变，只重设视觉外壳）。
- 内嵌 `<wsx-calendar>` 实时演示（`/demos` 路由），用真实组件渲染，不是截图/视频。
- 路由：`/`（Home）、`/features`、`/docs/:category/:page`、`/demos`，hash 或 history 模式由 `wsx-router` 决定（当前 `mode="hash"`）。

## Capabilities and Constraints

- Web Component 标签：`wsx-calendar`；主包 `@calenderjs/calendar`。
- 日历组件支持月/周/日视图切换、事件双击/键盘编辑触发（RFC-0039）、`proposeEventUpdate` 权限+校验门（RFC-0035）。
- 技术栈：WSX（`@wsxjs/wsx-core` 的 `.wsx` 文件格式）+ Vite + UnoCSS。不是 React/Vue 项目，重设必须保持 `.wsx` 组件格式，不能引入 React/Vue 写法。
- MIT 协议开源，首页已展示该事实（`MIT` stat item），重设后仍需保留可见的开源信号。

## Brand Commitments

- 品牌名：CalenderJS（注意拼写，不是 Calendar，不要"纠正"成后者）。
- MIT 协议、多语言（zh/en）是明确硬约束，不能在重设中拆除或简化掉。
- 现有事件图标（📅 日历 / 📝 铅笔 / ✓ 对勾，emoji 风格）明确要求替换为更正式的设计图标/插图，不保留 emoji 图标风格。
- 除上述约束外，配色、字体、布局、整体视觉语言都开放重设，没有必须保留的旧视觉元素。

## Evidence on Hand

- 真实可运行的日历组件（`@calenderjs/calendar`），demo 页面内嵌真实渲染，不是伪造的演示素材。
- 无客户案例、无第三方评价、无使用数据——这些都不存在，重设不得编造。
- 现有文案（首页 tagline、features 四条能力描述）是真实产品描述，视为内容真相，保留语义，允许重新措辞以匹配新视觉语言，但不得新增未经确认的功能宣称。

## Product Principles

1. 面向评估者的"能力优先"叙事——视觉和结构都要在几屏内让开发者判断出"这是不是我要的日历库"。
2. DSL 校验能力与框架无关的 Web Components 两点差异化，缺一不可，不能在视觉层面只强调其中一个。
3. 真实组件胜过营销素材——能用 `<wsx-calendar>` 实际渲染演示的地方，不用静态图片或视频替代。
4. 开源/多语言是产品事实的一部分，不是可选装饰，必须在视觉上保持可见、可信。
