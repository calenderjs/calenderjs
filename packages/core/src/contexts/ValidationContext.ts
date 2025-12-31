/**
 * ValidationContext 接口
 * 
 * 根据 RFC-0001 定义的验证上下文
 */

import { Event } from '../models/Event';
import { User } from '../models/User';

/**
 * 验证上下文
 */
export interface ValidationContext {
  /** 用户（用于权限验证） */
  user?: User;
  /** 事件列表（用于冲突检测） */
  events: Event[];
  /** 当前时间 */
  now: Date;
  /** 其他扩展属性 */
  [key: string]: any;
}
