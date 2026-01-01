# RFC-0008: Calendar Component API 重新设计

**状态**: Draft  
**创建日期**: 2024-12-30  
**作者**: WSX Team  
**关联**: RFC-0001

## 摘要

重新设计 `<wsx-calendar>` 组件的 API，严格遵循 Web Components 标准和 WSX 框架最佳实践。当前实现存在严重的 API 设计问题，包括属性/状态混乱、事件绑定不一致、不符合 Web Component 标准等问题。

## 问题分析

### 当前设计的问题

#### 1. 属性/状态管理混乱

**问题**：
```typescript
// 当前实现 - 混乱的状态管理
export default class Calendar extends WebComponent {
    // 普通属性（无法响应式）
    eventDSL = undefined;
    events = [];
    user = undefined;
    defaultView = "month";
    currentDate = undefined;

    // 响应式状态（使用 @state）
    @state currentView = "month";
    @state viewDate = new Date();
    @state dslRuntime = undefined;
    @state showEventDialog = false;
    // ...
}
```

**问题点**：
- ❌ 普通属性和响应式状态混用，开发者不知道何时用哪个
- ❌ `eventDSL`, `events`, `user` 等外部数据使用普通属性，无法响应变化
- ❌ `defaultView`, `currentDate` 等初始值使用普通属性，但实际状态用 `@state`
- ❌ 访问方式混乱：`this.eventDSL` vs `this.state.viewDate`

#### 2. 不符合 Web Component 标准

**问题**：
```typescript
// 当前实现 - 没有 observedAttributes
export default class Calendar extends WebComponent {
    eventDSL = undefined;  // 如何从 attribute 获取？
    events = [];            // 如何从 attribute 获取？
    
    onAttributeChanged(name, oldValue, newValue) {
        // 只处理了 event-dsl，其他属性呢？
        if (name === "event-dsl" || name === "eventDSL") {
            this.initializeDSL();
        }
    }
}
```

**问题点**：
- ❌ 没有 `static observedAttributes` 声明
- ❌ 属性（attributes）和属性（properties）没有区分
- ❌ 复杂对象（如 `events`, `user`）无法通过 attributes 传递，但没有提供 properties API
- ❌ 属性变化时没有正确触发重新渲染

#### 3. 事件绑定不一致

**问题**：
```typescript
// 当前实现 - 三种不同的事件绑定方式
renderToolbar() {
    return (
        <button onclick={() => this.handleNavigate(-1)}>  // 方式1: onclick
        <button onClick={() => this.handleViewChange("month")}>  // 方式2: onClick (React风格)
    );
}

connectedCallback() {
    this.attachEventListeners();  // 方式3: addEventListener
}

attachEventListeners() {
    const prevBtn = this.shadowRoot?.querySelector('[data-action="navigate-prev"]');
    prevBtn?.addEventListener('click', () => this.handleNavigate(-1));
}
```

**问题点**：
- ❌ 同时使用 `onclick`、`onClick`、`addEventListener` 三种方式
- ❌ `attachEventListeners` 在 `connectedCallback` 中调用，但此时 DOM 可能还没渲染
- ❌ 事件监听器在每次 `connectedCallback` 时重复添加，可能导致内存泄漏
- ❌ 不符合 WSX 的声明式事件绑定方式

#### 4. 命名和概念混乱

**问题**：
- ❌ `viewDate` vs `currentDate` - 两个概念混淆
- ❌ `defaultView` vs `currentView` - 初始值和当前值混淆
- ❌ `eventDSL` - 应该叫 `dsl` 还是 `event-dsl`？
- ❌ `dslRuntime` - 内部状态，但命名不清晰

#### 5. 代码重复和结构混乱

**问题**：
- ❌ 文件中有重复的代码块（1200-1986行）
- ❌ `renderMonthView`, `renderWeekView`, `renderDayView` 逻辑重复
- ❌ 视图组件（`MonthView.wsx`, `WeekView.wsx`, `DayView.wsx`）存在但未使用

## 设计原则

### Web Component 标准

1. **Attributes vs Properties**
   - **Attributes**：HTML 属性，只能是字符串，用于初始化和简单配置
   - **Properties**：JavaScript 属性，可以是任何类型，用于复杂数据传递
   - 使用 `observedAttributes` 声明需要观察的属性
   - 使用 getter/setter 实现属性同步

2. **生命周期**
   - `constructor`：初始化，不访问 DOM
   - `connectedCallback`：DOM 已连接，可以访问 DOM
   - `disconnectedCallback`：清理资源
   - `attributeChangedCallback`：属性变化时触发

3. **事件系统**
   - 使用 `CustomEvent` 进行组件通信
   - 使用原生事件绑定（`onclick`）或 WSX 声明式绑定
   - 避免在 `connectedCallback` 中手动添加事件监听器

### WSX 框架最佳实践

1. **状态管理**
   - 使用 `@state` 装饰器管理内部响应式状态
   - 外部数据通过 properties 传入，内部状态通过 `@state` 管理
   - 区分"外部配置"和"内部状态"

