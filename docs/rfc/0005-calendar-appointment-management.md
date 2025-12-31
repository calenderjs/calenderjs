# RFC-0001: Calendar Component for Appointment Management

**状态**: Draft  
**创建日期**: 2024-12-19  
**作者**: WSX Team

## 摘要

设计并实现一个功能完整的日历组件库 `@calenderjs/core`，基于 WSX 框架构建。该组件库提供 `<wsx-calendar>` 组件，用于预约管理领域。组件将提供月视图、周视图和日视图三种显示模式，界面设计参考 Google 日历，并包含流畅的动画过渡效果。组件将支持预约的创建、编辑、删除、拖拽调整时间等功能，同时保持 WSX 框架的核心理念：基于 Web Components 标准、使用 JSX 语法、零运行时开销。

**核心设计理念**：
- **事件 DSL 驱动**：Calendar 组件由事件 DSL（Appointment DSL）驱动，组件根据 DSL 配置来渲染和管理事件。组件不直接处理业务逻辑，而是依赖 DSL 定义的类型、验证规则、行为配置和显示规则。
- **业务服务分离**：Appointment DSL 是业务服务层面的（见 RFC-0003），由业务服务定义和管理。Calendar 组件是纯前端组件，通过接收业务服务提供的 DSL 运行时来渲染事件。这种分离使得：
  - 业务规则在服务端定义和管理（多租户、权限、业务逻辑）
  - 前端组件专注于渲染和交互
  - 业务规则可以独立于组件实现，便于维护和扩展
- **纯前端组件**：本 RFC 仅关注纯前端组件库的实现，不包含任何后端服务或 API。组件库是独立的、可复用的 UI 组件集合。Appointment DSL 的定义和管理属于业务服务（RFC-0003）的职责。

## 动机

### 为什么需要这个功能？

在预约管理、日程安排、会议管理等应用场景中，日历组件是一个核心需求。目前 WSX 框架缺少一个功能完整、设计精美的日历组件示例，无法充分展示框架在复杂交互场景下的能力。

### 当前状况

目前 WSX 框架的基础组件库中还没有日历组件。开发者如果需要实现日历功能，需要从零开始构建，这增加了开发成本和学习曲线。

### 目标用户

- **应用开发者**：需要构建预约管理、日程安排等功能的开发者
- **框架学习者**：希望通过复杂组件示例学习 WSX 框架最佳实践的开发者
- **UI 设计师**：需要参考高质量组件实现的设计师

## 详细设计

### 核心概念

#### 数据驱动的组件设计

**Calendar 组件是数据驱动的**：
- 组件接收事件数据（Event[]）并渲染
- 组件不定义事件的数据结构
- 组件不包含业务逻辑
- 组件专注于渲染和交互

**DSL 的作用：约束数据**：
- **DSL（Domain Specific Language）**：领域特定语言，用于约束事件数据的结构和规则
- **领域**：预约管理领域（Appointment Domain）
- **约束方式**：定义事件类型、字段结构、验证规则、显示规则、行为规则

**组件与 DSL 的关系**：

```
业务服务（RFC-0003）
  ↓ 定义 DSL 配置
DSL 配置（AppointmentDSL）
  ↓ 传递给组件
Calendar 组件
  ↓ 接收事件数据
事件数据（Event[]）
  ↓ 根据 DSL 约束验证和渲染
渲染结果
```

**关键理解**：
- **组件是数据驱动的**：组件总是接收数据并渲染，这是组件的本质
- **DSL 是数据约束**：DSL 定义数据的结构、规则、验证，约束数据必须符合这些定义
- **不需要"运行时"**：组件直接使用 DSL 配置来验证和渲染数据，不需要额外的运行时层

#### DSL 配置（不是运行时）

**DSL 配置的结构**：

```typescript
/**
 * DSL 配置（由业务服务定义）
 */
interface AppointmentDSL {
  types: AppointmentType[];  // 事件类型定义列表
}

/**
 * 事件类型定义
 */
interface AppointmentType {
  id: string;                // 类型 ID（如 'meeting', 'vacation'）
  name: string;              // 类型名称
  fields: FieldDefinition[]; // 字段定义（约束数据结构）
  display: DisplayConfig;   // 显示配置（约束如何渲染）
  behavior: BehaviorConfig;  // 行为配置（约束交互行为）
  validation?: ValidationRule[]; // 验证规则（约束数据有效性）
}
```

**组件如何使用 DSL 配置**：

```typescript
// 1. 业务服务定义 DSL 配置（RFC-0003）
const dslConfig: AppointmentDSL = {
  types: [meetingType, vacationType, ...]
};

// 2. 组件接收 DSL 配置和事件数据
<wsx-calendar
    dsl={dslConfig}              // DSL 配置（约束数据）
    events={events}              // 事件数据（被约束的数据）
/>

// 3. 组件内部使用 DSL 配置：
// - 验证事件数据是否符合 DSL 定义的字段结构
// - 根据 DSL 的 display 配置渲染事件
// - 根据 DSL 的 behavior 配置控制交互
```

**事件数据结构（最小接口）**：

```typescript
/**
 * 事件数据（最小接口）
 * 组件只关心时间信息，其他字段由 DSL 定义
 */
interface Event {
  id: string;                    // 唯一标识符
  type: string;                   // DSL 类型 ID（用于查找 DSL 定义）
  startTime: Date;                // 开始时间
  endTime: Date;                  // 结束时间
  data: Record<string, any>;      // 其他数据（由 DSL 的 fields 定义约束）
}
```

**DSL 定义事件类型示例**：

```typescript
/**
 * DSL 定义事件类型（由业务服务定义）
 */
const meetingType: AppointmentType = {
  id: 'meeting',
  name: '会议',
  fields: [
    // When 相关字段
    { name: 'duration', type: 'number', default: 60 },
    
    // Where 相关字段
    { name: 'location', type: 'string', required: true },
    { name: 'room', type: 'string' },
    
    // Who 相关字段
    { name: 'attendees', type: 'array', items: { type: 'string' } },
    { name: 'organizer', type: 'string', required: true },
    
    // 其他业务字段
    { name: 'agenda', type: 'string' },
    { name: 'priority', type: 'enum', enum: ['low', 'normal', 'high'] },
  ],
  display: {
    color: '#4285f4',
    titleTemplate: '${title}',
    descriptionTemplate: '${location} • ${attendees.length} 人',
  },
  behavior: {
    draggable: true,
    resizable: true,
    minDuration: 15,
    timeConstraints: [
      { type: 'workingHours', value: { start: '09:00', end: '18:00' } }
    ],
  },
};
```

**事件在日历中的表示**：

- **月视图**：每个日期单元格显示该日的事件数量或预览
- **周视图**：时间轴上显示事件块，位置对应时间，高度对应时长
- **日视图**：类似周视图，但只显示单日，时间槽更细

#### 视图模式

1. **月视图（Month View）**
   - 显示整月的日期网格
   - 每个日期单元格显示该日的预约数量或预览
   - 支持点击日期跳转到日视图
   - 支持拖拽预约到不同日期

2. **周视图（Week View）**
   - 显示一周的详细时间轴（通常为 7 天）
   - 时间轴从 00:00 到 24:00，以小时或 30 分钟为间隔
   - 预约以时间块形式显示，高度对应时长
   - 支持拖拽调整预约时间
   - 支持拖拽调整预约时长（通过拖拽底部边缘）

3. **日视图（Day View）**
   - 显示单日的详细时间轴
   - 时间轴从 00:00 到 24:00，以 15 分钟或 30 分钟为间隔
   - 预约以时间块形式显示，位置和高度精确对应时间
   - 支持拖拽调整预约时间
   - 支持拖拽调整预约时长

#### 预约数据模型

