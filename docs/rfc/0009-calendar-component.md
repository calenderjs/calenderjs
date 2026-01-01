# RFC-0009: Calendar Component

**状态**: Draft  
**创建日期**: 2024-12-30  
**作者**: WSX Team  
**关联**: RFC-0001 (Event DSL), RFC-0008 (API Redesign)

## 摘要

设计并实现 `<wsx-calendar>` 组件，一个基于 WSX 框架构建的事件日历组件。组件提供月视图、周视图和日视图三种显示模式，界面设计参考 Google 日历。组件只处理数据模型，不涉及任何 DSL 逻辑。

**核心特性**：
- 基于 WSX 框架构建（Web Components + JSX）
- 纯数据驱动：只处理 `events` 和 `user` 数据模型
- 支持月/周/日三种视图
- 零运行时开销（构建时编译）
- 符合 Web Components 标准

**设计原则**：
- ✅ **组件只处理数据模型**：组件只关心 `events` 和 `user` 数据，不涉及 DSL
- ✅ **数据驱动**：组件行为完全由传入的数据驱动
- ✅ **保持简单**：不进行验证、不进行 DSL 处理，这些应该在外部完成

**开源定位**：
- **@calenderjs/calendar**：开源日历组件（MIT协议）
- 依赖 **@calenderjs/core**（数据模型）
- **不依赖** **@calenderjs/event-dsl**（组件不涉及 DSL）

## 动机

### 为什么需要这个组件？

在事件管理、日程安排、项目管理等应用场景中，日历组件是一个核心需求。目前缺少一个功能完整、设计精美、且由领域语言驱动的开源日历组件。

### 为什么使用 WSX 框架？

1. **Web Components 标准**：组件可以在任何框架或原生 HTML 中使用
2. **零运行时开销**：组件逻辑在构建时编译，运行时只执行必要的 DOM 操作
3. **样式隔离**：使用 Shadow DOM 实现样式隔离，避免样式冲突
4. **声明式渲染**：使用 JSX 语法进行声明式渲染

### 目标用户

- **应用开发者**：需要构建事件管理、日程安排等功能的开发者
- **框架学习者**：希望学习 WSX 框架和 Web Components 的开发者

## WSX 框架说明

### 什么是 WSX？

**WSX (Web Components Syntax Extension)** 是一个用于原生 Web Components 的 JSX 语法扩展，旨在简化 Web Components 的开发体验。

**核心定位**：
- ✅ **JSX 语法编译器**：将 JSX 语法编译为原生 DOM 操作
- ✅ **TypeScript 集成**：完整的类型安全和 IntelliSense 支持
- ✅ **零运行时开销**：构建时编译，运行时只执行原生 DOM 操作
- ✅ **Web Components 标准**：完全基于浏览器原生 Web Components API

**WSX 不是**：
- ❌ 不是 React/Vue 的替代品或替代方案
- ❌ 不是状态管理系统
- ❌ 不是虚拟 DOM 实现
- ❌ 不是组件生命周期的重新实现

### WSX 设计哲学

WSX 遵循"减法优于加法，增强优于替换"的设计哲学：

1. **不"改进"浏览器已优化的部分**：Web Components 已经经过实战验证
2. **零运行时负担**：编译时语法糖，而非运行时框架
3. **不创建新的抽象**：使用现有的 Web API 和标准
4. **解决一个特定问题**：让 Web Component 开发变得愉快

**WSX 等式**：
```
JSX + Web Components = 现代语法 + 原生性能
```

### WSX 核心概念

#### 1. WebComponent 基类

`WebComponent` 是 WSX 提供的标准自定义元素基类，使用 Shadow DOM 提供完全的样式隔离和封装。

```typescript
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-calendar' })
export default class Calendar extends WebComponent {
    constructor() {
        super({
            styleName: 'wsx-calendar',
            // 或者手动传入样式
            // styles: '...'
        });
    }

    render() {
        return (
            <div class="calendar">
                {/* JSX 内容 */}
            </div>
        );
    }
}
```

**关键特性**：
- 使用 Shadow DOM 实现样式隔离
- JSX 语法编译为原生 `document.createElement()` 调用
- 自动 CSS 注入（如果存在同名的 `.css` 文件）
- 完整的生命周期钩子支持

#### 2. @state 装饰器（响应式状态）

`@state` 装饰器用于管理响应式状态，当状态变化时自动触发重渲染。

