/**
 * User 接口
 * 
 * 根据 RFC-0001 定义的用户数据模型（用于权限验证）
 */

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'user' | 'guest' | string;

/**
 * 用户接口（用于权限验证）
 */
export interface User {
  /** 用户ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 姓名 */
  name?: string;
  /** 角色 */
  role: UserRole;
  /** VIP等级 */
  vipLevel?: number;
  /** 其他扩展属性 */
  [key: string]: any;
}
