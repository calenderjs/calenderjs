# RFC-0001 审查报告：时间敏感活动视角

**审查日期**: 2024-12-30  
**审查范围**: DSL 设计和事件数据模型  
**重点**: 事件作为时间敏感活动的建模

## 执行摘要

RFC-0001 定义了 Event DSL 和事件数据模型，但在处理事件作为**时间敏感活动**方面存在一些关键缺失。本审查从时间维度、时区、重复事件、时间验证等角度提出改进建议。

---

## 1. 核心问题分析

### 1.1 时区支持缺失 ⚠️ **严重**

**问题**：
- `Event` 接口中的 `startTime` 和 `endTime` 使用 `Date` 类型，但没有时区信息
- DSL 中没有时区相关的语法和验证
- 跨时区事件处理不明确

**影响**：
- 无法正确处理跨时区会议
- 夏令时转换可能导致时间错误
- 国际化场景下时间显示不准确

**建议**：

```typescript
// 改进的 Event 接口
export interface Event {
  id: string;
  type: string;
  title: string;
  startTime: Date;              // ISO 8601 格式，包含时区
  endTime: Date;
  timeZone?: string;           // IANA 时区标识符（如 "Asia/Shanghai"）
  allDay?: boolean;             // 全天事件（不受时区影响）
  data: Record<string, any>;
  metadata?: EventMetadata;
}
```

**DSL 增强**：

```dsl
# 时区相关约束
constraints:
  timeZone: "Asia/Shanghai"     # 事件时区
  allowedTimeZones: ["Asia/Shanghai", "America/New_York"]  # 允许的时区列表

validate:
  # 跨时区验证：确保所有参与者都在允许的时区内
  when attendees.count > 0:
    all attendees.timeZone in allowedTimeZones
```

### 1.2 重复事件支持不完整 ⚠️ **重要**

**问题**：
- RFC-0001 中的 `Event` 接口没有 `recurring` 字段
- DSL 中没有定义重复规则的语法
- 虽然其他 RFC（0005）提到了 `RecurringRule`，但 RFC-0001 作为基础 DSL 应该包含

**当前状态**：
- `packages/event-dsl/src/types.ts` 中有 `RecurringRule` 定义
- 但 `Event` 接口（`packages/core/src/models/Event.ts`）中没有

**建议**：

```typescript
// Event 接口应包含
export interface Event {
  // ... 现有字段
  recurring?: RecurringRule;
  parentEventId?: string;      // 如果是重复事件的实例，指向父事件
  recurrenceId?: string;       // 重复实例的唯一标识
}
```

**DSL 增强**：

```dsl
# 重复规则定义
recurring:
  frequency: daily | weekly | monthly | yearly
  interval: 1                    # 每 N 个周期
  endDate: "2025-12-31"         # 结束日期
  count: 10                      # 或重复次数
  daysOfWeek: [1, 3, 5]          # 每周一、三、五
  dayOfMonth: 15                 # 每月第 15 天
  excludeDates: ["2025-01-01"]    # 排除的日期

validate:
  # 重复事件验证
  when recurring is set:
    endDate after startTime
    count > 0 or endDate is set
```

### 1.3 时间验证规则不够完善 ⚠️ **中等**

**问题**：
- DSL 中有 `duration` 计算，但缺少基础时间验证
- 没有明确要求 `startTime < endTime`
- 时间范围验证不够灵活

**当前 DSL 示例**：
```dsl
validate:
  duration between 15 minutes and 8 hours
  startTime.hour between 9 and 18
```

**缺失的验证**：
1. 开始时间必须早于结束时间
2. 时间不能是过去（对于新建事件）
3. 跨天事件的特殊处理
4. 时间精度验证（如只能按 15 分钟间隔）

**建议**：

