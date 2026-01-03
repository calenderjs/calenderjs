import { describe, it, expect } from "vitest";
import type { EventTypeAST } from "../../ast";
import { parseEventDSL } from "../parse";

describe("@calenderjs/event-dsl index", () => {
    it("should export EventTypeAST type", () => {
        const ast: EventTypeAST = {
            type: "test",
            name: "Test",
            fields: [],
            validate: [],
            display: [],
            behavior: [],
        };
        expect(ast).toBeDefined();
    });
});

describe("时间约束语法解析", () => {
    it("应该解析 timeZone 约束", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  timeZone: "Asia/Shanghai"
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("timeZone");
        expect(ast.constraints?.[0].value).toBe("Asia/Shanghai");
    });

    it("应该解析 allowedTimeZones 约束（数组）", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  allowedTimeZones: ["Asia/Shanghai", "America/New_York"]
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("allowedTimeZones");
        expect(Array.isArray(ast.constraints?.[0].value)).toBe(true);
        expect(ast.constraints?.[0].value).toEqual([
            "Asia/Shanghai",
            "America/New_York",
        ]);
    });

    it("应该解析 timePrecision 约束（Duration）", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  timePrecision: 15 minutes
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("timePrecision");
        expect(ast.constraints?.[0].value).toEqual({
            type: "Duration",
            value: 15,
            unit: "minutes",
        });
    });

    it("应该解析 minAdvanceTime 和 maxAdvanceTime 约束", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  minAdvanceTime: 1 hour
  maxAdvanceTime: 30 days
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(2);
        expect(ast.constraints?.[0].name).toBe("minAdvanceTime");
        expect(ast.constraints?.[0].value).toEqual({
            type: "Duration",
            value: 1,
            unit: "hours",
        });
        expect(ast.constraints?.[1].name).toBe("maxAdvanceTime");
        expect(ast.constraints?.[1].value).toEqual({
            type: "Duration",
            value: 30,
            unit: "days",
        });
    });

    it("应该解析 allowCrossDay 约束（布尔值）", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  allowCrossDay: true
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("allowCrossDay");
        expect(ast.constraints?.[0].value).toBe(true);
    });

    it("应该解析 maxCrossDayDuration 约束", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  maxCrossDayDuration: 7 days
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("maxCrossDayDuration");
        expect(ast.constraints?.[0].value).toEqual({
            type: "Duration",
            value: 7,
            unit: "days",
        });
    });

    it("应该解析 allowedHours 约束（范围）", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  allowedHours: 9 to 18
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(1);
        expect(ast.constraints?.[0].name).toBe("allowedHours");
        expect(ast.constraints?.[0].value).toEqual({
            type: "Range",
            min: 9,
            max: 18,
        });
    });

    it("应该解析所有时间约束类型", () => {
        const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
constraints:
  timeZone: "Asia/Shanghai"
  allowedTimeZones: ["Asia/Shanghai", "America/New_York"]
  timePrecision: 15 minutes
  minAdvanceTime: 1 hour
  maxAdvanceTime: 30 days
  allowCrossDay: true
  maxCrossDayDuration: 7 days
  allowedHours: 9 to 18
`;
        const ast = parseEventDSL(dsl);
        expect(ast.constraints).toBeDefined();
        expect(ast.constraints?.length).toBe(8);

        const constraintMap = new Map(
            ast.constraints?.map((c) => [c.name, c.value]) || []
        );

        expect(constraintMap.get("timeZone")).toBe("Asia/Shanghai");
        expect(constraintMap.get("allowedTimeZones")).toEqual([
            "Asia/Shanghai",
            "America/New_York",
        ]);
        expect(constraintMap.get("timePrecision")).toEqual({
            type: "Duration",
            value: 15,
            unit: "minutes",
        });
        expect(constraintMap.get("minAdvanceTime")).toEqual({
            type: "Duration",
            value: 1,
            unit: "hours",
        });
        expect(constraintMap.get("maxAdvanceTime")).toEqual({
            type: "Duration",
            value: 30,
            unit: "days",
        });
        expect(constraintMap.get("allowCrossDay")).toBe(true);
        expect(constraintMap.get("maxCrossDayDuration")).toEqual({
            type: "Duration",
            value: 7,
            unit: "days",
        });
        expect(constraintMap.get("allowedHours")).toEqual({
            type: "Range",
            min: 9,
            max: 18,
        });
    });

    describe("重复事件 DSL 语法解析", () => {
        it("应该解析基本的重复事件配置（daily）", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: daily
  interval: 1
  endDate: "2025-12-31"
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.frequency).toBe("daily");
            expect(ast.recurring?.interval).toBe(1);
            expect(ast.recurring?.endDate).toBe("2025-12-31");
        });

        it("应该解析 weekly 重复事件配置（包含 daysOfWeek）", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: weekly
  interval: 1
  daysOfWeek: [1, 3, 5]
  count: 10
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.frequency).toBe("weekly");
            expect(ast.recurring?.interval).toBe(1);
            expect(ast.recurring?.daysOfWeek).toEqual([1, 3, 5]);
            expect(ast.recurring?.count).toBe(10);
        });

        it("应该解析 monthly 重复事件配置（包含 dayOfMonth）", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: monthly
  interval: 1
  dayOfMonth: 15
  endDate: "2025-12-31"
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.frequency).toBe("monthly");
            expect(ast.recurring?.interval).toBe(1);
            expect(ast.recurring?.dayOfMonth).toBe(15);
            expect(ast.recurring?.endDate).toBe("2025-12-31");
        });

        it("应该解析 yearly 重复事件配置", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: yearly
  interval: 1
  count: 5
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.frequency).toBe("yearly");
            expect(ast.recurring?.interval).toBe(1);
            expect(ast.recurring?.count).toBe(5);
        });

        it("应该解析 excludeDates 和 timeZone", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: weekly
  interval: 1
  daysOfWeek: [1, 2, 3, 4, 5]
  excludeDates: ["2025-01-01", "2025-12-25"]
  timeZone: "Asia/Shanghai"
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.excludeDates).toEqual([
                "2025-01-01",
                "2025-12-25",
            ]);
            expect(ast.recurring?.timeZone).toBe("Asia/Shanghai");
        });

        it("应该解析完整的重复事件配置", () => {
            const dsl = `
type: meeting
name: "Meeting"
fields:
  - title: string
recurring:
  frequency: weekly
  interval: 2
  daysOfWeek: [1, 3, 5]
  endDate: "2025-12-31"
  excludeDates: ["2025-01-01", "2025-07-04"]
  timeZone: "America/New_York"
`;
            const ast = parseEventDSL(dsl);
            expect(ast.recurring).toBeDefined();
            expect(ast.recurring?.frequency).toBe("weekly");
            expect(ast.recurring?.interval).toBe(2);
            expect(ast.recurring?.daysOfWeek).toEqual([1, 3, 5]);
            expect(ast.recurring?.endDate).toBe("2025-12-31");
            expect(ast.recurring?.excludeDates).toEqual([
                "2025-01-01",
                "2025-07-04",
            ]);
            expect(ast.recurring?.timeZone).toBe("America/New_York");
        });
    });
});
