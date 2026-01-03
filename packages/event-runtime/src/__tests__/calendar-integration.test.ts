/**
 * Calendar 组件集成测试
 * 
 * 验证完整的流程：DSL → Data Model → Event 验证 → Calendar 显示
 * 
 * 这个测试验证：
 * 1. DSL AST → 编译 → Data Model
 * 2. Event 对象创建和验证
 * 3. Event 渲染（生成 Calendar 组件需要的显示数据）
 * 4. 验证渲染后的数据可以用于 Calendar 组件
 */

import { describe, it, expect } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "../EventRuntime";
import { EventValidator } from "@calenderjs/event-model";
import type { Event, ValidationContext } from "@calenderjs/event-model";
import type { RenderContext, RenderedEvent } from "@calenderjs/core";

describe("Calendar 组件集成测试", () => {
    it("应该完成 DSL → Data Model → Event 验证 → Calendar 显示的完整流程", () => {
        // ========== 步骤 1: 定义 DSL AST ==========
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

        // ========== 步骤 2: 编译 DSL AST → Data Model ==========
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

        // ========== 步骤 3: 创建 Event 对象 ==========
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

        // ========== 步骤 4: 使用 EventValidator 验证 Event 基础结构 ==========
        const eventValidator = new EventValidator();
        const baseValidation = eventValidator.validateBase(event);
        expect(baseValidation.valid).toBe(true);
        expect(baseValidation.errors || []).toEqual([]);

        // ========== 步骤 5: 使用 EventValidator 验证 Event.extra（使用生成的 JSON Schema）==========
        if (eventTypeDataModel.extraSchema) {
            const extraValidation = eventValidator.validateExtra(
                event,
                eventTypeDataModel.extraSchema
            );
            expect(extraValidation.valid).toBe(true);
            expect(extraValidation.errors || []).toEqual([]);
        }

        // ========== 步骤 6: 使用 EventRuntime 验证业务规则 ==========
        const runtime = new EventRuntime(eventTypeDataModel);
        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };
        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);
        // 验证通过时 errors 可能是 undefined
        if (validationResult.errors) {
            expect(validationResult.errors).toEqual([]);
        }

        // ========== 步骤 7: 使用 EventRuntime 渲染 Event（生成 Calendar 显示数据）==========
        const renderContext: RenderContext = {};
        const rendered: RenderedEvent = runtime.render(event, renderContext);

        // 验证渲染后的数据（RenderedEvent 只包含显示相关的字段）
        expect(rendered).toBeDefined();
        expect(rendered.title).toBe("团队会议");
        expect(rendered.color).toBe("#4285f4");
        expect(rendered.icon).toBe("meeting");

        // ========== 步骤 8: 验证渲染后的数据可以用于 Calendar 组件 ==========
        // Calendar 组件直接使用 Event 对象，RenderedEvent 用于覆盖显示属性
        // 实际使用中，Calendar 组件会：
        // 1. 使用 Event.startTime 和 Event.endTime 进行时间计算和布局
        // 2. 使用 RenderedEvent.color 和 RenderedEvent.icon 进行样式显示
        // 3. 使用 RenderedEvent.title 或 Event.title 作为标题
        
        // 验证 Event 对象（Calendar 组件的主要数据源）
        expect(event.id).toBe("event-1");
        expect(event.type).toBe("meeting");
        expect(event.title).toBe("团队会议");
        expect(event.startTime).toBeInstanceOf(Date);
        expect(event.endTime).toBeInstanceOf(Date);
        expect(event.extra).toBeDefined();
        expect(event.extra.attendees).toHaveLength(2);
        expect(event.extra.location).toBe("会议室 A");

        // 验证 RenderedEvent（Calendar 组件的显示属性）
        expect(rendered.color).toBe("#4285f4");
        expect(rendered.icon).toBe("meeting");
        expect(rendered.title).toBe("团队会议");

        // 组合后的 Calendar 事件数据结构（实际使用场景）
        const calendarEvent = {
            ...event, // 包含所有 Event 字段（id, type, title, startTime, endTime, extra 等）
            color: rendered.color, // 使用渲染后的颜色
            icon: rendered.icon, // 使用渲染后的图标
        };

        // 验证组合后的数据结构
        expect(calendarEvent.id).toBe("event-1");
        expect(calendarEvent.type).toBe("meeting");
        expect(calendarEvent.title).toBe("团队会议");
        expect(calendarEvent.startTime).toBeInstanceOf(Date);
        expect(calendarEvent.endTime).toBeInstanceOf(Date);
        expect(calendarEvent.color).toBe("#4285f4");
        expect(calendarEvent.icon).toBe("meeting");
        expect(calendarEvent.extra).toBeDefined();
        expect(calendarEvent.extra.attendees).toHaveLength(2);
        expect(calendarEvent.extra.location).toBe("会议室 A");
    });

    it("应该处理多个事件的完整流程", () => {
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
        const eventValidator = new EventValidator();

        // 创建多个事件
        const events: Event[] = [
            {
                id: "event-1",
                type: "appointment",
                title: "预约 1",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: { patient: "张三" },
            },
            {
                id: "event-2",
                type: "appointment",
                title: "预约 2",
                startTime: new Date("2024-12-30T14:00:00Z"),
                endTime: new Date("2024-12-30T15:00:00Z"),
                extra: { patient: "李四" },
            },
        ];

        // 验证和渲染所有事件
        const renderedEvents: RenderedEvent[] = [];
        for (const event of events) {
            // 验证基础结构
            const baseValidation = eventValidator.validateBase(event);
            expect(baseValidation.valid).toBe(true);

            // 验证业务规则
            const validationResult = runtime.validate(event, {
                events: [],
                now: new Date(),
            });
            expect(validationResult.valid).toBe(true);

            // 渲染
            const rendered = runtime.render(event, {});
            renderedEvents.push(rendered);
        }

        // 验证所有事件都已渲染
        expect(renderedEvents).toHaveLength(2);
        expect(renderedEvents[0].title).toBe("预约 1");
        expect(renderedEvents[1].title).toBe("预约 2");
        expect(renderedEvents[0].color).toBe("#ea4335");
        expect(renderedEvents[1].color).toBe("#ea4335");
    });

    it("应该处理包含时区和全天事件的完整流程", () => {
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
        const eventValidator = new EventValidator();

        // 创建带时区的全天事件
        const event: Event = {
            id: "event-1",
            type: "holiday",
            title: "元旦",
            startTime: new Date("2024-12-30T00:00:00Z"),
            endTime: new Date("2024-12-30T23:59:59Z"),
            timeZone: "Asia/Shanghai",
            allDay: true,
            extra: {
                description: "元旦假期",
            },
        };

        // 验证
        const baseValidation = eventValidator.validateBase(event);
        expect(baseValidation.valid).toBe(true);

        const validationResult = runtime.validate(event, {
            events: [],
            now: new Date(),
        });
        expect(validationResult.valid).toBe(true);

        // 渲染
        const rendered = runtime.render(event, {});
        expect(rendered).toBeDefined();
        expect(rendered.title).toBe("元旦");
        expect(rendered.color).toBe("#ea4335");
    });
});
