# RFC-0001: Event Calendar Component with Event DSL

**状态**: Draft
**创建日期**: 2024-12-30
**作者**: WSX Team

## 摘要

设计并实现一个**开源**的事件日历组件库 `@calenderjs/core`，基于 WSX 框架构建。该组件库提供 `<wsx-calendar>` 组件，用于显示任何类型的事件（会议、节假日、任务、生日等）。组件将提供月视图、周视图和日视图三种显示模式，界面设计参考 Google 日历。

**核心创新**：组件由 **Event DSL**（领域特定语言）驱动。Event DSL 是一种声明式的、领域友好的配置语言，专为事件日历领域设计，使得非程序员也能理解和配置事件类型。

**开源定位**：
- **@calenderjs/core**：开源日历组件（MIT协议）
- **Event DSL**：开源配置语言（MIT协议）
- **商业应用**：Appointment Service 等业务服务可以基于此组件构建（付费SaaS）

## 动机

### 为什么需要这个功能？

在事件管理、日程安排、项目管理等应用场景中，日历组件是一个核心需求。目前缺少一个功能完整、设计精美、且由领域语言驱动的开源日历组件。

### Event DSL 的必要性

**为什么不用 JavaScript/JSON 配置？**

1. **可读性差**：
   ```javascript
   // JavaScript配置 - 复杂难懂
   customValidation: (event, context) => {
     return event.data.attendees.length >= 1 &&
            event.data.attendees.length <= 50 &&
            event.startTime.getHours() >= 9 &&
            event.startTime.getHours() <= 18;
   }
   ```

2. **无法序列化**：JavaScript函数无法存储为JSON，无法通过API传输

3. **不适合非程序员**：产品经理、运营人员无法直接配置

**Event DSL 的优势**：

```dsl
# Event DSL - 声明式、易读
validate:
  attendees.count between 1 and 50
  startTime.hour between 9 and 18
  no conflict with other events
```

- ✅ 声明式、领域友好
- ✅ 完全可序列化（纯文本）
- ✅ 非程序员也能理解
- ✅ 专为事件领域设计

### 目标用户

- **应用开发者**：需要构建事件管理、日程安排等功能的开发者
- **配置管理员**：需要定义和管理事件类型的产品经理、运营人员
- **框架学习者**：希望学习 WSX 框架和 DSL 设计的开发者

## Event DSL 完整定义

### DSL 设计理念

**核心原则**：
1. **领域特定**：只包含事件日历领域需要的概念
2. **声明式**：描述"是什么"，而不是"怎么做"
3. **自然语言风格**：读起来像自然语言，而不是代码
4. **安全可控**：无副作用，沙箱执行

**不包含的功能**（保持简洁）：
- ❌ 循环（for/while）
- ❌ 函数定义
- ❌ 变量赋值
- ❌ 文件/网络访问

### DSL 语法规范

#### 1. 事件类型定义

```dsl
# ============================================
# Event Type Definition
# ============================================

type: meeting
name: 会议
description: 团队会议、客户会议等

# 字段定义
fields:
  - title: string, required
  - attendees: list of email, required
  - location: string
  - priority: enum(low, normal, high), default: normal
  - organizer: email, required
  - agenda: text

# 验证规则
validate:
  attendees.count between 1 and 50
  startTime.hour between 9 and 18
  duration between 15 minutes and 8 hours
  no conflict with other events

  when priority is high:
    attendees.count >= 5
    created before startTime minus 1 day

# 显示规则
display:
  color:
    when priority is high: "#ea4335"
    when priority is normal: "#4285f4"
    else: "#34a853"

  icon:
    when attendees.count > 20: "🏢"
    when priority is high: "🔥"
    else: "📅"

  title: "{event.title}"

  description:
    when attendees.count > 20:
      "大型会议: {attendees.count}人 · {location}"
    else:
      "{attendees.count}人 · {location}"

# 行为规则
behavior:
  draggable:
    when user.role is admin: true
    when user.email equals organizer: true
    else: false

  resizable: false

  editable:
    when startTime before now: false
    when user.role is admin: true
    when user.email equals organizer: true
    else: false

# 时间约束
constraints:
  minDuration: 15 minutes
  maxDuration: 8 hours
  allowedHours: 9 to 18
  allowedDays: monday to friday
```

#### 2. 数据访问语法

```dsl
# 访问事件字段
event.title
event.data.attendees
attendees.count          # 简写形式（在event上下文中）
startTime.hour
startTime.minute
startTime.day
endTime.hour
duration                 # 自动计算（endTime - startTime）

# 访问用户信息
user.email
user.role
user.id
user.vipLevel

# 访问时间
now                      # 当前时间
created                  # 事件创建时间
```