```dsl
validate:
  # 基础时间验证（应该自动包含）
  startTime before endTime
  startTime after now minus 1 day  # 允许创建过去 1 天内的事件（用于历史记录）
  
  # 时间精度验证
  startTime.minute in [0, 15, 30, 45]  # 只能按 15 分钟间隔
  endTime.minute in [0, 15, 30, 45]
  
  # 跨天事件验证
  when duration > 24 hours:
    allDay is true  # 或要求明确标记为跨天事件
  
  # 时间范围验证（增强）
  startTime between "09:00" and "18:00"  # 支持时间字符串
  duration between 15 minutes and 8 hours
```

### 1.4 全天事件支持不明确 ⚠️ **中等**

**问题**：
- `Event` 接口中没有 `allDay` 字段
- DSL 中没有全天事件的定义和验证
- 全天事件的时间表示不明确

**建议**：

```typescript
export interface Event {
  // ... 现有字段
  allDay?: boolean;  // 全天事件
  // 全天事件时，startTime 和 endTime 应该只包含日期部分
}
```

**DSL 增强**：

```dsl
# 全天事件定义
fields:
  - allDay: boolean, default: false

validate:
  # 全天事件验证
  when allDay is true:
    startTime.hour is 0
    startTime.minute is 0
    endTime.hour is 23
    endTime.minute is 59
    duration is 1 day  # 或允许跨天
```

### 1.5 时间相关的 DSL 语法增强建议 💡 **改进**

**当前 DSL 时间语法**：
```dsl
startTime.hour between 9 and 18
duration between 15 minutes and 8 hours
startTime before now
```

**建议增强**：

```dsl
# 1. 时间字符串字面量
startTime between "09:00" and "18:00"
startTime equals "10:30"

# 2. 日期比较
startTime.date equals "2025-01-15"
endTime.date after startTime.date

# 3. 工作日/周末验证
startTime.dayOfWeek in [1, 2, 3, 4, 5]  # 工作日
startTime.dayOfWeek in [0, 6]            # 周末

# 4. 时间间隔验证
startTime.minute in [0, 15, 30, 45]      # 只能按 15 分钟间隔

# 5. 相对时间验证
startTime after now plus 1 hour          # 至少提前 1 小时创建
created before startTime minus 1 day     # 至少提前 1 天创建

# 6. 时间范围验证（跨天）
startTime between "22:00" and "06:00"     # 支持跨天范围
```

---

## 2. 数据模型改进建议

### 2.1 Event 接口完整定义

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
```

### 2.2 时间相关的工具函数

建议在 `@calenderjs/core` 中添加：

```typescript
/**
 * 时间工具函数
 */
export namespace TimeUtils {
  /**
   * 验证时间范围
   */
  export function isValidTimeRange(startTime: Date, endTime: Date): boolean;
  
  /**
   * 计算持续时间（分钟）
   */
  export function calculateDuration(startTime: Date, endTime: Date): number;
  
  /**
   * 检查时间冲突
   */
  export function hasTimeConflict(
    event1: Event,
    event2: Event,
    options?: { includeAllDay?: boolean }
  ): boolean;
  
  /**
   * 转换时区
   */
  export function convertTimeZone(
    date: Date,
    fromTimeZone: string,
    toTimeZone: string
  ): Date;
  
  /**
   * 检查是否在工作时间
   */
  export function isBusinessHours(
    date: Date,
    timeZone?: string,
    options?: { start?: string; end?: string }
  ): boolean;
  
  /**
   * 生成重复事件实例
   */
  export function generateRecurringInstances(
    event: Event,
    startDate: Date,
    endDate: Date
  ): Event[];
}
```

---

## 3. DSL 语法增强建议

### 3.1 时间约束部分增强

```dsl
constraints:
  # 基础时间约束
  minDuration: 15 minutes
  maxDuration: 8 hours
  
  # 时间范围约束
  allowedHours: 9 to 18
  allowedDays: monday to friday
  
  # 时区约束
  timeZone: "Asia/Shanghai"
  allowedTimeZones: ["Asia/Shanghai", "America/New_York"]
  
  # 时间精度
  timePrecision: 15 minutes  # 只能按 15 分钟间隔
  
  # 提前创建时间
  minAdvanceTime: 1 hour     # 至少提前 1 小时创建
  maxAdvanceTime: 30 days    # 最多提前 30 天创建
  
  # 跨天事件
  allowCrossDay: true        # 允许跨天事件
  maxCrossDayDuration: 7 days # 最大跨天时长
