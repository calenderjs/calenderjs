/**
 * Calendar 组件类型定义
 */

import type { Event } from '@calenderjs/event-model';
import { User } from '@calenderjs/core';
import { EventTypeAST } from '@calenderjs/event-dsl';

/**
 * Calendar 组件属性
 */
export interface CalendarProps {
  /** Event DSL 配置（文本或已解析的 AST） */
  eventDSL?: string | EventTypeAST | EventTypeAST[];
  
  /** 事件数据 */
  events?: Event[];
  
  /** 用户上下文（用于权限验证） */
  user?: User;
  
  /** 默认视图 */
  defaultView?: 'month' | 'week' | 'day';
  
  /** 当前日期 */
  currentDate?: Date;
}