2. **事件绑定**
   - 在 JSX 中使用 `onclick`（小写）进行声明式绑定
   - 避免使用 `addEventListener` 手动绑定
   - 事件处理函数应该是类方法

3. **组件结构**
   - 单一职责：每个组件只做一件事
   - 可组合：大组件拆分为小组件
   - 可测试：组件 API 清晰，易于测试

## 重新设计方案

### 1. 属性/状态分类

#### 外部配置（Properties）

```typescript
export default class Calendar extends WebComponent {
    // 通过 JavaScript properties 设置（数据模型）
    private _events: Event[] = [];
    private _user: User | undefined = undefined;

    // Properties getters/setters
    get events(): Event[] {
        return this._events;
    }

    set events(value: Event[]) {
        this._events = value;
        this.requestUpdate(); // 触发重新渲染
    }

    get user(): User | undefined {
        return this._user;
    }

    set user(value: User | undefined) {
        this._user = value;
        this.requestUpdate();
    }
}
```

#### HTML Attributes（简单配置）

```typescript
export default class Calendar extends WebComponent {
    // 声明需要观察的 attributes
    static get observedAttributes() {
        return ['view', 'date'];
    }

    // 从 attributes 获取初始值
    get initialView(): 'month' | 'week' | 'day' {
        return (this.getAttribute('view') as 'month' | 'week' | 'day') || 'month';
    }

    get initialDate(): Date {
        const dateAttr = this.getAttribute('date');
        return dateAttr ? new Date(dateAttr) : new Date();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === 'view' && newValue !== oldValue) {
            this.currentView = newValue as 'month' | 'week' | 'day';
        }
        if (name === 'date' && newValue !== oldValue) {
            this.currentDate = new Date(newValue!);
        }
    }
}
```

#### 内部状态（@state）

```typescript
export default class Calendar extends WebComponent {
    // 内部响应式状态
    @state currentView: 'month' | 'week' | 'day' = 'month';
    @state currentDate: Date = new Date();
    @state private showEventDialog: boolean = false;
    @state private editingEvent: Event | undefined = undefined;
    @state private showDeleteConfirm: boolean = false;
    @state private deletingEvent: Event | undefined = undefined;
}
```

### 2. 统一的命名规范

**外部配置（数据模型）**：
- `events` - 事件列表（Property）
- `user` - 当前用户（Property）

**HTML Attributes**：
- `view` - 初始视图（`month` | `week` | `day`）
- `date` - 初始日期（ISO 8601 字符串）

**内部状态**：
- `currentView` - 当前视图（响应式）
- `currentDate` - 当前日期（响应式）

**重要原则**：
- ✅ 组件只处理数据模型（`events`, `user`）
- ✅ 组件不涉及任何 DSL 逻辑
- ✅ 验证和 DSL 处理应该在外部完成

### 3. 事件绑定统一

**方案：使用 WSX 声明式事件绑定**

```typescript
renderToolbar() {
    return (
        <div class="calendar-toolbar">
            <button
                class="calendar-nav-button"
                onclick={() => this.handleNavigate(-1)}
            >
                ←
            </button>
            <button
                class="calendar-view-button"
                onclick={() => this.handleViewChange('month')}
            >
                月
            </button>
        </div>
    );
}

// 事件处理函数
private handleNavigate(direction: number): void {
    // 处理导航逻辑
}

private handleViewChange(view: 'month' | 'week' | 'day'): void {
    this.currentView = view;
    this.dispatchEvent(new CustomEvent('view-change', {
        detail: { view },
        bubbles: true
    }));
}
```

**移除 `attachEventListeners` 方法**，所有事件绑定在 JSX 中声明式完成。

### 4. 组件结构优化

#### 主组件：`Calendar.wsx`

```typescript
@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // Properties（数据模型）
    private _events: Event[] = [];
    private _user: User | undefined = undefined;

    // Internal state
    @state currentView: 'month' | 'week' | 'day' = 'month';
    @state currentDate: Date = new Date();
    // ... 其他内部状态

    // Properties getters/setters
    get events(): Event[] { return this._events; }
    set events(value: Event[]) {
        this._events = value;
        this.requestUpdate();
    }

    get user(): User | undefined { return this._user; }
    set user(value: User | undefined) {
        this._user = value;
        this.requestUpdate();
    }

    // Observed attributes
    static get observedAttributes() {
        return ['view', 'date'];
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

    private renderView() {
        switch (this.currentView) {
            case 'month':
                return <MonthView
                    date={this.currentDate}
                    events={this.events}
                    user={this.user}
                    onDateClick={(date) => this.handleDateClick(date)}
                    onDateDoubleClick={(date) => this.handleDateDoubleClick(date)}
                    onEventClick={(event) => this.handleEventClick(event)}
                />;
            case 'week':
                return <WeekView
                    date={this.currentDate}
                    events={this.events}
                    user={this.user}
                    onDateClick={(date) => this.handleDateClick(date)}
                    onEventClick={(event) => this.handleEventClick(event)}
                />;
            case 'day':
                return <DayView
                    date={this.currentDate}
                    events={this.events}
                    user={this.user}
                    onEventClick={(event) => this.handleEventClick(event)}
                />;
        }
    }
}
```

