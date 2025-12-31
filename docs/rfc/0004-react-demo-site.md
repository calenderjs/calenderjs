# RFC-0004: React Calendar Package and Demo Site

**状态**: Draft  
**创建日期**: 2024-12-19  
**作者**: WSX Team  
**关联 RFC**: RFC-0001

## 摘要

设计并实现两部分内容：

1. **React 组件包 `@calenderjs/react`**：提供 Calendar 组件的 React 封装，将基于 WSX 的 `<wsx-calendar>` Web Component 包装为 React 组件，方便 React 开发者使用。

2. **演示网站 `apps/demo-calenderjs-react`**：基于 React + Vite 的演示网站，展示如何使用 `@calenderjs/react` 包，提供组件使用示例、DSL 配置演示和交互式体验。

**重要说明**：
- **React 包**：创建一个独立的 React 包，暴露 Calendar 组件
- **演示网站**：创建一个演示网站展示 React 包的使用方式
- **消费 RFC-0001**：React 包和演示网站都使用 RFC-0001 定义的 `@calenderjs/calendar` 组件和 Event DSL
- **React 封装**：将基于 WSX 的 Web Component 封装为 React 组件，提供更好的 React 开发体验
- **类型安全**：提供完整的 TypeScript 类型支持

## 动机

### 为什么需要 React 包？

- **React 集成**：React 开发者需要 React 组件，而不是直接使用 Web Component
- **类型安全**：提供完整的 TypeScript 类型支持
- **开发体验**：提供 React Hook 和组件，简化状态管理
- **生态兼容**：与 React 生态系统（状态管理、路由等）无缝集成

### 为什么需要演示网站？

- **组件展示**：直观展示 React 包的使用方式和功能
- **DSL 演示**：展示 Event DSL 的定义和使用方式
- **快速上手**：为开发者提供可运行的示例代码
- **文档补充**：通过实际运行的应用补充文档说明

### 与 RFC-0003 的区别

- **RFC-0003**：完整的多租户企业服务（ToB），使用 Next.js，包含数据库、认证、第三方集成等
- **RFC-0004**：React 组件包 + 简单的演示网站，使用 React + Vite，仅用于展示组件功能，无后端服务

## 详细设计

### 1. 包结构

#### 1.1 React 组件包：`@calenderjs/react`