#### 3. 比较运算

```dsl
# 相等/不等
priority is high
priority is not low
user.role equals admin
user.role not equals guest

# 范围
attendees.count between 1 and 50
startTime.hour between 9 and 18
priority in (low, normal, high)

# 大小比较
attendees.count > 20
attendees.count >= 5
duration < 2 hours
```

#### 4. 逻辑运算

```dsl
# 与（and）
attendees.count > 0 and attendees.count <= 50
user.role is admin and event.priority is high

# 或（or）
user.role is admin or user.email equals organizer
priority is high or attendees.count > 20

# 非（not/no）
not user.role equals guest
no conflict with other events
```

#### 5. 条件表达式

```dsl
# when-else 结构
when condition:
  expression
else:
  expression

# 示例
when priority is high:
  "#ea4335"
else:
  "#4285f4"

# 多条件
when priority is high:
  attendees.count >= 5
  duration >= 1 hour
when priority is normal:
  attendees.count >= 1
else:
  true
```

#### 6. 时间和时长

```dsl
# 时长字面量
15 minutes
2 hours
1 day
1 week

# 时间比较
startTime before now
startTime after now
created before startTime minus 1 day
endTime after startTime plus 30 minutes

# 时间运算
startTime minus 1 day
endTime plus 2 hours
now minus 1 week
```

#### 7. 字符串模板

```dsl
# 使用 {} 插值
"{attendees.count}人参与"
"大型会议: {attendees.count}人 · {location}"
"{user.name} 创建的 {event.title}"

# 条件模板
when attendees.count > 20:
  "大型会议: {attendees.count}人"
else:
  "{attendees.count}人"
```

#### 8. 内置函数

```dsl
# 冲突检测
no conflict with other events
conflict with other events

# 列表操作
attendees.count
attendees contains "admin@example.com"
attendees.first
attendees.last

# 字符串操作
title contains "重要"
location starts with "会议室"
```

### 完整语法示例

#### 示例1：会议事件类型

```dsl
type: meeting
name: 会议

fields:
  - title: string, required
  - attendees: list of email, required, min: 1, max: 50
  - location: string
  - priority: enum(low, normal, high), default: normal
  - organizer: email, required

validate:
  attendees.count between 1 and 50
  startTime.hour between 9 and 18
  duration between 15 minutes and 8 hours
  no conflict with other events

  when priority is high:
    attendees.count >= 5
    created before startTime minus 1 day

display:
  color:
    when priority is high: "#ea4335"
    when priority is normal: "#4285f4"
    else: "#34a853"

  icon:
    when attendees.count > 20: "🏢"
    when priority is high: "🔥"
    else: "📅"

  title: "{event.title}"
  description: "{attendees.count}人 · {location}"

behavior:
  draggable: user.role is admin or user.email equals organizer
  resizable: false
  editable: startTime after now and (user.role is admin or user.email equals organizer)
  deletable: user.role is admin or user.email equals organizer

constraints:
  minDuration: 15 minutes
  maxDuration: 8 hours
  allowedHours: 9 to 18
  allowedDays: monday to friday
```

#### 示例2：节假日事件类型

```dsl
type: holiday
name: 节假日

fields:
  - name: string, required
  - country: string, default: "CN"
  - isOfficial: boolean, default: true

validate:
  name is not empty
  duration is 1 day

display:
  color: "#ea4335"
  icon: "🎉"
  title: "{name}"
  description:
    when isOfficial is true:
      "法定节假日"
    else:
      "假期"

behavior:
  draggable: false
  resizable: false
  editable: user.role is admin
  deletable: user.role is admin
```

#### 示例3：任务事件类型

```dsl
type: task
name: 任务

fields:
  - title: string, required
  - status: enum(todo, doing, done), default: todo
  - priority: enum(low, normal, high), default: normal
  - assignee: email

validate:
  title is not empty
  duration >= 15 minutes

display:
  color:
    when status is done: "#34a853"
    when status is doing: "#fbbc04"
    else: "#9e9e9e"

  icon:
    when status is done: "✓"
    when status is doing: "⏳"
    else: "◯"

  title: "{title}"
  description:
    when status is done:
      "已完成"
    when status is doing:
      "进行中 · {priority}"
    else:
      "待办 · {priority}"

behavior:
  draggable: true
  resizable: true
  editable: user.email equals assignee or user.role is admin
  deletable: user.email equals assignee or user.role is admin
```

## Peggy 语法定义

### 完整 Peggy 语法文件

文件：`packages/dsl/src/parser/event-dsl.pegjs`

