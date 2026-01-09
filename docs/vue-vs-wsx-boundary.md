# Vue vs WSX 使用边界指南 (AI 工作指南)

> **作者**: Evan You (Vue.js 创建者) + WSX Master  
> **创建日期**: 2025-01-08  
> **目标读者**: **AI Agents** (这是 AI 的工作指南，不是用户文档)  
> **目的**: 明确 Vue 和 WSX 在 CalenderJS 项目中的使用边界和决策原则，指导 AI 在开发时做出正确的技术选择

## 📋 核心原则 (AI 必须严格遵守)

### ⚠️ 铁律：绝不混合 Vue 和 WSX

**🚫 绝对禁止混合使用**：
- ❌ **永远不要在 WSX 文件中导入或使用 Vue**
- ❌ **永远不要在 Vue 文件中实现 WSX 组件逻辑**
- ❌ **永远不要在一个文件中同时使用两种技术**

**✅ 正确的做法**：
- WSX 组件（`.wsx` 文件）→ 只使用 WSX 技术栈
- Vue 应用（`.vue` 文件）→ 只使用 Vue 技术栈，通过 Web Components 标准使用 WSX 组件

### 关键澄清

**重要**：CalenderJS 日历组件**核心使用 WSX 框架构建，不是 Vue**。

**AI 必须理解**：
- ✅ **WSX**：用于构建核心日历组件（`@calenderjs/calendar`）
- ✅ **Vue**：用于 Vue 应用的集成层（如果将来需要 `@calenderjs/vue` 包）
- ✅ **React**：用于 React 应用的集成层（`@calenderjs/react` 包）

**AI 决策规则**：
- 当用户要求"构建日历组件"或"实现视图组件"时 → **使用 WSX**（创建 `.wsx` 文件）
- 当用户要求"在 Vue 应用中使用日历"或"创建 Vue 包装组件"时 → **使用 Vue**（创建 `.vue` 文件）
- 当用户要求"在 React 应用中使用日历"时 → **使用 React 包装器**（创建 `.tsx` 文件）

**AI 必须记住**：
- 📁 `.wsx` 文件 = 纯 WSX，零 Vue 依赖
- 📁 `.vue` 文件 = 纯 Vue，通过 Web Components API 使用 WSX 组件
- 🔒 **边界清晰，绝不混合**

## 🎯 技术栈定位

### WSX 框架

**WSX (Web Components Syntax Extension)** 是项目的**核心组件框架**。

```
WSX = JSX 语法 + Web Components 标准 + 零运行时开销
```

**特点**：
- ✅ 基于 Web Components 标准（Custom Elements + Shadow DOM）
- ✅ 使用 JSX 语法，提供声明式 API
- ✅ 构建时编译，运行时零开销
- ✅ 框架无关，可在任何框架中使用

**在项目中的角色**：
- 📦 `@calenderjs/calendar`：核心日历组件（使用 WSX 构建）
- 📦 `@calenderjs/calendar/src/views/*.wsx`：所有视图组件（DayView, WeekView, MonthView）

### Vue.js

**Vue.js** 是**应用层框架**，用于构建完整的 Vue 应用。

**在项目中的角色**：
- 📦 `@calenderjs/vue`（如果将来创建）：Vue 集成包装器
- 📦 Vue 应用中使用 WSX 日历组件

## 🗺️ AI 决策树（快速判断）

```
┌─────────────────────────────────────┐
│  需要构建日历组件核心功能？            │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
    [是]              [否]
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ 使用 WSX    │  │ 构建 Vue 应用？│
│             │  └──────┬───────┘
│ - 组件实现  │         │
│ - 视图渲染  │      [是]    [否]
│ - 状态管理  │         │        │
│ - 事件处理  │         ▼        ▼
└─────────────┘  ┌──────────┐  ┌──────────┐
                 │ 使用 Vue  │  │ 使用其他  │
                 │          │  │ 框架/原生 │
                 │ - 应用层  │  │          │
                 │ - 路由    │  │ - React  │
                 │ - 状态    │  │ - Angular│
                 │ - 集成    │  │ - 原生   │
                 └──────────┘  └──────────┘
```

## 📐 详细边界说明

### 1. 核心组件层（使用 WSX）

**何时使用 WSX**：

✅ **必须使用 WSX** 的场景：