```typescript
interface Appointment {
    id: string;                    // 唯一标识符
    title: string;                 // 预约标题
    startTime: Date;               // 开始时间
    endTime: Date;                 // 结束时间
    description?: string;          // 描述
    color?: string;                // 颜色标识（用于区分不同类型的预约）
    allDay?: boolean;              // 是否全天事件
    recurring?: RecurringRule;     // 重复规则（可选）
    attendees?: string[];         // 参与者列表
    location?: string;             // 地点
}

interface RecurringRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;               // 间隔（如每 2 周）
    endDate?: Date;                 // 结束日期
    count?: number;                 // 重复次数
    daysOfWeek?: number[];         // 星期几（0=周日）
}
```

#### 动画设计

参考 Google 日历的动画效果：

1. **视图切换动画**
   - 使用 CSS `transform` 和 `opacity` 实现淡入淡出
   - 使用 `transform: translateX()` 实现左右滑动切换
   - 动画时长：200-300ms，使用 `ease-out` 缓动函数

2. **预约拖拽动画**
   - 拖拽时使用 `transform: translate()` 跟随鼠标
   - 拖拽过程中显示半透明预览
   - 放置时使用弹性动画（spring animation）回到目标位置

3. **预约创建/删除动画**
   - 创建：从点击位置淡入并展开
   - 删除：淡出并收缩到点击位置

4. **时间轴滚动动画**
   - 使用 `scroll-behavior: smooth` 实现平滑滚动
   - 支持键盘导航（方向键、Page Up/Down）

### API设计

```typescript
interface CalendarProps {
    // ========== DSL 配置（数据约束）==========
    dsl: AppointmentDSL;                  // DSL 配置（必需）
    // DSL 配置的作用：
    // - 约束事件数据的结构和规则
    // - 定义事件类型、字段、验证规则、显示规则、行为规则
    // - 由业务服务（RFC-0003）定义和提供
    // - 组件使用 DSL 配置来验证和渲染事件数据
    
    // ========== 事件数据（数据驱动）==========
    events: Event[];                      // 事件列表（被 DSL 约束的数据）
    // Event 接口（最小定义）：
    // {
    //   id: string;
    //   type: string;              // DSL 类型 ID（用于查找 DSL 定义）
    //   startTime: Date;
    //   endTime: Date;
    //   data: Record<string, any>;  // 其他数据（由 DSL 的 fields 约束）
    // }
    
    onEventCreate?: (event: Partial<Event>) => void;
    onEventUpdate?: (id: string, event: Partial<Event>) => void;
    onEventDelete?: (id: string) => void;
    
    // ========== 视图控制 ==========
    defaultView?: 'month' | 'week' | 'day';
    currentDate?: Date;                    // 当前显示的日期
    onViewChange?: (view: 'month' | 'week' | 'day') => void;
    onDateChange?: (date: Date) => void;
    
    // ========== 显示配置 ==========
    firstDayOfWeek?: 0 | 1;                // 0=周日, 1=周一
    timeSlotDuration?: number;             // 时间槽间隔（分钟），默认 30
    minTime?: string;                      // 最小显示时间，如 "08:00"
    maxTime?: string;                      // 最大显示时间，如 "22:00"
    showWeekends?: boolean;                // 是否显示周末
    locale?: string;                       // 语言环境
    
    // ========== 交互配置（会被 DSL behavior 覆盖）==========
    editable?: boolean;                    // 是否可编辑（默认值，DSL 优先）
    draggable?: boolean;                   // 是否可拖拽（默认值，DSL 优先）
    resizable?: boolean;                   // 是否可调整大小（默认值，DSL 优先）
    selectable?: boolean;                  // 是否可选择时间段
    
    // ========== 样式配置（会被 DSL display 覆盖）==========
    appointmentColors?: string[];         // 预约颜色选项（默认值，DSL 优先）
    theme?: 'light' | 'dark';
    
    // ========== 自定义渲染（可选，DSL 渲染优先）==========
    renderAppointment?: (appointment: Appointment) => HTMLElement;
    renderHeader?: (date: Date, view: string) => HTMLElement;
}
```

**API 设计说明**：

1. **数据驱动**：
   - 组件是数据驱动的，总是接收 `events` 数据并渲染
   - 组件不定义事件结构，只处理最小的事件接口（id、type、startTime、endTime、data）

2. **DSL 约束数据**：
   - `dsl` 配置约束事件数据的结构和规则
   - 组件使用 DSL 配置来：
     - 验证事件数据是否符合 DSL 定义的字段结构
     - 根据 DSL 的 `display` 配置渲染事件
     - 根据 DSL 的 `behavior` 配置控制交互行为
     - 根据 DSL 的 `validation` 规则验证数据有效性

3. **DSL 配置优先级**：
   - DSL 的 `display` 配置会覆盖 `appointmentColors`
   - DSL 的 `behavior` 配置会覆盖 `editable`、`draggable`、`resizable`
   - DSL 的渲染规则会优先于自定义 `renderAppointment`

4. **业务规则由 DSL 定义**：
   - 验证规则：由 DSL 的 `validation` 和字段 `validation` 定义
   - 时间约束：由 DSL 的 `timeConstraints` 定义
   - 行为规则：由 DSL 的 `behavior` 定义
   - 显示规则：由 DSL 的 `display` 定义

### 组件结构

**重要说明**：
- **Calendar 组件**：纯前端组件，由事件 DSL 驱动，专注于渲染和交互
- **Appointment DSL**：业务服务层面的（RFC-0003），由业务服务定义和管理，包含业务规则、验证规则、行为配置等
- **组件与业务服务的协作**：业务服务提供 DSL 运行时和事件数据，Calendar 组件根据 DSL 配置来渲染和管理事件

#### 基础用法（使用 DSL，由业务服务提供）

```tsx
// 注意：DSL 定义和管理属于业务服务（RFC-0003）的职责
// 前端组件从业务服务获取 DSL 运行时

// 1. 从业务服务获取 DSL 定义（通常通过 API）
// const businessDSL = await fetchDSLFromBusinessService();

// 2. 编译 DSL（可以在前端或服务端完成）
const compiler = new AppointmentDSLCompiler();
const compiled = compiler.compile(businessDSL);
const runtime = new AppointmentDSLRuntime(compiled);

// 3. 从业务服务获取事件数据
// const appointments = await fetchAppointmentsFromBusinessService();

// 4. 使用 Calendar 组件（由业务服务的 DSL 驱动）
<wsx-calendar
    dsl-runtime={runtime}           // 从业务服务获取的 DSL 运行时
    appointments={appointments}     // 从业务服务获取的事件数据（包含 type 和 dslData）
    default-view="month"
    on-appointment-create={handleCreate}
    on-appointment-update={handleUpdate}
    on-appointment-delete={handleDelete}
>
    {/* 可选：自定义工具栏 */}
    <div slot="toolbar">
        <button onclick={handlePrev}>←</button>
        <button onclick={handleToday}>Today</button>
        <button onclick={handleNext}>→</button>
    </div>
</wsx-calendar>
```

#### 组件驱动模式

**Calendar 组件由事件 DSL 驱动的含义**：

1. **渲染驱动**：组件根据预约的 `type` 字段查找对应的 DSL 类型定义，使用 DSL 的 `display` 配置来渲染
2. **验证驱动**：创建/更新预约时，组件使用 DSL 的验证规则进行数据验证
3. **行为驱动**：组件的交互行为（拖拽、编辑、删除）由 DSL 的 `behavior` 配置控制
4. **业务规则驱动**：时间约束、字段要求等业务规则由 DSL 定义

**Appointment DSL 是业务服务层面的**：

- **业务服务定义**：Appointment DSL 由业务服务（RFC-0003）定义和管理，每个租户可以有自己的 DSL 配置
- **业务类型定义**：每种预约类型（会议、假期、培训等）都是业务概念，在业务服务中定义
- **业务规则**：验证规则、时间约束、行为配置都是业务需求，由业务服务管理
- **业务字段**：DSL 定义的字段（如 `attendees`、`location`、`priority`）都是业务属性
- **业务显示**：标题模板、描述模板、颜色配置都是业务展示需求
- **多租户支持**：不同租户可以有不同的 DSL 配置，由业务服务管理

