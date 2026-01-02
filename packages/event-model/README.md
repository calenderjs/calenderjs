# @calenderjs/event-model

Event Data Model - Single Source of Truth (SSOT) for Event data structures.

## 概述

此包提供 Event 数据模型的类型定义和 JSON Schema 验证，作为所有其他包的单一数据源（SSOT）。

## 职责

`@calenderjs/event-model` 包有两个核心职责：

1. **定义数据模型和 JSON Schema**
   - Event 接口定义（`Event.ts`）
   - Event JSON Schema（`validator.ts` 中的 `EVENT_BASE_SCHEMA`）
   - JSON Schema 类型定义（`types.ts`）

2. **使用 JSON Schema 验证数据**
   - EventValidator 类（`validator.ts` 和 `validators/EventValidator.ts`）
   - 验证 Event 对象是否符合 Event Data Model
   - 验证 Event.data 字段是否符合指定的 JSON Schema

## 依赖关系

```
@calenderjs/event-model (SSOT)
    ↑                    ↑
    │                    │
@calenderjs/calendar  @calenderjs/event-dsl
```

## 导出

### 1. Event 接口和类型

```typescript
import { Event, EventMetadata } from '@calenderjs/event-model';

const event: Event = {
  id: "event-1",
  type: "meeting",
  title: "团队会议",
  startTime: new Date("2025-01-15T10:00:00"),
  endTime: new Date("2025-01-15T11:00:00"),
  data: {
    attendees: ["user1@example.com"],
    location: "会议室 A"
  }
};
```

### 2. Event JSON Schema

```typescript
import { EVENT_BASE_SCHEMA } from '@calenderjs/event-model';

// EVENT_BASE_SCHEMA 定义了 Event 接口的 JSON Schema
// 用于验证 Event 对象的基本结构
console.log(EVENT_BASE_SCHEMA);
```

### 3. Event 验证器

```typescript
import { EventValidator, EVENT_BASE_SCHEMA } from '@calenderjs/event-model';
import type { Event } from '@calenderjs/event-model';

const validator = new EventValidator();

// 验证 Event 对象是否符合 Event Data Model
const event: Event = {
  id: "event-1",
  type: "meeting",
  title: "团队会议",
  startTime: new Date("2025-01-15T10:00:00"),
  endTime: new Date("2025-01-15T11:00:00"),
  data: {}
};

const result = validator.validateBase(event);
if (!result.valid) {
  console.error('验证失败:', result.errors);
}
```

## 使用

### 在 calendar 包中使用

```typescript
import type { Event } from '@calenderjs/event-model';

export class Calendar {
  private events: Event[] = [];
  
  addEvent(event: Event) {
    this.events.push(event);
  }
}
```

### 在 event-dsl 包中使用

```typescript
import type { Event } from '@calenderjs/event-model';

export class EventDSLRuntime {
  validate(event: Event): ValidationResult {
    // 验证逻辑
  }
}
```

## 相关 RFC

- RFC-0001: Event Calendar DSL
- RFC-0011: Event 数据模型与 Event DSL 集成
