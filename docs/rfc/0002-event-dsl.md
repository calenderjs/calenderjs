# RFC-0002: Event DSL

**状态**: Implemented (核心) / In Progress (集成)  
**创建日期**: 2024-12-19  
**最后更新**: 2026-03-15  
**作者**: WSX Team  
**关联 RFC**: RFC-0005, RFC-0009, RFC-0011, RFC-0012

## 摘要

设计并实现 Event DSL（领域特定语言），用于声明式定义日历事件类型。DSL 通过文本语法定义事件的字段结构、验证规则、显示配置和行为约束，编译后生成运行时数据模型，供 Calendar 组件进行 DSL 驱动的渲染和验证。

**核心定位**：

- **文本 DSL**：拥有独立的语法（由 PEG.js/Peggy 解析），非 TypeScript 配置对象
- **编译时/运行时分离**：`@calenderjs/event-dsl` 是开发/编译时工具，`@calenderjs/event-runtime` 是生产依赖
- **Event 是技术模型，Appointment 是业务概念**：DSL 定义业务类型（如 meeting、vacation），编译后生成符合 `Event` 接口的数据

## 术语约定

| 术语                             | 含义                                                           |
| -------------------------------- | -------------------------------------------------------------- |
| **Event**                        | 技术数据模型（`@calenderjs/event-model` 中定义的接口）         |
| **Appointment / Holiday / Task** | 业务概念，都是 Event 的具体类型（`Event.type = "meeting"` 等） |
| **Event DSL**                    | 用于声明式定义事件类型的领域特定语言                           |
| **EventTypeAST**                 | DSL 文本解析后的抽象语法树                                     |
| **EventTypeDataModel**           | AST 编译后的运行时数据模型                                     |
| **EventRuntime**                 | 使用 DataModel 执行验证/渲染/权限检查的运行时实例              |

## 动机

传统的事件数据模型（如 `Event` 接口）提供了灵活的基础结构，但无法优雅地表达不同业务领域的规则。Event DSL 解决以下问题：

- **声明式定义**：通过 DSL 语法声明事件类型的字段、验证、显示和行为规则
- **业务逻辑分离**：将业务规则从组件逻辑中分离，Calendar 组件不硬编码任何业务逻辑
- **类型安全**：从 DSL 生成 TypeScript 类型定义和 JSON Schema，提供开发时和运行时双重保障
- **可扩展性**：添加新事件类型只需写一段 DSL 文本，无需修改核心代码

## 架构概览

### 编译管线

```
DSL 文本                    ← 用户/业务服务编写
  ↓ parseEventDSL()         ← @calenderjs/event-dsl (开发时)
EventTypeAST                ← 抽象语法树（内存表示）
  ↓ EventDSLCompiler        ← @calenderjs/event-dsl (开发时)
  ├→ EventDSLDataModel      ← 运行时数据模型
  ├→ JSON Schema            ← generateJSONSchema() - 校验 Event.data 结构
  └→ TypeScript 类型        ← generateTypeScript() - IDE 类型补全
       ↓
EventRuntime(dataModel)     ← @calenderjs/event-runtime (生产时)
  ├→ validate(event, ctx)   → ValidationResult
  ├→ render(event, ctx)     → RenderedEvent
  └→ canPerform(action, event, user) → boolean
```

### 包职责

| 包                          | 角色                                      | 运行时依赖          |
| --------------------------- | ----------------------------------------- | ------------------- |
| `@calenderjs/event-model`   | Event 接口（SSOT）、JSON Schema、基础验证 | 是（ajv）           |
| `@calenderjs/event-dsl`     | DSL 解析器、编译器、代码生成器            | 否（仅开发/构建时） |
| `@calenderjs/event-runtime` | EventRuntime（验证、渲染、权限）          | 是                  |

```
event-dsl ──depends──→ event-model ←──depends── event-runtime
 (dev)                   (SSOT)                   (prod)
```

## DSL 语法设计

### 文本语法

DSL 采用声明式文本语法，由 Peggy（PEG.js 继任）解析。语法设计面向非程序员可读。

#### 最小示例

```
type: meeting
name: "会议"
fields:
  - title: string
```

#### 完整示例

```
type: meeting
name: "团队会议"
description: "标准团队会议类型"

fields:
  - attendees: list of email, required
  - location: string
  - priority: enum(low, normal, high), default: "normal"
  - agenda: text

validate:
  attendees.count between 1 and 50
  startTime.hour >= 9
  startTime.hour <= 18
  title.length >= 1
  title.length <= 100
  no conflict with other events
  when priority is high:
    attendees.count >= 5

display:
  color: "#4285f4"
  icon: "meeting"
  color:
    when priority is high: "#ea4335"
    else: "#34a853"
  title: "{title}"
  description: "{attendees.count} attendees"

behavior:
  editable: true
  draggable: true
  resizable: false
  editable: role is admin or role is manager

constraints:
  timeZone: "Asia/Shanghai"
  timePrecision: 15 minutes
  minAdvanceTime: 1 hour
  maxAdvanceTime: 30 days
  allowCrossDay: true
  allowedHours: 9 to 18

recurring:
  frequency: weekly
  interval: 2
  daysOfWeek: [1, 3, 5]
  endDate: "2025-12-31"
```

