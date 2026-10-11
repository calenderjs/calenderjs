# RFC-0005: Calendar Component

**Status:** Under Review
**创建日期**: 2024-12-19  
**最后更新**: 2026-09-26
**作者**: WSX Team  
**关联 RFC**: RFC-0002 (Event DSL), RFC-0008 (API Redesign), RFC-0009 (Data-driven Calendar), RFC-0011 (Event Data Model), RFC-0012 (Plugin Mechanism), RFC-0017 (Calendar follow-ons)

## Summary

CalenderJS is designed to render Event DSL definitions directly in the Calendar component. Calendar consumes DSL-defined type rules and applies them to separately supplied `Event[]` records. DSL editing is a separate feature and package; the Calendar package does not include the editor UI.

## Problem

Calendar is designed to work directly with Event DSL for rendering. This does not make Calendar an editor: DSL authoring and Monaco language support remain separate packages. The DSL provides event-type rules; concrete, dated events remain Calendar input data.

## Goals

- Calendar directly parses/compiles supplied Event DSL definitions and renders matching `Event[]` with DSL rules.
- Calendar supports precompiled `EventRuntime` input and plain-data rendering when no DSL definition is supplied.
- DSL editing stays outside `@calenderjs/calendar`; Calendar has no editor UI dependency.

## Acceptance

- Supplying DSL definitions and matching `Event[]` makes Calendar apply DSL display rules to rendered events.
- Supplying multiple event-type definitions applies each definition to events with matching `Event.type`.
- Supplying no DSL definition preserves plain-data rendering.
- Calendar package does not depend on `@calenderjs/react-event-editor` or `@calenderjs/monaco-event-dsl`.
- Property rename and old-name compatibility follow RFC-0024.

## 摘要

设计并实现 `<wsx-calendar>` 组件，一个基于 WSX 框架构建的 DSL 驱动日历组件。组件提供月视图、周视图和日视图三种显示模式，界面设计参考 Google 日历。

**核心架构**：

- **Event DSL 直接渲染**：Calendar 接受事件类型 DSL 定义，在组件内解析/编译，并应用渲染、验证及行为规则。`Event[]` 仍由调用方单独提供。
- **编辑器独立**：DSL 编辑器属于 `@calenderjs/react-event-editor` 与 `@calenderjs/monaco-event-dsl`，不并入 Calendar 包；Calendar 的 DSL 渲染不依赖编辑器 UI。
- **优雅降级**：未提供 EventRuntime 时，Calendar 回退到纯数据驱动模式，使用 Event 核心字段渲染
- **Web Components 标准**：基于 WSX 框架，使用 Custom Elements + Shadow DOM + JSX 语法
- **Event 数据模型**：组件消费 `Event[]` 数据，通过 `Event.type` + `Event.data` 承载 DSL 定义的业务字段

**开源定位**：

- `@calenderjs/calendar`：开源日历组件（MIT 协议）
- 依赖 `@calenderjs/event-model`（Event 数据模型 SSOT）
- 依赖 `@calenderjs/event-dsl` 与 `@calenderjs/event-runtime`，直接编译 DSL 并执行规则
- 不依赖 DSL 编辑器包；调用方可独立选择编辑器

## 术语约定

| 术语                             | 含义                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| **Event**                        | 技术数据模型（`Event { id, type, title, startTime, endTime, data, ... }`） |
| **Appointment / Holiday / Task** | 业务概念，都是 Event 的具体类型（`Event.type = "meeting"` 等）             |
| **EventRuntime**                 | DSL 编译后的运行时实例，提供 validate / render / canPerform                |
| **data**                         | `Event.data: Record<string, any>` — DSL fields 定义的业务数据容器          |

## 动机

在事件管理、日程安排、预约管理等场景中，日历组件是核心需求。现有方案（FullCalendar 等）不基于 Web Components，无法利用 Shadow DOM 隔离，也不支持 DSL 驱动的声明式事件类型系统。本组件通过 WSX 框架 + Event DSL 提供：

