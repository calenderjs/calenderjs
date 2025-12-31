# RFC-0002: Appointment DSL

**状态**: Draft  
**创建日期**: 2024-12-19  
**作者**: WSX Team  
**关联 RFC**: RFC-0001

## 摘要

设计并实现 Appointment DSL（领域特定语言），用于定义和扩展特殊预约事件类型。DSL 允许通过声明式语法定义预约的业务规则、验证逻辑和显示配置，与 RFC-0001 的日历组件库集成，提供类型安全和可扩展的预约类型系统。

**重要说明**：本 RFC 仅关注 DSL 的设计和实现，不包含任何后端服务。DSL 是一个独立的包，可以在前端组件中使用。

## 动机

### 为什么需要 Appointment DSL？

传统的预约数据模型（如 RFC-0001 中的 `Appointment` 接口）虽然灵活，但无法优雅地表达复杂的业务规则和特殊事件类型。Appointment DSL 允许：

- **声明式定义**：通过 DSL 声明预约的业务规则，而非硬编码
- **类型安全**：通过 DSL 生成 TypeScript 类型定义，确保类型安全
- **可扩展性**：轻松添加新的预约类型和规则，无需修改核心代码
- **业务逻辑分离**：将业务规则从组件逻辑中分离，提高可维护性
- **运行时验证**：在运行时验证预约数据，确保数据完整性

## 详细设计

### 1. DSL 语法设计

Appointment DSL 采用 JSON Schema 和 TypeScript 类型系统，支持声明式定义预约类型和规则。

#### 1.1 核心类型定义

```typescript
// appointment-dsl.ts
export interface AppointmentDSL {
  // 预约类型定义
  types: AppointmentType[];
  // 全局规则
  rules?: AppointmentRule[];
  // 全局验证器
  validators?: AppointmentValidator[];
}

// 预约类型定义
export interface AppointmentType {
  // 类型标识符
  id: string;
  // 类型名称
  name: string;
  // 类型描述
  description?: string;
  // 字段定义
  fields: FieldDefinition[];
  // 显示配置
  display: DisplayConfig;
  // 行为配置
  behavior: BehaviorConfig;
  // 验证规则
  validation?: ValidationRule[];
}

// 字段定义
export interface FieldDefinition {
  // 字段名
  name: string;
  // 字段类型
  type: 'string' | 'number' | 'date' | 'time' | 'boolean' | 'enum' | 'object' | 'array';
  // 是否必填
  required?: boolean;
  // 默认值
  default?: any;
  // 字段描述
  description?: string;
  // 枚举值（当 type 为 'enum' 时）
  enum?: string[];
  // 对象字段定义（当 type 为 'object' 时）
  properties?: Record<string, FieldDefinition>;
  // 数组元素定义（当 type 为 'array' 时）
  items?: FieldDefinition;
  // 验证规则
  validation?: FieldValidationRule[];
}

// 显示配置
export interface DisplayConfig {
  // 颜色
  color: string;
  // 图标
  icon?: string;
  // 标题模板（支持变量：${fieldName}）
  titleTemplate?: string;
  // 描述模板
  descriptionTemplate?: string;
  // 自定义渲染组件（可选）
  renderComponent?: string;
}

// 行为配置
export interface BehaviorConfig {
  // 是否可拖拽
  draggable?: boolean;
  // 是否可调整大小
  resizable?: boolean;
  // 是否可编辑
  editable?: boolean;
  // 是否可删除
  deletable?: boolean;
  // 是否可复制
  copyable?: boolean;
  // 是否允许重叠
  allowOverlap?: boolean;
  // 最小时长（分钟）
  minDuration?: number;
  // 最大时长（分钟）
  maxDuration?: number;
  // 默认时长（分钟）
  defaultDuration?: number;
  // 时间限制（如：只能在工作时间）
  timeConstraints?: TimeConstraint[];
}

// 时间限制
export interface TimeConstraint {
  // 限制类型
  type: 'workingHours' | 'dayOfWeek' | 'dateRange' | 'custom';
  // 限制值
  value: any;
  // 错误消息
  errorMessage?: string;
}

// 验证规则
export interface ValidationRule {
  // 规则类型
  type: 'field' | 'crossField' | 'custom';
  // 规则表达式（支持函数或表达式字符串）
  expression: string | Function;
  // 错误消息
  errorMessage: string;
}

// 字段验证规则
export interface FieldValidationRule {
  // 验证类型
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  // 验证值
  value?: any;
  // 错误消息
  errorMessage: string;
}
```