```
packages/react/
├── src/
│   ├── Calendar.tsx                 # React Calendar 组件（包装 wsx-calendar）
│   ├── hooks/
│   │   └── useCalendar.ts           # Calendar Hook
│   ├── types.ts                     # TypeScript 类型定义
│   └── index.ts                     # 导出入口
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**包依赖**：
```json
{
  "name": "@calenderjs/react",
  "dependencies": {
    "@calenderjs/calendar": "workspace:*",
    "@calenderjs/event-dsl": "workspace:*",
    "@calenderjs/core": "workspace:*",
    "react": "^18.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

#### 1.2 演示网站：`apps/demo-calenderjs-react`

```
apps/demo-calenderjs-react/
├── src/
│   ├── App.tsx                      # 主应用组件
│   ├── main.tsx                     # 入口文件
│   ├── pages/
│   │   ├── Home.tsx                 # 首页（组件展示）
│   │   ├── BasicExample.tsx         # 基础使用示例
│   │   ├── DSLExample.tsx           # DSL 使用示例
│   │   └── AdvancedExample.tsx      # 高级功能示例
│   ├── components/
│   │   └── EventForm.tsx            # 事件表单组件
│   └── styles/
│       └── globals.css
├── public/
│   └── ...
├── index.html
├── package.json
└── vite.config.ts
```

**演示网站依赖**：
```json
{
  "name": "demo-calenderjs-react",
  "dependencies": {
    "@calenderjs/react": "workspace:*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0"
  }
}
```

### 2. React 组件包设计

#### 2.1 Calendar 组件（React 封装）

```typescript
// packages/react/src/Calendar.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import '@calenderjs/calendar'; // 注册 Web Component
import { Event, EventTypeAST, User } from '@calenderjs/core';

export interface CalendarProps {
  eventDSL: string | EventTypeAST | EventTypeAST[];
  events: Event[];
  user?: User;
  defaultView?: 'month' | 'week' | 'day';
  currentDate?: Date;
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (id: string, event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onDateChange?: (date: Date) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface CalendarRef {
  setEvents: (events: Event[]) => void;
  setEventDSL: (dsl: string | EventTypeAST | EventTypeAST[]) => void;
  setUser: (user: User) => void;
  getCalendar: () => HTMLElement | null;
}

export const Calendar = forwardRef<CalendarRef, CalendarProps>(
  (
    {
      eventDSL,
      events,
      user,
      defaultView = 'month',
      currentDate,
      onEventCreate,
      onEventUpdate,
      onEventDelete,
      onViewChange,
      onDateChange,
      className,
      style,
    },
    ref
  ) => {
    const calendarRef = useRef<HTMLElement>(null);

    // 注册 Web Component（如果还没有注册）
    useEffect(() => {
      if (!customElements.get('wsx-calendar')) {
        import('@calenderjs/calendar');
      }
    }, []);

    // 设置属性
    useEffect(() => {
      const calendar = calendarRef.current as any;
      if (!calendar) return;

      calendar.eventDSL = eventDSL;
      calendar.events = events;
      if (user) calendar.user = user;
      if (defaultView) calendar.defaultView = defaultView;
      if (currentDate) calendar.currentDate = currentDate;
    }, [eventDSL, events, user, defaultView, currentDate]);

    // 监听事件
    useEffect(() => {
      const calendar = calendarRef.current;
      if (!calendar) return;

      const handleEventCreate = (e: CustomEvent) => {
        onEventCreate?.(e.detail);
      };
      const handleEventUpdate = (e: CustomEvent) => {
        onEventUpdate?.(e.detail.id, e.detail.event);
      };
      const handleEventDelete = (e: CustomEvent) => {
        onEventDelete?.(e.detail.id);
      };
      const handleViewChange = (e: CustomEvent) => {
        onViewChange?.(e.detail.view);
      };
      const handleDateChange = (e: CustomEvent) => {
        onDateChange?.(e.detail.date);
      };

      calendar.addEventListener('event-create', handleEventCreate);
      calendar.addEventListener('event-update', handleEventUpdate);
      calendar.addEventListener('event-delete', handleEventDelete);
      calendar.addEventListener('view-change', handleViewChange);
      calendar.addEventListener('date-change', handleDateChange);

      return () => {
        calendar.removeEventListener('event-create', handleEventCreate);
        calendar.removeEventListener('event-update', handleEventUpdate);
        calendar.removeEventListener('event-delete', handleEventDelete);
        calendar.removeEventListener('view-change', handleViewChange);
        calendar.removeEventListener('date-change', handleDateChange);
      };
    }, [onEventCreate, onEventUpdate, onEventDelete, onViewChange, onDateChange]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      setEvents: (newEvents: Event[]) => {
        const calendar = calendarRef.current as any;
        if (calendar) calendar.events = newEvents;
      },
      setEventDSL: (dsl: string | EventTypeAST | EventTypeAST[]) => {
        const calendar = calendarRef.current as any;
        if (calendar) calendar.eventDSL = dsl;
      },
      setUser: (newUser: User) => {
        const calendar = calendarRef.current as any;
        if (calendar) calendar.user = newUser;
      },
      getCalendar: () => calendarRef.current,
    }));

    return (
      <wsx-calendar
        ref={calendarRef}
        className={className}
        style={style}
      />
    );
  }
);

Calendar.displayName = 'Calendar';
```

#### 2.2 useCalendar Hook

```typescript
// packages/react/src/hooks/useCalendar.ts
import { useState, useCallback, useMemo } from 'react';
import { Event, EventTypeAST, User } from '@calenderjs/core';
import { parseEventDSL } from '@calenderjs/event-dsl';

export function useCalendar(dslText: string, initialUser?: User) {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | undefined>(initialUser);

  // 解析 DSL
  const ast = useMemo(() => {
    try {
      return parseEventDSL(dslText);
    } catch (error) {
      console.error('Failed to parse DSL:', error);
      return null;
    }
  }, [dslText]);

  // 添加事件
  const addEvent = useCallback((event: Event) => {
    setEvents(prev => [...prev, event]);
  }, []);

  // 更新事件
  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents(prev =>
      prev.map(event => (event.id === id ? { ...event, ...updates } : event))
    );
  }, []);

  // 删除事件
  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  }, []);

  return {
    events,
    setEvents,
    user,
    setUser,
    ast,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
```

#### 2.3 导出

```typescript
// packages/react/src/index.ts
export { Calendar } from './Calendar';
export type { CalendarProps, CalendarRef } from './Calendar';
export { useCalendar } from './hooks/useCalendar';
export * from '@calenderjs/core';
```

### 3. 演示网站功能

#### 3.1 组件展示页面

- **基础使用**：展示如何使用 `@calenderjs/react` 的 Calendar 组件
- **DSL 集成**：展示如何使用 Event DSL 定义和渲染事件类型
- **交互功能**：展示拖拽、调整大小等功能（待实现）

#### 3.2 示例代码

- **可运行的示例**：所有示例都可以直接在浏览器中运行
- **代码展示**：展示源代码和使用说明
- **交互式编辑**：允许用户修改示例代码（可选）

### 4. 技术实现

#### 4.1 React 包构建配置

```typescript
// packages/react/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CalenderJSReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@calenderjs/calendar', '@calenderjs/event-dsl', '@calenderjs/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  plugins: [react()],
});
```

#### 4.2 演示网站 Vite 配置

```typescript
// apps/demo-calenderjs-react/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

### 5. 演示网站页面设计

#### 5.1 首页（Home.tsx）

- 组件概览
- 快速开始指南
- 功能特性列表
- 链接到各个示例页面

#### 5.2 基础使用示例（BasicExample.tsx）

```tsx
import { Calendar } from '@calenderjs/react';
import { Event } from '@calenderjs/core';

function BasicExample() {
  const [events, setEvents] = useState<Event[]>([]);

  return (
    <Calendar
      eventDSL={simpleDSL}
      events={events}
      defaultView="week"
      onEventCreate={(event) => {
        const newEvent: Event = {
          id: Date.now().toString(),
          type: 'meeting',
          title: event.title || '新事件',
          startTime: event.startTime || new Date(),
          endTime: event.endTime || new Date(),
          data: event.data || {},
        };
        setEvents(prev => [...prev, newEvent]);
      }}
    />
  );
}
```

#### 5.3 DSL 使用示例（DSLExample.tsx）

- 展示如何定义 Event DSL
- 展示如何使用 `useCalendar` Hook
- 展示不同类型的事件渲染

#### 5.4 高级功能示例（AdvancedExample.tsx）

- 自定义渲染
- 事件处理
- 视图切换
- 拖拽功能（待实现）

## 实现计划

### 阶段 1: React 组件包（3 天）

**Day 1-2**：
1. 创建 `packages/react` 包结构
2. 实现 Calendar React 组件（包装 wsx-calendar）
3. 实现 useCalendar Hook
4. 创建 TypeScript 类型定义
5. 配置构建（Vite）

**Day 3**：
1. 编写单元测试
2. 编写文档
3. 发布包

### 阶段 2: 演示网站（2 天）

**Day 1**：
1. 创建 `apps/demo-calenderjs-react` 项目
2. 配置 Vite + React
3. 配置 React Router
4. 创建基础页面结构

**Day 2**：
1. 实现基础使用示例
2. 实现 DSL 使用示例
3. 实现高级功能示例
4. 优化 UI/UX

## 技术栈

- **Vite**: 构建工具
- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **React Router**: 路由（可选）
- **@calenderjs/calendar**: Calendar 组件（基于 WSX，来自 RFC-0001）
- **@calenderjs/event-dsl**: Event DSL 系统（来自 RFC-0001）
- **@calenderjs/core**: 核心接口（来自 RFC-0001）

## React 与 WSX 组件集成

### 集成方式

WSX 组件是基于 Web Components 标准的，可以在 React 中直接使用：

```tsx
// React 组件中使用 WSX Calendar 组件
import { useEffect, useRef } from 'react';
import '@calenderjs/calendar'; // 注册 Web Component

function CalendarPage() {
  const calendarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 获取 Web Component 实例
    const calendar = calendarRef.current as any;
    
    // 设置 DSL 配置
    calendar.eventDSL = meetingDSL;
    
    // 设置事件数据
    calendar.events = events;
    
    // 监听事件
    calendar.addEventListener('event-create', handleEventCreate);
  }, []);

  return (
    <wsx-calendar
      ref={calendarRef}
      event-dsl={meetingDSL}
      events={events}
      default-view="week"
    />
  );
}
```

### React 包装组件

为了更好的 React 集成体验，可以创建 React 包装组件：

```tsx
// CalendarWrapper.tsx
import { useEffect, useRef, forwardRef } from 'react';
import '@calenderjs/calendar';
import { Event, EventTypeAST, User } from '@calenderjs/core';