- **框架无关**：Web Components 标准，可在 React/Vue/Angular/原生 HTML 中使用
- **业务可配**：通过 DSL 文本声明事件类型、验证规则、显示规则、行为规则
- **零运行时开销**：WSX 在构建时编译 JSX 为原生 DOM 操作

## DSL 渲染与包边界

Calendar 是 Event DSL 的直接消费者：调用方把 DSL 定义交给 Calendar，Calendar 解析/编译定义并把对应规则应用于 `events`。调用方不需要另建应用层编译适配器。

DSL 描述事件类型及其字段、渲染、验证和行为规则；带日期的 `Event` 实例仍通过 `events` 属性单独提供。DSL 本身不代替具体事件数据。

DSL 编辑是另一项功能。`@calenderjs/react-event-editor` 提供 React 编辑器，`@calenderjs/monaco-event-dsl` 提供 Monaco 语言支持；它们不并入、不依赖 `@calenderjs/calendar`。宿主可以同时展示编辑器与 Calendar，但两个包保持独立职责。

Calendar 接受 DSL 文本、单个已解析 AST 或 AST 数组。规范属性名、旧属性兼容和两种输入同时设置时的优先级由 [RFC-0024](completed/0024-rename-event-dsl-property.md) 定义。`eventRuntime` 用于注入预编译的单类型 Runtime，不是编辑器入口。

## 组件 API 设计

### 三层 API

Calendar API 分三层，遵循 Web Components 标准（RFC-0008）：

#### 1. HTML Attributes（简单配置）

```html
<wsx-calendar view="month" date="2026-03-15"></wsx-calendar>
```

| Attribute | 类型                         | 默认值    | 说明              |
| --------- | ---------------------------- | --------- | ----------------- |
| `view`    | `'month' \| 'week' \| 'day'` | `'month'` | 初始/当前视图     |
| `date`    | ISO 8601 字符串              | 当前日期  | 初始/当前显示日期 |

#### 2. JavaScript Properties（复杂数据）

```typescript
const calendar = document.querySelector("wsx-calendar") as Calendar;
calendar.events = events; // Event[] - 事件数据
calendar.user = currentUser; // User - 当前用户
calendar.eventTypeDefinitions = meetingDSL; // DSL 定义；Calendar 直接编译并渲染
```

| Property       | 类型           | 必需 | 说明                            |
| -------------- | -------------- | ---- | ------------------------------- |
| `events`       | `Event[]`      | 是   | 事件列表（数据模型）            |
| `user`         | `User`         | 否   | 当前用户（权限验证用）          |
| `eventTypeDefinitions` | `string \| EventTypeAST \| EventTypeAST[]` | 否 | DSL 事件类型定义；Calendar 直接解析/编译并应用规则；别名兼容见 RFC-0024 |
| `eventRuntime` | `EventRuntime` | 否 | 预编译单类型 Runtime 的注入入口 |

**实现方式**：getter/setter 模式，setter 中处理 JSON string 和 object 两种输入。

#### 3. 内部状态（@state）

```typescript
@state currentView: 'month' | 'week' | 'day' = 'month';
@state currentDate: Date = new Date();
@state private showEventDialog: boolean = false;
@state private editingEvent: Event | undefined = undefined;
@state private showDeleteConfirm: boolean = false;
@state private deletingEvent: Event | undefined = undefined;
```

### 事件系统（CustomEvent）

所有事件使用 `CustomEvent`，`bubbles: true` + `composed: true`（穿透 Shadow DOM）。

| 事件名         | detail 类型                    | 触发时机   |
| -------------- | ------------------------------ | ---------- |
| `date-change`  | `{ date: Date }`               | 日期导航   |
| `view-change`  | `{ view: string }`             | 视图切换   |
| `event-click`  | `{ event: Event }`             | 点击事件块 |
| `event-create` | `{ event: Event }`             | 创建事件   |
| `event-update` | `{ id: string, event: Event }` | 更新事件   |
| `event-delete` | `{ id: string }`               | 删除事件   |

### 公共方法

```typescript
createEvent(data: Partial<Event>): { success: boolean; event?: Event; errors?: string[] }
updateEvent(id: string, data: Partial<Event>): { success: boolean; event?: Event; errors?: string[] }
deleteEvent(id: string): { success: boolean; error?: string }
```

