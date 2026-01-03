# DSL → Calendar 完整流程验证

## 概述

本文档验证了完整的端到端流程：**DSL → Data Model → Event 验证 → Calendar 显示**

## 验证流程

### 步骤 1: DSL AST 定义

定义事件类型的 DSL AST：

```typescript
const ast: EventTypeAST = {
    type: "meeting",
    name: "团队会议",
    fields: [
        {
            name: "attendees",
            type: { type: "list", itemType: "email" },
            required: true,
        },
        {
            name: "location",
            type: "string",
        },
    ],
    validate: [
        {
            type: "Between",
            field: { type: "FieldAccess", path: ["attendees", "count"] },
            min: 1,
            max: 50,
        },
        {
            type: "Between",
            field: { type: "FieldAccess", path: ["startTime", "hour"] },
            min: 9,
            max: 18,
        },
    ],
    display: [
        {
            name: "color",
            value: "#4285f4",
        },
        {
            name: "icon",
            value: "meeting",
        },
    ],
    behavior: [
        {
            name: "editable",
            value: true,
        },
    ],
};
```

### 步骤 2: 编译 DSL AST → Data Model

```typescript
import { EventDSLCompiler } from "@calenderjs/event-dsl";

const compiler = new EventDSLCompiler();
const dataModel = compiler.compileFromAST([ast]);
const eventTypeDataModel = dataModel.types[0];

// Data Model 包含：
// - extraSchema: JSON Schema（用于验证 Event.extra）
// - validationRules: 业务规则（用于运行时验证）
// - displayRules: 显示规则（用于渲染）
// - behaviorRules: 行为规则（用于权限控制）
```

### 步骤 3: 创建 Event 对象

```typescript
import type { Event } from "@calenderjs/event-model";

const event: Event = {
    id: "event-1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date("2024-12-30T10:00:00Z"),
    endTime: new Date("2024-12-30T11:00:00Z"),
    extra: {
        attendees: ["user1@example.com", "user2@example.com"],
        location: "会议室 A",
    },
};
```

### 步骤 4: 验证 Event

#### 4.1 使用 EventValidator 验证基础结构

```typescript
import { EventValidator } from "@calenderjs/event-model";

const eventValidator = new EventValidator();
const baseValidation = eventValidator.validateBase(event);
// baseValidation.valid === true
```

#### 4.2 使用 EventValidator 验证 Event.extra（使用生成的 JSON Schema）

```typescript
if (eventTypeDataModel.extraSchema) {
    const extraValidation = eventValidator.validateExtra(
        event,
        eventTypeDataModel.extraSchema
    );
    // extraValidation.valid === true
}
```

#### 4.3 使用 EventRuntime 验证业务规则

```typescript
import { EventRuntime } from "@calenderjs/event-runtime";

const runtime = new EventRuntime(eventTypeDataModel);
const validationResult = runtime.validate(event, {
    events: [],
    now: new Date(),
});
// validationResult.valid === true
```

### 步骤 5: 渲染 Event（生成 Calendar 显示数据）

```typescript
const rendered = runtime.render(event, {});
// rendered = {
//     title: "团队会议",
//     color: "#4285f4",
//     icon: "meeting",
// }
```

### 步骤 6: 组合数据用于 Calendar 组件

```typescript
// Calendar 组件需要的数据结构：Event + RenderedEvent 的组合
const calendarEvent = {
    ...event, // Event 的所有字段（id, type, title, startTime, endTime, extra 等）
    color: rendered.color, // 从 RenderedEvent 获取颜色
    icon: rendered.icon, // 从 RenderedEvent 获取图标
};

// Calendar 组件可以直接使用 calendarEvent
// <wsx-calendar events={[calendarEvent]} />
```

## 验证结果

### 测试状态

- ✅ **端到端测试**: 5 个测试通过
- ✅ **Calendar 集成测试**: 3 个测试通过
- ✅ **Calendar 显示验证**: 2 个测试通过
- ✅ **总计**: 131 个测试通过（包括所有现有测试）

### 验证内容

1. ✅ DSL AST → Data Model 编译正确
2. ✅ Event 基础结构验证正确
3. ✅ Event.extra 验证（使用生成的 JSON Schema）正确
4. ✅ 业务规则验证正确
5. ✅ Event 渲染正确
6. ✅ 渲染后的数据可以用于 Calendar 组件

## 使用示例

### 完整代码示例

```typescript
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import type { Event } from "@calenderjs/event-model";

// 1. 定义 DSL AST
const ast: EventTypeAST = { /* ... */ };

// 2. 编译 DSL AST → Data Model
const compiler = new EventDSLCompiler();
const dataModel = compiler.compileFromAST([ast]);
const eventTypeDataModel = dataModel.types[0];

// 3. 创建 Event 对象
const event: Event = { /* ... */ };

// 4. 验证 Event
const eventValidator = new EventValidator();
const baseValidation = eventValidator.validateBase(event);
if (eventTypeDataModel.extraSchema) {
    const extraValidation = eventValidator.validateExtra(
        event,
        eventTypeDataModel.extraSchema
    );
}

const runtime = new EventRuntime(eventTypeDataModel);
const validationResult = runtime.validate(event, {
    events: [],
    now: new Date(),
});

// 5. 渲染 Event
const rendered = runtime.render(event, {});

// 6. 组合数据用于 Calendar
const calendarEvent = {
    ...event,
    color: rendered.color,
    icon: rendered.icon,
};

// 7. 使用 Calendar 组件
// <wsx-calendar events={[calendarEvent]} />
```

## 结论

✅ **验证通过**: DSL → Data Model → Event 验证 → Calendar 显示的完整流程正常工作。

所有测试通过，架构正确，可以继续开发 Calendar 组件和其他功能。