```typescript
import { state } from '@wsxjs/wsx-core';

export class Calendar extends WebComponent {
    // ✅ @state 装饰器必须有初始值
    @state private currentView: 'month' | 'week' | 'day' = 'month';
    @state private currentDate: Date = new Date();
    @state private showDialog = false;
    @state private events: Event[] = [];

    render() {
        // 直接使用 this.xxx，无需 this.state.xxx
        return (
            <div>
                <p>View: {this.currentView}</p>
                <button onclick={() => this.currentView = 'week'}>
                    Switch to Week
                </button>
            </div>
        );
    }
}
```

**重要要求**：
- ⚠️ `@state` 装饰器的属性**必须有初始值**
- ✅ ESLint 规则会在开发时检查（`wsx/state-requires-initial-value`）
- ✅ Babel 插件会在构建时验证，缺少初始值会导致构建失败
- ✅ 需要配置 `@wsxjs/wsx-vite-plugin` 才能使用 `@state` 装饰器

**有效示例**：
```typescript
@state private count = 0;              // ✅ 数字
@state private name = "";              // ✅ 字符串
@state private enabled = false;        // ✅ 布尔值
@state private user = {};              // ✅ 对象
@state private items: string[] = [];   // ✅ 数组
```

**无效示例**：
```typescript
@state private count;                  // ❌ 缺少初始值
@state private name;                   // ❌ 缺少初始值
```

#### 3. @autoRegister 装饰器（自动注册）

`@autoRegister` 装饰器用于自动注册自定义元素，无需手动调用 `customElements.define()`。

```typescript
import { autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-calendar' })
export default class Calendar extends WebComponent {
    // 组件会自动注册为 <wsx-calendar> 自定义元素
}
```

**使用方式**：
- `@autoRegister()` - 自动从类名生成标签名（如 `Calendar` → `calendar`）
- `@autoRegister({ tagName: 'wsx-calendar' })` - 指定自定义标签名

#### 4. 生命周期钩子

WSX 组件使用标准的 Web Components 生命周期，但提供了更友好的钩子方法：

```typescript
export class Calendar extends WebComponent {
    // 组件连接到 DOM 后调用
    connectedCallback() {
        super.connectedCallback?.();
        // 初始化逻辑
    }

    // 组件从 DOM 断开后调用
    disconnectedCallback() {
        super.disconnectedCallback?.();
        // 清理资源
    }

    // 属性变化时调用
    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        // 处理属性变化
    }
}
```

**重要**：必须调用 `super.xxx?.()` 以确保基类逻辑正确执行。

#### 5. 属性观察

使用 `static observedAttributes` 声明需要观察的属性：

```typescript
export class Calendar extends WebComponent {
    static get observedAttributes() {
        return ['view', 'date', 'event-dsl'];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        
        switch (name) {
            case 'view':
                if (newValue) {
                    this.currentView = newValue as 'month' | 'week' | 'day';
                }
                break;
            case 'date':
                if (newValue) {
                    this.currentDate = new Date(newValue);
                }
                break;
        }
    }
}
```

#### 6. 事件绑定

WSX 使用原生事件绑定，**不是 React 风格**：

```typescript
render() {
    return (
        <div>
            {/* ✅ 正确：使用原生 onclick */}
            <button onclick={(e) => this.handleClick(e)}>Click me</button>
            
            {/* ❌ 错误：不要使用 React 风格的 onClick */}
            {/* <button onClick={this.handleClick}>Click me</button> */}
        </div>
    );
}

private handleClick = (event: MouseEvent) => {
    console.log('Button clicked');
};
```

**关键区别**：
- ✅ 使用 `onclick`（小写），不是 `onClick`
- ✅ 事件处理器接收原生 `Event` 对象
- ✅ 使用箭头函数或绑定方法

#### 7. 状态访问

使用 `@state` 装饰器的属性，直接通过 `this.xxx` 访问，**不是 `this.state.xxx`**：

```typescript
export class Calendar extends WebComponent {
    @state private count = 0;
    @state private name = "";

    render() {
        return (
            <div>
                {/* ✅ 正确：直接访问 */}
                <p>Count: {this.count}</p>
                <p>Name: {this.name}</p>
                
                {/* ❌ 错误：不要使用 this.state.xxx */}
                {/* <p>Count: {this.state.count}</p> */}
            </div>
        );
    }
}
```