```peggy
{
  // 辅助函数
  function buildBinaryExpression(head, tail) {
    return tail.reduce((left, [op, right]) => ({
      type: 'BinaryExpression',
      operator: op,
      left: left,
      right: right
    }), head);
  }
}

// ============================================
// 顶层规则
// ============================================

EventTypeDefinition
  = _ sections:Section+ _ {
      const result = {};
      sections.forEach(section => {
        result[section.name] = section.value;
      });
      return result;
    }

Section
  = TypeSection
  / NameSection
  / DescriptionSection
  / FieldsSection
  / ValidateSection
  / DisplaySection
  / BehaviorSection
  / ConstraintsSection

// ============================================
// 基本信息部分
// ============================================

TypeSection
  = "type:" _ value:Identifier _ {
      return { name: 'type', value: value };
    }

NameSection
  = "name:" _ value:String _ {
      return { name: 'name', value: value };
    }

DescriptionSection
  = "description:" _ value:String _ {
      return { name: 'description', value: value };
    }

// ============================================
// 字段定义部分
// ============================================

FieldsSection
  = "fields:" _ fields:FieldDefinition+ {
      return { name: 'fields', value: fields };
    }

FieldDefinition
  = _ "-" _ name:Identifier ":" _ type:FieldType modifiers:FieldModifier* _ {
      return {
        name: name,
        type: type,
        ...Object.assign({}, ...modifiers)
      };
    }

FieldType
  = "string"
  / "number"
  / "boolean"
  / "email"
  / "text"
  / "list of " type:FieldType { return { type: 'list', itemType: type }; }
  / "enum(" values:EnumValues ")" { return { type: 'enum', values: values }; }

EnumValues
  = head:Identifier tail:("," _ value:Identifier { return value; })* {
      return [head, ...tail];
    }

FieldModifier
  = "," _ "required" { return { required: true }; }
  / "," _ "default:" _ value:Literal { return { default: value }; }
  / "," _ "min:" _ value:Number { return { min: value }; }
  / "," _ "max:" _ value:Number { return { max: value }; }

// ============================================
// 验证规则部分
// ============================================

ValidateSection
  = "validate:" _ rules:ValidationRule+ {
      return { name: 'validate', value: rules };
    }

ValidationRule
  = _ WhenExpression
  / _ ComparisonExpression _

WhenExpression
  = "when" _ condition:LogicalExpression ":" _ rules:ValidationRule+ {
      return {
        type: 'When',
        condition: condition,
        rules: rules
      };
    }

ComparisonExpression
  = BetweenExpression
  / RangeExpression
  / ConflictExpression
  / LogicalExpression

BetweenExpression
  = field:FieldAccess _ "between" _ min:Literal _ "and" _ max:Literal {
      return {
        type: 'Between',
        field: field,
        min: min,
        max: max
      };
    }

RangeExpression
  = field:FieldAccess _ operator:ComparisonOperator _ value:Literal {
      return {
        type: 'Comparison',
        operator: operator,
        left: field,
        right: value
      };
    }

ConflictExpression
  = "no" _ "conflict" _ "with" _ "other" _ "events" {
      return { type: 'NoConflict' };
    }
  / "conflict" _ "with" _ "other" _ "events" {
      return { type: 'Conflict' };
    }

LogicalExpression
  = head:LogicalTerm tail:(_ operator:("and" / "or") _ right:LogicalTerm {
      return [operator, right];
    })* {
      return buildBinaryExpression(head, tail);
    }

LogicalTerm
  = "not" _ expr:ComparisonTerm {
      return { type: 'UnaryExpression', operator: 'not', argument: expr };
    }
  / ComparisonTerm

ComparisonTerm
  = left:FieldAccess _ operator:("is" / "equals" / "is not" / "not equals" / ">" / ">=" / "<" / "<=") _ right:Literal {
      return {
        type: 'Comparison',
        operator: operator,
        left: left,
        right: right
      };
    }
  / FieldAccess

// ============================================
// 显示规则部分
// ============================================

DisplaySection
  = "display:" _ rules:DisplayRule+ {
      return { name: 'display', value: rules };
    }

DisplayRule
  = _ name:("color" / "icon" / "title" / "description") ":" _ value:DisplayValue _ {
      return { name: name, value: value };
    }

DisplayValue
  = WhenDisplayExpression
  / StringTemplate
  / String

WhenDisplayExpression
  = "when" _ condition:LogicalExpression ":" _ value:DisplayValue rest:(_ "else:" _ value:DisplayValue { return value; })? {
      return {
        type: 'Conditional',
        condition: condition,
        consequent: value,
        alternate: rest
      };
    }

// ============================================
// 行为规则部分
// ============================================

BehaviorSection
  = "behavior:" _ rules:BehaviorRule+ {
      return { name: 'behavior', value: rules };
    }

BehaviorRule
  = _ name:("draggable" / "resizable" / "editable" / "deletable") ":" _ value:BehaviorValue _ {
      return { name: name, value: value };
    }

BehaviorValue
  = LogicalExpression
  / Boolean

// ============================================
// 约束部分
// ============================================

ConstraintsSection
  = "constraints:" _ constraints:ConstraintRule+ {
      return { name: 'constraints', value: constraints };
    }

ConstraintRule
  = _ name:Identifier ":" _ value:Literal _ {
      return { name: name, value: value };
    }

// ============================================
// 字段访问
// ============================================

FieldAccess
  = head:Identifier tail:("." property:Identifier { return property; })* {
      return {
        type: 'FieldAccess',
        path: [head, ...tail]
      };
    }

// ============================================
// 字面量
// ============================================

Literal
  = Duration
  / Number
  / String
  / Boolean
  / Identifier

Duration
  = value:Number _ unit:("minutes" / "hours" / "days" / "weeks") {
      return {
        type: 'Duration',
        value: value,
        unit: unit
      };
    }

Number
  = digits:[0-9]+ {
      return parseInt(digits.join(''), 10);
    }

String
  = '"' chars:[^"]* '"' {
      return chars.join('');
    }

StringTemplate
  = '"' parts:TemplatePart+ '"' {
      return {
        type: 'Template',
        parts: parts
      };
    }

TemplatePart
  = "{" field:FieldAccess "}" { return field; }
  / chars:[^{}]+ { return chars.join(''); }

Boolean
  = "true" { return true; }
  / "false" { return false; }

Identifier
  = chars:[a-zA-Z_][a-zA-Z0-9_]* {
      return chars.flat().join('');
    }

ComparisonOperator
  = ">=" / "<=" / ">" / "<" / "is" / "equals" / "is not" / "not equals"

// ============================================
// 空白和注释
// ============================================

_
  = (WhiteSpace / Comment)*

WhiteSpace
  = [ \t\n\r]

Comment
  = "#" [^\n]*
```