## DSL 驱动架构

### 三种模式

#### 模式 A：直接传入 DSL 定义（主要集成方式）

```typescript
const calendar = document.querySelector("wsx-calendar") as Calendar;
calendar.events = events;
calendar.eventTypeDefinitions = meetingDSL;
```

Calendar 在组件内解析/编译 DSL，并按 `Event.type` 将对应规则用于事件渲染、验证和行为检查。

#### 模式 B：注入预编译 Runtime（单类型入口）

```typescript
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";

const compiler = new EventDSLCompiler();
const dataModel = compiler.compileDSL(meetingDSL);
const runtime = new EventRuntime(dataModel.types[0]);

const calendar = document.querySelector("wsx-calendar");
calendar.events = events;
calendar.user = currentUser;
calendar.eventRuntime = runtime; // 启用 DSL 驱动
```

DSL 驱动时，Calendar 的行为变化：

| 能力     | 无 DSL                                     | 有 DSL                                                          |
| -------- | ------------------------------------------ | --------------------------------------------------------------- |
| **渲染** | 使用 `event.title`、`event.color` 直接渲染 | 使用 `runtime.render()` 获取增强的 title/color/icon/description |
| **验证** | 无验证（信任外部数据）                     | 使用 `runtime.validate()` 校验字段/时间约束/冲突                |
| **行为** | 所有事件可编辑/拖拽/删除                   | 使用 `runtime.canPerform()` 按 DSL behavior 规则和用户角色控制  |

#### 模式 C：纯数据驱动（无 DSL 定义和 Runtime）

```typescript
const calendar = document.querySelector("wsx-calendar");
calendar.events = events; // 直接使用 Event 核心字段渲染
```

### Calendar 内部的 DSL 集成逻辑

```typescript
private renderEventBlock(event: Event): HTMLElement {
  let title = event.title;
  let color = event.color || '#4285f4';
  let description = '';
  let icon: string | undefined;

  if (this._eventRuntime) {
    const rendered = this._eventRuntime.render(event, { user: this._user });
    title = rendered.title;
    color = rendered.color;
    description = rendered.description || '';
    icon = rendered.icon;
  }

  return (
    <div class="event-block" style={{ backgroundColor: color }}
         onclick={() => this.handleEventClick(event)}>
      {icon && <span class="event-icon">{icon}</span>}
      <span class="event-title">{title}</span>
      {description && <span class="event-desc">{description}</span>}
    </div>
  );
}

private handleEventCreate(eventData: Partial<Event>): void {
  if (this._eventRuntime) {
    const validation = this._eventRuntime.validate(eventData, {
      existingEvents: this._events,
      user: this._user
    });
    if (!validation.valid) {
      this.dispatchEvent(new CustomEvent('event-create-error', {
        detail: { errors: validation.errors },
        bubbles: true, composed: true
      }));
      return;
    }
  }

  this.dispatchEvent(new CustomEvent('event-create', {
    detail: { event: eventData },
    bubbles: true, composed: true
  }));
}

private isEventDraggable(event: Event): boolean {
  if (!this._eventRuntime) return true;
  return this._eventRuntime.canPerform('drag', event, this._user);
}
```

## Event 数据模型

Calendar 消费的核心数据结构（定义在 `@calenderjs/event-model`）：

```typescript
interface Event {
  id: string; // 唯一标识符
  type: string; // DSL 类型标识（如 "meeting"、"vacation"）
  title: string; // 显示标题
  startTime: Date; // 开始时间
  endTime: Date; // 结束时间
  color?: string; // 显示颜色
  icon?: string; // 显示图标
  data?: Record<string, any>; // DSL 业务字段容器
  timeZone?: string; // 时区（IANA 标识符）
  allDay?: boolean; // 全天事件
  recurring?: RecurringRule; // 重复规则
  parentEventId?: string; // 父事件ID（重复事件实例）
  recurrenceId?: string; // 重复实例ID
  metadata?: EventMetadata; // 创建/更新元数据
}
```

**`Event.data` 字段设计（替代原 `extra`）**：

