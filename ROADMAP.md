# CalenderJS Roadmap

> **最后更新**: 2026-03-15

## RFC 状态总览

| RFC | 标题 | 状态 | 优先级 | 备注 |
|-----|------|------|--------|------|
| 0002 | Event DSL | **Implemented** (核心) / In Progress (集成) | — | PEG.js 语法、编译器、生成器已实现；`extra`→`data` 重命名和 EventDataGenerator 待完成 |
| 0005 | Calendar Component | **In Progress** | **P1** | 基础渲染已完成；DSL 驱动集成（EventRuntime）待实现 |
| 0004 | React Package & Demo | **Implemented** | — | @calenderjs/react + demos/react |
| 0009 | Calendar Component (数据驱动) | **Superseded by 0005** | — | 纯数据驱动设计已落地，0005 在此基础上增加 DSL 驱动 |
| 0010 | Week View 布局修复 | **Implemented** | — | Google Calendar 风格布局 |
| 0013 | 修复今天高亮显示 | **Implemented** | — | MonthView/DayView/WeekView |
| 0008 | Calendar API 重新设计 | **Implemented** | — | 属性/状态分层、observedAttributes、getter/setter |
| 0011 | Event 数据模型与 DSL 集成 | Draft | **P1** | `extra`→`data` 重命名、EventDataGenerator、架构澄清 |
| 0012 | Calendar 插件机制 | Draft | **P2** | 依赖 0005/0011；按 Event.type 注册渲染器 |
| 0006 | Documentation & Examples | Draft | **P3** | site 已有基础框架，文档内容待补全 |
| 0007 | VS Code Extension & Online Editor | Draft | **P4** | 未来特性 |
| 0003 | Multi-Tenant Service | Future Plan | **P5** | 后端服务，暂不启动 |

## 关键架构决策（2026-03-15 确认）

| 决策 | 选择 | 说明 |
|------|------|------|
| Calendar 与 DSL 关系 | **DSL 驱动** | Calendar 接受 EventRuntime，用于增强渲染/验证/行为；无 runtime 时降级 |
| Event vs Appointment | **Appointment 是业务概念，Event 是技术模型** | DSL 定义业务类型，编译后生成符合 Event 接口的数据 |
| DSL 形态 | **文本 DSL** | PEG.js 解析文本语法为 AST，TypeScript 对象是 AST 内存表示 |
| 扩展数据字段 | **`data`**（替代 `extra`） | Event.data 存放 DSL 定义的业务字段，语义更准确 |
| event-dsl vs event-runtime | **编译时 vs 运行时分离** | event-dsl 是开发时工具，event-runtime 是生产依赖，tree-shaking 友好 |
| 过时 RFC 处理 | **重写更新** | RFC-0002/0005 已重写对齐当前架构 |

## 里程碑

### M1: 核心组件 (Completed)

- [x] RFC-0005 基础渲染（DayView/WeekView/MonthView）
- [x] RFC-0002: Event DSL（语法、编译器、运行时）
- [x] RFC-0010: WeekView 布局修复
- [x] RFC-0013: 今天高亮修复

### M2: React 集成 (Completed)

- [x] RFC-0004: @calenderjs/react 包 + React Demo

### M3: API 稳定化 (Completed)

- [x] RFC-0008: Calendar API 重新设计

### M4: DSL 集成 (Current - P1)

- [ ] `extra` → `data` 全局重命名（RFC-0011 前置）
- [ ] RFC-0005 M4: Calendar 接受 EventRuntime property
- [ ] DSL 驱动渲染/验证/行为
- [ ] EventDataGenerator 实现

### M5: 插件生态

- [ ] RFC-0012: Calendar 插件机制

### M6: 文档与工具

- [ ] RFC-0006: 完整文档体系
- [ ] RFC-0007: VS Code 扩展

### M7: 服务化 (Future)

- [ ] RFC-0003: 多租户日历服务

## 已实现的包

| 包 | 状态 | 说明 |
|----|------|------|
| `@calenderjs/core` | Implemented | 核心模型、上下文、工具函数 |
| `@calenderjs/calendar` | Implemented (基础) | WSX 日历组件（月/周/日视图），DSL 集成待完成 |
| `@calenderjs/event-model` | Implemented | Event 接口 SSOT、验证器、JSON Schema |
| `@calenderjs/event-dsl` | Implemented | PEG.js 语法、解析器、编译器、生成器 |
| `@calenderjs/event-runtime` | Implemented | EventRuntime：验证、渲染、权限 |
| `@calenderjs/date-time` | Implemented | 日期时间工具函数 |
| `@calenderjs/react` | Implemented | React 封装（Calendar、EventEditor） |
| `@calenderjs/monaco-event-dsl` | Implemented | Monaco Editor DSL 集成 |
| `site/` | Implemented | WSX 官网（i18n、路由、文档） |
| `demos/react/` | Implemented | React Demo（DSL 编辑器 + Calendar） |