interface CalendarWrapperProps {
  eventDSL: string | EventTypeAST | EventTypeAST[];
  events: Event[];
  user?: User;
  defaultView?: 'month' | 'week' | 'day';
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (id: string, event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;
}

export const CalendarWrapper = forwardRef<HTMLElement, CalendarWrapperProps>(
  ({ eventDSL, events, user, defaultView, onEventCreate, onEventUpdate, onEventDelete }, ref) => {
    const calendarRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const calendar = (ref || calendarRef).current as any;
      if (!calendar) return;

      // 设置属性
      calendar.eventDSL = eventDSL;
      calendar.events = events;
      if (user) calendar.user = user;
      if (defaultView) calendar.defaultView = defaultView;

      // 监听事件
      if (onEventCreate) {
        calendar.addEventListener('event-create', (e: CustomEvent) => {
          onEventCreate(e.detail);
        });
      }
      if (onEventUpdate) {
        calendar.addEventListener('event-update', (e: CustomEvent) => {
          onEventUpdate(e.detail.id, e.detail.event);
        });
      }
      if (onEventDelete) {
        calendar.addEventListener('event-delete', (e: CustomEvent) => {
          onEventDelete(e.detail.id);
        });
      }

      return () => {
        // 清理事件监听器
        if (onEventCreate) {
          calendar.removeEventListener('event-create', onEventCreate);
        }
        // ...
      };
    }, [eventDSL, events, user, defaultView, onEventCreate, onEventUpdate, onEventDelete]);