### Section 说明

| Section       | 作用                                   | 必需 |
| ------------- | -------------------------------------- | ---- |
| `type`        | 事件类型标识符（映射到 `Event.type`）  | 是   |
| `name`        | 类型显示名称                           | 是   |
| `description` | 类型描述                               | 否   |
| `fields`      | 字段定义（映射到 `Event.data` 中的键） | 是   |
| `validate`    | 验证规则（运行时校验）                 | 否   |
| `display`     | 显示配置（颜色、图标、标题/描述模板）  | 否   |
| `behavior`    | 行为规则（可编辑、可拖拽、权限控制）   | 否   |
| `constraints` | 时间约束（时区、精度、提前量、跨天等） | 否   |
| `recurring`   | 重复规则（频率、间隔、排除日期等）     | 否   |

### 字段类型

| 类型        | 语法                      | Event.data 中的值    |
| ----------- | ------------------------- | -------------------- |
| `string`    | `- name: string`          | `string`             |
| `number`    | `- count: number`         | `number`             |
| `boolean`   | `- active: boolean`       | `boolean`            |
| `email`     | `- contact: email`        | `string`（格式校验） |
| `text`      | `- notes: text`           | `string`（长文本）   |
| `list of T` | `- tags: list of string`  | `T[]`                |
| `enum(...)` | `- status: enum(a, b, c)` | `string`（受限值）   |

**字段修饰符**：`, required`、`, default: "value"`、`, min: n`、`, max: n`

### 验证表达式

| 语法                                | 含义         |
| ----------------------------------- | ------------ |
| `field between min and max`         | 范围检查     |
| `field >= value` / `field <= value` | 比较运算     |
| `field in ["a", "b", "c"]`          | 枚举检查     |
| `no conflict with other events`     | 时间冲突检测 |
| `when condition: rules`             | 条件验证     |
| `not expr`                          | 逻辑否定     |
| `expr and expr` / `expr or expr`    | 逻辑组合     |

### 显示规则

- 静态值：`color: "#4285f4"`
- 条件值：`color: when priority is high: "#ea4335" else: "#34a853"`
- 模板值：`title: "{title}"`、`description: "{attendees.count} attendees"`

## AST 类型定义

DSL 文本解析后生成以下 AST 结构：

```typescript
interface EventTypeAST {
  type: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  validate: ValidationRule[];
  display: DisplayRule[];
  behavior: BehaviorRule[];
  constraints?: ConstraintRule[];
  recurring?: RecurringDefinition;
}

interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
}

type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "email"
  | "text"
  | { type: "list"; itemType: FieldType }
  | { type: "enum"; values: string[] };
```

完整 AST 类型见 `packages/event-dsl/src/ast/types.ts`。

## 编译器输出

### EventDSLDataModel

编译器将 AST 转换为运行时可用的 DataModel：

```typescript
interface EventTypeDataModel {
  id: string;
  name: string;
  extraSchema: JSONSchema; // 由 fields 生成，校验 Event.data 结构
  validationRules: ValidationRule[];
  displayRules: DisplayRule[];
  behaviorRules: BehaviorRule[];
  constraints: ConstraintRule[];
  recurring?: RecurringDefinition;
  validator: ValidatorFunction;
  renderer: RendererFunction;
  behavior: BehaviorConfig;
}

interface EventDSLDataModel {
  types: EventTypeDataModel[];
  validators: EventValidatorDataModel[];
}
```

### JSON Schema 生成

从 fields 生成 Draft-07 JSON Schema，用于校验 `Event.data` 的结构：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "会议",
  "properties": {
    "attendees": {
      "type": "array",
      "items": { "type": "string", "format": "email" },
      "minItems": 1,
      "maxItems": 50
    },
    "location": { "type": "string" },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high"],
      "default": "normal"
    }
  },
  "required": ["attendees"],
  "additionalProperties": false
}
```

### TypeScript 类型生成

从 fields 生成 TypeScript 接口，提供 IDE 类型补全：

```typescript
export interface MeetingData {
  attendees: string[];
  location?: string;
  priority?: "low" | "normal" | "high";
  agenda?: string;
}
```

## DSL 与 Event 数据模型的映射

DSL 定义的字段存储在 `Event.data` 中（类型 `Record<string, any>`）。

### 映射关系

| DSL Section     | Event 字段                         | 说明             |
| --------------- | ---------------------------------- | ---------------- |
| `type`          | `Event.type`                       | 事件类型标识符   |
| `fields`        | `Event.data`                       | 业务字段数据容器 |
| `display.color` | `Event.color`（运行时渲染后）      | 显示颜色         |
| `display.icon`  | `Event.icon`（运行时渲染后）       | 显示图标         |
| `display.title` | 覆盖 `Event.title`（运行时渲染后） | 显示标题         |

### Event 示例

```typescript
const meetingEvent: Event = {
  id: "evt-001",
  type: "meeting", // ← DSL type
  title: "团队会议",
  startTime: new Date("2026-01-15T10:00:00"),
  endTime: new Date("2026-01-15T11:00:00"),
  color: "#4285f4",
  data: {
    // ← DSL fields 存放于此
    attendees: ["alice@co.com", "bob@co.com"],
    location: "会议室 A",
    priority: "high",
    agenda: "讨论 Q1 计划",
  },
};
```

## EventRuntime 使用

EventRuntime 是 DSL 的生产时消费者，提供验证、渲染、权限检查三个核心能力。

```typescript
// 公共 API
constructor(dataModel: EventTypeDataModel)
getDataModel(): EventTypeDataModel          // 只读获取 DataModel
validate(event, context) → ValidationResult
render(event, context)   → RenderedEvent
canPerform(action, event, user) → boolean
```

```typescript
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";

