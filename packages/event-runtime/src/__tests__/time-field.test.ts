import { describe, expect, it } from "vitest";
import { readTimeField, resolveEventTimeZone } from "../time-field";

const TEST_INSTANT = new Date("2024-12-30T16:30:45.000Z");

describe("time-field", () => {
  it("未声明时区时保持 UTC 兼容行为", () => {
    expect(readTimeField(TEST_INSTANT, "hour")).toBe(16);
    expect(readTimeField(TEST_INSTANT, "minute")).toBe(30);
    expect(readTimeField(TEST_INSTANT, "second")).toBe(45);
    expect(readTimeField(TEST_INSTANT, "date")).toBe("2024-12-30");
    expect(readTimeField(TEST_INSTANT, "dayOfWeek")).toBe(1);
  });

  it("按显式 IANA 时区解析跨日字段", () => {
    const timeZone = "Asia/Shanghai";

    expect(readTimeField(TEST_INSTANT, "hour", timeZone)).toBe(0);
    expect(readTimeField(TEST_INSTANT, "day", timeZone)).toBe(31);
    expect(readTimeField(TEST_INSTANT, "month", timeZone)).toBe(12);
    expect(readTimeField(TEST_INSTANT, "year", timeZone)).toBe(2024);
    expect(readTimeField(TEST_INSTANT, "date", timeZone)).toBe("2024-12-31");
    expect(readTimeField(TEST_INSTANT, "dayOfWeek", timeZone)).toBe(2);
  });

  it("同一时间点在不同时区返回不同小时", () => {
    expect(readTimeField(TEST_INSTANT, "hour", "UTC")).toBe(16);
    expect(readTimeField(TEST_INSTANT, "hour", "America/New_York")).toBe(11);
  });

  it("浏览器本地时区可以还原本地 Date 的墙上时间", () => {
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = new Date(2024, 11, 30, 14, 0, 0);

    expect(readTimeField(localDate, "hour", localTimeZone)).toBe(14);
  });

  it("事件时区优先于重复规则时区", () => {
    expect(
      resolveEventTimeZone({
        timeZone: "Asia/Shanghai",
        recurring: {
          frequency: "weekly",
          interval: 1,
          timeZone: "America/New_York",
        },
      }),
    ).toBe("Asia/Shanghai");
    expect(
      resolveEventTimeZone({
        recurring: {
          frequency: "weekly",
          interval: 1,
          timeZone: "America/New_York",
        },
      }),
    ).toBe("America/New_York");
  });

  it("无效日期或 IANA 时区返回 undefined", () => {
    expect(readTimeField(new Date(Number.NaN), "hour", "UTC")).toBeUndefined();
    expect(
      readTimeField(TEST_INSTANT, "hour", "Invalid/TimeZone"),
    ).toBeUndefined();
  });
});