- DSL fields 定义的业务字段统一存储在 `data` 中
- 语义明确："这是此事件类型的核心数据"，而非"额外的附加信息"
- JSON Schema 校验 `data` 结构（由 DSL 编译器从 fields 生成）
- TypeScript 类型生成（如 `MeetingData`）提供开发时类型安全

```typescript
// meeting 类型事件
{
  type: "meeting",
  title: "团队会议",
  startTime: new Date("2026-01-15T10:00"),
  endTime: new Date("2026-01-15T11:00"),
  data: {
    attendees: ["alice@co.com", "bob@co.com"],
    location: "会议室 A",
    priority: "high"
  }
}

// vacation 类型事件
{
  type: "vacation",
  title: "年假",
  startTime: new Date("2026-02-01"),
  endTime: new Date("2026-02-03"),
  allDay: true,
  data: {
    reason: "春节",
    approvedBy: "manager@co.com",
    days: 3
  }
}
```

## 视图设计

### 月视图（MonthView）

- 显示整月日期网格（6 行 x 7 列，含前后月补齐）
- 每个日期单元格显示事件预览（标题 + 颜色条）
- 事件过多时显示 "+N more"
- 点击日期跳转到日视图
- 双击日期创建事件

### 周视图（WeekView）

- 显示 7 天时间轴（默认 00:00-24:00）
- 事件块按时间定位（top = startTime, height = duration）
- 处理重叠事件的并排布局
- 当前时间线指示器

### 日视图（DayView）

- 显示单日时间轴（时间槽更细：15/30 分钟）
- 事件块精确定位
- 详细事件信息展示

### 视图渲染与 DSL 集成

所有视图渲染事件时遵循相同逻辑：

```
Event → (有 EventRuntime?) → runtime.render(event) → RenderedEvent
                           ↓ (无)
                           → 使用 event.title / event.color 直接渲染
```

`RenderedEvent` 结构：

```typescript
interface RenderedEvent {
  title: string;
  description?: string;
  color: string;
  icon?: string;
  allDay?: boolean;
  [key: string]: any; // 允许扩展渲染属性
}
```

## 组件架构

### WSX 组件结构

```
Calendar.wsx (主组件: @autoRegister({ tagName: "wsx-calendar" }))
├── 工具栏（视图切换、日期导航、Today 按钮）
├── 视图容器
│   ├── MonthView.wsx (wsx-month-view)
│   ├── WeekView.wsx (wsx-week-view)
│   └── DayView.wsx (wsx-day-view)
├── 事件创建/编辑对话框
└── 删除确认对话框
```

### 组件通信

```
外部应用
  ↓ (attributes: view, date)
  ↓ (properties: events, user, eventTypeDefinitions 或 eventRuntime)
Calendar 主组件
  ↓ (attributes: JSON 序列化的 events/date)
视图子组件 (MonthView / WeekView / DayView)
  ↑ (CustomEvent 冒泡: date-click, event-click)
Calendar 主组件
  ↑ (CustomEvent composed: event-create, event-update, event-delete)
外部应用
```

### 工具函数

纯函数，独立于组件实例，便于测试：

| 文件             | 函数                                                                                          | 用途           |
| ---------------- | --------------------------------------------------------------------------------------------- | -------------- |
| `date-utils.ts`  | `getMonthDates()`, `getWeekDates()`, `isSameDay()`, `isSameMonth()`, `getDayHours()`          | 日期计算       |
| `event-utils.ts` | `groupEventsByDate()`, `getEventsForDate()`, `sortEventsByTime()`, `calculateEventPosition()` | 事件分组与定位 |

## 使用示例

### HTML（最简）

```html
<wsx-calendar view="month" date="2026-03-15"></wsx-calendar>
<script>
  const calendar = document.querySelector("wsx-calendar");
  calendar.events = [
    {
      id: "1",
      type: "meeting",
      title: "会议",
      startTime: new Date(),
      endTime: new Date(),
    },
  ];
</script>
```

### TypeScript + DSL 驱动

```typescript
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";

const meetingDSL = `
type: meeting
name: "会议"
fields:
  - attendees: list of email, required
  - location: string
  - priority: enum(low, normal, high), default: "normal"