    return (
      <wsx-calendar
        ref={ref || calendarRef}
        event-dsl={eventDSL}
        events={events}
        user={user}
        default-view={defaultView}
      />
    );
  }
);
```

### 使用示例

```tsx
// App.tsx
import { useState } from 'react';
import { CalendarWrapper } from './components/CalendarWrapper';
import { Event } from '@calenderjs/core';
import { parseEventDSL } from '@calenderjs/event-dsl';

const meetingDSL = `
type: meeting
name: 会议

fields:
  - title: string, required
  - attendees: list of email, required

validate:
  attendees.count between 1 and 50
  startTime.hour between 9 and 18

display:
  color: "#4285f4"
  title: "{event.title}"
`;

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [user] = useState({ id: '1', email: 'user@example.com', role: 'user' });

  const handleEventCreate = (event: Partial<Event>) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      type: 'meeting',
      title: event.title || '新事件',
      startTime: event.startTime || new Date(),
      endTime: event.endTime || new Date(),
      data: event.data || {},
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div>
      <h1>CalenderJS React Demo</h1>
      <CalendarWrapper
        eventDSL={meetingDSL}
        events={events}
        user={user}
        defaultView="week"
        onEventCreate={handleEventCreate}
      />
    </div>
  );
}
```

## 与 RFC-0003 的关系

- **RFC-0003**：完整的企业级多租户服务，使用 Next.js（包含服务端功能）
- **RFC-0004**：简单的演示网站，使用 React + Vite（纯前端），用于展示组件功能
- 两者技术栈不同：RFC-0003 需要 Next.js 的服务端功能，RFC-0004 只需要前端展示

## 未解决问题

1. **代码编辑器**：是否需要集成代码编辑器让用户在线编辑？
2. **部署方式**：如何部署演示网站？
3. **文档集成**：是否与文档网站集成？

---

*本 RFC 定义了一个 React 组件包 `@calenderjs/react` 和一个演示网站 `apps/demo-calenderjs-react`，用于为 React 开发者提供便捷的 Calendar 组件封装和使用示例。*