#### 子组件：`MonthView.wsx`, `WeekView.wsx`, `DayView.wsx`

```typescript
// MonthView.wsx
@autoRegister({ tagName: "wsx-month-view" })
export default class MonthView extends WebComponent {
    // Props (通过 attributes 或 properties 传入)
    date: Date = new Date();
    events: Event[] = [];
    user?: User;

    // Event callbacks (通过 properties 传入)
    onDateClick?: (date: Date) => void;
    onDateDoubleClick?: (date: Date) => void;
    onEventClick?: (event: Event) => void;

    render() {
        // 渲染月视图
    }
}
```

### 5. 使用示例

#### HTML 方式

```html
<wsx-calendar
    view="month"
    date="2024-12-30"
></wsx-calendar>

<script>
    const calendar = document.querySelector('wsx-calendar');
    
    // 通过 properties 设置复杂数据
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

#### JavaScript/TypeScript 方式

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

#### JSX 方式（在 WSX 项目中使用）

```tsx
<wsx-calendar
    view="month"
    date="2024-12-30"
    events={events}
    user={user}
    onViewChange={(e) => console.log('View changed:', e.detail.view)}
    onEventClick={(e) => console.log('Event clicked:', e.detail.event)}
/>
```

## 实施计划

### 阶段 1: API 重构（1周）

- [ ] 1.1 定义清晰的属性/状态分类
  - [ ] 外部配置（Properties）：`events`, `user`, `dsl`
  - [ ] HTML Attributes：`view`, `date`, `event-dsl`
  - [ ] 内部状态（@state）：`currentView`, `currentDate`, `dslRuntime`, 等

- [ ] 1.2 实现 `observedAttributes` 和 `attributeChangedCallback`
  - [ ] 声明 `observedAttributes`
  - [ ] 实现属性到状态的同步
  - [ ] 实现属性变化时的重新渲染

- [ ] 1.3 实现 Properties getters/setters
  - [ ] `events` property（数据模型）
  - [ ] `user` property（数据模型）
  - [ ] 属性变化时触发重新渲染

### 阶段 2: 事件绑定统一（3天）

- [ ] 2.1 移除 `attachEventListeners` 方法
- [ ] 2.2 将所有事件绑定改为 JSX 声明式绑定（`onclick`）
- [ ] 2.3 移除所有 `onClick`（React 风格）和 `addEventListener` 调用
- [ ] 2.4 测试事件绑定功能

### 阶段 3: 组件结构优化（1周）

- [ ] 3.1 重构视图组件
  - [ ] 将 `MonthView`, `WeekView`, `DayView` 改为独立的 WSX 组件
  - [ ] 通过 props 传递数据
  - [ ] 通过事件回调处理交互

- [ ] 3.2 移除重复代码
  - [ ] 清理 `Calendar.wsx` 中的重复代码块
  - [ ] 提取公共逻辑到工具函数

- [ ] 3.3 优化命名
  - [ ] 统一命名规范
  - [ ] 移除混淆的概念（如 `viewDate` vs `currentDate`）

### 阶段 4: 测试和文档（3天）

- [ ] 4.1 更新测试用例
  - [ ] 测试属性（attributes）设置
  - [ ] 测试属性（properties）设置
  - [ ] 测试事件绑定和触发
  - [ ] 测试状态变化和重新渲染

- [ ] 4.2 更新文档
  - [ ] API 文档
  - [ ] 使用示例
  - [ ] 迁移指南（从旧 API 迁移到新 API）

## 迁移指南

### 从旧 API 迁移到新 API

#### 旧代码

```typescript
const calendar = document.createElement('wsx-calendar');
calendar.eventDSL = dslString;
calendar.events = events;
calendar.user = user;
calendar.defaultView = 'month';
calendar.currentDate = new Date('2024-12-30');
```

#### 新代码

```typescript
const calendar = document.createElement('wsx-calendar');
calendar.setAttribute('view', 'month');
calendar.setAttribute('date', '2024-12-30');
// 注意：不再有 DSL property，组件只处理数据模型
calendar.events = events;
calendar.user = user;
```

## 总结

重新设计后的 Calendar 组件将：

1. ✅ **符合 Web Component 标准**：使用 `observedAttributes`、getters/setters、生命周期方法
2. ✅ **清晰的 API 设计**：区分 attributes、properties、内部状态
3. ✅ **统一的事件绑定**：使用 WSX 声明式事件绑定
4. ✅ **更好的可维护性**：组件结构清晰，代码不重复
5. ✅ **更好的可测试性**：API 清晰，易于测试

## 参考

- [Web Components 标准](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements 规范](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [WSX 框架文档](https://github.com/wsxjs/wsx)
- RFC-0001: Event Calendar Component with Event DSL
