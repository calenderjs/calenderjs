# CalenderJS Task Tracking

> **当前里程碑**: M4 - DSL 集成  
> **最后更新**: 2026-08-02

## 当前 Sprint: DSL 集成

### 阶段 1: `extra` → `data` 全局重命名 (P1 前置) — **已完成**

| # | 任务 | 状态 | 文件 |
|---|------|------|------|
| 1 | 重命名 Event.extra → Event.data | Done | `packages/event-model/src/Event.ts` |
| 2 | 更新 EVENT_BASE_SCHEMA 中的 extra → data | Done | `packages/event-model/src/validator.ts` |
| 3 | 更新 EventValidator 中 validateExtra → validateData | Done | `packages/event-model/src/validator.ts` |
| 4 | 更新 EventTypeDataModel.extraSchema → dataSchema | Done | `packages/event-model/src/EventTypeDataModel.ts` |
| 5 | 更新 event-dsl 编译器输出 | Done | `packages/event-dsl/src/compiler.ts` |
| 6 | 更新 event-runtime 字段访问路径 | Done | `packages/event-runtime/src/EventRuntime.ts` |
| 7 | 更新 Calendar 组件（如有引用） | Done | `packages/calendar/src/views/` |
| 8 | 更新 React demo | Done | `demos/react/` |
| 9 | 运行全量测试确认无回归 | Done | `pnpm test` |

### 阶段 2: Calendar EventRuntime 集成 (RFC-0005 M4) — **已完成**

| # | 任务 | 状态 | 文件 |
|---|------|------|------|
| 1 | Calendar 添加 eventRuntime property (getter/setter) | Done | `packages/calendar/src/Calendar.wsx` |
| 2 | 渲染集成：有 runtime 时 runtime.render() 增强 | Done | `displayEvents` + views |
| 3 | 验证集成：创建/更新前 runtime.validate() | Done | `validateEventForCreate/Update` |
| 4 | 行为集成：拖拽/编辑/删除前 runtime.canPerform() | Done | `canPerformAction` |
| 5 | 错误事件：event-create-error, event-update-error | Done | `proposeEventCreate/Update` |
| 6 | 添加 EventRuntime 集成测试 | Done | `EventRuntime.integration.test.ts` |
| 7 | 更新 RFC-0005 状态 → Implemented | Pending | `docs/rfc/0005-calendar-component.md` |

### 阶段 3: EventDataGenerator (RFC-0011) — **进行中**

| # | 任务 | 状态 | 文件 |
|---|------|------|------|
| 1 | 实现 EventDataGenerator 类 | Pending | `packages/event-dsl/src/generators/` |
| 2 | 从 DSL 定义生成符合 Event 接口的数据实例 | Pending | — |
| 3 | 添加测试 | Pending | — |
| 4 | 导出到 event-dsl index.ts | Pending | `packages/event-dsl/src/index.ts` |
| 5 | 更新 RFC-0011 状态 → Implemented | Pending | `docs/rfc/0011-*` |

---

## 已完成

### 2026-08-02: Calendar EventRuntime 集成 (RFC-0005 M4)

- [x] `eventRuntime` / `eventDSL` property
- [x] `displayEvents` 渲染增强
- [x] `validateEventForCreate/Update`, `canPerformAction`, `proposeEvent*`
- [x] 集成测试

### 2026-08-02: `extra` → `data` 全局重命名

- [x] Event.data、dataSchema、validateData 全仓迁移
- [x] Calendar views、React demo、EventRuntime 路径更新
- [x] 全量测试通过

### 2026-03-15: RFC 重写与架构澄清

- [x] 深度审计所有 RFC 与实际实现的差距
- [x] 确认核心架构决策（DSL 驱动、Event vs Appointment、text DSL、`data` 字段、编译/运行时分离）
- [x] 重写 RFC-0002: `Appointment DSL` → `Event DSL`（对齐 PEG.js 语法、AST、编译管线、运行时分离）
- [x] 重写 RFC-0005: `Calendar Appointment Management` → `Calendar Component`（DSL 驱动架构、Event 术语、data 字段）
- [x] 删除旧文件：`0002-appointment-dsl.md`, `0005-calendar-appointment-management.md`
- [x] 更新 ROADMAP.md：新增"关键架构决策"章节，调整里程碑
- [x] RFC-0009 标记为 Superseded by RFC-0005

### RFC-0008: Calendar API 重新设计 (Implemented)

- [x] observedAttributes、onAttributeChanged、events/user getter/setter
- [x] @state 状态管理、子组件委托、事件统一
- [x] 移除 initializeComponent() 冗余初始化
- [x] 移除死代码 handleTimeSlotClick 和 _initialized
- [x] 测试通过：45 passed

### RFC-0013: 修复今天高亮 (Implemented)

- [x] MonthView/DayView/WeekView 今天处理修复
- [x] 移除 isSelected 选中日期状态

### 2026-03-15: 清理杂散文档

- [x] 删除重复文档（DEMO-INSTRUCTIONS.md, DSL-TO-CALENDAR-VERIFICATION.md）
- [x] 创建 wsx-work 技能（.cursor/skills/wsx-work/）

---

## Backlog（按优先级排序）

1. **RFC-0012**: Calendar 插件机制 → 依赖 0005 DSL 集成
2. **RFC-0006**: 文档补全 → site 框架已有，内容待写
3. **RFC-0007**: VS Code 扩展 → Future
4. **RFC-0003**: 多租户服务 → Future Plan
