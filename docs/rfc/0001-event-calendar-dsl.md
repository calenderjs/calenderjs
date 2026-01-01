# RFC-0001: Event DSL (领域特定语言)

**状态**: Draft
**创建日期**: 2024-12-30
**作者**: WSX Team
**关联**: RFC-0009 (Calendar Component)

## 摘要

设计并实现 **Event DSL**（领域特定语言），一种声明式的、领域友好的配置语言，专为事件日历领域设计。Event DSL 使得非程序员也能理解和配置事件类型，用于定义事件的验证规则、显示规则和行为规则。

**核心创新**：Event DSL 是一种声明式的、领域友好的配置语言，专为事件日历领域设计，使得非程序员也能理解和配置事件类型。

**时间敏感活动支持**：
- ✅ 时区支持（IANA 时区标识符）
- ✅ 重复事件（daily/weekly/monthly/yearly）
- ✅ 全天事件支持
- ✅ 时间精度控制
- ✅ 时间范围验证
- ✅ 跨天事件支持

**开源定位**：
- **Event DSL**：开源配置语言（MIT协议）
- **@calenderjs/event-dsl**：DSL 解析器和运行时引擎（MIT协议）
- **商业应用**：Appointment Service 等业务服务可以基于此 DSL 构建（付费SaaS）

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
- **框架学习者**：希望学习 DSL 设计的开发者

### 与 Calendar 组件的关系

**重要**：Event DSL 会被编译成 Event Data Model（JSON 格式）。Calendar 组件（见 RFC-0009）**只处理编译后的 JSON 数据**，不知道 DSL 的存在。

**数据流程**：
```
DSL 文本 → 解析器 → AST (JSON) → 编译 → Event Data Model (JSON) → Calendar 组件
```

- ✅ **DSL 是配置层**：用于定义事件类型、验证规则、显示规则、行为规则
- ✅ **编译后的 JSON 是数据层**：Calendar 组件只处理 JSON 数据模型
- ✅ **组件不涉及 DSL**：组件不知道 DSL 的存在，只处理数据模型

## Event DSL 完整定义

### DSL 设计理念

**核心原则**：
1. **领域特定**：只包含事件日历领域需要的概念
2. **声明式**：描述"是什么"，而不是"怎么做"
3. **自然语言风格**：读起来像自然语言，而不是代码
4. **安全可控**：无副作用，沙箱执行
5. **时间敏感**：完整支持时区、重复事件、时间验证等时间相关特性

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
  # 基础时间验证（自动包含）
  startTime before endTime
  duration >= minDuration
  duration <= maxDuration
  
  # 业务验证
  attendees.count between 1 and 50
  startTime.hour between 9 and 18
  duration between 15 minutes and 8 hours
  no conflict with other events

  # 时间精度验证
  when timePrecision is set:
    startTime.minute mod timePrecision is 0
    endTime.minute mod timePrecision is 0

  # 提前创建验证
  when minAdvanceTime is set:
    startTime after now plus minAdvanceTime
  when maxAdvanceTime is set:
    startTime before now plus maxAdvanceTime

  # 时区验证
  when timeZone is set:
    event.timeZone equals timeZone
  when allowedTimeZones is set:
    event.timeZone in allowedTimeZones

  # 条件验证
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
  timeZone: "Asia/Shanghai"              # 事件时区（IANA 时区标识符）
  allowedTimeZones: ["Asia/Shanghai", "America/New_York"]  # 允许的时区列表
  timePrecision: 15 minutes              # 时间精度（只能按指定间隔）
  minAdvanceTime: 1 hour                 # 至少提前创建时间
  maxAdvanceTime: 30 days                # 最多提前创建时间
  allowCrossDay: true                    # 允许跨天事件
  maxCrossDayDuration: 7 days           # 最大跨天时长
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
startTime.date          # 开始日期（不含时间）
endTime.date            # 结束日期（不含时间）
startTime.dayOfWeek     # 星期几（0=周日，1=周一...）
endTime.dayOfWeek       # 星期几
startTime.timeZone      # 时区信息
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
startTime.date equals "2025-01-15"        # 日期比较
endTime.date after startTime.date       # 日期比较
startTime.dayOfWeek in [1, 2, 3, 4, 5]  # 工作日验证
startTime.dayOfWeek in [0, 6]           # 周末验证

