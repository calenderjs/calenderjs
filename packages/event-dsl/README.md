# @calenderjs/event-dsl

Event DSL - 领域特定语言，用于定义事件类型和业务规则。

**架构说明**：
- Event DSL 编译成 Data Model (Event 对象，包含规则和数据)
- Event Data Model 是 SSOT，定义了 Event 接口结构（在 @calenderjs/event-model 中）
- DSL 通过 EventDSLCompiler 编译成 Data Model (Event 对象，包含规则和数据)

**包职责**：
本包包含以下组件：
1. **DSL 定义**（核心）：
   - DSL 语法定义（`.pegjs` 文件）
   - DSL 解析器（将文本解析为 AST）
   - AST 类型定义（抽象语法树结构）

2. **DSL 工具**（执行引擎）：
   - **编译器**（`EventDSLCompiler`）：编译 DSL → Data Model (Event 对象，包含规则和数据)
   - **运行时引擎**（`EventRuntime`）：使用编译后的 Data Model 进行验证、渲染和行为检查（**应用层使用**，在 `@calenderjs/event-runtime` 包中）

**验证架构**：
1. **编译时验证**（EventDSLCompiler，在 `@calenderjs/event-dsl` 包中）：
   - 验证 DSL 语法是否正确
   - 如果编译失败，返回错误
   - 生成验证器函数（基于字段定义，如 `required`、`min`、`max`）

2. **JSON Schema 验证**（EventValidator，在 `@calenderjs/event-model` 包中）：
   - 验证 Event 对象是否符合 Event 接口结构
   - 验证 Event.extra 是否符合 JSON Schema（结构验证）
   - 无法验证业务规则（如 `attendees.count between 1 and 50` 需要计算数组长度）

3. **运行时验证**（EventRuntime，在 `@calenderjs/event-runtime` 包中）：
   - 执行 DSL 中定义的业务规则（如 `attendees.count between 1 and 50`）
   - 验证的是 Event 数据模型的数据（`@calenderjs/event-model` 中的 Event 对象）
   - 需要运行时数据（event.extra.attendees.length）
   - 需要上下文信息（context.events, context.now, context.user）
   - 无法在编译时验证（数据是动态的）
   - 无法通过 JSON Schema 验证（JSON Schema 只能验证结构，不能验证业务逻辑）

**重要**：
- 运行时**不在**数据模型包中（`@calenderjs/event-model`）
- 运行时在 DSL 包中（`@calenderjs/event-dsl`）
- 但运行时验证的是 Event 数据模型的数据

**重要说明**：
- **DSL 的主要用途**：编译成 Data Model (Event 对象，包含规则和数据)
- **Calendar 组件**：直接使用 Event 对象（event.color, event.icon, event.title），**不需要运行时**
- **运行时的用途**（应用层）：
  1. **业务规则验证**：执行 DSL 中定义的业务规则（如 `attendees.count between 1 and 50`、`no conflict with other events`）
  2. **权限检查**：检查用户是否可以执行某个操作（draggable, editable, deletable）
  3. **动态渲染**（可选）：根据 DSL 规则动态生成显示属性（但 Event 已有 color/icon）

**数据流程**：
```
DSL 文本 
  → Peggy 解析器 
  → AST 
  → EventDSLCompiler 
  → Data Model (Event 对象，包含规则和数据)
  → Calendar 组件（直接使用）
  
验证流程：
1. 编译时验证（EventDSLCompiler）：验证 DSL 语法，编译成 Data Model
2. JSON Schema 验证（EventValidator）：使用 Data Model 中的标准 JSON Schema 验证 Event 结构
3. 运行时验证（EventRuntime）：使用 Data Model 中的业务规则验证业务逻辑（应用层使用，在 `@calenderjs/event-runtime` 包中）
```

## 安装

```bash
pnpm add @calenderjs/event-dsl
```

## 快速开始

### 1. 定义事件类型

```typescript
import { EventTypeDefinition } from '@calenderjs/event-dsl';

const meetingType: EventTypeDefinition = {
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
import { EventDSLCompiler } from '@calenderjs/event-dsl';

const dsl: EventDSL = {
  types: [meetingType]
};

const compiler = new EventDSLCompiler();
const compiled = compiler.compile(dsl);
```

### 3. 使用编译后的 Data Model

```typescript
import type { Event } from '@calenderjs/event-model';

// Data Model 是 Event 对象，包含规则和数据
// compiled.types[0] 是 CompiledType (Data Model)
const dataModel = compiled.types[0];

// Data Model 包含：
// - extraSchema: JSON Schema (用于验证 Event.extra 结构)
// - validationRules: 业务规则 (用于验证业务逻辑)
// - validator, renderer, behavior 等
```

### 4. 验证 Event 对象

```typescript
import { EventValidator } from '@calenderjs/event-model';
import { EventRuntime } from '@calenderjs/event-runtime';
import { EventDSLCompiler } from '@calenderjs/event-dsl';

// 使用 Event Data Model 验证器验证基础结构
const eventValidator = new EventValidator();
const baseValidation = eventValidator.validateBase(event);

// 使用运行时验证业务规则
const compiler = new EventDSLCompiler();
const dataModel = compiler.compileFromAST([ast]);
const runtime = new EventRuntime(dataModel.types[0]);
const runtimeValidation = runtime.validate(event, context);
```

## API

### EventDSLCompiler

编译 DSL 定义，生成可执行的验证器和渲染器。

### EventRuntime

运行时系统，使用编译后的 Data Model 进行验证、渲染和行为配置查询。

## 更多示例

查看 `docs/examples/appointment-dsl-examples.ts` 获取更多示例。
