# @calenderjs/dsl

Appointment DSL - 领域特定语言，用于定义预约类型和业务规则。

## 安装

```bash
pnpm add @calenderjs/dsl
```

## 快速开始

### 1. 定义预约类型

```typescript
import { AppointmentType } from '@calenderjs/dsl';

const meetingType: AppointmentType = {
  id: 'meeting',
  name: '会议',
  fields: [
    {
      name: 'title',
      type: 'string',
      required: true,
      validation: [
        { type: 'minLength', value: 1, errorMessage: '标题不能为空' }
      ]
    },
    {
      name: 'attendees',
      type: 'array',
      items: { type: 'string' }
    }
  ],
  display: {
    color: '#4285f4',
    titleTemplate: '${title}',
    descriptionTemplate: '${attendees.length} 人'
  },
  behavior: {
    draggable: true,
    minDuration: 15,
    timeConstraints: [
      {
        type: 'workingHours',
        value: { start: '09:00', end: '18:00' },
        errorMessage: '会议只能在工作时间内安排'
      }
    ]
  }
};
```

### 2. 编译 DSL

```typescript
import { AppointmentDSLCompiler } from '@calenderjs/dsl';

const dsl = {
  types: [meetingType]
};

const compiler = new AppointmentDSLCompiler();
const compiled = compiler.compile(dsl);
```

### 3. 创建运行时

```typescript
import { AppointmentDSLRuntime } from '@calenderjs/dsl';

const runtime = new AppointmentDSLRuntime(compiled);
```

### 4. 验证和渲染

```typescript
const appointment = {
  id: '1',
  type: 'meeting',
  title: '团队会议',
  startTime: new Date('2024-12-20T10:00:00'),
  endTime: new Date('2024-12-20T11:00:00'),
  dslData: {
    attendees: ['user1@example.com']
  }
};

// 验证
const validation = runtime.validate(appointment, 'meeting');
if (!validation.valid) {
  console.error(validation.errors);
}

// 渲染
const rendered = runtime.render(appointment, 'meeting');
console.log(rendered); // { title: '团队会议', color: '#4285f4', ... }
```

## API

### AppointmentDSLCompiler

编译 DSL 定义，生成可执行的验证器和渲染器。

### AppointmentDSLRuntime

运行时系统，提供验证、渲染和行为配置查询功能。

## 更多示例

查看 `docs/examples/appointment-dsl-examples.ts` 获取更多示例。