### AST 类型定义

文件：`packages/dsl/src/ast/types.ts`

```typescript
/**
 * Event DSL AST 类型定义
 */

export interface EventTypeAST {
  type: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  validate: ValidationRule[];
  display: DisplayRule[];
  behavior: BehaviorRule[];
  constraints?: ConstraintRule[];
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
}

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'text'
  | { type: 'list'; itemType: FieldType }
  | { type: 'enum'; values: string[] };

export type ValidationRule =
  | BetweenRule
  | ComparisonRule
  | ConflictRule
  | WhenRule
  | LogicalRule;

export interface BetweenRule {
  type: 'Between';
  field: FieldAccess;
  min: any;
  max: any;
}

export interface ComparisonRule {
  type: 'Comparison';
  operator: string;
  left: FieldAccess;
  right: any;
}

export interface ConflictRule {
  type: 'NoConflict' | 'Conflict';
}

export interface WhenRule {
  type: 'When';
  condition: Expression;
  rules: ValidationRule[];
}

export interface LogicalRule {
  type: 'BinaryExpression' | 'UnaryExpression';
  operator: 'and' | 'or' | 'not';
  left?: Expression;
  right?: Expression;
  argument?: Expression;
}

export interface FieldAccess {
  type: 'FieldAccess';
  path: string[];
}

export type Expression = any; // 可以是各种表达式类型

export interface DisplayRule {
  name: 'color' | 'icon' | 'title' | 'description';
  value: string | ConditionalValue | TemplateValue;
}

export interface ConditionalValue {
  type: 'Conditional';
  condition: Expression;
  consequent: any;
  alternate?: any;
}

export interface TemplateValue {
  type: 'Template';
  parts: Array<string | FieldAccess>;
}

export interface BehaviorRule {
  name: 'draggable' | 'resizable' | 'editable' | 'deletable';
  value: boolean | Expression;
}

export interface ConstraintRule {
  name: string;
  value: any;
}
```

## 包架构与数据模型

### 包结构

CalenderJS 采用 monorepo 结构，分为两个核心包：

```
packages/
├── core/              @calenderjs/core
│   └── 通用接口和数据模型
│
├── event-dsl/         @calenderjs/event-dsl
│   └── DSL解析、生成和运行时
│
└── calendar/         @calenderjs/calendar
    └── Calendar 组件（基于 WSX，必需）
```

**依赖关系**：

```
@calenderjs/event-dsl  ──依赖→  @calenderjs/core
                                    ↑
                                    │
@calenderjs/calendar    ──依赖→  @calenderjs/core
                                    │
                                    │
                                 基础接口
```