#### 不使用 DSL 的降级模式（可选）

如果未提供 DSL 运行时，组件会降级到基础模式：

```tsx
<wsx-calendar
    appointments={appointments}     // 直接使用基础 Appointment 数据
    default-view="month"
    // 不使用 DSL，使用默认渲染和验证
/>
```

### 实现细节

#### 1. 组件架构设计

##### 1.1 组件组织结构

组件采用分层架构，从顶层到底层：

```
Calendar (主组件)
├── Toolbar (工具栏)
│   ├── ViewSwitcher (视图切换器)
│   ├── DateNavigator (日期导航)
│   └── CustomToolbar (自定义工具栏插槽)
│
├── ViewContainer (视图容器)
│   ├── MonthView (月视图)
│   │   ├── MonthHeader (月份标题)
│   │   ├── WeekDayHeader (星期标题)
│   │   └── DateGrid (日期网格)
│   │       └── DateCell (日期单元格)
│   │           └── AppointmentBlock (预约块)
│   │
│   ├── WeekView (周视图)
│   │   ├── WeekHeader (周标题)
│   │   ├── TimeColumn (时间列)
│   │   └── DayColumns (日期列)
│   │       └── TimeSlot (时间槽)
│   │           └── AppointmentBlock (预约块)
│   │
│   └── DayView (日视图)
│       ├── DayHeader (日标题)
│       ├── TimeColumn (时间列)
│       └── TimeSlots (时间槽)
│           └── AppointmentBlock (预约块)
│
└── EventSystem (事件系统)
    ├── CustomEventEmitter (自定义事件发射器)
    └── EventHandlers (事件处理器)
```

##### 1.2 组件职责划分

**主组件 (Calendar.wsx)**：
- 管理全局状态（当前视图、当前日期、预约列表）
- 协调子组件之间的通信
- 处理外部属性和事件
- 管理 DSL 运行时（如果提供）

**视图组件 (MonthView/WeekView/DayView)**：
- 负责特定视图的渲染逻辑
- 计算和布局预约块
- 处理视图内的事件（点击、拖拽等）
- 不直接修改全局状态，通过事件通知父组件

**工具组件 (AppointmentBlock)**：
- 渲染单个预约
- 支持 DSL 渲染（如果配置）
- 处理预约相关的事件（点击、拖拽开始等）

**工具函数 (utils/)**：
- 纯函数，无副作用
- 日期计算、预约分组、位置计算等
- 可独立测试

##### 1.3 组件通信模式

```
外部应用
  ↓ (props/attributes)
Calendar 主组件
  ↓ (props)
视图组件 (MonthView/WeekView/DayView)
  ↓ (props)
子组件 (DateCell/TimeSlot/AppointmentBlock)
  ↑ (CustomEvent)
事件冒泡到 Calendar 主组件
  ↑ (CustomEvent)
外部应用接收事件
```

#### 2. 事件系统设计

##### 2.1 事件类型定义

组件使用 CustomEvent 实现事件通信，符合 Web Components 标准：

```typescript
// Calendar.types.ts

/**
 * 预约创建事件
 */
export interface AppointmentCreateEvent extends CustomEvent {
  type: 'appointment-create';
  detail: {
    appointment: Partial<Appointment>;
    startTime?: Date;  // 如果从时间槽点击创建
    endTime?: Date;
  };
}

/**
 * 预约更新事件
 */
export interface AppointmentUpdateEvent extends CustomEvent {
  type: 'appointment-update';
  detail: {
    id: string;
    appointment: Partial<Appointment>;
    // 更新类型
    updateType: 'time' | 'duration' | 'property' | 'all';
    // 原始数据（用于撤销）
    original?: Appointment;
  };
}

/**
 * 预约删除事件
 */
export interface AppointmentDeleteEvent extends CustomEvent {
  type: 'appointment-delete';
  detail: {
    id: string;
    appointment: Appointment;  // 被删除的预约数据
  };
}

/**
 * 预约点击事件
 */
export interface AppointmentClickEvent extends CustomEvent {
  type: 'appointment-click';
  detail: {
    appointment: Appointment;
    event: MouseEvent;
  };
}

/**
 * 视图切换事件
 */
export interface ViewChangeEvent extends CustomEvent {
  type: 'view-change';
  detail: {
    view: 'month' | 'week' | 'day';
    previousView: 'month' | 'week' | 'day';
  };
}

/**
 * 日期改变事件
 */
export interface DateChangeEvent extends CustomEvent {
  type: 'date-change';
  detail: {
    date: Date;
    previousDate: Date;
  };
}

/**
 * 时间槽选择事件
 */
export interface TimeSlotSelectEvent extends CustomEvent {
  type: 'time-slot-select';
  detail: {
    startTime: Date;
    endTime: Date;
    date: Date;
  };
}
```

##### 2.2 事件数据形状（与 DSL 集成）

当使用 DSL 时，事件数据包含 DSL 相关信息：

```typescript
/**
 * DSL 增强的预约创建事件
 */
export interface DSLAppointmentCreateEvent extends AppointmentCreateEvent {
  detail: {
    appointment: Partial<Appointment>;
    // DSL 相关
    type?: string;  // DSL 类型 ID
    dslData?: Record<string, any>;  // DSL 扩展数据
    // 验证结果
    validation?: {
      valid: boolean;
      errors: string[];
    };
  };
}

/**
 * DSL 增强的预约更新事件
 */
export interface DSLAppointmentUpdateEvent extends AppointmentUpdateEvent {
  detail: {
    id: string;
    appointment: Partial<Appointment>;
    type?: string;
    dslData?: Record<string, any>;
    // 行为检查（基于 DSL behavior 配置）
    behaviorCheck?: {
      draggable: boolean;
      resizable: boolean;
      editable: boolean;
      deletable: boolean;
    };
  };
}
```

##### 2.3 事件处理流程

```typescript
// Calendar.wsx 中的事件处理

export default class Calendar extends WebComponent {
  /**
   * 处理预约创建
   */
  private handleAppointmentCreate(data: {
    startTime: Date;
    endTime: Date;
    type?: string;
  }): void {
    // 如果使用 DSL，验证数据
    if (this.dslRuntime && data.type) {
      const validation = this.dslRuntime.validate(
        { startTime: data.startTime, endTime: data.endTime },
        data.type
      );
      if (!validation.valid) {
        this.dispatchEvent(new CustomEvent('appointment-create-error', {
          detail: { errors: validation.errors }
        }));
        return;
      }
    }

    // 派发创建事件
    this.dispatchEvent(new CustomEvent('appointment-create', {
      detail: {
        appointment: {
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
        }
      },
      bubbles: true,
      composed: true,  // 允许事件穿透 Shadow DOM
    }));
  }

  /**
   * 处理预约更新
   */
  private handleAppointmentUpdate(
    id: string,
    updates: Partial<Appointment>
  ): void {
    const appointment = this.appointments.find(apt => apt.id === id);
    if (!appointment) return;

    // 如果使用 DSL，检查行为配置
    if (this.dslRuntime && appointment.type) {
      const behavior = this.dslRuntime.getBehavior(appointment.type);
      if (behavior && !behavior.editable) {
        this.dispatchEvent(new CustomEvent('appointment-update-error', {
          detail: { error: '此类型的预约不可编辑' }
        }));
        return;
      }

      // 验证更新数据
      const validation = this.dslRuntime.validate(
        { ...appointment, ...updates },
        appointment.type
      );
      if (!validation.valid) {
        this.dispatchEvent(new CustomEvent('appointment-update-error', {
          detail: { errors: validation.errors }
        }));
        return;
      }
    }

    // 派发更新事件
    this.dispatchEvent(new CustomEvent('appointment-update', {
      detail: {
        id,
        appointment: updates,
        updateType: this.determineUpdateType(updates),
        original: appointment,
      },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   * 处理预约删除
   */
  private handleAppointmentDelete(id: string): void {
    const appointment = this.appointments.find(apt => apt.id === id);
    if (!appointment) return;

    // 如果使用 DSL，检查行为配置
    if (this.dslRuntime && appointment.type) {
      const behavior = this.dslRuntime.getBehavior(appointment.type);
      if (behavior && !behavior.deletable) {
        this.dispatchEvent(new CustomEvent('appointment-delete-error', {
          detail: { error: '此类型的预约不可删除' }
        }));
        return;
      }
    }

    // 派发删除事件
    this.dispatchEvent(new CustomEvent('appointment-delete', {
      detail: { id, appointment },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   * 处理拖拽
   */
  private handleAppointmentDrag(
    id: string,
    newStartTime: Date,
    newEndTime: Date
  ): void {
    const appointment = this.appointments.find(apt => apt.id === id);
    if (!appointment) return;

    // 如果使用 DSL，检查行为配置和时间约束
    if (this.dslRuntime && appointment.type) {
      const behavior = this.dslRuntime.getBehavior(appointment.type);
      if (behavior && !behavior.draggable) {
        return;  // 不允许拖拽，静默失败
      }

      // 检查时间约束
      const timeCheck = this.dslRuntime.checkTimeConstraints(
        { ...appointment, startTime: newStartTime, endTime: newEndTime },
        appointment.type
      );
      if (!timeCheck.valid) {
        this.dispatchEvent(new CustomEvent('appointment-drag-error', {
          detail: { errors: timeCheck.errors }
        }));
        return;
      }
    }

    // 派发更新事件（拖拽本质上是时间更新）
    this.handleAppointmentUpdate(id, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }
}
```

