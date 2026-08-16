/**
 * WSX @state 日期安全存储
 *
 * @wsxjs/wsx-core 的 reactive() 会对 Date 做 Proxy：
 * - Date 方法品牌检查失败（this is not a Date object）
 * - unwrapProxy / JSON.stringify 会把 Date 摊成 {}
 *
 * 因此 @state 中只存 ISO 字符串；对外 API 仍用 Date。
 */

const INVALID_STATE_DATE = "Invalid date for WSX @state";

/** 「未选择」标记（与历史 new Date(0) 语义一致） */
export const UNSELECTED_DATE_ISO = new Date(0).toISOString();

/**
 * 将 Date / ISO 字符串规范为可写入 @state 的 ISO 字符串
 */
export function toStateIso(value: Date | string): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`${INVALID_STATE_DATE}: ${value}`);
    }
    return parsed.toISOString();
  }

  const time = value.getTime();
  if (Number.isNaN(time)) {
    throw new Error(INVALID_STATE_DATE);
  }
  return new Date(time).toISOString();
}

/**
 * 从 @state ISO 还原为普通 Date（非 Proxy）
 */
export function fromStateIso(iso: string): Date {
  return new Date(iso);
}

/**
 * selectedDate：空值 → 未选择 ISO
 */
export function toStateIsoOrUnselected(
  value: Date | string | null | undefined,
): string {
  if (value === null || value === undefined) {
    return UNSELECTED_DATE_ISO;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return UNSELECTED_DATE_ISO;
    }
    return parsed.toISOString();
  }
  return toStateIso(value);
}

type EventTimeFields = {
  startTime: Date | string;
  endTime: Date | string;
};

/**
 * 将事件时间字段规范为 ISO，避免落入 reactive Proxy
 */
export function normalizeEventForState<T extends EventTimeFields>(event: T): T {
  return {
    ...event,
    startTime: toStateIso(event.startTime),
    endTime: toStateIso(event.endTime),
  };
}

/**
 * 批量规范事件列表时间字段
 */
export function normalizeEventsForState<T extends EventTimeFields>(
  events: T[],
): T[] {
  return events.map((event) => normalizeEventForState(event));
}