# 时间运算
startTime minus 1 day
endTime plus 2 hours
now minus 1 week
startTime plus 1 hour                   # 相对时间
now plus minAdvanceTime                 # 使用约束中的值

# 时间字符串比较
startTime between "09:00" and "18:00"  # 时间范围
startTime equals "10:30"                 # 精确时间
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

#### 8. 重复事件规则

```dsl
# 重复规则定义
recurring:
  frequency: daily | weekly | monthly | yearly
  interval: 1                    # 每 N 个周期
  endDate: "2025-12-31"           # 结束日期
  count: 10                        # 或重复次数
  daysOfWeek: [1, 3, 5]           # 每周一、三、五（0=周日）
  dayOfMonth: 15                  # 每月第 15 天
  excludeDates: ["2025-01-01"]    # 排除的日期
  timeZone: "Asia/Shanghai"       # 重复事件时区

# 重复事件验证
validate:
  when recurring is set:
    recurring.endDate after startTime or recurring.count > 0
    when recurring.frequency is weekly:
      recurring.daysOfWeek is not empty
    when recurring.frequency is monthly:
      recurring.dayOfMonth between 1 and 31
```

#### 9. 内置函数

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

# 时间操作
isBusinessDay(date)               # 是否为工作日
isWeekend(date)                   # 是否为周末
daysBetween(date1, date2)         # 计算天数差
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
  # 基础时间验证
  startTime before endTime
  duration between 15 minutes and 8 hours
  
  # 业务验证
  attendees.count between 1 and 50
  startTime.hour between 9 and 18
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
  timeZone: "Asia/Shanghai"
  timePrecision: 15 minutes
```

#### 示例2：重复会议事件类型

```dsl
type: weekly-meeting
name: 周例会

fields:
  - title: string, required
  - attendees: list of email, required
  - location: string

validate:
  startTime before endTime
  duration between 30 minutes and 2 hours
  startTime.dayOfWeek in [1, 3, 5]  # 每周一、三、五

display:
  color: "#4285f4"
  icon: "📅"
  title: "{title}"
  description: "周例会 · {location}"

behavior:
  draggable: false
  resizable: false
  editable: user.role is admin
  deletable: user.role is admin

constraints:
  minDuration: 30 minutes
  maxDuration: 2 hours
  allowedDays: monday, wednesday, friday

# 重复规则
recurring:
  frequency: weekly
  interval: 1
  daysOfWeek: [1, 3, 5]          # 每周一、三、五
  endDate: "2025-12-31"
  timeZone: "Asia/Shanghai"