##### 2.4 外部事件监听

```typescript
// 外部使用示例
const calendar = document.querySelector('wsx-calendar');

calendar.addEventListener('appointment-create', (e: AppointmentCreateEvent) => {
  const { appointment } = e.detail;
  // 处理预约创建
  console.log('创建预约:', appointment);
});

calendar.addEventListener('appointment-update', (e: AppointmentUpdateEvent) => {
  const { id, appointment, updateType } = e.detail;
  // 处理预约更新
  console.log('更新预约:', id, appointment, updateType);
});

calendar.addEventListener('appointment-delete', (e: AppointmentDeleteEvent) => {
  const { id } = e.detail;
  // 处理预约删除
  console.log('删除预约:', id);
});

calendar.addEventListener('appointment-click', (e: AppointmentClickEvent) => {
  const { appointment } = e.detail;
  // 显示预约详情
  showAppointmentDetails(appointment);
});
```

#### 3. WSX 组件架构

**组件结构**：
```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister, state } from "@wsxjs/wsx-core";
import styles from "./Calendar.css?inline";
import { AppointmentDSLRuntime } from "@calenderjs/dsl";

@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    @state private currentView: 'month' | 'week' | 'day' = 'month';
    @state private currentDate: Date = new Date();
    @state private appointments: Appointment[] = [];
    private dslRuntime?: AppointmentDSLRuntime;
    
    constructor() {
        super({
            styles,
            styleName: "wsx-calendar",
        });
    }

    /**
     * 设置 DSL 运行时
     */
    setDSLRuntime(runtime: AppointmentDSLRuntime): void {
        this.dslRuntime = runtime;
        this.rerender();
    }

    render(): HTMLElement {
        return (
            <div class="calendar-container">
                {this.renderToolbar()}
                {this.renderView()}
            </div>
        );
    }

    private renderView(): HTMLElement {
        switch (this.currentView) {
            case 'month':
                return this.renderMonthView();
            case 'week':
                return this.renderWeekView();
            case 'day':
                return this.renderDayView();
        }
    }
}
```

**关键特性**：
- 使用 `WebComponent` 基类，支持 Shadow DOM 样式隔离
- 使用 `@state` 装饰器实现响应式状态管理
- 使用 `@autoRegister` 自动注册为自定义元素
- 样式通过 `?inline` 导入，内联到组件中
- 使用 JSX 语法进行声明式渲染
- 支持 DSL 运行时注入

#### 2. Vite 构建配置

**vite.config.ts**：
```typescript
import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: "src/Calendar.wsx",
            name: "WSXCalendar",
            formats: ["es", "cjs"],
            fileName: (format) => `calendar.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: ["@wsxjs/wsx-core"],
            output: {
                globals: {
                    "@wsxjs/wsx-core": "WSXCore",
                },
            },
        },
        // 关键配置：禁用CSS代码分割，确保CSS内联到JS中
        // 这对于 Shadow DOM 组件至关重要
        cssCodeSplit: false,
        // 只在开发环境生成 source maps
        sourcemap: process.env.NODE_ENV === "development",
    },
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "jsx",
            jsxFragment: "Fragment",
        }),
    ],
    // 开发模式下解析 workspace packages 到源文件
    // 生产模式下使用 package.json exports (dist 文件)
    resolve: {
        alias:
            process.env.NODE_ENV === "development"
                ? {
                      "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts"),
                  }
                : undefined,
    },
});
```

**构建配置说明**：
- **库模式构建**：使用 `build.lib` 配置，输出为库格式
- **CSS 内联**：`cssCodeSplit: false` 确保 CSS 内联到 JS 中，这对于 Shadow DOM 组件至关重要
- **外部依赖**：`@wsxjs/wsx-core` 标记为外部依赖，避免重复打包
- **WSX 插件**：使用 `@wsxjs/wsx-vite-plugin` 处理 `.wsx` 文件
- **开发别名**：开发模式下解析到源文件，便于调试

**package.json 配置**：
```json
{
  "name": "@wsxjs/wsx-calendar",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/calendar.cjs",
  "module": "./dist/calendar.js",
  "types": "./dist/calendar.d.ts",
  "exports": {
    ".": {
      "import": "./dist/calendar.js",
      "require": "./dist/calendar.cjs",
      "types": "./dist/calendar.d.ts"
    },
    "./styles": "./dist/calendar.css"
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.0.1"
  }
}
```

##### 2.5 事件数据形状（完整定义）

**基础预约数据结构**：

```typescript
/**
 * 基础预约接口
 */
export interface Appointment {
  // 必需字段
  id: string;                    // 唯一标识符
  title: string;                  // 标题
  startTime: Date;                // 开始时间
  endTime: Date;                  // 结束时间

  // 可选字段
  description?: string;           // 描述
  color?: string;                  // 颜色（十六进制或 CSS 颜色值）
  allDay?: boolean;               // 是否全天事件
  location?: string;              // 地点
  attendees?: string[];          // 参与者列表（邮箱或 ID）

  // 重复规则
  recurring?: RecurringRule;

  // DSL 相关字段（当使用 DSL 时）
  type?: string;                 // DSL 类型 ID（如 'meeting', 'vacation'）
  dslData?: Record<string, any>; // DSL 扩展数据（根据 DSL 类型定义）
}

/**
 * 重复规则
 */
export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;               // 间隔（如每 2 周）
  endDate?: Date;                 // 结束日期
  count?: number;                 // 重复次数
  daysOfWeek?: number[];          // 星期几（0=周日）
  dayOfMonth?: number;            // 每月第几天
}
```

**DSL 增强的预约数据结构**：

```typescript
/**
 * DSL 增强的预约（运行时）
 */
export interface DSLAppointment extends Appointment {
  type: string;                   // 必需：DSL 类型 ID
  dslData: Record<string, any>;   // 必需：DSL 数据

  // 渲染后的数据（由 DSL 运行时生成）
  rendered?: {
    title: string;                // 渲染后的标题（基于 titleTemplate）
    description?: string;         // 渲染后的描述（基于 descriptionTemplate）
    color: string;                 // 渲染后的颜色（基于 display.color）
    icon?: string;                 // 图标（基于 display.icon）
  };
}