### Core 包：通用数据模型

`@calenderjs/core` 定义所有包共享的核心接口和数据模型。

#### Event 接口

```typescript
/**
 * 事件核心接口
 */
export interface Event {
  id: string;
  type: string;              // 事件类型 (meeting, holiday, task等)
  title: string;
  startTime: Date;
  endTime: Date;
  data: Record<string, any>; // 由DSL定义的fields
  metadata?: EventMetadata;
}

export interface EventMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}
```

#### User 接口

```typescript
/**
 * 用户接口（用于权限验证）
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  vipLevel?: number;
  [key: string]: any;
}

export type UserRole = 'admin' | 'user' | 'guest' | string;
```

#### Context 接口

```typescript
/**
 * 验证上下文
 */
export interface ValidationContext {
  user?: User;
  events: Event[];  // 用于冲突检测
  now: Date;
  [key: string]: any;
}

/**
 * 渲染上下文
 */
export interface RenderContext {
  user?: User;
  theme?: 'light' | 'dark';
  locale?: string;
  [key: string]: any;
}
```

#### EventType 接口

```typescript
/**
 * 事件类型定义接口
 */
export interface EventTypeDefinition {
  type: string;
  name: string;
  description?: string;
  schema: JSONSchema;        // 用于运行时验证
  validate?: (event: Event, context: ValidationContext) => ValidationResult;
  render?: (event: Event, context: RenderContext) => RenderedEvent;
  canPerform?: (action: string, event: Event, user: User) => boolean;
}

export interface JSONSchema {
  $schema?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface RenderedEvent {
  title: string;
  color: string;
  icon?: string;
  description?: string;
}
```

### Event-DSL 包：DSL 处理

`@calenderjs/event-dsl` 依赖 `@calenderjs/core`，提供 DSL 解析、代码生成和运行时功能。

#### 包结构

```
packages/event-dsl/
├── src/
│   ├── parser/           # DSL解析器
│   │   ├── event-dsl.pegjs
│   │   └── parse.ts
│   ├── ast/              # AST类型定义
│   │   └── types.ts
│   ├── generators/       # 代码生成器
│   │   ├── json-schema.ts
│   │   └── typescript.ts
│   └── runtime/          # 运行时引擎
│       └── EventDSLRuntime.ts
└── package.json
```

#### 主要导出

```typescript
// 解析器
export function parseEventDSL(dslText: string): EventTypeAST;

// 生成器
export function generateJSONSchema(ast: EventTypeAST): JSONSchema;
export function generateTypeScript(ast: EventTypeAST): string;

// 运行时
export class EventDSLRuntime {
  validate(event: Event, context: ValidationContext): ValidationResult;
  render(event: Event, context: RenderContext): RenderedEvent;
  canPerform(action: string, event: Event, user: User): boolean;
}
```

## 完整数据流程

