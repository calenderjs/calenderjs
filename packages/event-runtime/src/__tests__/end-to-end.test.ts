/**
 * 端到端测试：DSL → Data Model → Event 验证 → 显示
 * 
 * 验证完整的流程：
 * 1. DSL AST → 编译 → Data Model (EventTypeDataModel)
 * 2. Data Model → 验证 Event 对象
 * 3. Event 对象 → 渲染 (RenderedEvent)
 * 
 * 注意：使用 AST 而不是 DSL 文本，因为某些语法（如 attendees.count）的 DSL 解析器支持还在开发中
 */

import { describe, it, expect } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "../EventRuntime";
import { EventValidator } from "@calenderjs/event-model";
import type { Event, ValidationContext } from "@calenderjs/event-model";
import type { RenderContext } from "@calenderjs/core";

describe("端到端测试：DSL → Data Model → Event 验证 → 显示", () => {
    it("应该完成完整的 DSL → 验证 → 渲染流程", () => {
        // 1. 使用 AST 创建测试数据（DSL 解析器对复杂语法的支持还在开发中）
        const ast: EventTypeAST = {
            type: "meeting",
            name: "团队会议",
            fields: [
                {
                    name: "attendees",
                    type: { type: "list", itemType: "email" },
                    required: true,
                },
                {
                    name: "location",
                    type: "string",
                },
            ],
            validate: [
                {
                    type: "Between",
                    field: { type: "FieldAccess", path: ["attendees", "count"] },
                    min: 1,
                    max: 50,
                },
                {
                    type: "Between",
                    field: { type: "FieldAccess", path: ["startTime", "hour"] },
                    min: 9,
                    max: 18,
                },
            ],
            display: [
                {
                    name: "color",
                    value: "#4285f4",
                },
                {
                    name: "icon",
                    value: "meeting",
                },
            ],
            behavior: [
                {
                    name: "editable",
                    value: true,
                },
            ],
        };

        // 2. 编译 AST → Data Model
        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const eventTypeDataModel = dataModel.types[0];

        // 验证 Data Model 结构
        expect(eventTypeDataModel).toBeDefined();
        expect(eventTypeDataModel.id).toBe("meeting");
        expect(eventTypeDataModel.name).toBe("团队会议");
        expect(eventTypeDataModel.extraSchema).toBeDefined();
        expect(eventTypeDataModel.validationRules).toBeDefined();
        expect(eventTypeDataModel.displayRules).toBeDefined();
        expect(eventTypeDataModel.behaviorRules).toBeDefined();

        // 3. 创建 Event 对象
        const event: Event = {
            id: "event-1",
            type: "meeting",
            title: "团队会议",
            startTime: new Date("2024-12-30T10:00:00Z"),
            endTime: new Date("2024-12-30T11:00:00Z"),
            extra: {
                attendees: ["user1@example.com", "user2@example.com"],
                location: "会议室 A",
            },
        };

        // 4. 使用 EventValidator 验证 Event 基础结构
        const eventValidator = new EventValidator();
        const baseValidation = eventValidator.validateBase(event);
        expect(baseValidation.valid).toBe(true);

        // 5. 使用 EventValidator 验证 Event.extra（使用生成的 JSON Schema）
        if (eventTypeDataModel.extraSchema) {
            const extraValidation = eventValidator.validateExtra(
                event,
                eventTypeDataModel.extraSchema
            );
            expect(extraValidation.valid).toBe(true);
        }

        // 6. 使用 EventRuntime 验证业务规则
        const runtime = new EventRuntime(eventTypeDataModel);
        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };
        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);

        // 7. 使用 EventRuntime 渲染 Event
        const renderContext: RenderContext = {};
        const rendered = runtime.render(event, renderContext);
        expect(rendered).toBeDefined();
        expect(rendered.color).toBe("#4285f4");
        expect(rendered.icon).toBe("meeting");
        expect(rendered.title).toBe("团队会议");
    });

    it("应该处理包含时区的完整流程", () => {
        const ast: EventTypeAST = {
            type: "appointment",
            name: "预约",
            fields: [
                {
                    name: "patient",
                    type: "string",
                    required: true,
                },
            ],
            validate: [
                {
                    type: "Comparison",
                    operator: ">=",
                    left: { type: "FieldAccess", path: ["startTime", "hour"] },
                    right: 9,
                },
                {
                    type: "Comparison",
                    operator: "<=",
                    left: { type: "FieldAccess", path: ["startTime", "hour"] },
                    right: 17,
                },
            ],
            display: [
                {
                    name: "color",
                    value: "#ea4335",
                },
            ],
            behavior: [],
        };

        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const runtime = new EventRuntime(dataModel.types[0]);

        const event: Event = {
            id: "event-2",
            type: "appointment",
            title: "预约",
            startTime: new Date("2024-12-30T14:00:00Z"),
            endTime: new Date("2024-12-30T15:00:00Z"),
            timeZone: "Asia/Shanghai",
            extra: {
                patient: "张三",
            },
        };

        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };

        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);

        const rendered = runtime.render(event, {});
        expect(rendered.color).toBe("#ea4335");
    });

    it("应该处理包含重复事件的完整流程", () => {
        const ast: EventTypeAST = {
            type: "meeting",
            name: "每周例会",
            fields: [
                {
                    name: "agenda",
                    type: "text",
                },
            ],
            validate: [
                {
                    type: "Comparison",
                    operator: ">=",
                    left: { type: "FieldAccess", path: ["startTime", "hour"] },
                    right: 9,
                },
            ],
            display: [
                {
                    name: "color",
                    value: "#4285f4",
                },
            ],
            behavior: [],
        };

        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const runtime = new EventRuntime(dataModel.types[0]);

        const event: Event = {
            id: "event-3",
            type: "meeting",
            title: "每周例会",
            startTime: new Date("2024-12-30T10:00:00Z"),
            endTime: new Date("2024-12-30T11:00:00Z"),
            recurring: {
                frequency: "weekly",
                interval: 1,
                daysOfWeek: [1, 3, 5], // 周一、周三、周五
                endDate: new Date("2025-12-31T23:59:59Z"),
            },
            extra: {
                agenda: "讨论项目进度",
            },
        };

        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };

        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);

        const rendered = runtime.render(event, {});
        expect(rendered).toBeDefined();
    });

    it("应该处理全天事件的完整流程", () => {
        const ast: EventTypeAST = {
            type: "holiday",
            name: "节假日",
            fields: [
                {
                    name: "description",
                    type: "text",
                },
            ],
            validate: [],
            display: [
                {
                    name: "color",
                    value: "#ea4335",
                },
            ],
            behavior: [],
        };

        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const runtime = new EventRuntime(dataModel.types[0]);

        const event: Event = {
            id: "event-4",
            type: "holiday",
            title: "节假日",
            startTime: new Date("2024-12-30T00:00:00Z"),
            endTime: new Date("2024-12-30T23:59:59Z"),
            allDay: true,
            extra: {
                description: "元旦假期",
            },
        };

        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };

        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);

        const rendered = runtime.render(event, {});
        expect(rendered).toBeDefined();
    });

    it("应该拒绝不符合验证规则的事件", () => {
        const ast: EventTypeAST = {
            type: "meeting",
            name: "会议",
            fields: [
                {
                    name: "attendees",
                    type: { type: "list", itemType: "email" },
                    required: true,
                },
            ],
            validate: [
                {
                    type: "Between",
                    field: { type: "FieldAccess", path: ["attendees", "count"] },
                    min: 1,
                    max: 50,
                },
                {
                    type: "Between",
                    field: { type: "FieldAccess", path: ["startTime", "hour"] },
                    min: 9,
                    max: 18,
                },
            ],
            display: [],
            behavior: [],
        };

        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const runtime = new EventRuntime(dataModel.types[0]);

        // 创建不符合规则的事件（开始时间不在 9-18 之间）
        const event: Event = {
            id: "event-5",
            type: "meeting",
            title: "会议",
            startTime: new Date("2024-12-30T20:00:00Z"), // 20:00 不在 9-18 之间
            endTime: new Date("2024-12-30T21:00:00Z"),
            extra: {
                attendees: ["user1@example.com"],
            },
        };

        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };

        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors).toBeDefined();
        expect(validationResult.errors?.length).toBeGreaterThan(0);
    });
});
