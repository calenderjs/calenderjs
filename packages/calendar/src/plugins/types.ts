import type { Event } from "@calenderjs/event-model";

/** 一个详情字段的结构化描述，host 拿这个去渲染，自己决定用什么 UI 组件 */
export interface EventDetailField {
  key: string;
  label: string;
  value: string;
}

/** 插件 describe() 的返回值——纯数据，没有任何 HTML/DOM */
export interface EventDetailDescription {
  title: string;
  fields: EventDetailField[];
}

export interface EventDetailPlugin {
  /** 插件名称，用于注册/注销时的唯一标识 */
  name: string;
  /** 支持的 Event.type，"*" 表示默认兜底插件 */
  type: string;
  /** 优先级，数字越大越优先，默认 0 */
  priority?: number;
  /** 是否支持该 event（通常直接比较 event.type === this.type） */
  supports(event: Event): boolean;
  /**
   * 把 event 翻译成结构化描述。
   * 纯函数：不操作 DOM，不返回字符串拼接的 HTML，不依赖任何渲染框架。
   */
  describe(event: Event): EventDetailDescription;
}
