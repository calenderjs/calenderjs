/**
 * Calendar EventRuntime 集成测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import type { Event } from "@calenderjs/event-model";
import "../Calendar.wsx";
import Calendar from "../Calendar.wsx";

const MEETING_AST: EventTypeAST = {
    type: "meeting",
    name: "会议",
    fields: [
        {
            name: "attendees",
            type: { type: "list", itemType: "email" },
            required: true,
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
    behavior: [{ name: "editable", value: true }],
};

function createMeetingEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2024-01-15T10:00:00"),
        endTime: new Date("2024-01-15T11:00:00"),
        data: {
            attendees: ["a@example.com", "b@example.com"],
        },
        ...overrides,
    };
}

describe("Calendar EventRuntime 集成", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it("设置 eventRuntime 后应增强 displayEvents 标题", async () => {
        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([MEETING_AST]);
        const runtime = new EventRuntime(dataModel.types[0]);

        const calendar = document.createElement("wsx-calendar") as Calendar;
        calendar.eventRuntime = runtime;
        calendar.events = [createMeetingEvent()];
        container.appendChild(calendar);

        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(calendar.displayEvents[0].title).toBe("团队会议");
        expect(calendar.displayEvents[0].color).toBe("#4285f4");
        expect(calendar.displayEvents[0].icon).toBe("meeting");
    });

    it("无 Runtime 时 displayEvents 应等于原始 events", () => {
        const calendar = document.createElement("wsx-calendar") as Calendar;
        const events = [createMeetingEvent()];
        calendar.events = events;

        expect(calendar.displayEvents[0].id).toBe(events[0].id);
        expect(calendar.displayEvents[0].title).toBe(events[0].title);
    });

    it("proposeEventCreate 验证失败时应派发 event-create-error", () => {
        const compiler = new EventDSLCompiler();
        const astWithRule: EventTypeAST = {
            ...MEETING_AST,
            validate: [
                {
                    type: "Between",
                    field: {
                        type: "FieldAccess",
                        path: ["data", "attendees", "count"],
                    },
                    min: 3,
                    max: 50,
                },
            ],
        };
        const runtime = new EventRuntime(
            compiler.compileFromAST([astWithRule]).types[0]
        );

        const calendar = document.createElement("wsx-calendar") as Calendar;
        calendar.eventRuntime = runtime;
        container.appendChild(calendar);

        const errorHandler = vi.fn();
        calendar.addEventListener("event-create-error", errorHandler);

        const ok = calendar.proposeEventCreate(createMeetingEvent());

        expect(ok).toBe(false);
        expect(errorHandler).toHaveBeenCalled();
    });

    it("canPerformAction 应委托给 EventRuntime", () => {
        const compiler = new EventDSLCompiler();
        const runtime = new EventRuntime(
            compiler.compileFromAST([MEETING_AST]).types[0]
        );

        const calendar = document.createElement("wsx-calendar") as Calendar;
        calendar.eventRuntime = runtime;
        calendar.user = {
            id: "1",
            email: "user@example.com",
            role: "user",
        };

        expect(
            calendar.canPerformAction("editable", createMeetingEvent())
        ).toBe(true);
    });
});
