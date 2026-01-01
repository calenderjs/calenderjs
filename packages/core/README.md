# @calenderjs/core

CalenderJS 核心日历组件库，支持基于 Appointment DSL 的渲染。

## 安装

```bash
pnpm add @calenderjs/core @calenderjs/event-dsl
```

## 使用示例

### 基础用法

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { Calendar } from '@calenderjs/core';
    
    // 注册组件
    customElements.define('wsx-calendar', Calendar);
    
    // 使用组件
    const calendar = document.querySelector('wsx-calendar');
    calendar.setAppointments([
      {
        id: '1',
        title: '团队会议',
        startTime: new Date('2024-12-20T10:00:00'),
        endTime: new Date('2024-12-20T11:00:00'),
        color: '#4285f4'
      }
    ]);
  </script>
</head>
<body>
  <wsx-calendar></wsx-calendar>
</body>
</html>
```

### 使用 DSL 渲染

```typescript
import { Calendar } from '@calenderjs/core';
import { AppointmentDSLCompiler, AppointmentDSLRuntime } from '@calenderjs/event-dsl';
import { meetingAppointmentType } from './appointment-types';

// 定义 DSL
const dsl = {
  types: [meetingAppointmentType]
};

// 编译 DSL
const compiler = new AppointmentDSLCompiler();
const compiled = compiler.compile(dsl);

// 创建运行时
const runtime = new AppointmentDSLRuntime(compiled);

// 使用组件
const calendar = document.querySelector('wsx-calendar') as Calendar;
calendar.setDSLRuntime(runtime);
calendar.setAppointments([
  {
    id: '1',
    type: 'meeting',
    title: '团队会议',
    startTime: new Date('2024-12-20T10:00:00'),
    endTime: new Date('2024-12-20T11:00:00'),
    dslData: {
      attendees: ['user1@example.com', 'user2@example.com'],
      location: '会议室 A'
    }
  }
]);
```

## API

### Calendar 类

#### 方法

- `setDSLRuntime(runtime: AppointmentDSLRuntime)`: 设置 DSL 运行时
- `setAppointments(appointments: Appointment[])`: 设置预约列表

#### 属性

- `default-view`: 默认视图（'month' | 'week' | 'day'）
- `data-appointments`: JSON 格式的预约列表

## 特性

- ✅ 基于 Web Components 标准
- ✅ 支持月/周/日三种视图
- ✅ 支持 DSL 渲染
- ✅ 支持拖拽和调整大小（待实现）
- ✅ 响应式设计
