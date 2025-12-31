/**
 * 通用类型定义
 */

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息列表 */
  errors?: string[];
}

/**
 * 渲染后的事件
 */
export interface RenderedEvent {
  /** 标题 */
  title: string;
  /** 颜色 */
  color: string;
  /** 图标（可选） */
  icon?: string;
  /** 描述（可选） */
  description?: string;
}