/**
 * DSL 预约类型示例
 */
// 会议类型
const meetingAppointment: DSLAppointment = {
  id: '1',
  type: 'meeting',
  title: '团队会议',
  startTime: new Date('2024-12-20T10:00:00'),
  endTime: new Date('2024-12-20T11:00:00'),
  dslData: {
    attendees: ['user1@example.com', 'user2@example.com'],
    location: '会议室 A',
    priority: 'high',
  },
};

// 假期类型
const vacationAppointment: DSLAppointment = {
  id: '2',
  type: 'vacation',
  title: '年假',
  startTime: new Date('2024-12-25T00:00:00'),
  endTime: new Date('2024-12-27T23:59:59'),
  allDay: true,
  dslData: {
    reason: '年假',
    approvedBy: 'manager@example.com',
    days: 3,
  },
};
```

**事件数据形状总结**：

| 事件类型 | 数据形状 | DSL 增强 |
|---------|---------|---------|
| `appointment-create` | `{ appointment: Partial<Appointment> }` | `{ appointment: Partial<DSLAppointment>, validation?: ValidationResult }` |
| `appointment-update` | `{ id: string, appointment: Partial<Appointment>, updateType: string }` | `{ id: string, appointment: Partial<DSLAppointment>, behaviorCheck?: BehaviorConfig }` |
| `appointment-delete` | `{ id: string, appointment: Appointment }` | `{ id: string, appointment: DSLAppointment }` |
| `appointment-click` | `{ appointment: Appointment, event: MouseEvent }` | `{ appointment: DSLAppointment, rendered?: RenderedAppointment }` |
| `appointment-drag` | `{ id: string, newStartTime: Date, newEndTime: Date }` | `{ id: string, newStartTime: Date, newEndTime: Date, timeCheck?: ValidationResult }` |

#### 3. DSL 集成与事件渲染

##### 3.1 组件对 DSL 的依赖

Calendar 组件通过 `AppointmentDSLRuntime` 来渲染事件。当提供 DSL 运行时后，组件会：

1. **类型识别**：根据预约的 `type` 字段识别 DSL 类型
2. **数据验证**：使用 DSL 验证器验证预约数据
3. **渲染增强**：使用 DSL 渲染器生成渲染后的数据（标题、描述、颜色等）
4. **行为检查**：根据 DSL 行为配置决定是否允许拖拽、编辑等操作

```typescript
// Calendar.wsx 中的 DSL 集成
export default class Calendar extends WebComponent {
  private dslRuntime?: AppointmentDSLRuntime;

  /**
   * 设置 DSL 运行时
   */
  setDSLRuntime(runtime: AppointmentDSLRuntime): void {
    this.dslRuntime = runtime;
    this.rerender();
  }

  /**
   * 渲染预约（使用 DSL）
   */
  private renderAppointment(appointment: Appointment): HTMLElement {
    let renderedData: RenderedAppointment;
    
    // 如果使用 DSL 且有类型
    if (this.dslRuntime && appointment.type) {
      // 使用 DSL 运行时渲染
      renderedData = this.dslRuntime.render(appointment, appointment.type);
    } else {
      // 使用默认渲染
      renderedData = {
        title: appointment.title,
        description: appointment.description,
        color: appointment.color || '#4285f4',
      };
    }

    return (
      <div
        class="appointment-block"
        style={{ backgroundColor: renderedData.color }}
      >
        <div class="appointment-title">{renderedData.title}</div>
        {renderedData.description && (
          <div class="appointment-description">{renderedData.description}</div>
        )}
        {renderedData.icon && (
          <span class="appointment-icon">{renderedData.icon}</span>
        )}
      </div>
    );
  }
}
```

##### 3.2 事件数据管理架构

**数据层次结构**：

```
Appointment[] (原始数据)
  ↓
按视图分组
  ↓
MonthViewData / WeekViewData / DayViewData
  ↓
按日期/时间槽组织
  ↓
DateCell / TimeSlot (包含 Appointment[])
  ↓
渲染 AppointmentBlock
```

**月视图数据管理**：

```typescript
/**
 * 月视图数据管理
 */
interface MonthViewData {
  // 当前月份信息
  year: number;
  month: number;
  
  // 日期网格（包含跨月日期）
  dateGrid: DateCell[];
  
  // 按日期索引的预约映射
  appointmentsByDate: Map<string, Appointment[]>;
}

interface DateCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];  // 该日期的预约列表
}

/**
 * 生成月视图数据
 */
private generateMonthViewData(
  year: number,
  month: number,
  appointments: Appointment[]
): MonthViewData {
  // 1. 计算月份范围
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  // 2. 生成日期网格（包含前后月的日期以填满周）
  const dateGrid = this.generateDateGrid(monthStart, monthEnd);
  
  // 3. 按日期分组预约
  const appointmentsByDate = new Map<string, Appointment[]>();
  
  appointments.forEach(appointment => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const current = new Date(start);
    
    // 处理跨天预约
    while (current <= end) {
      const dateKey = this.formatDateKey(current);
      if (!appointmentsByDate.has(dateKey)) {
        appointmentsByDate.set(dateKey, []);
      }
      appointmentsByDate.get(dateKey)!.push(appointment);
      current.setDate(current.getDate() + 1);
    }
  });
  
  // 4. 为每个日期单元格分配预约
  const dateCells: DateCell[] = dateGrid.map(date => ({
    date,
    isCurrentMonth: date.getMonth() === month,
    isToday: this.isToday(date),
    appointments: appointmentsByDate.get(this.formatDateKey(date)) || [],
  }));
  
  return {
    year,
    month,
    dateGrid: dateCells,
    appointmentsByDate,
  };
}
```

**周视图数据管理**：

```typescript
/**
 * 周视图数据管理
 */
interface WeekViewData {
  // 周的开始和结束日期
  weekStart: Date;
  weekEnd: Date;
  
  // 日期列表（7天）
  days: DayColumn[];
  
  // 时间槽配置
  timeSlots: TimeSlot[];
}

interface DayColumn {
  date: Date;
  isToday: boolean;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  hour: number;
  minute: number;
  appointments: Appointment[];  // 该时间槽的预约列表
  // 位置信息（用于渲染）
  top: number;
  height: number;
}

/**
 * 生成周视图数据
 */
private generateWeekViewData(
  weekStart: Date,
  appointments: Appointment[],
  minTime: string = '00:00',
  maxTime: string = '23:59',
  slotDuration: number = 30
): WeekViewData {
  // 1. 生成时间槽列表
  const timeSlots = this.generateTimeSlots(minTime, maxTime, slotDuration);
  
  // 2. 为每一天生成日期列
  const days: DayColumn[] = [];
  const current = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(current);
    dayDate.setDate(weekStart.getDate() + i);
    
    // 3. 计算该日期的预约
    const dayAppointments = appointments.filter(apt =>
      this.isAppointmentOnDate(apt, dayDate)
    );
    
    // 4. 为每个时间槽分配预约
    const dayTimeSlots: TimeSlot[] = timeSlots.map(slot => {
      const slotStart = new Date(dayDate);
      slotStart.setHours(slot.hour, slot.minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
      
      const slotAppointments = dayAppointments.filter(apt =>
        this.isAppointmentInTimeRange(apt, slotStart, slotEnd)
      );
      
      return {
        ...slot,
        appointments: slotAppointments,
        top: this.calculateSlotTop(slot, slotDuration),
        height: slotDuration * 2, // 假设每 30 分钟 60px
      };
    });
    
    days.push({
      date: dayDate,
      isToday: this.isToday(dayDate),
      timeSlots: dayTimeSlots,
    });
  }
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return {
    weekStart,
    weekEnd,
    days,
    timeSlots,
  };
}
```

**日视图数据管理**：

```typescript
/**
 * 日视图数据管理（类似周视图，但只包含单日）
 */