```

### 3.2 验证规则增强

```dsl
validate:
  # 基础时间验证（自动包含）
  startTime before endTime
  duration >= minDuration
  duration <= maxDuration
  
  # 时间范围验证
  startTime.hour between allowedHours.start and allowedHours.end
  startTime.dayOfWeek in allowedDays
  
  # 时间精度验证
  when timePrecision is set:
    startTime.minute mod timePrecision is 0
    endTime.minute mod timePrecision is 0
  
  # 提前创建验证
  when minAdvanceTime is set:
    startTime after now plus minAdvanceTime
  when maxAdvanceTime is set:
    startTime before now plus maxAdvanceTime
  
  # 跨天事件验证
  when duration > 24 hours:
    allowCrossDay is true
  
  # 时区验证
  when timeZone is set:
    event.timeZone equals timeZone
  when allowedTimeZones is set:
    event.timeZone in allowedTimeZones
```

### 3.3 重复事件 DSL 语法

```dsl
# 重复规则定义
recurring:
  frequency: daily | weekly | monthly | yearly
  interval: 1
  endDate: "2025-12-31"
  count: 10
  daysOfWeek: [1, 3, 5]        # 每周一、三、五
  dayOfMonth: 15              # 每月第 15 天
  excludeDates: ["2025-01-01", "2025-02-14"]
  timeZone: "Asia/Shanghai"   # 重复事件时区

validate:
  # 重复事件验证
  when recurring is set:
    recurring.endDate after startTime or recurring.count > 0
    when recurring.frequency is weekly:
      recurring.daysOfWeek is not empty
    when recurring.frequency is monthly:
      recurring.dayOfMonth between 1 and 31
```

---

## 4. 实施优先级

### 🔴 高优先级（必须修复）

1. **时区支持**
   - 在 `Event` 接口中添加 `timeZone` 字段
   - DSL 中添加时区相关语法
   - 运行时支持时区转换

2. **基础时间验证**
   - 确保 `startTime < endTime`
   - 添加时间范围验证
   - 实现时间冲突检测

3. **全天事件支持**
   - 在 `Event` 接口中添加 `allDay` 字段
   - DSL 中添加全天事件验证

### 🟡 中优先级（重要改进）

4. **重复事件支持**
   - 在 `Event` 接口中添加 `recurring` 相关字段
   - DSL 中添加重复规则语法
   - 实现重复事件生成逻辑

5. **时间精度验证**
   - DSL 中添加时间精度约束
   - 运行时验证时间间隔

### 🟢 低优先级（增强功能）

6. **时间工具函数**
   - 添加时间相关的工具函数库
   - 实现时区转换、工作日计算等

7. **高级时间验证**
   - 跨天事件验证
   - 相对时间验证
   - 工作日/周末验证

---

## 5. 总结

RFC-0001 作为 Event DSL 的基础设计文档，在时间敏感活动建模方面需要以下关键改进：

1. ✅ **时区支持**：必须添加，对国际化场景至关重要
2. ✅ **重复事件**：虽然在其他 RFC 中提及，但应在基础 DSL 中定义
3. ✅ **时间验证**：需要更完善的基础验证规则
4. ✅ **全天事件**：需要明确的支持和验证
5. ✅ **时间工具**：需要提供时间相关的工具函数

**建议**：在实施阶段 2 之前，优先完成高优先级的改进，确保事件作为时间敏感活动的核心需求得到满足。

---

**审查人**: AI Assistant  
**审查日期**: 2024-12-30
