/**
 * DSL → Calendar 完整流程验证测试
 * 
 * 这个测试验证完整的端到端流程：
 * 1. DSL AST → 编译 → Data Model
 * 2. Event 对象创建
 * 3. Event 验证（基础结构 + 业务规则）
 * 4. Event 渲染（生成显示数据）
 * 5. 验证数据可以用于 Calendar 组件
 * 
 * **重要**：这个测试验证整个架构的正确性
 */

import { describe, it, expect } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "../EventRuntime";
import { EventValidator } from "@calenderjs/event-model";
import type { Event, ValidationContext } from "@calenderjs/event-model";
import type { RenderContext } from "@calenderjs/core";

describe("DSL → Calendar 完整流程验证", () => {
    it("应该完成 DSL → Data Model → Event 验证 → 渲染的完整流程", () => {
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

        // ========== 步骤 5: 使用 EventValidator 验证 Event.extra（使用生成的 JSON Schema）==========
        if (eventTypeDataModel.extraSchema) {
            const extraValidation = eventValidator.validateExtra(
                event,
                eventTypeDataModel.extraSchema
            );
            expect(extraValidation.valid).toBe(true);
        }

        // ========== 步骤 6: 使用 EventRuntime 验证业务规则 ==========
        const runtime = new EventRuntime(eventTypeDataModel);
        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };
        const validationResult = runtime.validate(event, context);
        expect(validationResult.valid).toBe(true);

        // ========== 步骤 7: 使用 EventRuntime 渲染 Event ==========
        const renderContext: RenderContext = {};
        const rendered = runtime.render(event, renderContext);

        // 验证渲染后的数据
        expect(rendered).toBeDefined();
        expect(rendered.title).toBe("团队会议");
        expect(rendered.color).toBe("#4285f4");
        expect(rendered.icon).toBe("meeting");

        // ========== 步骤 8: 验证数据可以用于 Calendar 组件 ==========
        // Calendar 组件需要的数据结构：Event + RenderedEvent 的组合
        const calendarEvent = {
            ...event, // 包含所有 Event 字段（id, type, title, startTime, endTime, extra 等）
            color: rendered.color, // 使用渲染后的颜色
            icon: rendered.icon, // 使用渲染后的图标
        };

        // 验证 Calendar 事件数据结构
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

        // ========== 验证完成 ==========
        // 如果所有步骤都通过，说明 DSL → Data Model → Event 验证 → 显示流程正常工作
        expect(true).toBe(true); // 所有断言都通过
    });
});
