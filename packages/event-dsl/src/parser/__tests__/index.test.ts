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

    describe("normalizeAST 默认值处理", () => {
        it("应该处理缺少 type 和 name 的情况", () => {
            // 模拟解析器返回缺少 type 和 name 的结果
            const mockResult = {
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            // 通过解析一个不完整的 DSL 来触发 normalizeAST 的默认值分支
            const dsl = `
fields:
  - title: string
`;
            const ast = parseEventDSL(dsl);
            // 即使缺少 type 和 name，也应该有默认值
            expect(ast.type).toBeDefined();
            expect(ast.name).toBeDefined();
        });

        it("应该处理缺少 fields、validate、display、behavior 的情况", () => {
            // 通过解析一个只有 type 和 name 的 DSL
            const dsl = `
type: test
name: "Test"
`;
            const ast = parseEventDSL(dsl);
            expect(ast.fields).toEqual([]);
            expect(ast.validate).toEqual([]);
            expect(ast.display).toEqual([]);
            expect(ast.behavior).toEqual([]);
        });
    });

    describe("完整 DSL 解析", () => {
        it("应该解析包含所有 section 的完整 DSL", () => {
            const dsl = `type: meeting
name: "团队会议"
description: "标准团队会议类型"

fields:
  - attendees: list of email, required
  - location: string

validate:
  attendees.count between 1 and 50
  startTime.hour >= 9
  startTime.hour <= 18

display:
  color: "#4285f4"
  icon: "meeting"

behavior:
  editable: true
  draggable: true`;

            const ast = parseEventDSL(dsl);

            // 验证基本信息
            expect(ast.type).toBe("meeting");
            expect(ast.name).toBe("团队会议");
            expect(ast.description).toBe("标准团队会议类型");

            // 验证字段定义
            expect(ast.fields).toHaveLength(2);
            expect(ast.fields[0]).toEqual({
                name: "attendees",
                type: { type: "list", itemType: "email" },
                required: true,
            });
            expect(ast.fields[1]).toEqual({
                name: "location",
                type: "string",
            });

            // 验证验证规则
            expect(ast.validate).toHaveLength(3);
            expect(ast.validate[0]).toMatchObject({
                type: "Between",
                field: {
                    type: "FieldAccess",
                    path: ["attendees", "count"],
                },
                min: 1,
                max: 50,
            });
            expect(ast.validate[1]).toMatchObject({
                type: "Comparison",
                operator: ">=",
                left: {
                    type: "FieldAccess",
                    path: ["startTime", "hour"],
                },
                right: 9,
            });
            expect(ast.validate[2]).toMatchObject({
                type: "Comparison",
                operator: "<=",
                left: {
                    type: "FieldAccess",
                    path: ["startTime", "hour"],
                },
                right: 18,
            });

            // 验证显示规则
            expect(ast.display).toHaveLength(2);
            expect(ast.display[0]).toEqual({
                name: "color",
                value: "#4285f4",
            });
            expect(ast.display[1]).toEqual({
                name: "icon",
                value: "meeting",
            });

            // 验证行为规则
            expect(ast.behavior).toHaveLength(2);
            expect(ast.behavior[0]).toEqual({
                name: "editable",
                value: true,
            });
            expect(ast.behavior[1]).toEqual({
                name: "draggable",
                value: true,
            });
        });

        it("应该正确解析 validate section 后跟 display section", () => {
            const dsl = `type: meeting
name: "Meeting"
fields:
  - title: string
validate:
  title.length >= 1
  title.length <= 100
display:
  color: "#4285f4"
  icon: "calendar"`;

            const ast = parseEventDSL(dsl);

            expect(ast.type).toBe("meeting");
            expect(ast.name).toBe("Meeting");
            expect(ast.validate).toHaveLength(2);
            expect(ast.display).toHaveLength(2);
            expect(ast.display[0].name).toBe("color");
            expect(ast.display[1].name).toBe("icon");
        });

        it("应该正确解析 validate section 后跟 behavior section", () => {
            const dsl = `type: meeting
name: "Meeting"
fields:
  - title: string
validate:
  title.length >= 1
behavior:
  editable: true
  draggable: true`;

            const ast = parseEventDSL(dsl);

            expect(ast.type).toBe("meeting");
            expect(ast.validate).toHaveLength(1);
            expect(ast.behavior).toHaveLength(2);
            expect(ast.behavior[0].name).toBe("editable");
            expect(ast.behavior[1].name).toBe("draggable");
        });
    });

    describe("穷尽测试 - 所有字段类型", () => {
        it("应该解析所有基础字段类型", () => {
            const dsl = `type: test
name: "Test"
fields:
  - str: string
  - num: number
  - bool: boolean
  - email_field: email
  - text_field: text`;

            const ast = parseEventDSL(dsl);

            expect(ast.fields).toHaveLength(5);
            expect(ast.fields[0].type).toBe("string");
            expect(ast.fields[1].type).toBe("number");
            expect(ast.fields[2].type).toBe("boolean");
            expect(ast.fields[3].type).toBe("email");
            expect(ast.fields[4].type).toBe("text");
        });

        it("应该解析嵌套的 list of 类型", () => {
            const dsl = `type: test
name: "Test"
fields:
  - emails: list of email
  - strings: list of string
  - nested: list of list of string`;

            const ast = parseEventDSL(dsl);

            expect(ast.fields[0].type).toEqual({
                type: "list",
                itemType: "email",
            });
            expect(ast.fields[1].type).toEqual({
                type: "list",
                itemType: "string",
            });
            expect(ast.fields[2].type).toEqual({
                type: "list",
                itemType: { type: "list", itemType: "string" },
            });
        });

        it("应该解析 enum 类型", () => {
            const dsl = `type: test
name: "Test"
fields:
  - priority: enum(low, normal, high)
  - status: enum(pending, approved, rejected)`;

            const ast = parseEventDSL(dsl);

            expect(ast.fields[0].type).toEqual({
                type: "enum",
                values: ["low", "normal", "high"],
            });
            expect(ast.fields[1].type).toEqual({
                type: "enum",
                values: ["pending", "approved", "rejected"],
            });
        });

        it("应该解析所有字段修饰符", () => {
            const dsl = `type: test
name: "Test"
fields:
  - required_field: string, required
  - default_field: string, default: "default value"
  - min_field: number, min: 1
  - max_field: number, max: 100
  - range_field: number, min: 1, max: 100
  - full_field: string, required, default: "test", min: 1, max: 50`;

            const ast = parseEventDSL(dsl);

            expect(ast.fields[0].required).toBe(true);
            expect(ast.fields[1].default).toBe("default value");
            expect(ast.fields[2].min).toBe(1);
            expect(ast.fields[3].max).toBe(100);
            expect(ast.fields[4].min).toBe(1);
            expect(ast.fields[4].max).toBe(100);
            expect(ast.fields[5].required).toBe(true);
            expect(ast.fields[5].default).toBe("test");
            expect(ast.fields[5].min).toBe(1);
            expect(ast.fields[5].max).toBe(50);
        });
    });

    describe("穷尽测试 - 所有验证规则类型", () => {
        it("应该解析所有比较操作符", () => {
            const dsl = `type: test
name: "Test"
fields:
  - value: number
validate:
  value > 10
  value >= 10
  value < 100
  value <= 100
  value is 50
  value equals 50
  value is not 10
  value not equals 10`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(8);
            expect((ast.validate[0] as any).operator).toBe(">");
            expect((ast.validate[1] as any).operator).toBe(">=");
            expect((ast.validate[2] as any).operator).toBe("<");
            expect((ast.validate[3] as any).operator).toBe("<=");
            expect((ast.validate[4] as any).operator).toBe("is");
            expect((ast.validate[5] as any).operator).toBe("equals");
            expect((ast.validate[6] as any).operator).toBe("is not");
            expect((ast.validate[7] as any).operator).toBe("not equals");
        });

        it("应该解析 between 表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - count: number
validate:
  count between 1 and 100
  count between 0 and 50`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(2);
            expect(ast.validate[0].type).toBe("Between");
            expect(ast.validate[0].min).toBe(1);
            expect(ast.validate[0].max).toBe(100);
            expect(ast.validate[1].type).toBe("Between");
            expect(ast.validate[1].min).toBe(0);
            expect(ast.validate[1].max).toBe(50);
        });

        it("应该解析 in 表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - status: string
validate:
  status in ["pending", "approved", "rejected"]
  status in [1, 2, 3]`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(2);
            expect(ast.validate[0].type).toBe("In");
            expect(ast.validate[0].values).toEqual([
                "pending",
                "approved",
                "rejected",
            ]);
            expect(ast.validate[1].type).toBe("In");
            expect(ast.validate[1].values).toEqual([1, 2, 3]);
        });

        it("应该解析 conflict 表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
validate:
  no conflict with other events
  conflict with other events`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(2);
            expect(ast.validate[0].type).toBe("NoConflict");
            expect(ast.validate[1].type).toBe("Conflict");
        });

        it("应该解析 when 条件表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - priority: string
  - count: number
validate:
  when priority is high:
    count >= 5
    count <= 100`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(1);
            expect(ast.validate[0].type).toBe("When");
            expect(ast.validate[0].rules).toHaveLength(2);
        });

        it("应该解析逻辑表达式 (and/or)", () => {
            const dsl = `type: test
name: "Test"
fields:
  - count: number
validate:
  count >= 10 and count <= 100`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(1);
            expect((ast.validate[0] as any).type).toBe("BinaryExpression");
            expect((ast.validate[0] as any).operator).toBe("and");
        });

        it("应该解析 not 表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - value: number
validate:
  not value is 0`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(1);
            expect(ast.validate[0].type).toBe("UnaryExpression");
            expect(ast.validate[0].operator).toBe("not");
        });

        it("应该解析 mod 表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - minute: number
validate:
  minute mod 15 is 10`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(1);
            expect((ast.validate[0] as any).type).toBe("ModComparison");
            expect((ast.validate[0] as any).modValue).toBe(15);
            expect((ast.validate[0] as any).operator).toBe("is");
            expect((ast.validate[0] as any).right).toBe(10);
        });
    });

    describe("穷尽测试 - 所有显示规则", () => {
        it("应该解析所有显示属性", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
display:
  color: "#4285f4"
  icon: "calendar"
  title: "Event Title"
  description: "Event Description"`;

            const ast = parseEventDSL(dsl);

            expect(ast.display).toHaveLength(4);
            expect(ast.display[0].name).toBe("color");
            expect(ast.display[1].name).toBe("icon");
            expect(ast.display[2].name).toBe("title");
            expect(ast.display[3].name).toBe("description");
        });

        it("应该解析条件显示表达式", () => {
            const dsl = `type: test
name: "Test"
fields:
  - priority: string
display:
  color:
    when priority is high: "#ea4335"
    else: "#34a853"`;

            const ast = parseEventDSL(dsl);

            expect(ast.display).toHaveLength(1);
            expect(ast.display[0].name).toBe("color");
            expect((ast.display[0].value as any).type).toBe("Conditional");
            expect((ast.display[0].value as any).condition).toBeDefined();
            expect((ast.display[0].value as any).consequent).toBe("#ea4335");
            expect((ast.display[0].value as any).alternate).toBeDefined();
        });

        it("应该解析字符串模板", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
  - count: number
display:
  title: "{title}"
  description: "{count} attendees"`;

            const ast = parseEventDSL(dsl);

            expect(ast.display).toHaveLength(2);
            // 字符串模板在解析后是普通字符串，不是 Template 对象
            expect(typeof ast.display[0].value).toBe("string");
            expect(ast.display[0].value).toBe("{title}");
            expect(typeof ast.display[1].value).toBe("string");
            expect(ast.display[1].value).toBe("{count} attendees");
        });
    });

    describe("穷尽测试 - 所有行为规则", () => {
        it("应该解析所有行为属性", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
behavior:
  draggable: true
  resizable: true
  editable: true
  deletable: true`;

            const ast = parseEventDSL(dsl);

            expect(ast.behavior).toHaveLength(4);
            expect(ast.behavior[0].name).toBe("draggable");
            expect(ast.behavior[1].name).toBe("resizable");
            expect(ast.behavior[2].name).toBe("editable");
            expect(ast.behavior[3].name).toBe("deletable");
            expect(ast.behavior[0].value).toBe(true);
            expect(ast.behavior[1].value).toBe(true);
            expect(ast.behavior[2].value).toBe(true);
            expect(ast.behavior[3].value).toBe(true);
        });

        it("应该解析 false 值", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
behavior:
  draggable: false
  editable: false`;

            const ast = parseEventDSL(dsl);

            expect(ast.behavior[0].value).toBe(false);
            expect(ast.behavior[1].value).toBe(false);
        });

        it("应该解析逻辑表达式作为行为值", () => {
            const dsl = `type: test
name: "Test"
fields:
  - role: string
behavior:
  editable: role is admin or role is manager`;

            const ast = parseEventDSL(dsl);

            expect(ast.behavior).toHaveLength(1);
            expect(ast.behavior[0].name).toBe("editable");
            expect(ast.behavior[0].value.type).toBe("BinaryExpression");
            expect(ast.behavior[0].value.operator).toBe("or");
        });
    });

    describe("穷尽测试 - Section 顺序和组合", () => {
        it("应该解析所有 section 的任意顺序", () => {
            const dsl = `behavior:
  editable: true
type: meeting
display:
  color: "#4285f4"
name: "Meeting"
fields:
  - title: string
validate:
  title.length >= 1
description: "Test description"
constraints:
  timeZone: "Asia/Shanghai"`;

            const ast = parseEventDSL(dsl);

            expect(ast.type).toBe("meeting");
            expect(ast.name).toBe("Meeting");
            expect(ast.description).toBe("Test description");
            expect(ast.fields).toHaveLength(1);
            expect(ast.validate).toHaveLength(1);
            expect(ast.display).toHaveLength(1);
            expect(ast.behavior).toHaveLength(1);
            expect(ast.constraints).toHaveLength(1);
        });

        it("应该处理空的 validate section", () => {
            const dsl = `type: test
name: "Test"
fields:
  - title: string
validate:
display:
  color: "#4285f4"`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toEqual([]);
            expect(ast.display).toHaveLength(1);
        });

        it("应该处理多个连续的 validate 规则", () => {
            const dsl = `type: test
name: "Test"
fields:
  - count: number
validate:
  count >= 10
  count <= 100
  count mod 5 is 10
  count in [10, 20, 30]
  count between 10 and 50`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(5);
            expect((ast.validate[0] as any).operator).toBe(">=");
            expect((ast.validate[1] as any).operator).toBe("<=");
            expect((ast.validate[2] as any).type).toBe("ModComparison");
            expect((ast.validate[3] as any).type).toBe("In");
            expect((ast.validate[4] as any).type).toBe("Between");
        });
    });

    describe("穷尽测试 - 边界情况", () => {
        it("应该处理只有 type 和 name 的最小 DSL", () => {
            const dsl = `type: test
name: "Test"`;

            const ast = parseEventDSL(dsl);

            expect(ast.type).toBe("test");
            expect(ast.name).toBe("Test");
            expect(ast.fields).toEqual([]);
            expect(ast.validate).toEqual([]);
            expect(ast.display).toEqual([]);
            expect(ast.behavior).toEqual([]);
        });

        it("应该处理包含注释的 DSL", () => {
            const dsl = `# 这是注释
type: test
# 另一个注释
name: "Test"
# fields 注释
fields:
  - title: string # 字段注释
validate:
  # 验证规则注释
  title.length >= 1`;

            const ast = parseEventDSL(dsl);

            expect(ast.type).toBe("test");
            expect(ast.name).toBe("Test");
            expect(ast.fields).toHaveLength(1);
            expect(ast.validate).toHaveLength(1);
        });

        it("应该处理多行字符串值", () => {
            const dsl = `type: test
name: "Test with long name"
description: "This is a very long description that spans multiple lines in the source but is still a single string value"`;

            const ast = parseEventDSL(dsl);

            expect(ast.name).toBe("Test with long name");
            expect(ast.description).toBe(
                "This is a very long description that spans multiple lines in the source but is still a single string value"
            );
        });

        it("应该处理复杂的字段访问路径", () => {
            const dsl = `type: test
name: "Test"
fields:
  - user: string
validate:
  user.profile.settings.notifications.enabled is true
  user.profile.settings.theme equals dark`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(2);
            expect(ast.validate[0].left.path).toEqual([
                "user",
                "profile",
                "settings",
                "notifications",
                "enabled",
            ]);
            expect(ast.validate[1].left.path).toEqual([
                "user",
                "profile",
                "settings",
                "theme",
            ]);
        });

        it("应该处理 Duration 字面量", () => {
            const dsl = `type: test
name: "Test"
fields:
  - duration: number
validate:
  duration >= 15 minutes
  duration <= 8 hours
  duration between 30 minutes and 2 hours`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(3);
            expect((ast.validate[0] as any).right.type).toBe("Duration");
            expect((ast.validate[0] as any).right.value).toBe(15);
            expect((ast.validate[0] as any).right.unit).toBe("minutes");
            expect((ast.validate[1] as any).right.type).toBe("Duration");
            expect((ast.validate[1] as any).right.value).toBe(8);
            expect((ast.validate[1] as any).right.unit).toBe("hours");
        });

        it("应该处理数组字面量", () => {
            const dsl = `type: test
name: "Test"
fields:
  - tags: list of string
validate:
  tags in [["work", "urgent"], ["personal", "low"]]`;

            const ast = parseEventDSL(dsl);

            expect(ast.validate).toHaveLength(1);
            expect((ast.validate[0] as any).type).toBe("In");
            expect(Array.isArray((ast.validate[0] as any).values[0])).toBe(
                true
            );
        });
    });
});
