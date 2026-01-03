/**
 * Event 核心接口
 * 
 * Single Source of Truth (SSOT) for Event data model
 * 
 * 根据 RFC-0001 和 RFC-0011 定义的事件数据模型
 * 
 * 此包作为 Event 数据模型的唯一数据源，所有其他包（calendar、event-dsl）都应依赖此包
 * 
 * @calenderjs/event-model 的两个核心职责：
 * 1. 定义数据模型和 JSON Schema
 *    - Event 接口定义（此文件）
 *    - Event JSON Schema（validator.ts 中的 EVENT_BASE_SCHEMA）
 * 2. 使用 JSON Schema 验证数据
 *    - EventValidator 类（validator.ts）
 */

/**
 * 事件核心接口
 * 
 * Event 是日历系统中的核心数据模型，表示一个**时间敏感的活动**。
 * 
 * **重要设计原则**：
 * 1. **Calendar 只关心 Event** - Calendar 组件处理的是 Event（时间敏感的活动）
 * 2. **Event 必须有时间** - Event 必须有 startTime 和 endTime
 * 3. **Appointment 和 Holiday 都是 Event 的扩展** - 它们都是 Event，只是 `type` 不同
 * 4. **Event 包含 Calendar 需要的数据** - Event 数据模型包含 Calendar 显示所需的核心字段
 * 5. **扩展属性用于详情卡片** - Event 的 `extra` 字段存储详情卡片数据，不同类型的事件有不同的详情卡片
 * 
 * @example
 * ```typescript
 * // meeting 类型的 Event
 * const meetingEvent: Event = {
 *   id: "event-1",
 *   type: "meeting",
 *   title: "团队会议",
 *   startTime: new Date("2025-01-15T10:00:00"),
 *   endTime: new Date("2025-01-15T11:00:00"),
 *   color: "#4285f4",
 *   extra: {
 *     attendees: ["user1@example.com", "user2@example.com"],
 *     location: "会议室 A",
 *     agenda: "讨论项目进度"
 *   }
 * };
 * 
 * // appointment 类型的 Event（扩展的 Event）
 * const appointmentEvent: Event = {
 *   id: "event-2",
 *   type: "appointment",
 *   title: "医生预约",
 *   startTime: new Date("2025-01-15T14:00:00"),
 *   endTime: new Date("2025-01-15T15:00:00"),
 *   color: "#fbbc04",
 *   extra: {
 *     doctor: "Dr. Smith",
 *     department: "内科",
 *     notes: "带病历"
 *   }
 * };
 * 
 * // holiday 类型的 Event（扩展的 Event）
 * const holidayEvent: Event = {
 *   id: "event-3",
 *   type: "holiday",
 *   title: "春节",
 *   startTime: new Date("2025-01-29T00:00:00"),
 *   endTime: new Date("2025-02-04T23:59:59"),
 *   color: "#ea4335",
 *   extra: {
 *     country: "CN",
 *     isOfficial: true,
 *     description: "法定节假日"
 *   }
 * };
 * ```
 */
export interface Event {
  /** 唯一标识符 */
  id: string;
  
  /** 
   * 事件类型标识符
   * 
   * 例如: "meeting", "appointment", "holiday", "task", "reminder" 等
   * 
   * **重要**：
   * - Appointment 和 Holiday 都是 Event 的扩展类型
   * - 它们都是 Event，只是 `type` 不同
   * - 在 Calendar 中显示时，根据 `type` 显示不同的详情卡片
   */
  type: string;
  
  /** 事件标题（Calendar 显示用） */
  title: string;
  
  /** 开始时间（必需 - Event 必须有时间） */
  startTime: Date;
  
  /** 结束时间（必需 - Event 必须有时间） */
  endTime: Date;
  
  /** 
   * Calendar 显示属性（可选）
   * 
   * 用于控制 Calendar 中事件的显示样式
   */
  color?: string;
  icon?: string;
  
  /** 
   * 扩展属性（可选）
   * 
   * 用于存储事件详情卡片需要的数据
   * 这些数据由 Event DSL 定义，用于显示事件详情
   * 
   * **重要**：
   * - Appointment 和 Holiday 都是 Event 的扩展类型
   * - 它们都是 Event，只是 `type` 不同，`extra` 的内容不同
   * - 在 Calendar 中显示时，根据 `type` 显示不同的详情卡片
   * 
   * 例如：
   * - `type: "meeting"` → `extra: { attendees, location, agenda }`
   * - `type: "appointment"` → `extra: { doctor, department, notes }`
   * - `type: "holiday"` → `extra: { country, isOfficial, description }`
   * - `type: "task"` → `extra: { assignee, status, priority }`
   * 
   * 这些数据不影响 Calendar 的显示，只用于详情卡片
   */
  extra?: Record<string, any>;
  
  /** 
   * 时区（可选）
   * 
   * IANA 时区标识符，如 "Asia/Shanghai", "America/New_York"
   * 用于处理跨时区事件
   */
  timeZone?: string;
  
  /** 
   * 全天事件（可选）
   * 
   * 如果为 true，表示这是一个全天事件
   * 全天事件的开始和结束时间通常设置为当天的 00:00:00 和 23:59:59
   */
  allDay?: boolean;
  
  /** 
   * 重复规则（可选）
   * 
   * 定义事件的重复模式（daily, weekly, monthly, yearly）
   * 用于生成重复事件实例
   */
  recurring?: RecurringRule;
  
  /** 
   * 父事件ID（可选）
   * 
   * 用于重复事件：如果此事件是重复事件的一个实例，此字段指向原始事件（父事件）的ID
   */
  parentEventId?: string;
  
  /** 
   * 重复实例ID（可选）
   * 
   * 用于重复事件：标识此事件是重复事件序列中的哪个实例
   * 通常与 parentEventId 一起使用
   */
  recurrenceId?: string;
  
  /** 事件元数据（可选） */
  metadata?: EventMetadata;
}

/**
 * 重复规则
 * 
 * 定义事件的重复模式，用于生成重复事件实例
 * 
 * 根据 RFC-0001 定义
 */
export interface RecurringRule {
  /** 频率：daily（每天）、weekly（每周）、monthly（每月）、yearly（每年） */
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  /** 间隔（如每 2 周，interval = 2） */
  interval: number;
  
  /** 结束日期（可选，与 count 二选一） */
  endDate?: Date;
  
  /** 重复次数（可选，与 endDate 二选一） */
  count?: number;
  
  /** 星期几（可选，用于 weekly 频率，0=周日，1=周一...） */
  daysOfWeek?: number[];
  
  /** 每月第几天（可选，用于 monthly 频率，1-31） */
  dayOfMonth?: number;
  
  /** 排除的日期列表（可选，用于跳过某些日期） */
  excludeDates?: Date[];
  
  /** 时区（可选，重复事件应保持在同一时区） */
  timeZone?: string;
}

/**
 * 事件元数据
 * 
 * 包含事件的创建、更新等元信息
 */
export interface EventMetadata {
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
  
  /** 创建者ID（可选） */
  createdBy?: string;
  
  /** 更新者ID（可选） */
  updatedBy?: string;
  
  /** 版本号（可选） */
  version?: number;
}