#### 1.2 DSL 示例

**示例 1：标准会议预约**

```typescript
const meetingAppointmentType: AppointmentType = {
  id: 'meeting',
  name: '会议',
  description: '标准会议预约',
  fields: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: '会议标题',
      validation: [
        { type: 'minLength', value: 1, errorMessage: '标题不能为空' },
        { type: 'maxLength', value: 100, errorMessage: '标题不能超过100个字符' }
      ]
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      description: '会议描述'
    },
    {
      name: 'attendees',
      type: 'array',
      required: false,
      description: '参会人员',
      items: {
        type: 'string'
      }
    },
    {
      name: 'location',
      type: 'string',
      required: false,
      description: '会议地点'
    },
    {
      name: 'priority',
      type: 'enum',
      required: false,
      default: 'normal',
      enum: ['low', 'normal', 'high', 'urgent'],
      description: '优先级'
    }
  ],
  display: {
    color: '#4285f4',
    icon: 'meeting',
    titleTemplate: '${title}',
    descriptionTemplate: '${location} • ${attendees.length} 人'
  },
  behavior: {
    draggable: true,
    resizable: true,
    editable: true,
    deletable: true,
    allowOverlap: false,
    minDuration: 15,
    maxDuration: 480,
    defaultDuration: 60,
    timeConstraints: [
      {
        type: 'workingHours',
        value: { start: '09:00', end: '18:00' },
        errorMessage: '会议只能在工作时间内安排'
      }
    ]
  },
  validation: [
    {
      type: 'crossField',
      expression: (appointment) => {
        return appointment.endTime > appointment.startTime;
      },
      errorMessage: '结束时间必须晚于开始时间'
    }
  ]
};
```

**示例 2：特殊事件 - 假期预约**

```typescript
const vacationAppointmentType: AppointmentType = {
  id: 'vacation',
  name: '假期',
  description: '员工假期预约',
  fields: [
    {
      name: 'title',
      type: 'string',
      required: true,
      default: '假期'
    },
    {
      name: 'vacationType',
      type: 'enum',
      required: true,
      enum: ['annual', 'sick', 'personal', 'maternity', 'other'],
      description: '假期类型'
    },
    {
      name: 'approvalStatus',
      type: 'enum',
      required: true,
      default: 'pending',
      enum: ['pending', 'approved', 'rejected'],
      description: '审批状态'
    },
    {
      name: 'approver',
      type: 'string',
      required: false,
      description: '审批人'
    }
  ],
  display: {
    color: '#ff9800',
    icon: 'vacation',
    titleTemplate: '${vacationType} - ${title}',
    descriptionTemplate: '${approvalStatus === "approved" ? "已批准" : approvalStatus === "pending" ? "待审批" : "已拒绝"}'
  },
  behavior: {
    draggable: false, // 假期不可拖拽
    resizable: true,
    editable: true,
    deletable: true,
    allowOverlap: false,
    minDuration: 60, // 至少1小时
    timeConstraints: [
      {
        type: 'dayOfWeek',
        value: [1, 2, 3, 4, 5], // 周一到周五
        errorMessage: '假期只能在工作日申请'
      }
    ]
  }
};
```

### 2. DSL 编译器

DSL 编译器将 DSL 定义转换为可执行的类型定义和验证函数。