display:
  color: "#4285f4"
  color: when priority is high: "#ea4335" else: "#4285f4"
  title: "{title}"
  description: "{attendees.count} 人参会"
behavior:
  draggable: true
  editable: role is admin or role is manager
`;

const compiler = new EventDSLCompiler();
const dataModel = compiler.compileDSL(meetingDSL);
const runtime = new EventRuntime(dataModel.types[0]);

const calendar = document.querySelector("wsx-calendar");
calendar.events = events;
calendar.user = { id: "u1", role: "admin" };
calendar.eventRuntime = runtime;

calendar.addEventListener("event-create", (e) => {
  console.log("创建事件:", e.detail.event);
});
```

### React 集成

```tsx
import "@calenderjs/calendar";
import { useRef, useEffect } from "react";

function CalendarApp({ events, user, runtime }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.events = events;
    el.user = user;
    el.eventRuntime = runtime;
  }, [events, user, runtime]);

  return <wsx-calendar ref={ref} view="week" />;
}
```

## 文件结构

```
packages/calendar/
├── src/
│   ├── Calendar.wsx                   # 主组件
│   ├── Calendar.css                   # 组件样式（Shadow DOM 内联）
│   ├── views/
│   │   ├── MonthView.wsx              # 月视图
│   │   ├── MonthView.css
│   │   ├── WeekView.wsx               # 周视图
│   │   ├── WeekView.css
│   │   ├── DayView.wsx                # 日视图
│   │   └── DayView.css
│   ├── utils/
│   │   ├── date-utils.ts              # 日期工具
│   │   └── event-utils.ts             # 事件工具
│   ├── __tests__/
│   │   ├── Calendar.test.ts
│   │   └── utils/
│   │       ├── date-utils.test.ts
│   │       └── event-utils.test.ts
│   └── index.ts
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

## 依赖

```json
{
  "dependencies": {
    "@calenderjs/core": "workspace:*",
    "@calenderjs/date-time": "workspace:*",
    "@calenderjs/event-dsl": "workspace:*",
    "@calenderjs/event-model": "workspace:*",
    "@calenderjs/event-runtime": "workspace:*"
  },
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.2.0"
  }
}
```

`event-dsl` 与 `event-runtime` 是 Calendar DSL 渲染路径的依赖。编辑器包不是 Calendar 依赖；`eventRuntime` 仍可接收预编译的单类型 Runtime。

## 范围

本 RFC 只描述 `<wsx-calendar>` 本体：月/周/日视图、工具栏，以及可选 Runtime 下已经存在的显示、校验和提议事件。

从本 RFC 拆出的事项见 [RFC-0017](0017-calendar-follow-ons.md)，不再在这里跟踪：

| 事项 | RFC |
| ---- | --- |
| `eventDSL` 改名为 `eventTypeDefinitions` | [0024](completed/0024-rename-event-dsl-property.md) |
| 编辑/删除前的 `canPerform` | [0018](completed/0018-gate-actions-with-can-perform.md) |
| 把 `description` 和标题模板合并进显示事件 | [0019](completed/0019-merge-runtime-description.md) |
| 拖到新时刻 | [0020](0020-drag-events-to-new-time.md) |
| 拖边缘改时长 | [0021](0021-resize-event-duration.md) |
| 视图切换动画 | [0022](0022-animate-view-switch.md) |
| 大量事件虚拟化 | [0023](0023-virtualize-event-list.md) |

`extra` → `data` 属于 RFC-0011。插件属于 RFC-0012。今天高亮属于 RFC-0013。API 分层属于 RFC-0008。性能数字属于 RFC-0023。

## 向后兼容性

无 Runtime 时保持纯数据驱动。属性改名的兼容规则只写在 RFC-0024。

## 参考

- [Google Calendar](https://calendar.google.com/)
- [FullCalendar](https://fullcalendar.io/)
- [Web Components 标准](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [WSX 框架](https://wsxjs.dev)

---

_本 RFC 定义 `<wsx-calendar>` 直接渲染 Event DSL 的架构，同时保持 DSL 编辑器为独立包，并支持无 DSL 的纯数据驱动降级模式。_