### WSX 配置要求

#### TypeScript 配置

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"],
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

**重要配置**：
- `experimentalDecorators: true` - 启用装饰器语法
- `useDefineForClassFields: false` - 确保装饰器与类属性兼容

#### Vite 配置

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
    plugins: [wsx()]
});
```

**重要**：`@wsxjs/wsx-vite-plugin` 是使用 `@state` 装饰器的**必需**配置。该插件包含 Babel 插件，会在编译时处理 `@state` 装饰器。

#### ESLint 配置

```javascript
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
    {
        files: ['**/*.{ts,tsx,js,jsx,wsx}'],
        plugins: {
            wsx: wsxPlugin
        },
        rules: {
            'wsx/no-react-imports': 'error',
            'wsx/render-method-required': 'error',
            'wsx/state-requires-initial-value': 'error'  // ✅ 验证 @state 必须有初始值
        }
    }
];
```

### WSX vs React 关键区别

| 特性 | WSX | React |
|------|-----|-------|
| **事件绑定** | `onclick`（小写） | `onClick`（驼峰） |
| **状态访问** | `this.xxx` | `this.state.xxx` 或 `useState` |
| **状态管理** | `@state` 装饰器 | `useState` Hook 或 `this.state` |
| **组件注册** | `@autoRegister` 装饰器 | 无需注册 |
| **生命周期** | `connectedCallback` 等 | `componentDidMount` 等 |
| **DOM 操作** | 原生 DOM API | Virtual DOM |
| **运行时** | 零运行时开销 | React 运行时库 |
| **框架依赖** | 无（原生 Web Components） | 需要 React 库 |

### 参考资料

- **官方网站**：https://wsxjs.dev
- **GitHub 仓库**：https://github.com/wsxjs/wsxjs
- **快速开始指南**：https://wsxjs.dev/quick-start
- **WebComponent 使用指南**：https://wsxjs.dev/docs/guide/WEB_COMPONENT_GUIDE
- **TypeScript 配置指南**：https://wsxjs.dev/docs/guide/TYPESCRIPT_SETUP

## 组件 API 设计

### Web Components 标准

组件严格遵循 Web Components 标准，使用 `observedAttributes`、getters/setters、生命周期方法。

#### HTML Attributes（简单配置）

```html
<wsx-calendar
  view="month"
  date="2024-12-30"
  event-dsl="type: meeting ..."
></wsx-calendar>
```

**支持的 Attributes**：
- `view` - 初始视图（`month` | `week` | `day`），默认 `month`
- `date` - 初始日期（ISO 8601 字符串），默认当前日期

#### JavaScript Properties（复杂数据）

```typescript
const calendar = document.querySelector('wsx-calendar') as Calendar;