1. **日历组件核心实现**
   ```typescript
   // ✅ 正确：使用 WSX 构建日历组件
   // packages/calendar/src/Calendar.wsx
   @autoRegister({ tagName: "wsx-calendar" })
   export default class Calendar extends WebComponent {
       // 组件实现
   }
   ```

2. **视图组件实现**
   ```typescript
   // ✅ 正确：使用 WSX 构建视图组件
   // packages/calendar/src/views/DayView.wsx
   @autoRegister({ tagName: "wsx-day-view" })
   export default class DayView extends WebComponent {
       // 视图实现
   }
   ```

3. **UI 组件实现**
   ```typescript
   // ✅ 正确：使用 WSX 构建可复用的 UI 组件
   // packages/calendar/src/components/EventCard.wsx
   @autoRegister({ tagName: "wsx-event-card" })
   export default class EventCard extends WebComponent {
       // UI 组件实现
   }
   ```

**WSX 负责**：
- ✅ 组件定义和实现
- ✅ 视图渲染逻辑
- ✅ 组件内部状态管理（`@state`）
- ✅ 组件生命周期管理
- ✅ 事件处理和分发
- ✅ 样式封装（Shadow DOM）

### 2. 应用集成层（使用 Vue）

**何时使用 Vue**：

✅ **应该使用 Vue** 的场景：

1. **Vue 应用集成**
   ```vue
   <!-- ✅ 正确：在 Vue 应用中使用 WSX 组件 -->
   <template>
     <wsx-calendar
       :view="currentView"
       :date="selectedDate"
       :events="events"
       @date-change="handleDateChange"
     />
   </template>
   
   <script setup lang="ts">
   import '@calenderjs/calendar'; // 注册 Web Component
   import { ref } from 'vue';
   
   const currentView = ref('month');
   const selectedDate = ref(new Date());
   const events = ref([]);
   
   const handleDateChange = (e: CustomEvent) => {
     selectedDate.value = e.detail.date;
   };
   </script>
   ```

2. **Vue 包装组件**（如果创建 `@calenderjs/vue` 包）
   ```typescript
   // ✅ 正确：创建 Vue 包装组件提供更好的集成体验
   // packages/vue/src/Calendar.vue
   <template>
     <wsx-calendar
       ref="calendarRef"
       :view="view"
       :date="date"
       :events="events"
       @date-change="handleDateChange"
     />
   </template>
   
   <script setup lang="ts">
   import { ref, watch } from 'vue';
   import '@calenderjs/calendar';
   
   const props = defineProps<CalendarProps>();
   const emit = defineEmits<CalendarEmits>();
   
   // Vue 响应式系统处理应用层状态
   </script>
   ```

3. **Vue 应用层功能**
   ```vue
   <!-- ✅ 正确：在 Vue 应用中处理业务逻辑 -->
   <template>
     <div class="app">
       <header>
         <button @click="createEvent">创建事件</button>
       </header>
       <wsx-calendar :events="events" />
       <event-form v-if="showForm" />
     </div>
   </template>
   
   <script setup lang="ts">
   import { useRouter } from 'vue-router';
   import { useEventStore } from '@/stores/event';
   
   // Vue 应用层：路由、状态管理、业务逻辑
   </script>
   ```

**Vue 负责**：
- ✅ 应用层状态管理（Pinia/Vuex）
- ✅ 路由管理（Vue Router）
- ✅ 应用级组件组合
- ✅ 业务逻辑处理
- ✅ 与后端 API 交互
- ✅ 表单处理和验证

### 3. 边界示例

#### ❌ 错误：在 WSX 组件中使用 Vue

```typescript
// ❌ 错误：不要在 WSX 组件中导入 Vue
import { ref, computed } from 'vue'; // ❌ 禁止！

@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // ❌ 错误：不要使用 Vue 的响应式系统
    const count = ref(0); // ❌ 禁止！
    
    // ✅ 正确：使用 WSX 的 @state
    @state private count: number = 0; // ✅ 正确
}
```

#### ✅ 正确：在 Vue 应用中使用 WSX 组件

