/**
 * RenderContext 接口
 * 
 * 根据 RFC-0001 定义的渲染上下文
 */

import { User } from '../models/User';

/**
 * 渲染上下文
 */
export interface RenderContext {
  /** 用户（用于个性化渲染） */
  user?: User;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 语言环境 */
  locale?: string;
  /** 其他扩展属性 */
  [key: string]: any;
}
