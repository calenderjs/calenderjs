/**
 * Event 核心接口
 * 
 * 根据 RFC-0001 定义的事件数据模型
 */

/**
 * 事件核心接口
 */
export interface Event {
  /** 唯一标识符 */
  id: string;
  /** 事件类型 (meeting, holiday, task等) */
  type: string;
  /** 标题 */
  title: string;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
  /** 由DSL定义的fields数据 */
  data: Record<string, any>;
  /** 元数据 */
  metadata?: EventMetadata;
}

/**
 * 事件元数据
 */
export interface EventMetadata {
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 创建者ID */
  createdBy?: string;
  /** 更新者ID */
  updatedBy?: string;
  /** 版本号 */
  version?: number;
}