```vue
<!-- ✅ 正确：Vue 应用中使用 WSX 组件 -->
<template>
  <div class="vue-app">
    <!-- Vue 应用层组件 -->
    <app-header />
    
    <!-- WSX 日历组件（Web Component） -->
    <wsx-calendar
      :view="view"
      :date="date"
      :events="events"
      @date-change="handleDateChange"
    />
    
    <!-- Vue 应用层组件 -->
    <app-sidebar />
  </div>
</template>

<script setup lang="ts">
import '@calenderjs/calendar'; // 注册 Web Component
import { ref } from 'vue';

// Vue 应用层状态管理
const view = ref('month');
const date = ref(new Date());
const events = ref([]);

// Vue 应用层事件处理
const handleDateChange = (e: CustomEvent) => {
  date.value = e.detail.date;
  // 可以调用 API、更新状态等
};
</script>
```

## 🎨 架构分层

```
┌─────────────────────────────────────────┐
│         Vue 应用层 (Application)          │
│  - 路由、状态管理、业务逻辑                │
│  - 使用 Vue 组件和 WSX Web Components    │
└──────────────┬──────────────────────────┘
               │
               │ 使用/集成
               │
┌──────────────▼──────────────────────────┐
│    Vue 集成层 (Integration)               │
│    @calenderjs/vue (可选)                 │
│    - Vue 包装组件                         │
│    - Vue Hooks/Composables               │
└──────────────┬──────────────────────────┘
               │
               │ 包装/使用
               │
┌──────────────▼──────────────────────────┐
│    WSX 组件层 (Core Components)         │
│    @calenderjs/calendar                  │
│    - Calendar.wsx                        │
│    - DayView.wsx                         │
│    - WeekView.wsx                        │
│    - MonthView.wsx                       │
└──────────────┬──────────────────────────┘
               │
               │ 基于
               │
┌──────────────▼──────────────────────────┐
│    Web Components 标准                   │
│    - Custom Elements                     │
│    - Shadow DOM                          │
│    - HTML Templates                      │
└──────────────────────────────────────────┘
```

## 📦 包结构说明

### 当前包结构

```
packages/
├── calendar/          # ✅ WSX 核心组件
│   └── src/
│       ├── Calendar.wsx
│       └── views/
│           ├── DayView.wsx
│           ├── WeekView.wsx
│           └── MonthView.wsx
│
├── react/            # ✅ React 集成层
│   └── src/
│       └── Calendar.tsx  # React 包装组件
│
└── vue/              # ⚠️ 如果将来需要（可选）
    └── src/
        └── Calendar.vue  # Vue 包装组件
```

### 包职责划分

| 包 | 框架 | 职责 | 依赖 |
|---|---|---|---|
| `@calenderjs/calendar` | **WSX** | 核心日历组件实现 | `@wsxjs/wsx-core` |
| `@calenderjs/react` | **React** | React 集成包装器 | `@calenderjs/calendar` |
| `@calenderjs/vue` | **Vue** | Vue 集成包装器（可选） | `@calenderjs/calendar` |

## 🔍 AI 决策检查清单

### AI：我应该使用 WSX 吗？

✅ **AI 必须使用 WSX**，如果用户要求：
- [ ] 实现日历组件的核心功能（Calendar.wsx, DayView.wsx 等）
- [ ] 创建可复用的 UI 组件（EventCard.wsx 等）
- [ ] 实现视图组件（月/周/日视图）
- [ ] 处理组件内部状态管理（使用 `@state`）
- [ ] 实现组件生命周期逻辑

**AI 行为**：
- 创建 `.wsx` 文件
- 使用 `@autoRegister` 装饰器
- 继承 `WebComponent` 或 `LightComponent`
- 使用 `@state` 管理状态
- 导入样式使用 `?inline`

### AI：我应该使用 Vue 吗？

✅ **AI 必须使用 Vue**，如果用户要求：
- [ ] 构建完整的 Vue 应用（.vue 文件）
- [ ] 创建 Vue 包装组件（`@calenderjs/vue` 包）
- [ ] 实现应用层状态管理（Pinia/Vuex）
- [ ] 实现路由管理（Vue Router）
- [ ] 处理业务逻辑和 API 调用
- [ ] 在 Vue 应用中使用 WSX 组件

**AI 行为**：
- 创建 `.vue` 文件
- 使用 Vue 3 Composition API (`<script setup>`)
- 在 Vue 模板中使用 `<wsx-calendar>` Web Component
- 使用 Vue 的响应式系统（`ref`, `reactive`, `computed`）
- 通过 `@calenderjs/calendar` 导入注册 Web Component

## 🚫 AI 禁止事项（严格禁止 - 绝不混合）

### ⚠️ 铁律：绝不混合 Vue 和 WSX

