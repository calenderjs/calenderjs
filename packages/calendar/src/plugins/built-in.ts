import type { Event } from "@calenderjs/event-model";
import type { EventDetailPlugin, EventDetailDescription } from "./types";

function formatDateTime(date: Date): string {
  return date.toLocaleString();
}

/** 兜底插件：没有具体类型插件匹配时，展示通用字段 */
export const defaultPlugin: EventDetailPlugin = {
  name: "default",
  type: "*",
  supports: () => true,
  describe(event: Event): EventDetailDescription {
    return {
      title: event.title,
      fields: [
        { key: "startTime", label: "开始时间", value: formatDateTime(event.startTime) },
        { key: "endTime", label: "结束时间", value: formatDateTime(event.endTime) },
        { key: "data", label: "附加数据", value: JSON.stringify(event.data ?? {}) },
      ],
    };
  },
};

/** 参考实现插件：覆盖 meeting/appointment 类事件常见的 attendees/location 字段 */
export const appointmentPlugin: EventDetailPlugin = {
  name: "appointment",
  type: "meeting",
  priority: 0,
  supports: (event: Event) => event.type === "meeting",
  describe(event: Event): EventDetailDescription {
    const data = (event.data ?? {}) as { attendees?: string[]; location?: string };
    return {
      title: event.title,
      fields: [
        { key: "startTime", label: "开始时间", value: formatDateTime(event.startTime) },
        { key: "endTime", label: "结束时间", value: formatDateTime(event.endTime) },
        { key: "attendees", label: "参与者", value: (data.attendees ?? []).join("、") || "无" },
        { key: "location", label: "地点", value: data.location ?? "未指定" },
      ],
    };
  },
};