interface DayViewData {
  date: Date;
  isToday: boolean;
  timeSlots: TimeSlot[];
  appointments: Appointment[];  // 该日期的所有预约
}

/**
 * 生成日视图数据
 */
private generateDayViewData(
  date: Date,
  appointments: Appointment[],
  minTime: string = '00:00',
  maxTime: string = '23:59',
  slotDuration: number = 15  // 日视图使用更细的时间槽
): DayViewData {
  // 1. 过滤该日期的预约
  const dayAppointments = appointments.filter(apt =>
    this.isAppointmentOnDate(apt, date)
  );
  
  // 2. 生成时间槽
  const timeSlots = this.generateTimeSlots(minTime, maxTime, slotDuration);
  
  // 3. 为每个时间槽分配预约
  const slotsWithAppointments: TimeSlot[] = timeSlots.map(slot => {
    const slotStart = new Date(date);
    slotStart.setHours(slot.hour, slot.minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
    
    const slotAppointments = dayAppointments.filter(apt =>
      this.isAppointmentInTimeRange(apt, slotStart, slotEnd)
    );
    
    return {
      ...slot,
      appointments: slotAppointments,
      top: this.calculateSlotTop(slot, slotDuration),
      height: slotDuration * 4, // 假设每 15 分钟 60px
    };
  });
  
  return {
    date,
    isToday: this.isToday(date),
    timeSlots: slotsWithAppointments,
    appointments: dayAppointments,
  };
}
```

##### 3.3 数据更新与缓存策略

```typescript
export default class Calendar extends WebComponent {
  // 数据缓存
  private monthViewCache?: MonthViewData;
  private weekViewCache?: WeekViewData;
  private dayViewCache?: DayViewData;
  
  // 缓存键（用于判断是否需要重新计算）
  private cacheKey?: string;
  
  /**
   * 获取当前视图的数据（带缓存）
   */
  private getViewData(): MonthViewData | WeekViewData | DayViewData {
    const newCacheKey = this.generateCacheKey();
    
    // 如果缓存键相同，直接返回缓存
    if (this.cacheKey === newCacheKey && this.getCachedViewData()) {
      return this.getCachedViewData()!;
    }
    
    // 否则重新计算
    this.cacheKey = newCacheKey;
    return this.computeViewData();
  }
  
  /**
   * 生成缓存键
   */
  private generateCacheKey(): string {
    const dateKey = this.formatDateKey(this.currentDate);
    const viewKey = this.currentView;
    const appointmentsKey = this.appointments.length;
    return `${viewKey}-${dateKey}-${appointmentsKey}`;
  }
  
  /**
   * 计算视图数据
   */
  private computeViewData(): MonthViewData | WeekViewData | DayViewData {
    switch (this.currentView) {
      case 'month':
        this.monthViewCache = this.generateMonthViewData(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          this.appointments
        );
        return this.monthViewCache;
        
      case 'week':
        const weekStart = this.getWeekStart(this.currentDate);
        this.weekViewCache = this.generateWeekViewData(
          weekStart,
          this.appointments
        );
        return this.weekViewCache;
        
      case 'day':
        this.dayViewCache = this.generateDayViewData(
          this.currentDate,
          this.appointments
        );
        return this.dayViewCache;
    }
  }
  
  /**
   * 预约数据更新时清除缓存
   */
  private onAppointmentsChange(): void {
    this.monthViewCache = undefined;
    this.weekViewCache = undefined;
    this.dayViewCache = undefined;
    this.cacheKey = undefined;
    this.rerender();
  }
}
```

##### 3.4 DSL 渲染流程

```typescript
/**
 * 完整的 DSL 渲染流程
 */
private renderAppointmentWithDSL(appointment: Appointment): HTMLElement {
  // 1. 检查是否有 DSL 运行时和类型
  if (!this.dslRuntime || !appointment.type) {
    return this.renderAppointmentDefault(appointment);
  }
  
  // 2. 验证预约数据
  const validation = this.dslRuntime.validate(appointment, appointment.type);
  if (!validation.valid) {
    // 显示验证错误
    return this.renderAppointmentWithError(appointment, validation.errors);
  }
  
  // 3. 使用 DSL 运行时渲染
  const rendered = this.dslRuntime.render(appointment, appointment.type);
  
  // 4. 获取行为配置
  const behavior = this.dslRuntime.getBehavior(appointment.type);
  
  // 5. 渲染预约块
  return (
    <div
      class="appointment-block"
      style={{
        backgroundColor: rendered.color,
        cursor: behavior?.draggable ? 'move' : 'default',
      }}
      draggable={behavior?.draggable ?? true}
      data-appointment-id={appointment.id}
      data-appointment-type={appointment.type}
    >
      {rendered.icon && (
        <span class="appointment-icon">{rendered.icon}</span>
      )}
      <div class="appointment-title">{rendered.title}</div>
      {rendered.description && (
        <div class="appointment-description">{rendered.description}</div>
      )}
    </div>
  );
}
```

#### 4. 视图渲染引擎

**月视图渲染**：
- 计算月份的第一天和最后一天
- 生成日期网格（考虑跨月日期）
- 为每个日期计算对应的预约
- 使用 CSS Grid 布局
- **使用 DSL 渲染每个预约**

**周视图渲染**：
- 计算当前周的开始和结束日期
- 生成时间轴（从 minTime 到 maxTime）
- 为每个时间槽计算对应的预约
- 处理跨天预约的显示
- 使用绝对定位布局预约块
- **使用 DSL 渲染每个预约**

**日视图渲染**：
- 类似周视图，但只显示单日
- 时间槽更细（15 分钟或 30 分钟）
- 预约块更精确
- **使用 DSL 渲染每个预约**

#### 4. 拖拽系统

使用原生 HTML5 Drag and Drop API，结合 WSX 的事件处理：

```tsx
// 在 render 方法中为预约元素添加拖拽属性
private renderAppointment(appointment: Appointment): HTMLElement {
    return (
        <div
            class="appointment-block"
            draggable="true"
            onDragStart={(e) => this.handleDragStart(e, appointment)}
            onDragEnd={(e) => this.handleDragEnd(e)}
            style={{
                top: `${this.calculateTopPosition(appointment.startTime)}px`,
                height: `${this.calculateHeight(appointment.startTime, appointment.endTime)}px`,
            }}
        >
            <div class="appointment-title">{appointment.title}</div>
            <div class="appointment-time">
                {this.formatTime(appointment.startTime)} - {this.formatTime(appointment.endTime)}
            </div>
        </div>
    );
}

private handleDragStart(e: DragEvent, appointment: Appointment): void {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('appointment-id', appointment.id);
    e.dataTransfer.effectAllowed = 'move';
    // 添加拖拽样式
    (e.target as HTMLElement).classList.add('dragging');
}

private handleDragEnd(e: DragEvent): void {
    // 移除拖拽样式
    (e.target as HTMLElement)?.classList.remove('dragging');
}

// 时间槽拖放处理
private renderTimeSlot(hour: number, minute: number): HTMLElement {
    return (
        <div
            class="time-slot"
            onDrop={(e) => this.handleDrop(e, hour, minute)}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
            }}
        />
    );
}

private handleDrop(e: DragEvent, hour: number, minute: number): void {
    e.preventDefault();
    const appointmentId = e.dataTransfer?.getData('appointment-id');
    if (!appointmentId) return;
    
    const newTime = new Date(this.currentDate);
    newTime.setHours(hour, minute, 0, 0);
    
    this.updateAppointmentTime(appointmentId, newTime);
}
```

#### 5. 动画实现

使用 CSS 动画和 Web Animations API，结合 WSX 的响应式系统：

```css
/* Calendar.css - 内联到组件中 */
.calendar-container {
    position: relative;
    overflow: hidden;
}

.calendar-view {
    transition: opacity 250ms ease-out, transform 250ms ease-out;
}

.calendar-view-enter {
    opacity: 0;
    transform: translateX(20px);
}