**AI 必须严格遵守以下规则，违反这些规则是严重错误**：

### ❌ AI 绝对禁止：在 WSX 组件中使用 Vue

```typescript
// ❌ 绝对禁止
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'pinia';

@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // ❌ 禁止使用 Vue API
}
```

### ❌ 不要在 Vue 应用中直接操作 WSX 组件内部

```vue
<!-- ❌ 错误：直接操作 Web Component 内部 -->
<template>
  <wsx-calendar ref="calendar" />
</template>

<script setup>
import { ref, onMounted } from 'vue';

const calendar = ref(null);

onMounted(() => {
  // ❌ 禁止：直接操作 Web Component 内部状态
  calendar.value._viewDate = new Date(); // ❌ 禁止！
  
  // ✅ 正确：通过属性或方法
  calendar.value.viewDate = new Date(); // ✅ 正确
  calendar.value.setView('week'); // ✅ 正确（如果有方法）
});
</script>
```

## ✅ 最佳实践

### 1. 组件通信

**WSX 组件之间**：
```typescript
// ✅ 正确：使用 CustomEvent
this.dispatchEvent(new CustomEvent('date-change', {
    detail: { date: this.viewDate },
    bubbles: true
}));
```

**Vue 应用与 WSX 组件**：
```vue
<!-- ✅ 正确：使用 Vue 事件绑定 -->
<template>
  <wsx-calendar @date-change="handleDateChange" />
</template>

<script setup>
const handleDateChange = (e: CustomEvent) => {
  // Vue 应用层处理事件
  console.log('Date changed:', e.detail.date);
};
</script>
```

### 2. 状态管理

**WSX 组件内部**：
```typescript
// ✅ 正确：使用 @state 管理组件内部状态
@state private viewDate: Date = new Date();
@state private events: Event[] = [];
```

**Vue 应用层**：
```vue
<!-- ✅ 正确：使用 Vue 响应式系统管理应用状态 -->
<script setup>
import { ref } from 'vue';

const viewDate = ref(new Date());
const events = ref([]);
</script>
```

### 3. 样式管理

**WSX 组件**：
```typescript
// ✅ 正确：使用 Shadow DOM 样式隔离
import styles from "./Calendar.css?inline";

constructor() {
    super({ styles, styleName: "wsx-calendar" });
}
```

**Vue 应用**：
```vue
<!-- ✅ 正确：使用 Vue 的 scoped 样式 -->
<style scoped>
.app {
  /* 应用层样式 */
}
</style>
```

## 📚 参考示例

### 完整示例：Vue 应用中使用 WSX 日历组件

```vue
<!-- App.vue -->
<template>
  <div class="calendar-app">
    <!-- Vue 应用层：导航栏 -->
    <nav class="app-nav">
      <button @click="goToToday">今天</button>
      <select v-model="view">
        <option value="month">月视图</option>
        <option value="week">周视图</option>
        <option value="day">日视图</option>
      </select>
    </nav>
    
    <!-- WSX 组件：日历 -->
    <wsx-calendar
      :view="view"
      :date="selectedDate"
      :events="events"
      @date-change="handleDateChange"
      @event-click="handleEventClick"
    />
    
    <!-- Vue 应用层：事件表单 -->
    <event-form
      v-if="showForm"
      :event="selectedEvent"
      @save="handleSaveEvent"
      @cancel="showForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import '@calenderjs/calendar'; // 注册 Web Component
import type { Event } from '@calenderjs/event-model';

// Vue 应用层状态
const view = ref<'month' | 'week' | 'day'>('month');
const selectedDate = ref(new Date());
const events = ref<Event[]>([]);
const selectedEvent = ref<Event | null>(null);
const showForm = ref(false);

// Vue 应用层方法
const goToToday = () => {
  selectedDate.value = new Date();
};

const handleDateChange = (e: CustomEvent<{ date: Date }>) => {
  selectedDate.value = e.detail.date;
  // 可以在这里调用 API 加载新日期的事件
  loadEventsForDate(e.detail.date);
};

const handleEventClick = (e: CustomEvent<{ event: Event }>) => {
  selectedEvent.value = e.detail.event;
  showForm.value = true;
};

const handleSaveEvent = (event: Event) => {
  // 保存事件到后端
  saveEventToBackend(event).then(() => {
    // 更新事件列表
    loadEvents();
    showForm.value = false;
  });
};

// Vue 应用层：API 调用
const loadEvents = async () => {
  events.value = await fetchEvents();
};

const loadEventsForDate = async (date: Date) => {
  events.value = await fetchEventsForDate(date);
};

const saveEventToBackend = async (event: Event) => {
  return await api.post('/events', event);
};
</script>

<style scoped>
.calendar-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-nav {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
</style>
```

