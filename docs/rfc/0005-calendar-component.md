# RFC-0005: Calendar Component

**状态**: In Progress  
**创建日期**: 2024-12-19  
**最后更新**: 2026-03-15  
**作者**: WSX Team  
**关联 RFC**: RFC-0002 (Event DSL), RFC-0008 (API Redesign), RFC-0009 (Data-driven Calendar), RFC-0011 (Event Data Model), RFC-0012 (Plugin Mechanism)

## 摘要

设计并实现 `<wsx-calendar>` 组件，一个基于 WSX 框架构建的 DSL 驱动日历组件。组件提供月视图、周视图和日视图三种显示模式，界面设计参考 Google 日历。

**核心架构**：

- **DSL 驱动**：Calendar 接受 `EventRuntime` 实例，用于增强渲染（颜色、图标、标题模板）、验证（字段和时间约束）、行为控制（拖拽、编辑权限）
- **优雅降级**：未提供 EventRuntime 时，Calendar 回退到纯数据驱动模式，使用 Event 核心字段渲染
- **Web Components 标准**：基于 WSX 框架，使用 Custom Elements + Shadow DOM + JSX 语法
- **Event 数据模型**：组件消费 `Event[]` 数据，通过 `Event.type` + `Event.data` 承载 DSL 定义的业务字段

**开源定位**：

- `@calenderjs/calendar`：开源日历组件（MIT 协议）
- 依赖 `@calenderjs/event-model`（Event 数据模型 SSOT）
- 可选依赖 `@calenderjs/event-runtime`（DSL 驱动能力）

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
calendar.eventRuntime = runtime; // EventRuntime - DSL 运行时（可选）
```

| Property       | 类型           | 必需 | 说明                            |
| -------------- | -------------- | ---- | ------------------------------- |
| `events`       | `Event[]`      | 是   | 事件列表（数据模型）            |
| `user`         | `User`         | 否   | 当前用户（权限验证用）          |
| `eventRuntime` | `EventRuntime` | 否   | DSL 运行时（启用 DSL 驱动模式） |

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

### 两种模式

#### 模式 A：DSL 驱动（提供 EventRuntime）

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

#### 模式 B：纯数据驱动（无 EventRuntime）

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
  ↓ (properties: events, user, eventRuntime)
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
    "@calenderjs/event-model": "workspace:*",
    "@wsxjs/wsx-core": "^0.0.23"
  },
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.0.23"
  },
  "optionalDependencies": {
    "@calenderjs/event-runtime": "workspace:*"
  }
}
```

`event-runtime` 是可选依赖：Calendar 不硬依赖 DSL 运行时，通过 property 注入。

## 实现状态

| 模块                         | 状态      | 说明                                        |
| ---------------------------- | --------- | ------------------------------------------- |
| 组件基础结构                 | ✅ 完成   | WebComponent, @autoRegister, Shadow DOM     |
| 月/周/日视图渲染             | ✅ 完成   | 数据驱动渲染，无 DSL                        |
| 工具栏 + 视图切换 + 日期导航 | ✅ 完成   |                                             |
| CRUD 操作 + 对话框           | ✅ 完成   | create/update/delete + CustomEvent          |
| API 标准化 (RFC-0008)        | ✅ 完成   | observedAttributes, getter/setter, 事件统一 |
| "today" 高亮 (RFC-0013)      | ✅ 完成   |                                             |
| 工具函数 + 单元测试          | ✅ 完成   | 45 测试用例通过                             |
| **EventRuntime 集成**        | ❌ 未实现 | Calendar 接受 eventRuntime property         |
| **DSL 驱动渲染**             | ❌ 未实现 | runtime.render() 增强渲染                   |
| **DSL 驱动验证**             | ❌ 未实现 | runtime.validate() 创建/更新前验证          |
| **DSL 驱动行为**             | ❌ 未实现 | runtime.canPerform() 权限检查               |
| `extra` → `data` 重命名      | ❌ 待执行 | Event 接口字段重命名                        |
| 拖拽功能                     | ❌ 未实现 | HTML5 Drag and Drop API                     |
| 视图切换动画                 | ❌ 未实现 | CSS transitions                             |
| 虚拟滚动                     | ❌ 未实现 | 大量事件性能优化                            |

## 实施计划

### 已完成里程碑

- **M1**: 基础视图渲染（月/周/日）
- **M2**: CRUD 操作 + 事件系统
- **M3**: API 标准化（RFC-0008）

### 下一步里程碑

**M4: DSL 集成**（优先级最高）

1. `extra` → `data` 全局重命名（Event 接口 + 所有消费者）
2. Calendar 添加 `eventRuntime` property（getter/setter）
3. 渲染集成：有 runtime 时使用 `runtime.render()` 增强
4. 验证集成：创建/更新时使用 `runtime.validate()`
5. 行为集成：拖拽/编辑/删除前使用 `runtime.canPerform()`
6. 错误事件：`event-create-error`、`event-update-error`

**M5: 交互增强**

1. 拖拽功能（HTML5 Drag and Drop API）
2. 时间调整（拖拽底部边缘调整 duration）
3. 视图切换动画

**M6: 性能与文档**

1. 虚拟滚动（大量事件）
2. 事件聚合缓存
3. API 文档 + 使用示例

## 性能目标

| 指标          | 目标           |
| ------------- | -------------- |
| 1000 事件渲染 | < 100ms        |
| 视图切换      | < 50ms         |
| 事件交互响应  | < 16ms (60fps) |
| 1000 事件内存 | < 50MB         |

## 向后兼容性

- 当前纯数据驱动模式（无 eventRuntime）保持不变
- `eventRuntime` 是新增可选 property，不影响现有 API
- `extra` → `data` 重命名是破坏性变更，需要在所有包中同步更新

## 参考

- [Google Calendar](https://calendar.google.com/)
- [FullCalendar](https://fullcalendar.io/)
- [Web Components 标准](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [WSX 框架](https://wsxjs.dev)

---

_本 RFC 定义了 `<wsx-calendar>` 组件的完整架构：DSL 驱动的事件渲染、验证和行为控制，同时支持无 DSL 的纯数据驱动降级模式。_
