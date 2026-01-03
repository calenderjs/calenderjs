/**
 * Calendar 显示验证测试
 * 
 * 验证 Event 对象经过验证和渲染后，可以正确用于 Calendar 组件显示
 * 
 * 这个测试验证：
 * 1. Event 对象包含 Calendar 组件需要的所有字段
 * 2. RenderedEvent 提供 Calendar 组件需要的显示属性（color, icon）
 * 3. Event + RenderedEvent 的组合可以用于 Calendar 组件
 */

import { describe, it, expect } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "../EventRuntime";
import { EventValidator } from "@calenderjs/event-model";
import type { Event, ValidationContext } from "@calenderjs/event-model";
import type { RenderContext } from "@calenderjs/core";

describe("Calendar 显示验证", () => {
    it("应该生成可以用于 Calendar 组件的事件数据", () => {
        // 1. 定义 DSL AST
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
            behavior: [],
        };

        // 2. 编译 DSL AST → Data Model
        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([ast]);
        const eventTypeDataModel = dataModel.types[0];

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

        // 4. 验证 Event
        const eventValidator = new EventValidator();
        const baseValidation = eventValidator.validateBase(event);
        expect(baseValidation.valid).toBe(true);

        if (eventTypeDataModel.extraSchema) {
            const extraValidation = eventValidator.validateExtra(
                event,
                eventTypeDataModel.extraSchema
            );
            expect(extraValidation.valid).toBe(true);
        }

        const runtime = new EventRuntime(eventTypeDataModel);
        const validationResult = runtime.validate(event, {
            events: [],
            now: new Date(),
        });
        expect(validationResult.valid).toBe(true);

        // 5. 渲染 Event
        const rendered = runtime.render(event, {});

        // 6. 组合 Event + RenderedEvent 用于 Calendar 组件
        // Calendar 组件需要的数据结构：
        // - Event 的所有字段（id, type, title, startTime, endTime, extra 等）
        // - RenderedEvent 的显示属性（color, icon）
        const calendarEvent = {
            ...event, // Event 的所有字段
            color: rendered.color, // 从 RenderedEvent 获取颜色
            icon: rendered.icon, // 从 RenderedEvent 获取图标
        };

        // 7. 验证 Calendar 事件数据结构
        // Calendar 组件需要的字段：
        expect(calendarEvent.id).toBeDefined(); // ✅ Event.id
        expect(calendarEvent.type).toBeDefined(); // ✅ Event.type
        expect(calendarEvent.title).toBeDefined(); // ✅ Event.title
        expect(calendarEvent.startTime).toBeInstanceOf(Date); // ✅ Event.startTime
        expect(calendarEvent.endTime).toBeInstanceOf(Date); // ✅ Event.endTime
        expect(calendarEvent.color).toBeDefined(); // ✅ RenderedEvent.color
        expect(calendarEvent.icon).toBeDefined(); // ✅ RenderedEvent.icon
        expect(calendarEvent.extra).toBeDefined(); // ✅ Event.extra

        // 验证具体值
        expect(calendarEvent.id).toBe("event-1");
        expect(calendarEvent.type).toBe("meeting");
        expect(calendarEvent.title).toBe("团队会议");
        expect(calendarEvent.color).toBe("#4285f4");
        expect(calendarEvent.icon).toBe("meeting");
        expect(calendarEvent.extra.attendees).toHaveLength(2);
        expect(calendarEvent.extra.location).toBe("会议室 A");

        // 8. 验证时间字段（Calendar 组件用于布局和显示）
        expect(calendarEvent.startTime.getTime()).toBe(
            new Date("2024-12-30T10:00:00Z").getTime()
        );
        expect(calendarEvent.endTime.getTime()).toBe(
            new Date("2024-12-30T11:00:00Z").getTime()
        );

        // 验证完成：Event 对象经过验证和渲染后，可以正确用于 Calendar 组件
    });

    it("应该处理多个事件的 Calendar 显示", () => {
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
        const calendarEvents = events.map((event) => {
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

            // 组合用于 Calendar
            return {
                ...event,
                color: rendered.color,
                icon: rendered.icon,
            };
        });

        // 验证所有事件都可以用于 Calendar
        expect(calendarEvents).toHaveLength(2);
        expect(calendarEvents[0].color).toBe("#ea4335");
        expect(calendarEvents[1].color).toBe("#ea4335");
        expect(calendarEvents[0].startTime).toBeInstanceOf(Date);
        expect(calendarEvents[1].startTime).toBeInstanceOf(Date);
    });
});