.calendar-view-enter-active {
    opacity: 1;
    transform: translateX(0);
}

.appointment-block {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
    cursor: move;
}

.appointment-block.dragging {
    opacity: 0.7;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}

.appointment-block-enter {
    opacity: 0;
    transform: scale(0.9);
}

.appointment-block-enter-active {
    opacity: 1;
    transform: scale(1);
    transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.appointment-block-exit {
    opacity: 1;
    transform: scale(1);
}

.appointment-block-exit-active {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 200ms ease-out, transform 200ms ease-out;
}
```

**视图切换动画实现**：
```tsx
private switchView(newView: 'month' | 'week' | 'day'): void {
    // 添加退出动画类
    const currentViewElement = this.shadowRoot?.querySelector('.calendar-view');
    if (currentViewElement) {
        currentViewElement.classList.add('view-exit');
    }
    
    // 等待动画完成后再切换视图
    setTimeout(() => {
        this.currentView = newView;
        this.rerender();
        
        // 添加进入动画类
        requestAnimationFrame(() => {
            const newViewElement = this.shadowRoot?.querySelector('.calendar-view');
            if (newViewElement) {
                newViewElement.classList.add('view-enter');
            }
        });
    }, 250);
}
```

#### 6. 性能优化

**虚拟滚动**：
- 周视图和日视图只渲染可见时间范围
- 使用 `IntersectionObserver` API 检测可见区域
- 动态加载和卸载不可见的预约块

**预约聚合**：
- 月视图中，如果某日预约过多，显示 "+N more"
- 使用 `@state` 装饰器缓存聚合结果
- 只在预约数据变化时重新计算

**防抖处理**：
- 拖拽和滚动事件使用防抖
- 使用 WSX 的响应式系统，避免不必要的重渲染

**缓存计算**：
- 日期计算和预约分组结果缓存
- 使用 `Map` 和 `WeakMap` 存储计算结果
- 利用 WSX 的 DOM 缓存机制，复用 DOM 节点

**代码示例**：
```tsx
// 使用 @state 缓存计算结果
@state private cachedAppointmentsByDate: Map<string, Appointment[]> = new Map();

private getAppointmentsForDate(date: Date): Appointment[] {
    const dateKey = this.formatDateKey(date);
    if (this.cachedAppointmentsByDate.has(dateKey)) {
        return this.cachedAppointmentsByDate.get(dateKey)!;
    }
    
    const appointments = this.appointments.filter(apt => 
        this.isSameDay(apt.startTime, date)
    );
    this.cachedAppointmentsByDate.set(dateKey, appointments);
    return appointments;
}

// 预约数据变化时清除缓存
private onAppointmentsChange(): void {
    this.cachedAppointmentsByDate.clear();
    this.rerender();
}
```

### 示例用法

#### 基础用法

```tsx
import { LightComponent, autoRegister } from "@wsxjs/wsx-core";
import "./Calendar.wsx";

@autoRegister({ tagName: "appointment-manager" })
export default class AppointmentManager extends LightComponent {
    @state appointments: Appointment[] = [];

    render() {
        return (
            <wsx-calendar
                appointments={this.appointments}
                default-view="week"
                on-appointment-create={(e) => this.handleCreate(e.detail)}
                on-appointment-update={(e) => this.handleUpdate(e.detail.id, e.detail.appointment)}
                on-appointment-delete={(e) => this.handleDelete(e.detail.id)}
            />
        );
    }

    handleCreate(appointment: Partial<Appointment>) {
        const newAppointment: Appointment = {
            id: generateId(),
            title: appointment.title || 'New Appointment',
            startTime: appointment.startTime || new Date(),
            endTime: appointment.endTime || new Date(),
            ...appointment
        };
        this.appointments = [...this.appointments, newAppointment];
    }

    handleUpdate(id: string, updates: Partial<Appointment>) {
        this.appointments = this.appointments.map(apt =>
            apt.id === id ? { ...apt, ...updates } : apt
        );
    }

    handleDelete(id: string) {
        this.appointments = this.appointments.filter(apt => apt.id !== id);
    }
}
```

#### 高级用法：自定义渲染

```tsx
<wsx-calendar
    appointments={appointments}
    render-appointment={(appointment) => (
        <div class="custom-appointment">
            <strong>{appointment.title}</strong>
            <span>{formatTime(appointment.startTime)}</span>
        </div>
    )}
/>
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：组件使用 JSX 语法定义，提供声明式的 API
- [x] **信任浏览器**：使用原生 HTML5 Drag and Drop API、CSS 动画、Web Animations API
- [x] **零运行时**：组件逻辑在构建时编译，运行时只执行必要的 DOM 操作
- [x] **Web标准**：基于 Web Components 标准，使用 Custom Elements 和 Shadow DOM

### 理念契合说明

1. **Web Components 标准**：`<wsx-calendar>` 是一个标准的自定义元素，可以在任何框架或原生 HTML 中使用
2. **JSX 语法**：组件内部使用 JSX 渲染，外部也支持 JSX 语法配置
3. **响应式系统**：使用 `@state` 装饰器管理内部状态（当前视图、选中日期等）
4. **事件系统**：使用 CustomEvent 实现组件通信，符合 Web 标准
5. **样式隔离**：使用 Shadow DOM 实现样式隔离，避免样式冲突

## 权衡取舍

### 优势

- **功能完整**：提供月/周/日三种视图，满足大多数预约管理需求
- **设计精美**：参考 Google 日历，提供现代化的 UI 和流畅的动画
- **高度可定制**：支持自定义渲染、样式、交互行为
- **性能优秀**：使用虚拟滚动、缓存等优化技术
- **易于使用**：提供简洁的 API，易于集成到现有项目

### 劣势

- **复杂度较高**：实现三种视图和拖拽功能需要较多代码
- **学习曲线**：对于不熟悉日历组件的开发者，需要一定时间理解 API
- **浏览器兼容性**：某些高级特性（如 Web Animations API）需要 polyfill

### 替代方案

#### 方案 1: 使用第三方库（如 FullCalendar）

**优点**：
- 功能成熟，经过充分测试
- 社区支持好

**缺点**：
- 不符合 WSX 理念（不是 Web Components）
- 增加项目依赖
- 无法展示 WSX 框架能力

#### 方案 2: 简化版本（只实现月视图）

**优点**：
- 实现简单，开发周期短

**缺点**：
- 功能不完整，无法满足复杂需求
- 无法充分展示 WSX 框架能力

#### 方案 3: 当前方案（完整实现）

**优点**：
- 功能完整，满足各种需求
- 充分展示 WSX 框架能力
- 符合 WSX 理念

**缺点**：
- 开发周期较长
- 需要更多测试

## 未解决问题

1. **时区处理**：是否需要支持多时区？如何处理时区转换？
2. **国际化**：日期格式、星期名称、月份名称的本地化
3. **可访问性**：键盘导航、屏幕阅读器支持、ARIA 属性
4. **移动端适配**：触摸手势、响应式布局
5. **性能边界**：最多支持多少个预约？是否需要分页或虚拟化？

## 实现计划

### 文件结构

**组件文件结构**：
```
packages/calendar/
├── src/
│   ├── Calendar.wsx              # 主组件文件
│   ├── Calendar.css               # 组件样式（内联）
│   ├── Calendar.types.ts          # TypeScript 类型定义
│   ├── views/
│   │   ├── MonthView.wsx          # 月视图组件
│   │   ├── WeekView.wsx           # 周视图组件
│   │   └── DayView.wsx            # 日视图组件
│   ├── utils/
│   │   ├── date-utils.ts           # 日期计算工具
│   │   ├── appointment-utils.ts   # 预约处理工具
│   │   └── drag-drop-utils.ts     # 拖拽工具
│   └── index.ts                    # 导出入口
├── vite.config.ts                 # Vite 构建配置
├── package.json                   # 包配置
└── tsconfig.json                  # TypeScript 配置
```

**关键文件说明**：

1. **`Calendar.wsx`**：主组件文件
   - 使用 `WebComponent` 基类
   - 使用 `@state` 装饰器管理状态
   - 使用 `@autoRegister` 自动注册
   - 样式通过 `?inline` 导入

2. **`Calendar.css`**：组件样式
   - 使用 Shadow DOM 样式隔离
   - 包含所有视图的样式
   - 包含动画样式

3. **`vite.config.ts`**：Vite 构建配置
   - 使用 `@wsxjs/wsx-vite-plugin` 处理 `.wsx` 文件
   - 配置 `cssCodeSplit: false` 确保 CSS 内联
   - 配置外部依赖和别名

4. **视图组件**：`MonthView.wsx`、`WeekView.wsx`、`DayView.wsx`
   - 每个视图作为独立的 WSX 组件
   - 通过 props 传递数据和事件处理函数
   - 使用 JSX 语法进行声明式渲染

5. **工具函数**：`date-utils.ts`、`appointment-utils.ts`、`drag-drop-utils.ts`
   - 纯函数，便于测试
   - 不依赖组件实例
   - 可复用的工具函数

### 阶段规划

#### 阶段 1: 核心视图渲染（2 周）

1. **月视图实现**（3 天）
   - 日期网格生成
   - 预约聚合和显示
   - 日期导航

2. **周视图实现**（4 天）
   - 时间轴生成
   - 预约块定位和渲染
   - 跨天预约处理

3. **日视图实现**（2 天）
   - 基于周视图简化
   - 更细的时间槽

4. **视图切换**（1 天）
   - 视图切换逻辑
   - 基础动画

#### 阶段 2: 交互功能（2 周）

1. **预约创建**（2 天）
   - 点击时间槽创建
   - 创建表单/对话框
   - 数据验证

2. **预约编辑**（2 天）
   - 点击预约编辑
   - 编辑表单
   - 数据更新

3. **预约删除**（1 天）
   - 删除确认
   - 数据删除

4. **拖拽功能**（3 天）
   - 拖拽调整时间
   - 拖拽调整时长
   - 拖拽到不同日期

#### 阶段 3: 动画和优化（1 周）

1. **动画实现**（3 天）
   - 视图切换动画
   - 拖拽动画
   - 创建/删除动画

2. **性能优化**（2 天）
   - 虚拟滚动
   - 预约聚合优化
   - 事件防抖

#### 阶段 4: 测试和文档（1 周）

1. **单元测试**（2 天）
2. **集成测试**（2 天）
3. **文档编写**（1 天）

### 时间线

- **Week 1-2**: 阶段 1 - 核心视图渲染
- **Week 3-4**: 阶段 2 - 交互功能
- **Week 5**: 阶段 3 - 动画和优化
- **Week 6**: 阶段 4 - 测试和文档

### 依赖项

**运行时依赖**：
- **`@wsxjs/wsx-core`**：WSX 框架核心库（peer dependency）
  - 提供 `WebComponent` 基类
  - 提供 `@state` 装饰器
  - 提供 `@autoRegister` 装饰器
  - 提供 JSX 运行时支持

**开发依赖**：
- **`@wsxjs/wsx-vite-plugin`**：Vite 插件，处理 `.wsx` 文件
  - 自动注入 JSX pragma
  - 处理 JSX 语法转换
  - 支持 TypeScript

**可选依赖**：
- **日期处理库**：考虑使用 `date-fns` 或 `dayjs`（轻量级）
  - 如果使用，需要配置为外部依赖
  - 推荐使用 `date-fns`（更轻量，Tree-shaking 友好）

**不引入的依赖**：
- **动画库**：使用原生 CSS 动画和 Web Animations API
- **拖拽库**：使用原生 HTML5 Drag and Drop API
- **UI 框架**：完全基于 Web Components 标准，不依赖任何 UI 框架

**构建工具**：
- **Vite**：作为构建工具
- **TypeScript**：类型检查和编译
- **Rollup**：由 Vite 使用，进行代码打包

## 测试策略

### 单元测试

- 日期计算函数（月份第一天、最后一天、周的开始/结束）
- 预约分组和聚合逻辑
- 时间槽计算
- 拖拽位置到时间的转换

### 集成测试

- 视图切换功能
- 预约 CRUD 操作
- 拖拽调整预约
- 事件派发和监听

### 端到端测试

- 完整的用户流程：创建预约 → 编辑预约 → 删除预约
- 视图切换流程：月视图 → 周视图 → 日视图
- 拖拽流程：拖拽预约到不同时间/日期

## 文档计划

### 需要的文档

- [x] API 文档：完整的 Props 和 Events 说明
- [x] 使用指南：基础用法和高级用法示例
- [x] 示例代码：多个实际应用场景
- [x] 最佳实践：性能优化、可访问性、移动端适配
- [x] 设计文档：UI/UX 设计说明

### 文档位置

- API 文档：`packages/base-components/docs/calendar.md`
- 示例代码：`site/src/components/examples/CalendarExample.wsx`
- 设计文档：本 RFC 文档

## 向后兼容性

### 破坏性变更

无。这是一个新组件，不涉及现有 API 的变更。

### 迁移策略

不适用。

### 废弃计划

不适用。

## 性能影响

### 构建时性能

- 组件代码量较大（预计 2000-3000 行），但不会影响构建时间
- 不引入额外的构建时依赖

### 运行时性能

- **初始渲染**：月视图 < 50ms，周视图 < 100ms，日视图 < 50ms
- **视图切换**：< 200ms（包含动画）
- **拖拽响应**：< 16ms（60fps）
- **内存使用**：< 10MB（1000 个预约）

### 内存使用

- 预约数据缓存
- DOM 节点复用（使用 WSX 的缓存机制）
- 事件监听器管理

## 安全考虑

- **XSS 防护**：预约标题和描述使用 `textContent` 而非 `innerHTML`
- **数据验证**：所有用户输入都进行验证和清理
- **事件处理**：使用事件委托，避免内存泄漏

## 开发者体验

### 学习曲线

- **基础用法**：简单，只需传入预约数组
- **高级用法**：中等，需要理解 Props 和 Events
- **自定义渲染**：较难，需要理解组件内部结构

### 调试体验

- 提供详细的错误信息
- 支持开发模式下的调试日志
- 使用有意义的 CSS 类名，便于样式调试

### 错误处理

- 数据验证错误：显示清晰的错误信息
- 拖拽错误：回滚到原始位置
- 渲染错误：显示错误边界，不影响整个应用

## 社区影响

### 生态系统

- 丰富 WSX 组件库，提供复杂交互组件的参考实现
- 展示 WSX 框架在复杂场景下的能力
- 为其他开发者提供学习和参考的示例

### 第三方集成

- 可以与任何数据源集成（REST API、GraphQL、本地存储等）
- 支持与表单库集成（用于预约创建/编辑表单）
- 支持与状态管理库集成（Redux、MobX 等）

## 先例

### 业界实践

1. **Google Calendar**
   - 界面设计参考
   - 交互模式参考
   - 动画效果参考

2. **FullCalendar**
   - API 设计参考
   - 功能特性参考

3. **React Big Calendar**
   - 组件架构参考
   - 数据模型参考

### 学习借鉴

- **Google Calendar**：UI/UX 设计、动画效果
- **FullCalendar**：API 设计、功能特性
- **React Big Calendar**：组件架构、数据模型

## 附录

### 参考资料

- [Google Calendar](https://calendar.google.com/)
- [FullCalendar Documentation](https://fullcalendar.io/docs)
- [React Big Calendar](https://github.com/jquense/react-big-calendar)
- [HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

### 讨论记录

- 2024-12-19: 初始 RFC 创建，讨论核心功能和 API 设计

---

*这个 RFC 旨在为 WSX 框架提供一个功能完整、设计精美的日历组件，充分展示框架在复杂交互场景下的能力。*