## 🎯 总结

### 核心原则

1. **WSX = 组件实现层**
   - 所有日历组件的核心实现使用 WSX
   - WSX 组件是框架无关的 Web Components

2. **Vue = 应用集成层**
   - Vue 用于构建完整的应用
   - Vue 通过 Web Components 标准使用 WSX 组件

3. **清晰的边界**
   - WSX 组件不依赖 Vue
   - Vue 应用通过标准 Web Components API 使用 WSX 组件
   - 如果需要更好的集成体验，可以创建 Vue 包装组件

### 记住

> **"WSX 构建组件，Vue 构建应用"**

- WSX 负责：组件实现、视图渲染、组件状态
- Vue 负责：应用架构、路由、全局状态、业务逻辑

---

## 🤖 AI 工作流程

### 当用户提出需求时，AI 应该：

1. **识别需求类型**
   - 组件实现需求 → 使用 WSX
   - 应用集成需求 → 使用对应框架（Vue/React）

2. **选择正确的技术栈**
   - 参考本指南的决策树
   - 检查清单确认

3. **实现代码**
   - 遵循本指南的最佳实践
   - 避免禁止事项

4. **验证边界**
   - 确保 WSX 组件不依赖 Vue
   - 确保 Vue 应用通过标准 API 使用 WSX 组件

### AI 常见错误（必须避免 - 绝不混合）

❌ **错误 1**: 在 `.wsx` 文件中导入 Vue（**严重错误**）
```typescript
// ❌ AI 绝对不要这样做 - 这是混合使用！
import { ref } from 'vue'; // 🚫 禁止！WSX 文件不能有 Vue 依赖
import { computed } from 'vue'; // 🚫 禁止！
import { useRouter } from 'vue-router'; // 🚫 禁止！

@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // ❌ 错误：混合使用
}
```

❌ **错误 2**: 在 WSX 组件中使用 Vue 响应式系统
```typescript
// ❌ AI 绝对不要这样做 - 混合使用！
@autoRegister({ tagName: "wsx-calendar" })
export default class Calendar extends WebComponent {
    // ❌ 错误：使用 Vue 的 ref
    const count = ref(0); // 🚫 禁止！
    
    // ✅ 正确：使用 WSX 的 @state
    @state private count: number = 0; // ✅ 正确
}
```

❌ **错误 3**: 在 `.vue` 文件中实现 WSX 组件逻辑
```vue
<!-- ❌ AI 绝对不要这样做 - 混合使用！ -->
<template>
  <div class="calendar">
    <!-- 直接在 Vue 中实现日历逻辑 -->
  </div>
</template>

<script setup>
// ❌ 错误：应该在 .wsx 文件中实现组件
import { WebComponent } from '@wsxjs/wsx-core'; // 🚫 禁止在 .vue 中使用！
</script>
```

❌ **错误 4**: 在一个文件中同时使用两种技术
```typescript
// ❌ AI 绝对不要这样做 - 严重混合！
import { ref } from 'vue'; // 🚫 禁止！
import { WebComponent, state } from '@wsxjs/wsx-core'; // 🚫 禁止！

// 一个文件不能同时使用 Vue 和 WSX
```

✅ **正确做法**: 严格分离，绝不混合
- **WSX 组件**（`.wsx` 文件）：
  - ✅ 只使用 `@wsxjs/wsx-core`
  - ✅ 只使用 `@state` 装饰器
  - ✅ 只使用 WSX 生命周期
  - ❌ 零 Vue 依赖

- **Vue 应用**（`.vue` 文件）：
  - ✅ 只使用 Vue 3 Composition API
  - ✅ 只使用 Vue 的响应式系统（`ref`, `reactive`）
  - ✅ 通过 Web Components 标准使用 WSX 组件（`<wsx-calendar>`）
  - ❌ 不在 Vue 文件中实现 WSX 组件逻辑

---

**最后更新**: 2025-01-08  
**维护者**: Evan You + WSX Master  
**目标读者**: AI Agents（这是 AI 的工作指南）
