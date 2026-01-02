# @calenderjs/react

React wrapper for `@calenderjs/calendar` Web Component.

## 安装

```bash
pnpm add @calenderjs/react @calenderjs/calendar
```

## 使用方式

### 基础使用

```tsx
import { Calendar } from '@calenderjs/react';

function App() {
  return (
    <Calendar 
      view="month" 
      date="2024-12-30"
    />
  );
}
```

### 使用事件回调

```tsx
import { Calendar } from '@calenderjs/react';

function App() {
  const handleDateChange = (e: CustomEvent<{ date: Date }>) => {
    console.log('Date changed:', e.detail.date);
  };

  const handleViewChange = (e: CustomEvent<{ view: 'month' | 'week' | 'day' }>) => {
    console.log('View changed:', e.detail.view);
  };

  return (
    <Calendar 
      view="month"
      date={new Date()}
      onDateChange={handleDateChange}
      onViewChange={handleViewChange}
    />
  );
}
```

### 使用 ref 控制组件

```tsx
import { Calendar, CalendarRef } from '@calenderjs/react';
import { useRef } from 'react';

function App() {
  const calendarRef = useRef<CalendarRef>(null);

  const handleGoToToday = () => {
    calendarRef.current?.goToToday();
  };

  const handleSetView = (view: 'month' | 'week' | 'day') => {
    calendarRef.current?.setView(view);
  };

  return (
    <div>
      <button onClick={handleGoToToday}>今天</button>
      <button onClick={() => handleSetView('week')}>周视图</button>
      <Calendar ref={calendarRef} />
    </div>
  );
}
```

### 设置事件数据

```tsx
import { Calendar } from '@calenderjs/react';
import type { Event } from '@calenderjs/event-model';

function App() {
  const events: Event[] = [
    {
      id: '1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2024-12-30T10:00:00'),
      endTime: new Date('2024-12-30T11:00:00'),
      data: {},
    },
  ];

  return (
    <Calendar 
      view="month"
      events={events}
    />
  );
}
```

## API

### Calendar Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `view` | `'month' \| 'week' \| 'day'` | `'month'` | 初始视图 |
| `date` | `string \| Date` | 当前日期 | 初始日期 |
| `events` | `Event[]` | `[]` | 事件列表（数据模型） |
| `user` | `any` | `undefined` | 当前用户 |
| `onDateChange` | `(e: CustomEvent<{ date: Date }>) => void` | - | 日期变化回调 |
| `onViewChange` | `(e: CustomEvent<{ view: 'month' \| 'week' \| 'day' }>) => void` | - | 视图切换回调 |
| `className` | `string` | - | CSS 类名 |
| `style` | `React.CSSProperties` | - | 内联样式 |

### CalendarRef

| 方法 | 说明 |
|------|------|
| `getElement()` | 获取底层的 Web Component 实例 |
| `setView(view)` | 设置当前视图 |
| `setDate(date)` | 设置当前日期 |
| `goToToday()` | 跳转到今天 |

## 注意事项

1. 确保已安装 `@calenderjs/calendar` 包
2. Web Component 会自动注册，无需手动注册
3. 组件是纯数据驱动的，只处理数据模型，不涉及 DSL
