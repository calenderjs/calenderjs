/**
 * Calendar 组件类型定义
 */

import { Appointment, RecurringRule } from '@calenderjs/dsl';
import { AppointmentDSLRuntime } from '@calenderjs/dsl';

/**
 * Calendar 组件属性
 */
export interface CalendarProps {
  /** 预约列表 */
  appointments: Appointment[];
  /** 创建预约回调 */
  onAppointmentCreate?: (appointment: Partial<Appointment>) => void;
  /** 更新预约回调 */
  onAppointmentUpdate?: (id: string, appointment: Partial<Appointment>) => void;
  /** 删除预约回调 */
  onAppointmentDelete?: (id: string) => void;

  /** 视图控制 */
  defaultView?: 'month' | 'week' | 'day';
  /** 当前显示的日期 */
  currentDate?: Date;
  /** 视图改变回调 */
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  /** 日期改变回调 */
  onDateChange?: (date: Date) => void;

  /** 显示配置 */
  firstDayOfWeek?: 0 | 1; // 0=周日, 1=周一
  timeSlotDuration?: number; // 时间槽间隔（分钟），默认 30
  minTime?: string; // 最小显示时间，如 "08:00"
  maxTime?: string; // 最大显示时间，如 "22:00"
  showWeekends?: boolean; // 是否显示周末
  locale?: string; // 语言环境

  /** 交互配置 */
  editable?: boolean; // 是否可编辑
  draggable?: boolean; // 是否可拖拽
  resizable?: boolean; // 是否可调整大小
  selectable?: boolean; // 是否可选择时间段

  /** 样式配置 */
  appointmentColors?: string[]; // 预约颜色选项
  theme?: 'light' | 'dark';

  /** DSL 运行时（用于基于 DSL 渲染） */
  dslRuntime?: AppointmentDSLRuntime;

  /** 自定义渲染 */
  renderAppointment?: (appointment: Appointment) => HTMLElement;
  renderHeader?: (date: Date, view: string) => HTMLElement;
}

/**
 * 视图类型
 */
export type ViewType = 'month' | 'week' | 'day';

/**
 * 日期单元格信息
 */
export interface DateCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

/**
 * 时间槽信息
 */
export interface TimeSlot {
  hour: number;
  minute: number;
  appointments: Appointment[];
}
