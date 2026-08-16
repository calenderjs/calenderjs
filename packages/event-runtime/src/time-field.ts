import type { Event } from "@calenderjs/event-model";

const UTC_TIME_ZONE = "UTC";
const DATE_LOCALE = "en-US-u-ca-gregory-nu-latn";
const DATE_SEPARATOR = "-";
const DATE_PART_LENGTH = 2;
const WEEKDAY_INDEX: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type TimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
};

export type TimeFieldValue = number | string | undefined;

/**
 * 解析事件显式声明的 IANA 时区。
 *
 * 未声明时返回 undefined；调用方按 RFC-0014 使用 UTC。
 */
export function resolveEventTimeZone(
  event: Pick<Event, "timeZone" | "recurring">,
): string | undefined {
  return event.timeZone ?? event.recurring?.timeZone;
}

/** 按 RFC-0014 的时区语义读取 DSL 时间字段。 */
export function readTimeField(
  value: Date | string,
  property: string,
  timeZone?: string,
): TimeFieldValue {
  if (property === "timeZone") {
    return timeZone;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const parts = getTimeParts(date, timeZone);
  if (!parts) {
    return undefined;
  }

  switch (property) {
    case "hour":
      return parts.hour;
    case "minute":
      return parts.minute;
    case "second":
      return parts.second;
    case "day":
      return parts.day;
    case "month":
      return parts.month;
    case "year":
      return parts.year;
    case "date":
      return formatDate(parts);
    case "dayOfWeek":
      return parts.dayOfWeek;
    default:
      return undefined;
  }
}

function getTimeParts(date: Date, timeZone?: string): TimeParts | undefined {
  if (!timeZone || timeZone === UTC_TIME_ZONE) {
    return getUtcTimeParts(date);
  }

  try {
    const formatter = new Intl.DateTimeFormat(DATE_LOCALE, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    const values = Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter(({ type }) => type !== "literal")
        .map(({ type, value: partValue }) => [type, partValue]),
    );
    const dayOfWeek = WEEKDAY_INDEX[values.weekday];

    if (dayOfWeek === undefined) {
      return undefined;
    }

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute),
      second: Number(values.second),
      dayOfWeek,
    };
  } catch {
    return undefined;
  }
}

function getUtcTimeParts(date: Date): TimeParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    dayOfWeek: date.getUTCDay(),
  };
}

function formatDate(parts: Pick<TimeParts, "year" | "month" | "day">): string {
  const month = String(parts.month).padStart(DATE_PART_LENGTH, "0");
  const day = String(parts.day).padStart(DATE_PART_LENGTH, "0");
  return [String(parts.year), month, day].join(DATE_SEPARATOR);
}