```

#### 示例3：节假日事件类型

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
  allDay is true  # 节假日通常是全天事件

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

#### 示例4：任务事件类型

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
 * 事件核心接口（时间敏感活动）
 */
export interface Event {
  /** 唯一标识符 */
  id: string;
  /** 事件类型 (meeting, holiday, task等) */
  type: string;
  /** 标题 */
  title: string;
  /** 开始时间（ISO 8601 格式，包含时区） */
  startTime: Date;
  /** 结束时间（ISO 8601 格式，包含时区） */
  endTime: Date;
  /** 时区（IANA 时区标识符，如 "Asia/Shanghai"） */
  timeZone?: string;
  /** 是否全天事件 */
  allDay?: boolean;
  /** 重复规则 */
  recurring?: RecurringRule;
  /** 父事件 ID（如果是重复事件的实例） */
  parentEventId?: string;
  /** 重复实例 ID（用于标识重复序列中的特定实例） */
  recurrenceId?: string;
  /** 由DSL定义的fields数据 */
  data: Record<string, any>;
  /** 元数据 */
  metadata?: EventMetadata;
}

/**
 * 重复规则
 */
export interface RecurringRule {
  /** 频率 */
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** 间隔（如每 2 周） */
  interval: number;
  /** 结束日期 */
  endDate?: Date;
  /** 重复次数 */
  count?: number;
  /** 星期几（0=周日，1=周一...） */
  daysOfWeek?: number[];
  /** 每月第几天 */
  dayOfMonth?: number;
  /** 排除的日期列表 */
  excludeDates?: Date[];
  /** 时区（重复事件应保持在同一时区） */
  timeZone?: string;
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
import { parseEventDSL } from '@calenderjs/event-dsl';
import { EventDSLRuntime } from '@calenderjs/event-dsl';

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

## 实施计划

### 阶段 1: DSL 核心（2周）

#### ✅ Week 1: 解析器和 AST

- [x] **1.1 完成 Peggy 语法定义**
  - [x] 创建 `packages/event-dsl/src/event-dsl.pegjs`
  - [x] 定义 EventTypeDefinition 规则
  - [x] 定义字段定义规则（FieldDefinition）
  - [x] 定义验证规则（ValidationRule）
  - [x] 定义显示规则（DisplayRule）
  - [x] 定义行为规则（BehaviorRule）
  - [x] 定义表达式规则（Expression）
  - [x] 定义字面量规则（Literal）

- [x] **1.2 实现基础解析器**
  - [x] 创建 `packages/event-dsl/src/parser/parse.ts`
  - [x] 集成 Peggy 生成的解析器
  - [x] 实现 `parseEventDSL()` 函数
  - [x] AST 规范化处理
  - [x] 错误处理和错误信息

- [x] **1.3 定义完整的 AST 类型**
  - [x] 创建 `packages/event-dsl/src/ast/types.ts`
  - [x] EventTypeAST 接口
  - [x] FieldDefinition 接口
  - [x] ValidationRule 类型（Between, Comparison, Conflict, When, Logical）
  - [x] DisplayRule 接口
  - [x] BehaviorRule 接口
  - [x] Expression 类型
  - [x] FieldAccess 接口
  - [x] TemplateValue 接口
  - [x] ConditionalValue 接口

- [x] **1.4 单元测试（语法解析）**
  - [x] 解析器基础测试
  - [x] 语法错误测试
  - [x] AST 结构验证测试

#### ✅ Week 2: 运行时引擎

- [x] **2.1 实现 DSL 运行时引擎**
  - [x] 创建 `packages/event-dsl/src/runtime/EventDSLRuntime.ts`
  - [x] 构造函数实现
  - [x] `validate()` 方法框架
  - [x] `render()` 方法框架
  - [x] `canPerform()` 方法框架

- [x] **2.2 实现验证规则评估**
  - [x] `evaluateValidationRule()` 方法
  - [x] Between 规则评估
  - [x] Comparison 规则评估
  - [x] Conflict/NoConflict 规则评估
  - [x] When 规则评估
  - [x] BinaryExpression 规则评估（and/or）
  - [x] UnaryExpression 规则评估（not）

- [x] **2.3 实现显示规则评估**
  - [x] `evaluateDisplayValue()` 方法
  - [x] 字符串值处理
  - [x] Conditional 值处理
  - [x] Template 值处理
  - [x] `evaluateTemplate()` 方法实现

- [x] **2.4 实现行为规则评估**
  - [x] `evaluateExpression()` 方法
  - [x] FieldAccess 表达式评估
  - [x] Comparison 表达式评估
  - [x] BinaryExpression 表达式评估
  - [x] UnaryExpression 表达式评估
  - [x] `getFieldValue()` 方法（支持 event.data, user.*, 特殊字段）
  - [x] `getLiteralValue()` 方法（支持 Duration 类型）
  - [x] `compareValues()` 方法（支持多种操作符）
  - [x] `checkTimeConflict()` 方法

- [x] **2.5 集成测试**
  - [x] 88 个测试用例
  - [x] 95.14% 语句覆盖率
  - [x] 87.73% 分支覆盖率
  - [x] 100% 函数覆盖率

#### ✅ 1.0 Core 包 (@calenderjs/core)

- [x] **1.0.1 数据模型定义**
  - [x] Event 接口 (`packages/core/src/models/Event.ts`)
  - [x] User 接口 (`packages/core/src/models/User.ts`)
  - [x] EventType 接口 (`packages/core/src/models/EventType.ts`)
  - [x] ValidationContext 接口 (`packages/core/src/contexts/ValidationContext.ts`)
  - [x] RenderContext 接口 (`packages/core/src/contexts/RenderContext.ts`)
  - [x] ValidationResult 类型 (`packages/core/src/types/common.ts`)
  - [x] RenderedEvent 类型 (`packages/core/src/types/common.ts`)

- [x] **1.0.2 构建配置**
  - [x] Vite 配置（CJS/ESM/d.ts 输出）
  - [x] TypeScript 配置
  - [x] Vitest 测试配置
  - [x] 100% 测试覆盖率

**状态**: ✅ 阶段 1 完成（95.14% 覆盖率）

---

### 阶段 1.5: 时间敏感活动支持（高优先级）

**优先级**: 🔴 高（时间敏感活动是事件日历的核心需求）  
**预计时间**: 2周  
**依据**: RFC-0001-Review（时间敏感活动审查报告）

#### ❌ Week 3: 时区和时间增强

- [ ] **1.5.1 更新 Event 数据模型**
  - [ ] 在 `Event` 接口添加 `timeZone?: string` 字段
  - [ ] 在 `Event` 接口添加 `allDay?: boolean` 字段
  - [ ] 在 `Event` 接口添加 `recurring?: RecurringRule` 字段
  - [ ] 在 `Event` 接口添加 `parentEventId?: string` 字段
  - [ ] 在 `Event` 接口添加 `recurrenceId?: string` 字段
  - [ ] 创建 `RecurringRule` 接口定义
  - [ ] 更新 `packages/core/src/models/Event.ts`
  - [ ] 更新相关类型导出

- [ ] **1.5.2 时间访问语法增强**
  - [ ] 在 Peggy 语法中添加 `startTime.date` 访问
  - [ ] 在 Peggy 语法中添加 `startTime.dayOfWeek` 访问
  - [ ] 在 Peggy 语法中添加 `startTime.timeZone` 访问
  - [ ] 在 AST 中支持日期、星期几、时区字段访问
  - [ ] 更新 `FieldAccess` 评估逻辑
  - [ ] 更新 `packages/event-dsl/src/runtime/EventDSLRuntime.ts`

- [ ] **1.5.3 时间比较语法增强**
  - [ ] 在 Peggy 语法中添加日期字符串比较（`"2025-01-15"`）
  - [ ] 在 Peggy 语法中添加时间字符串比较（`"09:00"`）
  - [ ] 在 Peggy 语法中添加 `dayOfWeek in [1,2,3,4,5]` 语法
  - [ ] 实现日期字符串解析和比较
  - [ ] 实现时间字符串解析和比较
  - [ ] 更新 `compareValues()` 方法支持新语法

- [ ] **1.5.4 时间约束语法扩展**
  - [ ] 在 Peggy 语法中添加 `timeZone` 约束解析
  - [ ] 在 Peggy 语法中添加 `allowedTimeZones` 约束解析
  - [ ] 在 Peggy 语法中添加 `timePrecision` 约束解析
  - [ ] 在 Peggy 语法中添加 `minAdvanceTime` 约束解析
  - [ ] 在 Peggy 语法中添加 `maxAdvanceTime` 约束解析
  - [ ] 在 Peggy 语法中添加 `allowCrossDay` 约束解析
  - [ ] 在 Peggy 语法中添加 `maxCrossDayDuration` 约束解析
  - [ ] 更新 `ConstraintRule` AST 类型
  - [ ] 更新 `packages/event-dsl/src/parser/event-dsl.pegjs`

- [ ] **1.5.5 基础时间验证规则**
  - [ ] 实现 `startTime before endTime` 自动验证
  - [ ] 实现 `duration >= minDuration` 验证
  - [ ] 实现 `duration <= maxDuration` 验证
  - [ ] 实现时间精度验证（`startTime.minute mod timePrecision is 0`）
  - [ ] 实现提前创建时间验证（`startTime after now plus minAdvanceTime`）
  - [ ] 实现时区验证（`event.timeZone equals timeZone`）
  - [ ] 实现全天事件验证（`allDay` 相关规则）
  - [ ] 更新验证规则评估逻辑

- [ ] **1.5.6 单元测试**
  - [ ] 时区相关测试用例
  - [ ] 时间访问语法测试
  - [ ] 时间比较语法测试
  - [ ] 时间约束测试
  - [ ] 基础时间验证测试
  - [ ] 边界情况测试

#### ❌ Week 4: 重复事件和全天事件

- [ ] **1.5.7 重复事件 DSL 语法**
  - [ ] 在 Peggy 语法中添加 `RecurringSection` 规则
  - [ ] 实现 `recurring:` 部分解析
  - [ ] 支持 `frequency: daily|weekly|monthly|yearly` 解析
  - [ ] 支持 `interval: number` 解析
  - [ ] 支持 `endDate: date` 解析
  - [ ] 支持 `count: number` 解析
  - [ ] 支持 `daysOfWeek: [1,3,5]` 解析
  - [ ] 支持 `dayOfMonth: number` 解析
  - [ ] 支持 `excludeDates: ["2025-01-01"]` 解析
  - [ ] 支持 `timeZone: string` 解析
  - [ ] 更新 AST 类型添加 `RecurringDefinition` 接口
  - [ ] 更新 `EventTypeAST` 接口添加 `recurring?` 字段

- [ ] **1.5.8 重复事件验证规则**
  - [ ] 实现重复事件验证（`when recurring is set`）
  - [ ] 验证 `endDate after startTime or count > 0`
  - [ ] 验证 `weekly` 频率需要 `daysOfWeek`
  - [ ] 验证 `monthly` 频率需要 `dayOfMonth between 1 and 31`
  - [ ] 验证 `yearly` 频率规则
  - [ ] 更新运行时验证逻辑

- [ ] **1.5.9 重复事件生成工具**
  - [ ] 创建 `packages/core/src/utils/recurring-utils.ts`
  - [ ] 实现 `generateRecurringInstances()` 函数
  - [ ] 支持 daily 重复生成
  - [ ] 支持 weekly 重复生成
  - [ ] 支持 monthly 重复生成
  - [ ] 支持 yearly 重复生成
  - [ ] 支持 `excludeDates` 排除日期
  - [ ] 支持 `endDate` 和 `count` 限制
  - [ ] 单元测试覆盖所有重复类型

- [ ] **1.5.10 全天事件支持**
  - [ ] 在 DSL 验证中添加全天事件验证规则
  - [ ] 实现 `allDay is true` 时的时间验证
  - [ ] 验证全天事件的 `startTime` 和 `endTime` 格式
  - [ ] 实现全天事件的显示逻辑
  - [ ] 更新日历组件支持全天事件渲染

- [ ] **1.5.11 mod 操作符支持**
  - [ ] 在 Peggy 语法中添加 `mod` 操作符
  - [ ] 在 `ComparisonOperator` 中添加 `mod` 支持
  - [ ] 实现 `mod` 运算逻辑（`a mod b`）
  - [ ] 更新 `compareValues()` 方法
  - [ ] 支持 `startTime.minute mod 15 is 0` 语法
  - [ ] 单元测试验证

- [ ] **1.5.12 时间工具函数库**
  - [ ] 创建 `packages/core/src/utils/time-utils.ts`
  - [ ] 实现 `isValidTimeRange()` 函数
  - [ ] 实现 `calculateDuration()` 函数
  - [ ] 实现 `hasTimeConflict()` 函数（支持全天事件）
  - [ ] 实现 `convertTimeZone()` 函数
  - [ ] 实现 `isBusinessHours()` 函数
  - [ ] 实现 `isBusinessDay()` 函数
  - [ ] 实现 `isWeekend()` 函数
  - [ ] 实现 `daysBetween()` 函数
  - [ ] 单元测试覆盖所有工具函数

- [ ] **1.5.13 集成测试**
  - [ ] 时区转换测试
  - [ ] 重复事件生成测试
  - [ ] 全天事件测试
  - [ ] 时间验证规则集成测试
  - [ ] 端到端测试：DSL → 验证 → 渲染
  - [ ] 性能测试（大量重复事件）

**预期产出**:
- ✅ Event 接口完整支持时区、重复事件、全天事件
- ✅ DSL 语法完整支持时间敏感活动特性
- ✅ 运行时引擎支持所有时间验证规则
- ✅ 时间工具函数库
- ✅ 重复事件生成工具
- ✅ 测试覆盖率保持 >90%

**状态**: ❌ 阶段 1.5 未开始（时间敏感活动核心功能）

---

### 阶段 1.6: 重复事件和数据模型生成 (关键补充)

**优先级**: 🔴 高（阻塞后续开发）
**预计时间**: 1周

#### ❌ 任务 1.5.1: 重复事件支持

**问题**: DSL语法定义了`recurring:`部分，但AST和Peggy解析器未实现。

- [ ] **1.5.1.1 扩展 AST 类型定义**
  - [ ] 在 `EventTypeAST` 接口添加 `recurring?: RecurringDefinition` 字段
  - [ ] 创建 `RecurringDefinition` 接口
  - [ ] 定义重复规则的所有字段（frequency, interval, endDate, count, daysOfWeek等）
  - [ ] 更新 `packages/event-dsl/src/ast/types.ts`

- [ ] **1.5.1.2 Peggy 语法扩展**
  - [ ] 在 `Section` 规则添加 `RecurringSection`
  - [ ] 实现 `RecurringSection` 解析规则
  - [ ] 实现 `RecurringRule` 解析规则
  - [ ] 支持 frequency, interval, endDate, count 等字段解析
  - [ ] 更新 `packages/event-dsl/src/parser/event-dsl.pegjs`

- [ ] **1.5.1.3 运行时引擎支持**
  - [ ] 在 `EventDSLRuntime` 添加重复事件验证
  - [ ] 实现 `recurring` 字段的规则评估
  - [ ] 验证重复规则完整性（endDate 或 count 必须存在）
  - [ ] 验证频率特定规则（weekly需要daysOfWeek等）

- [ ] **1.5.1.4 单元测试**
  - [ ] 解析器测试：解析 recurring 部分
  - [ ] AST 验证：recurring 字段结构正确
  - [ ] 运行时测试：重复事件验证规则
  - [ ] 边界测试：缺失字段、无效值等

#### ❌ 任务 1.5.2: 时间操作符完善

**问题**: DSL使用了 `mod` 操作符但未在语法中定义。

- [ ] **1.5.2.1 定义 mod 操作符**
  - [ ] 在 ComparisonOperator 添加 `mod` 支持
  - [ ] 实现 `mod` 表达式解析
  - [ ] 更新 AST 类型支持 mod 操作

- [ ] **1.5.2.2 运行时实现**
  - [ ] 在 `compareValues()` 方法添加 mod 运算
  - [ ] 支持 `startTime.minute mod 15 is 0` 语法
  - [ ] 单元测试验证

#### ❌ 任务 1.5.3: 数据模型生成器 (关键功能)

**问题**: DSL需要生成JSON Schema和TypeScript，但缺少生成器API定义。

- [ ] **1.5.3.1 JSON Schema 生成器**
  - [ ] 创建 `packages/event-dsl/src/generators/json-schema.ts`
  - [ ] 定义 `JSONSchemaGeneratorOptions` 接口
  - [ ] 实现 `generateJSONSchema(ast, options)` 函数
  - [ ] 字段类型映射：string → {"type": "string"}
  - [ ] 字段类型映射：list of T → {"type": "array", "items": {...}}
  - [ ] 字段类型映射：enum → {"type": "string", "enum": [...]}
  - [ ] 支持 required, default, min, max 修饰符
  - [ ] 生成符合 JSON Schema Draft-07 规范

- [ ] **1.5.3.2 TypeScript 生成器**
  - [ ] 创建 `packages/event-dsl/src/generators/typescript.ts`
  - [ ] 定义 `TypeScriptGeneratorOptions` 接口
  - [ ] 实现 `generateTypeScript(ast, options)` 函数
  - [ ] 字段类型映射：string → string
  - [ ] 字段类型映射：list of T → T[]
  - [ ] 字段类型映射：enum(a,b,c) → 'a' | 'b' | 'c'
  - [ ] 支持可选字段（required vs ?:）
  - [ ] 生成 JSDoc 注释（@default, @min, @max等）

- [ ] **1.5.3.3 导出和集成**
  - [ ] 在 `packages/event-dsl/src/index.ts` 导出生成器
  - [ ] 更新类型定义导出
  - [ ] 文档和使用示例

- [ ] **1.5.3.4 测试覆盖**
  - [ ] JSON Schema 生成器单元测试
  - [ ] TypeScript 生成器单元测试
  - [ ] 端到端测试：DSL → AST → Schema/TypeScript
  - [ ] 验证生成的 Schema 可用于运行时验证
  - [ ] 验证生成的 TypeScript 可编译通过

#### ❌ 任务 1.5.4: AST 版本化

- [ ] **1.5.4.1 添加版本字段**
  - [ ] 在 `EventTypeAST` 接口添加 `version?: string` 字段
  - [ ] Peggy 语法支持解析 `version: 1.0`
  - [ ] 默认版本号设置

**预期产出**:
- ✅ 完整的重复事件支持（解析 + 运行时）
- ✅ JSON Schema 生成器（AST → schema.json）
- ✅ TypeScript 生成器（AST → types.ts）
- ✅ mod 操作符支持
- ✅ AST 版本化支持
- ✅ 测试覆盖率保持 >90%

**状态**: ❌ 阶段 1.6 未开始（数据模型生成功能）

---

### 阶段 2: 工具和生态（2周）

#### ❌ Week 6: 开发工具

- [ ] **6.1 DSL 语法高亮**
  - [ ] TextMate 语法定义
  - [ ] VS Code 扩展基础结构
  - [ ] 其他编辑器支持（可选）

- [ ] **6.2 VS Code 扩展**
  - [ ] 语法高亮实现
  - [ ] 自动补全实现
  - [ ] 错误检查实现
  - [ ] 代码格式化实现
  - [ ] AST 可视化
  - [ ] 实时预览

- [ ] **6.3 在线 DSL 编辑器**
  - [ ] Monaco Editor 集成
  - [ ] 实时预览
  - [ ] 错误提示
  - [ ] AST 可视化
  - [ ] 验证结果展示

#### ❌ Week 7: 文档和发布

- [ ] **7.1 示例项目**
  - [ ] 基础示例（Vanilla JS）
  - [ ] React 示例
  - [ ] Vue 示例（可选）
  - [ ] 高级示例（多事件类型、权限控制等）

- [ ] **7.2 完整文档**
  - [ ] API 文档
  - [ ] 使用指南
  - [ ] DSL 语法文档
  - [ ] 示例代码

- [ ] **7.3 发布 1.0**
  - [ ] 版本号确定
  - [ ] 发布说明
  - [ ] npm 发布
  - [ ] 文档网站部署

**状态**: ❌ 阶段 3 未开始

---

## 完成度统计

| 阶段 | 完成度 | 状态 |
|------|--------|------|
| 阶段 1: DSL 核心 | 100% | ✅ 完成 |
| **阶段 1.5: 时间敏感活动支持** | **0%** | **🔴 高优先级（阻塞）** |
| **阶段 1.6: 数据模型生成** | **0%** | **🟡 关键功能** |
| 阶段 2: 工具和生态 | 0% | ❌ 未开始 |
| **总体** | **25%** | ⏳ 进行中 |

**注意**: 
- 阶段 1.5（时间敏感活动支持）为高优先级，包含时区、重复事件、全天事件等核心功能
- 阶段 1.6（数据模型生成）为关键功能，包含 JSON Schema 和 TypeScript 生成器
- 这两个阶段**必须在阶段2之前完成**

---

## 下一步优先级

### 🔴 优先级 1: 时间敏感活动支持（高优先级 - 阻塞）

**必须立即完成阶段 1.5**，包括：

1. **时区和时间增强**（Week 3 - 5天）
   - Event 数据模型更新（timeZone, allDay, recurring）
   - 时间访问语法增强（date, dayOfWeek, timeZone）
   - 时间比较语法增强（日期字符串、时间字符串、工作日验证）
   - 时间约束扩展（timeZone, timePrecision, minAdvanceTime等）
   - 基础时间验证规则（startTime < endTime, duration验证等）
   - 时间工具函数库

2. **重复事件和全天事件**（Week 4 - 5天）
   - 重复事件 DSL 语法解析
   - 重复事件验证规则
   - 重复事件生成工具（generateRecurringInstances）
   - 全天事件支持
   - mod 操作符支持

**预计完成**: 2周内完成阶段 1.5

### 🟡 优先级 2: 数据模型生成（关键功能）

3. **JSON Schema 和 TypeScript 生成器**（阶段 1.6 - 1周）
   - JSON Schema 生成器：`generateJSONSchema(ast)`
   - TypeScript 生成器：`generateTypeScript(ast)`
   - 完整的类型映射和测试
   - 导出和集成

**预计完成**: 1周内完成阶段 1.6

---

### 🟡 优先级 2: 开发工具（阶段1.5完成后）

4. **VS Code 扩展**（1周）- 见 RFC-0007
   - 语法高亮
   - 自动补全
   - 错误检查

5. **在线编辑器**（1周）- 见 RFC-0007
   - Monaco Editor 集成
   - 实时预览
   - AST 可视化

### 🟢 优先级 3: 文档和示例

6. **文档**（1周）- 见 RFC-0006
   - DSL 语法文档
   - API 文档
   - 使用指南

7. **示例项目**（1周）- 见 RFC-0006
   - 基础示例
   - 高级示例

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
5. **时区处理**：如何处理夏令时转换？是否需要时区数据库？
6. **重复事件性能**：大量重复事件实例的生成和存储策略？
7. **时间精度**：是否需要支持秒级精度？还是只支持分钟级？

## 参考资料

- [PEG.js / Peggy](https://peggyjs.org/)
- [Parsing Expression Grammar](https://en.wikipedia.org/wiki/Parsing_expression_grammar)
- [Google Calendar API](https://developers.google.com/calendar)
- [CEL - Common Expression Language](https://github.com/google/cel-spec)

---

**状态**: 等待审批
**下一步**: 实现 Peggy 解析器和运行时引擎