### DSL → JSON Data Model

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 编写 DSL                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
    type: meeting
    fields:
      - title: string, required
      - attendees: list of email, required
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Peggy Parser 解析                                    │
│ parseEventDSL(dslText)                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 生成 AST (已经是JSON格式!)                            │
│ {                                                            │
│   type: "meeting",                                           │
│   fields: [                                                  │
│     { name: "title", type: "string", required: true },      │
│     { name: "attendees", type: {...}, required: true }      │
│   ]                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
            ┌─────────────┴─────────────┐
            ↓                           ↓
┌─────────────────────┐     ┌─────────────────────┐
│ Step 4a:            │     │ Step 4b:            │
│ 生成 JSON Schema     │     │ 生成 TypeScript      │
│ (运行时验证)         │     │ (开发时类型)         │
│                     │     │                     │
│ generateJSONSchema  │     │ generateTypeScript  │
│                     │     │                     │
│ {                   │     │ export interface    │
│   type: "object",   │     │ MeetingEventData {  │
│   properties: {...} │     │   title: string;    │
│ }                   │     │   attendees: string;│
└─────────────────────┘     └─────────────────────┘
```

### DSL 类型映射表

#### DSL → JSON Schema 映射

| DSL 类型 | JSON Schema |
|---------|-------------|
| `string` | `{"type": "string"}` |
| `number` | `{"type": "number"}` |
| `boolean` | `{"type": "boolean"}` |
| `email` | `{"type": "string", "format": "email"}` |
| `text` | `{"type": "string"}` |
| `list of T` | `{"type": "array", "items": {...}}` |
| `enum(a,b,c)` | `{"type": "string", "enum": ["a","b","c"]}` |

#### DSL → TypeScript 映射

| DSL 类型 | TypeScript |
|---------|-----------|
| `string` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| `email` | `string` (注释: email format) |
| `text` | `string` |
| `list of T` | `T[]` |
| `enum(a,b,c)` | `'a' \| 'b' \| 'c'` |

#### 字段修饰符映射

| DSL 修饰符 | JSON Schema | TypeScript |
|-----------|-------------|-----------|
| `required` | `"required": ["fieldName"]` | `fieldName: Type` (非可选) |
| 无 required | 不在 required 数组 | `fieldName?: Type` (可选) |
| `default: value` | `"default": value` | `/** @default value */` |
| `min: n` | `"minItems": n` 或 `"minimum": n` | `/** @min n */` |
| `max: n` | `"maxItems": n` 或 `"maximum": n` | `/** @max n */` |

### 生成示例对比

**输入 DSL**：
```dsl
type: meeting
name: 会议

fields:
  - title: string, required
  - attendees: list of email, required, min: 1, max: 50
  - priority: enum(low, normal, high), default: normal
```

**输出 AST (JSON)**：
```json
{
  "type": "meeting",
  "name": "会议",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    {
      "name": "attendees",
      "type": { "type": "list", "itemType": "email" },
      "required": true,
      "min": 1,
      "max": 50
    },
    {
      "name": "priority",
      "type": { "type": "enum", "values": ["low", "normal", "high"] },
      "default": "normal"
    }
  ]
}
```

**输出 JSON Schema**：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "会议",
  "properties": {
    "title": { "type": "string" },
    "attendees": {
      "type": "array",
      "items": { "type": "string", "format": "email" },
      "minItems": 1,
      "maxItems": 50
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high"],
      "default": "normal"
    }
  },
  "required": ["title", "attendees"]
}
```

**输出 TypeScript**：
```typescript
export interface MeetingEventData {
  title: string;

  /**
   * @minItems 1
   * @maxItems 50
   */
  attendees: string[];  // email format

  /** @default "normal" */
  priority?: 'low' | 'normal' | 'high';
}
```

## DSL 运行时引擎

### 核心架构

```
DSL Text (String)
    ↓
Peggy Parser
    ↓
AST (JSON格式)
    ↓
    ├─→ generateJSONSchema() → schema.json  (运行时)
    ├─→ generateTypeScript()  → types.ts    (开发时)
    └─→ EventDSLRuntime      → 验证/渲染/权限
```

### 运行时接口

文件：`packages/dsl/src/runtime/EventDSLRuntime.ts`

```typescript
/**
 * Event DSL Runtime
 * 执行解析后的 AST
 */
export class EventDSLRuntime {
  constructor(private ast: EventTypeAST) {}

  /**
   * 验证事件数据
   */
  validate(event: Event, context: ValidationContext): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.ast.validate) {
      const result = this.evaluateValidationRule(rule, event, context);
      if (!result.valid) {
        errors.push(result.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 渲染事件显示
   */
  render(event: Event, context: RenderContext): RenderedEvent {
    const result: RenderedEvent = {
      title: '',
      color: '#4285f4',
    };

    for (const rule of this.ast.display) {
      const value = this.evaluateDisplayRule(rule, event, context);
      result[rule.name] = value;
    }

    return result;
  }

  /**
   * 检查行为权限
   */
  canPerform(action: string, event: Event, user: User): boolean {
    const behaviorRule = this.ast.behavior.find(r => r.name === action);
    if (!behaviorRule) return true;

    if (typeof behaviorRule.value === 'boolean') {
      return behaviorRule.value;
    }

    return this.evaluateExpression(behaviorRule.value, event, { user });
  }

  // 私有方法：评估各种规则...
  private evaluateValidationRule(rule: ValidationRule, event: Event, context: any): { valid: boolean; message?: string } {
    // 实现细节...
  }

  private evaluateDisplayRule(rule: DisplayRule, event: Event, context: any): any {
    // 实现细节...
  }

  private evaluateExpression(expr: Expression, event: Event, context: any): any {
    // 实现细节...
  }
}
```

### 使用示例

```typescript
import { parseEventDSL } from '@calenderjs/dsl';
import { EventDSLRuntime } from '@calenderjs/dsl';

// 1. 解析 DSL 文本
const dslText = `
type: meeting
name: 会议

fields:
  - title: string, required
  - attendees: list of email

validate:
  attendees.count between 1 and 50
  startTime.hour between 9 and 18

display:
  color: "#4285f4"
  title: "{event.title}"
`;

const ast = parseEventDSL(dslText);

// 2. 创建运行时
const runtime = new EventDSLRuntime(ast);

// 3. 验证事件
const event = {
  id: '1',
  type: 'meeting',
  title: '团队会议',
  startTime: new Date('2024-12-30T10:00:00'),
  endTime: new Date('2024-12-30T11:00:00'),
  data: {
    attendees: ['user1@example.com', 'user2@example.com'],
  },
};

const validationResult = runtime.validate(event, { events: [] });
console.log(validationResult);
// { valid: true }

// 4. 渲染事件
const rendered = runtime.render(event, {});
console.log(rendered);
// { title: '团队会议', color: '#4285f4' }

// 5. 检查行为权限
const canDrag = runtime.canPerform('draggable', event, {
  email: 'admin@example.com',
  role: 'admin',
});
console.log(canDrag);
// true
```

## Calendar 组件集成

### 组件 Props

```typescript
interface CalendarProps {
  // Event DSL 配置（文本或已解析的 AST）
  eventDSL: string | EventTypeAST | EventTypeAST[];

  // 事件数据
  events: Event[];

  // 事件回调
  onEventCreate?: (event: Partial<Event>) => void;
  onEventUpdate?: (id: string, event: Partial<Event>) => void;
  onEventDelete?: (id: string) => void;

  // 视图配置
  defaultView?: 'month' | 'week' | 'day';
  currentDate?: Date;

  // 用户上下文（用于权限验证）
  user?: User;
}
```

### 组件使用示例

```tsx
<wsx-calendar
  event-dsl={meetingDSL}
  events={events}
  user={currentUser}
  default-view="week"
  on-event-create={handleCreate}
  on-event-update={handleUpdate}
  on-event-delete={handleDelete}
/>
```

## 实施计划

### 阶段 1: DSL 核心（2周）

**Week 1**：
1. 完成 Peggy 语法定义
2. 实现基础解析器
3. 定义完整的 AST 类型
4. 单元测试（语法解析）

**Week 2**：
1. 实现 DSL 运行时引擎
2. 实现验证规则评估
3. 实现显示规则评估
4. 实现行为规则评估
5. 集成测试

### 阶段 2: Calendar 组件（3周，必需）

**重要**：Calendar 组件是核心组件，必须实现。组件基于 WSX 框架构建。

**Week 3-4**：
1. 使用 WSX 构建 Calendar 组件基础结构
2. 实现月/周/日视图渲染（WSX 组件）
3. 集成 Event DSL（验证、渲染、行为）
4. 实现事件 CRUD 操作
5. 动画效果

**Week 5**：
1. 拖拽功能（基于 HTML5 Drag and Drop API）
2. 性能优化
3. 单元测试
4. 文档

### 阶段 3: 工具和生态（2周）

**Week 6**：
1. DSL 语法高亮
2. VS Code 扩展
3. 在线 DSL 编辑器

**Week 7**：
1. 示例项目
2. 完整文档
3. 发布 1.0

## 文件结构

```
calenderjs/
├── packages/
│   ├── core/                              # @calenderjs/core
│   │   ├── src/
│   │   │   ├── models/
│   │   │   │   ├── Event.ts              # Event 接口
│   │   │   │   ├── User.ts               # User 接口
│   │   │   │   ├── EventType.ts          # EventType 接口
│   │   │   │   └── index.ts
│   │   │   ├── contexts/
│   │   │   │   ├── ValidationContext.ts
│   │   │   │   ├── RenderContext.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   ├── common.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── event-dsl/                         # @calenderjs/event-dsl
│   │   ├── src/
│   │   │   ├── parser/
│   │   │   │   ├── event-dsl.pegjs       # Peggy 语法定义
│   │   │   │   ├── parse.ts
│   │   │   │   └── index.ts
│   │   │   ├── ast/
│   │   │   │   ├── types.ts              # AST 类型定义
│   │   │   │   └── index.ts
│   │   │   ├── generators/
│   │   │   │   ├── json-schema.ts        # AST → JSON Schema
│   │   │   │   ├── typescript.ts         # AST → TypeScript
│   │   │   │   └── index.ts
│   │   │   ├── runtime/
│   │   │   │   ├── EventDSLRuntime.ts    # 运行时引擎
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json                  # 依赖: @calenderjs/core
│   │   └── tsconfig.json
│   │
│   └── calendar/                          # @calenderjs/calendar (必需)
│       ├── src/
│       │   ├── Calendar.wsx              # 主组件（基于 WSX）
│       │   ├── views/
│       │   │   ├── MonthView.wsx        # 月视图（WSX）
│       │   │   ├── WeekView.wsx         # 周视图（WSX）
│       │   │   └── DayView.wsx          # 日视图（WSX）
│       │   └── index.ts
│       ├── package.json                  # 依赖: @calenderjs/core, @calenderjs/event-dsl, @wsxjs/wsx-core
│       └── vite.config.ts
│
├── docs/
│   ├── rfc/
│   │   └── 0001-event-calendar-dsl.md   # 本文档
│   └── dsl/
│       ├── syntax.md                      # DSL 语法文档
│       ├── examples.md                    # DSL 示例
│       └── api.md                         # API 文档
│
└── examples/
    ├── basic/                             # 基础示例
    ├── meeting-scheduler/                 # 会议调度示例
    └── task-manager/                      # 任务管理示例
```

## 依赖项

### @calenderjs/core

```json
{
  "name": "@calenderjs/core",
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**特点**：
- ✅ 零运行时依赖
- ✅ 仅包含接口定义
- ✅ 体积极小（< 10KB）

### @calenderjs/event-dsl

```json
{
  "name": "@calenderjs/event-dsl",
  "dependencies": {
    "@calenderjs/core": "workspace:*"
  },
  "devDependencies": {
    "peggy": "^4.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

**特点**：
- ✅ Peggy 生成纯 JavaScript 解析器
- ✅ 无需在运行时加载 Peggy
- ✅ 解析器体积小（约 50KB gzipped）
- ✅ 仅依赖 @calenderjs/core

### @calenderjs/calendar (必需)

**重要**：Calendar 组件是核心组件，必须实现。组件基于 WSX 框架构建。

```json
{
  "name": "@calenderjs/calendar",
  "dependencies": {
    "@calenderjs/core": "workspace:*",
    "@calenderjs/event-dsl": "workspace:*",
    "@wsxjs/wsx-core": "^0.0.1"
  },
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.0.1"
  },
  "devDependencies": {
    "@wsxjs/wsx-vite-plugin": "^0.0.1",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

**组件特点**：
- ✅ 基于 WSX 框架构建（Web Components + JSX）
- ✅ 使用 Event DSL 驱动渲染和验证
- ✅ 支持月/周/日三种视图
- ✅ 零运行时开销（构建时编译）

## 测试策略

### DSL 解析测试

```typescript
describe('Event DSL Parser', () => {
  it('should parse simple event type', () => {
    const dsl = `
      type: meeting
      name: 会议
    `;
    const ast = parseEventDSL(dsl);
    expect(ast.type).toBe('meeting');
    expect(ast.name).toBe('会议');
  });

  it('should parse validation rules', () => {
    const dsl = `
      validate:
        attendees.count between 1 and 50
    `;
    const ast = parseEventDSL(dsl);
    expect(ast.validate[0].type).toBe('Between');
  });
});
```

### DSL 运行时测试

```typescript
describe('Event DSL Runtime', () => {
  it('should validate event correctly', () => {
    const runtime = new EventDSLRuntime(ast);
    const result = runtime.validate(event, context);
    expect(result.valid).toBe(true);
  });
});
```

## 安全考虑

### DSL 安全特性

1. **无副作用**：DSL 不支持变量赋值、函数定义
2. **无文件访问**：DSL 无法访问文件系统
3. **无网络访问**：DSL 无法发起网络请求
4. **沙箱执行**：DSL 运行时完全隔离
5. **类型安全**：字段访问有类型检查

### 运行时安全

```typescript
// 限制字段访问深度（防止无限递归）
const MAX_FIELD_DEPTH = 10;

// 限制执行时间（防止死循环）
const MAX_EXECUTION_TIME = 100; // ms

// 限制 DSL 文本大小（防止内存攻击）
const MAX_DSL_SIZE = 100 * 1024; // 100KB
```

## 性能目标

- **解析性能**：100KB DSL 文本 < 50ms
- **验证性能**：单个事件验证 < 1ms
- **渲染性能**：单个事件渲染 < 1ms
- **内存使用**：100个事件类型 < 10MB

## 向后兼容性

- 无。这是新组件，无兼容性问题。
- DSL 语法版本化（通过 `version: 1.0` 字段）

## 开放问题

1. **DSL 版本管理**：如何处理 DSL 语法升级？
2. **错误信息**：如何提供友好的 DSL 错误信息？
3. **IDE 支持**：如何快速实现 VS Code 语法高亮？
4. **性能优化**：是否需要 DSL 编译缓存？

## 参考资料

- [PEG.js / Peggy](https://peggyjs.org/)
- [Parsing Expression Grammar](https://en.wikipedia.org/wiki/Parsing_expression_grammar)
- [Google Calendar API](https://developers.google.com/calendar)
- [CEL - Common Expression Language](https://github.com/google/cel-spec)

---

**状态**: 等待审批
**下一步**: 实现 Peggy 解析器和运行时引擎
