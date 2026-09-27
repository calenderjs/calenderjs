# CalenderJS Roadmap

> **最后更新**: 2026-09-20

## RFC 状态总览

| RFC  | 标题 | 状态 | 优先级 | 备注 |
| ---- | ---- | ---- | ------ | ---- |
| 0002 | [Event DSL](rfc/completed/0002-event-dsl.md) | **Implemented** | — | standalone 已归档；Calendar/Generator 债分别归 0005/0011 |
| 0005 | [Calendar Component](rfc/0005-calendar-component.md) | **In Progress** | **P1** | 基础渲染完成；跟 0002 之后做 EventRuntime 接线验收 |
| 0004 | [React Package & Demo](rfc/completed/0004-react-demo-site.md) | **Implemented** | — | @calenderjs/react + demos/react |
| 0009 | [Calendar Component (数据驱动)](rfc/completed/0009-calendar-component.md) | **Superseded** | — | 由 RFC-0005 取代；归档 `completed/0009-*` |
| 0010 | [Week View 布局修复](rfc/completed/0010-week-view-layout-fix.md) | **Implemented** | — | Google Calendar 风格布局 |
| 0013 | [修复今天高亮显示](rfc/completed/0013-fix-today-handling.md) | **Implemented** | — | MonthView/DayView/WeekView |
| 0008 | [Calendar API 重新设计](rfc/completed/0008-calendar-component-api-redesign.md) | **Implemented** | — | 属性/状态分层、observedAttributes、getter/setter |
| 0011 | [Event 数据模型与 DSL 集成](rfc/0011-event-data-model-integration.md) | Draft | **P1** | `data` 已落地；剩余 **EventDataGenerator**（跟 0002 关单后） |
| 0012 | [Calendar 插件机制](rfc/0012-calendar-plugin-mechanism.md) | Draft | **P2** | 依赖 0005/0011；按 Event.type 注册渲染器 |
| 0014 | [EventRuntime 时间字段时区语义](rfc/completed/0014-event-runtime-timezone-field-semantics.md) | **Implemented** | **P1** | 显式 IANA 时区解析；未声明时保持 UTC |
| 0015 | [React Demo 浏览器端到端验收](rfc/completed/0015-react-demo-e2e.md) | **Implemented** | **P1** | 归档 `completed/0015-*`；场景 39/39 + demo src 覆盖门禁 |
| 0006 | [Documentation & Examples](rfc/0006-documentation-and-examples.md) | Draft | **P3** | site 已有基础框架，文档内容待补全 |
| 0007 | [VS Code Extension & Online Editor](rfc/0007-vscode-extension-and-online-editor.md) | Draft | **P4** | 未来特性 |
| 0003 | [Multi-Tenant Service](../../site/.spec/rfc/0003-multi-tenant-service.md) | Future Plan | **P5** | **规格已迁至兄弟仓** `../site/.spec/rfc/`；本仓无正文；勿在本仓/`./site` 实现 |

## 关键架构决策（2026-03-15 确认）

| 决策                       | 选择                                         | 说明                                                                  |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Calendar 与 DSL 关系       | **DSL 驱动**                                 | Calendar 接受 EventRuntime，用于增强渲染/验证/行为；无 runtime 时降级 |
| Event vs Appointment       | **Appointment 是业务概念，Event 是技术模型** | DSL 定义业务类型，编译后生成符合 Event 接口的数据                     |
| DSL 形态                   | **文本 DSL**                                 | PEG.js 解析文本语法为 AST，TypeScript 对象是 AST 内存表示             |
| 扩展数据字段               | **`data`**（替代 `extra`）                   | Event.data 存放 DSL 定义的业务字段，语义更准确                        |
| event-dsl vs event-runtime | **编译时 vs 运行时分离**                     | event-dsl 是开发时工具，event-runtime 是生产依赖，tree-shaking 友好   |
| 过时 RFC 处理              | **重写更新**                                 | RFC-0002/0005 已重写对齐当前架构                                      |
| 0002 角色                  | **standalone（非 umbrella）**                | 一号一 concern；集成债由 0005/0011/0012 各自收口，不回灌 0002         |

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

**执行序：先关 0002，再跟 peer 收口（非 umbrella）。**

1. **关 RFC-0002** — **已完成**
   - [x] Acceptance 收窄到：语法 / 编译管线 / Schema·TS 生成 / EventRuntime 契约 / 包测绿
   - [x] 剥除错挂的 Calendar 集成、EventDataGenerator、`extra`→`data`（归 0005/0011）
   - [x] `specify archive 0002` → `rfc/completed/0002-event-dsl.md`
2. **已完成（见证）**
   - [x] RFC-0014: EventRuntime 时间字段时区语义
   - [x] RFC-0015: React Demo 浏览器端到端验收
   - [x] `extra` → `data` 代码落地（TASK 对账 → Done；正式关单在 0011）
3. **跟 0002 之后完成（当前主线）**
   - [ ] RFC-0011: EventDataGenerator + data 契约对账关单
   - [ ] RFC-0005: Calendar EventRuntime 剩余接线验收 → Implemented
4. **不挡 M4 主线**
   - [ ] RFC-0012: 插件机制（M5）

### M5: 插件生态

- [ ] RFC-0012: Calendar 插件机制

### M6: 文档与工具

- [ ] RFC-0006: 完整文档体系
- [ ] RFC-0007: VS Code 扩展

### M7: 服务化 (Future)

- [ ] RFC-0003: 多租户日历服务（规格在 `../site/.spec/rfc/0003-*`，非本仓）

## 已实现的包

| 包                               | 状态               | 说明                                          |
| -------------------------------- | ------------------ | --------------------------------------------- |
| `@calenderjs/core`               | Implemented        | 核心模型、上下文、工具函数                    |
| `@calenderjs/calendar`           | Implemented (基础) | WSX 日历组件（月/周/日视图），DSL 集成待完成  |
| `@calenderjs/event-model`        | Implemented        | Event 接口 SSOT、验证器、JSON Schema          |
| `@calenderjs/event-dsl`          | Implemented        | PEG.js 语法、解析器、编译器、生成器           |
| `@calenderjs/event-runtime`      | Implemented        | EventRuntime：验证、渲染、权限                |
| `@calenderjs/date-time`          | Implemented        | 日期时间工具函数                              |
| `@calenderjs/react`              | Implemented        | React 日历封装（Calendar、ResizableSplitter） |
| `@calenderjs/react-event-editor` | Implemented        | React Event DSL 编辑器（Monaco）              |
| `@calenderjs/monaco-event-dsl`   | Implemented        | Monaco Editor DSL 语言插件                    |
| `site/`                          | Implemented        | WSX 官网（i18n、路由、文档）                  |
| `demos/react/`                   | Implemented        | React Demo（DSL 编辑器 + Calendar）           |