const compiler = new EventDSLCompiler();
const dataModel = compiler.compileDSL(dslText);
const runtime = new EventRuntime(dataModel.types[0]);

// 验证
const result = runtime.validate(event, { existingEvents, user });
// → { valid: true } 或 { valid: false, errors: [...] }

// 渲染
const rendered = runtime.render(event, { user });
// → { title: "团队会议", color: "#ea4335", description: "2 attendees", icon: "meeting" }

// 权限
const canEdit = runtime.canPerform("edit", event, user);
// → true/false（基于 behavior 规则和用户角色）
```

### 字段解析路径

EventRuntime 通过以下路径解析验证表达式中的字段：

| 路径              | 解析为                        |
| ----------------- | ----------------------------- |
| `title`           | `event.title`                 |
| `startTime.hour`  | `event.startTime.getHours()`  |
| `attendees.count` | `event.data.attendees.length` |
| `priority`        | `event.data.priority`         |
| `user.role`       | `context.user.role`           |
| `duration`        | `endTime - startTime`（分钟） |

## 包结构

```
packages/event-dsl/                    ← 开发/编译时工具
├── src/
│   ├── event-dsl.pegjs                ← PEG 语法定义
│   ├── parser/                        ← 解析器（PEG 生成 + 后处理）
│   ├── ast/types.ts                   ← AST 类型定义
│   ├── compiler.ts                    ← EventDSLCompiler
│   ├── generators/
│   │   ├── json-schema.ts             ← generateJSONSchema()
│   │   └── typescript.ts              ← generateTypeScript()
│   └── index.ts
├── package.json                       ← deps: event-model; devDeps: peggy
└── vitest.config.ts

packages/event-runtime/                ← 生产时依赖
├── src/
│   ├── EventRuntime.ts                ← validate/render/canPerform
│   └── index.ts
├── package.json                       ← deps: event-model, core
└── vitest.config.ts

packages/event-model/                  ← SSOT：Event 接口 + 基础验证
├── src/
│   ├── Event.ts                       ← Event, RecurringRule, EventMetadata
│   ├── EventTypeDataModel.ts          ← EventTypeDataModel, EventDSLDataModel
│   ├── runtime-types.ts               ← ValidationResult, RenderedEvent, BehaviorConfig
│   ├── validator.ts                   ← EventValidator, EVENT_BASE_SCHEMA
│   └── types.ts                       ← JSONSchema 接口
└── package.json                       ← deps: ajv
```

## 实现状态

| 模块                    | 状态      | 说明                                      |
| ----------------------- | --------- | ----------------------------------------- |
| PEG.js 语法 + 解析器    | ✅ 完成   | 支持全部 sections 和语法                  |
| AST 类型定义            | ✅ 完成   | EventTypeAST + 子类型                     |
| EventDSLCompiler        | ✅ 完成   | DSL → DataModel                           |
| JSON Schema 生成        | ✅ 完成   | fields → Draft-07 Schema                  |
| TypeScript 生成         | ✅ 完成   | fields → TS interface                     |
| EventRuntime            | ✅ 完成   | validate / render / canPerform            |
| EventDataGenerator      | ❌ 未实现 | 从 DSL 生成 Event 数据实例（见 RFC-0011） |
| Calendar 集成           | ❌ 未实现 | Calendar 接受 EventRuntime（见 RFC-0005） |
| `extra` → `data` 重命名 | ❌ 待执行 | 全局字段重命名                            |

## 未解决问题

1. **DSL 版本管理**：DSL 定义的版本迁移策略
2. **表达式安全**：自定义表达式的沙箱执行
3. **性能优化**：大量事件类型时的编译和验证性能
4. **DSL 编辑器**：Monaco Editor 集成的语法高亮和补全

---

_本 RFC 定义了 Event DSL 的语法、编译管线和运行时架构。DSL 允许业务服务通过声明式文本定义事件类型，编译后供 Calendar 组件进行 DSL 驱动的渲染、验证和权限控制。_