// 通过 properties 设置复杂数据（数据模型）
calendar.events = events;
calendar.user = currentUser;
// 注意：DSL 只通过 attribute 传入，不作为 property
```

**支持的 Properties**：
- `events: Event[]` - 事件列表（数据模型）
- `user: User | undefined` - 当前用户（用于权限验证）

**设计原则**：
- ✅ **组件只处理数据模型**：组件只处理 `events` 和 `user` 数据，不涉及任何 DSL
- ✅ **数据驱动**：组件行为完全由传入的数据驱动
- ✅ **保持简单**：不进行验证、不进行 DSL 处理，验证和 DSL 处理应该在外部完成

#### 内部状态（@state）

组件使用 `@state` 装饰器管理内部响应式状态：
- `currentView: 'month' | 'week' | 'day'` - 当前视图
- `currentDate: Date` - 当前日期
- `showEventDialog: boolean` - 是否显示事件对话框
- `editingEvent: Event | undefined` - 正在编辑的事件
- `showDeleteConfirm: boolean` - 是否显示删除确认对话框
- `deletingEvent: Event | undefined` - 待删除的事件

### 事件系统

组件使用 `CustomEvent` 进行组件通信，所有事件都冒泡（`bubbles: true`）。

**支持的事件**：
- `date-change` - 日期变化时触发
  ```typescript
  detail: { date: Date }
  ```
- `view-change` - 视图切换时触发
  ```typescript
  detail: { view: 'month' | 'week' | 'day' }
  ```
- `event-click` - 事件点击时触发
  ```typescript
  detail: { event: Event }
  ```
- `event-create` - 事件创建时触发
  ```typescript
  detail: { event: Event }
  ```
- `event-update` - 事件更新时触发
  ```typescript
  detail: { id: string, event: Event }
  ```
- `event-delete` - 事件删除时触发
  ```typescript
  detail: { id: string }
  ```

### 公共方法

**CRUD 操作**：
- `createEvent(eventData: Partial<Event>): { success: boolean, event?: Event, errors?: string[] }`
- `updateEvent(eventId: string, eventData: Partial<Event>): { success: boolean, event?: Event, errors?: string[] }`
- `deleteEvent(eventId: string): { success: boolean, error?: string }`

## 组件结构

### 主组件：Calendar.wsx

```typescript
@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // Properties（数据模型）
    private _events: Event[] = [];
    private _user: User | undefined = undefined;

    // Internal state
    @state currentView: 'month' | 'week' | 'day' = 'month';
    @state currentDate: Date = new Date();
    @state private showEventDialog: boolean = false;
    @state private editingEvent: Event | undefined = undefined;
    @state private showDeleteConfirm: boolean = false;
    @state private deletingEvent: Event | undefined = undefined;
    // ... 其他内部状态

    // Observed attributes
    static get observedAttributes() {
        return ['view', 'date'];
    }

    // Properties getters/setters（只暴露数据模型）
    get events(): Event[] { return this._events; }
    set events(value: Event[]) {
        this._events = value;
        // @state 装饰器会自动处理更新
    }

    get user(): User | undefined { return this._user; }
    set user(value: User | undefined) {
        this._user = value;
    }

    // Lifecycle
    connectedCallback() {
        super.connectedCallback?.();
        this.initializeFromAttributes();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        // 处理属性变化
    }

    // Render
    render() {
        return (
            <div class="calendar">
                {this.renderToolbar()}
                {this.renderView()}
                {this.renderEventDialog()}
                {this.renderDeleteConfirm()}
            </div>
        );
    }
}
```

### 视图组件

视图渲染逻辑直接内联在 `Calendar.wsx` 中，不使用独立的子组件，以保持代码简洁和性能。

**视图类型**：
- `renderMonthView()` - 月视图渲染
- `renderWeekView()` - 周视图渲染
- `renderDayView()` - 日视图渲染

## 数据模型处理

组件只处理数据模型，不涉及任何 DSL 逻辑。

### 事件渲染

组件直接使用 `Event` 数据模型中的字段进行渲染：

```typescript
private renderEvent(event: Event) {
    // 直接使用 event 数据模型中的字段
    return {
        title: event.title,
        color: event.color || "#4285f4",
        description: event.description || "",
    };
}
```

### 数据验证

组件不进行数据验证。验证应该在外部完成，组件只接收已验证的数据。

### 行为控制

组件不进行行为控制。行为控制应该在外部完成，组件只负责渲染和事件派发。

## 使用示例

### HTML 方式

```html
<wsx-calendar
    view="month"
    date="2024-12-30"
></wsx-calendar>

<script>
    const calendar = document.querySelector('wsx-calendar');
    
// 通过 properties 设置复杂数据（数据模型）
calendar.events = [
    { id: '1', title: 'Meeting', startTime: new Date(), ... }
];
calendar.user = { id: '1', email: 'user@example.com', ... };

// 监听事件
calendar.addEventListener('event-click', (e) => {
    console.log('Event clicked:', e.detail.event);
});
</script>
```

### JavaScript/TypeScript 方式

```typescript
const calendar = document.createElement('wsx-calendar') as Calendar;

// 通过 attributes 设置简单配置
calendar.setAttribute('view', 'month');
calendar.setAttribute('date', '2024-12-30');

// 通过 properties 设置复杂数据（数据模型）
calendar.events = events;
calendar.user = currentUser;

// 监听事件
calendar.addEventListener('view-change', (e) => {
    console.log('View changed:', e.detail.view);
});

document.body.appendChild(calendar);
```

### JSX 方式（在 WSX 项目中使用）

```tsx
<wsx-calendar
    view="month"
    date="2024-12-30"
    events={events}         // 数据模型通过 property
    user={user}             // 数据模型通过 property
    onViewChange={(e) => console.log('View changed:', e.detail.view)}
    onEventClick={(e) => console.log('Event clicked:', e.detail.event)}