```typescript
// dsl-compiler.ts
export class AppointmentDSLCompiler {
  /**
   * 编译 DSL 定义，生成类型定义和验证器
   */
  compile(dsl: AppointmentDSL): CompiledDSL {
    return {
      types: this.compileTypes(dsl.types),
      validators: this.compileValidators(dsl.validators || []),
      runtime: this.generateRuntime(dsl)
    };
  }

  /**
   * 编译预约类型
   */
  private compileTypes(types: AppointmentType[]): CompiledType[] {
    return types.map(type => ({
      id: type.id,
      name: type.name,
      schema: this.generateJSONSchema(type),
      validator: this.generateValidator(type),
      renderer: this.generateRenderer(type)
    }));
  }

  /**
   * 生成 JSON Schema
   */
  private generateJSONSchema(type: AppointmentType): JSONSchema {
    // 将 FieldDefinition 转换为 JSON Schema
    const schema: JSONSchema = {
      type: 'object',
      properties: {},
      required: []
    };

    type.fields.forEach(field => {
      schema.properties![field.name] = this.fieldToJSONSchema(field);
      if (field.required) {
        schema.required!.push(field.name);
      }
    });

    return schema;
  }

  /**
   * 生成验证器函数
   */
  private generateValidator(type: AppointmentType): ValidatorFunction {
    return (appointment: any): ValidationResult => {
      const errors: string[] = [];

      // 字段验证
      type.fields.forEach(field => {
        const value = appointment[field.name];
        
        // 必填验证
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field.name} 是必填字段`);
          return;
        }

        // 字段级验证
        if (field.validation && value !== undefined && value !== null) {
          field.validation.forEach(rule => {
            if (!this.validateFieldRule(value, rule)) {
              errors.push(rule.errorMessage);
            }
          });
        }
      });

      // 跨字段验证
      if (type.validation) {
        type.validation.forEach(rule => {
          if (rule.type === 'crossField' || rule.type === 'custom') {
            const fn = typeof rule.expression === 'function' 
              ? rule.expression 
              : this.compileExpression(rule.expression as string);
            if (!fn(appointment)) {
              errors.push(rule.errorMessage);
            }
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };
  }

  /**
   * 生成渲染器
   */
  private generateRenderer(type: AppointmentType): RendererFunction {
    return (appointment: any): RenderedAppointment => {
      const title = this.renderTemplate(type.display.titleTemplate || '${title}', appointment);
      const description = type.display.descriptionTemplate 
        ? this.renderTemplate(type.display.descriptionTemplate, appointment)
        : undefined;

      return {
        title,
        description,
        color: type.display.color,
        icon: type.display.icon
      };
    };
  }

  private renderTemplate(template: string, data: any): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// 编译后的 DSL
export interface CompiledDSL {
  types: CompiledType[];
  validators: CompiledValidator[];
  runtime: RuntimeCode;
}

export interface CompiledType {
  id: string;
  name: string;
  schema: JSONSchema;
  validator: ValidatorFunction;
  renderer: RendererFunction;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RenderedAppointment {
  title: string;
  description?: string;
  color: string;
  icon?: string;
}

export type ValidatorFunction = (appointment: any) => ValidationResult;
export type RendererFunction = (appointment: any) => RenderedAppointment;
```

### 3. DSL 运行时

DSL 运行时在组件中使用，提供类型检查和验证功能。

```typescript
// dsl-runtime.ts
export class AppointmentDSLRuntime {
  private compiledDSL: CompiledDSL;

  constructor(compiledDSL: CompiledDSL) {
    this.compiledDSL = compiledDSL;
  }

  /**
   * 验证预约数据
   */
  validate(appointment: Appointment, typeId: string): ValidationResult {
    const type = this.compiledDSL.types.find(t => t.id === typeId);
    if (!type) {
      return { valid: false, errors: [`未知的预约类型: ${typeId}`] };
    }
    return type.validator(appointment);
  }

  /**
   * 获取预约类型定义
   */
  getType(typeId: string): CompiledType | undefined {
    return this.compiledDSL.types.find(t => t.id === typeId);
  }

  /**
   * 渲染预约
   */
  render(appointment: Appointment, typeId: string): RenderedAppointment {
    const type = this.getType(typeId);
    if (!type) {
      throw new Error(`未知的预约类型: ${typeId}`);
    }
    return type.renderer(appointment);
  }

  /**
   * 获取所有类型
   */
  getTypes(): CompiledType[] {
    return this.compiledDSL.types;
  }

  /**
   * 检查时间约束
   */
  checkTimeConstraints(appointment: Appointment, typeId: string): ValidationResult {
    const type = this.getType(typeId);
    if (!type) {
      return { valid: false, errors: [`未知的预约类型: ${typeId}`] };
    }

    // 从原始 DSL 获取行为配置
    // 这里需要存储原始 DSL 或从编译后的类型中获取
    // 简化实现...
    return { valid: true, errors: [] };
  }
}
```

### 4. 与 Calendar 组件集成

扩展 RFC-0001 中的 Calendar 组件，支持 DSL：

```typescript
// packages/core/src/Calendar.wsx
import { AppointmentDSLRuntime } from '@calenderjs/dsl';

export default class Calendar extends WebComponent {
  @state private dslRuntime?: AppointmentDSLRuntime;
  @state private appointments: Appointment[] = [];

  /**
   * 设置 DSL 运行时
   */
  setDSLRuntime(runtime: AppointmentDSLRuntime): void {
    this.dslRuntime = runtime;
    this.rerender();
  }

  /**
   * 渲染预约（支持 DSL）
   */
  private renderAppointment(appointment: Appointment): HTMLElement {
    // 如果配置了 DSL，使用 DSL 渲染器
    if (this.dslRuntime && appointment.type) {
      const rendered = this.dslRuntime.render(appointment, appointment.type);
      return this.renderWithDSL(rendered, appointment);
    }
    // 否则使用默认渲染
    return this.renderDefault(appointment);
  }

  /**
   * 验证预约（支持 DSL）
   */
  private validateAppointment(appointment: Appointment): ValidationResult {
    if (this.dslRuntime && appointment.type) {
      return this.dslRuntime.validate(appointment, appointment.type);
    }
    return this.validateDefault(appointment);
  }

  /**
   * 使用 DSL 渲染预约
   */
  private renderWithDSL(rendered: RenderedAppointment, appointment: Appointment): HTMLElement {
    return (
      <div
        class="appointment-block"
        style={{
          backgroundColor: rendered.color,
          borderLeft: `4px solid ${rendered.color}`
        }}
      >
        {rendered.icon && <span class="appointment-icon">{rendered.icon}</span>}
        <div class="appointment-title">{rendered.title}</div>
        {rendered.description && (
          <div class="appointment-description">{rendered.description}</div>
        )}
      </div>
    );
  }
}
```

## 实现计划

### 阶段 1: DSL 类型系统设计（3 天）

1. 定义 DSL 类型接口
2. 设计 DSL 语法
3. 编写 TypeScript 类型定义

### 阶段 2: DSL 编译器实现（4 天）

1. 实现编译器核心逻辑
2. 生成 JSON Schema
3. 生成验证器函数
4. 生成渲染器函数

### 阶段 3: DSL 运行时实现（3 天）

1. 实现运行时核心逻辑
2. 集成验证器
3. 集成渲染器
4. 实现模板渲染

### 阶段 4: Calendar 组件集成（2 天）

1. 扩展 Calendar 组件支持 DSL
2. 实现 DSL 渲染
3. 实现 DSL 验证

### 阶段 5: 测试和文档（2 天）

1. 编写单元测试
2. 编写 DSL 使用文档
3. 提供示例

## 文件结构

```
packages/calenderjs-dsl/
├── src/
│   ├── types.ts              # DSL 类型定义
│   ├── compiler.ts            # DSL 编译器
│   ├── runtime.ts             # DSL 运行时
│   ├── validators.ts          # 验证器工具
│   └── index.ts               # 导出入口
├── tests/
│   ├── compiler.test.ts
│   ├── runtime.test.ts
│   └── examples.test.ts
├── examples/
│   └── appointment-types.ts   # DSL 示例
├── package.json
└── tsconfig.json
```

## 技术栈

- **TypeScript**: 类型安全
- **JSON Schema**: 数据验证
- **无运行时依赖**: 纯 TypeScript 实现

## 使用示例

```typescript
import { AppointmentDSLCompiler, AppointmentDSLRuntime } from '@calenderjs/dsl';
import { meetingAppointmentType, vacationAppointmentType } from './appointment-types';

// 定义 DSL
const dsl = {
  types: [meetingAppointmentType, vacationAppointmentType]
};

// 编译 DSL
const compiler = new AppointmentDSLCompiler();
const compiledDSL = compiler.compile(dsl);

// 创建运行时
const runtime = new AppointmentDSLRuntime(compiledDSL);

// 验证预约
const appointment = {
  type: 'meeting',
  title: '团队会议',
  startTime: new Date('2024-12-20T10:00:00'),
  endTime: new Date('2024-12-20T11:00:00'),
  attendees: ['user1@example.com', 'user2@example.com']
};

const validation = runtime.validate(appointment, 'meeting');
if (!validation.valid) {
  console.error('验证失败:', validation.errors);
}

// 渲染预约
const rendered = runtime.render(appointment, 'meeting');
console.log(rendered); // { title: '团队会议', color: '#4285f4', ... }
```

## 未解决问题

1. **DSL 版本管理**：如何管理 DSL 定义的版本和迁移？
2. **表达式编译**：如何安全地编译和执行自定义表达式？
3. **性能优化**：大量预约类型时的性能优化策略
4. **类型生成**：是否应该生成 TypeScript 类型定义文件？

---

*本 RFC 定义了 Appointment DSL 的设计和实现，为日历组件提供可扩展的预约类型系统。*