/>
```

## 实施计划

### 阶段 1: 基础结构和视图（1周）

- [x] **1.1 使用 WSX 构建 Calendar 组件基础结构**
  - [x] 创建 `packages/calendar/src/Calendar.wsx`
  - [x] 组件注册 (`@autoRegister`)
  - [x] WebComponent 继承
  - [x] 属性定义（events, user - 数据模型）
  - [x] 状态管理（currentView, currentDate）
  - [x] 构造函数和生命周期
  - [x] `observedAttributes` 声明

- [x] **1.2 实现工具函数**
  - [x] 日期工具 (`packages/calendar/src/utils/date-utils.ts`)
    - [x] `getMonthDates()` - 获取月份日期
    - [x] `getWeekDates()` - 获取周日期
    - [x] `isSameDay()` - 判断同一天
    - [x] `isSameMonth()` - 判断同一月
    - [x] `getTimeString()` - 获取时间字符串
    - [x] `formatDateKey()` - 格式化日期键
    - [x] `getDayHours()` - 获取一天的小时列表
  - [x] 事件工具 (`packages/calendar/src/utils/event-utils.ts`)
    - [x] `groupEventsByDate()` - 按日期分组事件
    - [x] `getEventsForDate()` - 获取某日期的事件
    - [x] `sortEventsByTime()` - 按时间排序事件
    - [x] `calculateEventPosition()` - 计算事件位置

- [x] **1.3 实现月/周/日视图渲染**
  - [x] `renderMonthView()` - 月视图渲染
    - [x] 月份网格渲染
    - [x] 日期单元格
    - [x] 事件显示
  - [x] `renderWeekView()` - 周视图渲染
    - [x] 周视图头部
    - [x] 时间轴
    - [x] 事件定位
  - [x] `renderDayView()` - 日视图渲染
    - [x] 日视图头部
    - [x] 时间轴
    - [x] 事件详情

- [x] **1.4 实现基础组件功能**
  - [x] 视图初始化 (`initializeFromAttributes()`)
  - [x] 工具栏渲染 (`renderToolbar()`)
  - [x] 视图切换 (`handleViewChange()`)
  - [x] 日期导航 (`handleNavigate()`, `handleToday()`)
  - [x] 日期点击 (`handleDateClick()`)
  - [x] 事件点击 (`handleEventClick()`)

- [x] **1.5 构建配置**
  - [x] Vite 配置（WSX 插件集成）
  - [x] TypeScript 配置
  - [x] Vitest 测试配置
  - [x] CJS/ESM/d.ts 输出

### 阶段 2: CRUD 操作（1周）

- [x] **2.1 实现事件 CRUD 操作**
  - [x] 创建事件 (`createEvent()`)
    - [x] 事件创建表单/对话框
    - [x] 事件数据收集
    - [x] 事件创建回调 (`event-create` 事件)
  - [x] 更新事件 (`updateEvent()`)
    - [x] 事件编辑表单/对话框
    - [x] 表单预填充
    - [x] 事件更新回调 (`event-update` 事件)
  - [x] 删除事件 (`deleteEvent()`)
    - [x] 删除确认对话框
    - [x] 事件删除回调 (`event-delete` 事件)
  - [x] 事件表单组件
    - [x] 基础表单字段渲染
  - [x] 双击日期创建事件
  - [x] 事件删除按钮

**注意**：组件不进行验证和 DSL 处理，这些应该在外部完成。

### 阶段 3: 测试和优化（1周）

- [x] **3.1 单元测试**
  - [x] 组件渲染测试（DOM 和 Shadow DOM 支持）
  - [x] 视图切换测试（通过事件验证）
  - [x] 事件显示测试
  - [x] CRUD 操作测试（事件派发）
  - [x] 交互测试（用户交互和事件）
  - [x] 工具函数测试（date-utils, event-utils）
  - [x] 45 个测试用例全部通过
  - [ ] 100% 测试覆盖率（待完善）

- [ ] **3.2 拖拽功能（基于 HTML5 Drag and Drop API）**
  - [ ] 拖拽开始处理 (`dragstart` 事件)
  - [ ] 拖拽结束处理 (`dragend` 事件)
  - [ ] 拖拽悬停处理 (`dragover`, `dragenter`, `dragleave` 事件)
  - [ ] 拖拽放置处理 (`drop` 事件)
  - [ ] 时间调整（拖拽改变开始/结束时间）
  - [ ] 拖拽视觉反馈（拖拽时的样式变化）

- [ ] **3.3 动画效果**
  - [ ] 视图切换动画
    - [ ] 淡入淡出效果
    - [ ] 滑动过渡效果
  - [ ] 事件出现/消失动画
    - [ ] 事件添加动画
    - [ ] 事件删除动画
  - [ ] 拖拽动画
    - [ ] 拖拽时的视觉反馈
    - [ ] 放置时的动画效果
  - [ ] 过渡效果
    - [ ] CSS 过渡配置
    - [ ] 动画性能优化

- [ ] **3.4 性能优化**
  - [ ] 事件渲染优化（虚拟滚动，如果事件数量很多）
  - [ ] 视图切换优化
  - [ ] 内存泄漏检查

- [ ] **3.5 文档**
  - [ ] 组件 API 文档
  - [ ] 使用示例
  - [ ] 集成指南

**状态**: ⏳ 进行中（85% 完成）

**已完成**：
- ✅ 阶段 1: 基础结构和视图（100%）
- ✅ 阶段 2: CRUD 操作（100%）
- ✅ 阶段 3.1: 单元测试（45 个测试用例，95% 覆盖率）

**待完成**：
- ⏳ 阶段 3.2: 拖拽功能
- ⏳ 阶段 3.3: 动画效果
- ⏳ 阶段 3.4: 性能优化
- ⏳ 阶段 3.5: 文档

## 完成度统计

| 阶段 | 完成度 | 状态 |
|------|--------|------|
| 阶段 1: 基础结构和视图 | 100% | ✅ 完成 |
| 阶段 2: CRUD 操作 | 100% | ✅ 完成 |
| 阶段 3: 测试和优化 | 25% | ⏳ 进行中 |
| **总体** | **75%** | ⏳ 进行中 |

## 文件结构

```
packages/calendar/
├── src/
│   ├── Calendar.wsx              # 主组件（基于 WSX）
│   ├── utils/
│   │   ├── date-utils.ts         # 日期工具函数
│   │   └── event-utils.ts        # 事件工具函数
│   ├── __tests__/
│   │   ├── Calendar.test.ts      # 组件测试
│   │   └── utils/
│   │       ├── date-utils.test.ts
│   │       └── event-utils.test.ts
│   └── index.ts
├── package.json                   # 依赖: @calenderjs/core, @calenderjs/event-dsl, @wsxjs/wsx-core
├── vite.config.ts
└── vitest.config.ts
```

## 依赖项

```json
{
  "name": "@calenderjs/calendar",
  "dependencies": {
    "@calenderjs/core": "workspace:*",
    "@wsxjs/wsx-core": "^0.0.23"
  },
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.0.23"
  },
  "devDependencies": {
    "@wsxjs/wsx-vite-plugin": "^0.0.23",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

**组件特点**：
- ✅ 基于 WSX 框架构建（Web Components + JSX）
- ✅ 使用 Event DSL 驱动渲染和验证
- ✅ 支持月/周/日三种视图
- ✅ 零运行时开销（构建时编译）
- ✅ 符合 Web Components 标准

## 测试策略

### 组件测试

```typescript
describe('Calendar Component', () => {
    it('should render correctly', () => {
        const calendar = document.createElement('wsx-calendar');
        document.body.appendChild(calendar);
        expect(calendar.shadowRoot?.querySelector('.calendar')).toBeTruthy();
    });

    it('should handle view change', () => {
        const calendar = document.createElement('wsx-calendar');
        calendar.setAttribute('view', 'week');
        expect(calendar.currentView).toBe('week');
    });
});
```

## 性能目标

- **渲染性能**：1000 个事件 < 100ms
- **视图切换**：< 50ms
- **事件交互**：< 10ms
- **内存使用**：1000 个事件 < 50MB

## 向后兼容性

- 无。这是新组件，无兼容性问题。
- API 设计遵循 Web Components 标准，未来版本将保持向后兼容。

## 开放问题

1. **拖拽功能**：是否需要支持拖拽调整事件时间？
2. **动画效果**：是否需要视图切换动画？
3. **性能优化**：是否需要虚拟滚动支持大量事件？

## 参考资料

- RFC-0001: Event DSL (领域特定语言)
- RFC-0008: Calendar Component API 重新设计
- [Web Components 标准](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [WSX 框架文档](https://github.com/wsxjs/wsx)

---

**状态**: 进行中  
**下一步**: 完成基础日历视图（月/周/日），不涉及事件