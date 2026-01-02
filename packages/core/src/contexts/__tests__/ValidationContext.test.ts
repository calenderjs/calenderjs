import { describe, it, expect } from "vitest";
import { ValidationContext } from "../ValidationContext";
import type { Event } from "@calenderjs/event-model";
import { User } from "../../models/User";

describe("ValidationContext", () => {
    describe("ValidationContext interface", () => {
        it("should create a valid ValidationContext with required fields", () => {
            const context: ValidationContext = {
                events: [],
                now: new Date("2024-12-30T10:00:00"),
            };

            expect(context.events).toEqual([]);
            expect(context.now).toBeInstanceOf(Date);
        });

        it("should create ValidationContext with user", () => {
            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const context: ValidationContext = {
                user,
                events: [],
                now: new Date("2024-12-30T10:00:00"),
            };

            expect(context.user).toBe(user);
            expect(context.user?.id).toBe("1");
            expect(context.user?.email).toBe("user@example.com");
        });

        it("should create ValidationContext with events", () => {
            const events: Event[] = [
                {
                    id: "1",
                    type: "meeting",
                    title: "Meeting 1",
                    startTime: new Date("2024-12-30T10:00:00"),
                    endTime: new Date("2024-12-30T11:00:00"),
                    data: {},
                },
                {
                    id: "2",
                    type: "meeting",
                    title: "Meeting 2",
                    startTime: new Date("2024-12-30T14:00:00"),
                    endTime: new Date("2024-12-30T15:00:00"),
                    data: {},
                },
            ];

            const context: ValidationContext = {
                events,
                now: new Date("2024-12-30T10:00:00"),
            };

            expect(context.events).toHaveLength(2);
            expect(context.events[0].id).toBe("1");
            expect(context.events[1].id).toBe("2");
        });

        it("should support extended properties", () => {
            const context: ValidationContext = {
                events: [],
                now: new Date("2024-12-30T10:00:00"),
                tenantId: "tenant1",
                locale: "zh-CN",
                timezone: "Asia/Shanghai",
            };

            expect(context.tenantId).toBe("tenant1");
            expect(context.locale).toBe("zh-CN");
            expect(context.timezone).toBe("Asia/Shanghai");
        });

        it("should handle empty events array", () => {
            const context: ValidationContext = {
                events: [],
                now: new Date("2024-12-30T10:00:00"),
            };

            expect(context.events).toEqual([]);
            expect(context.events.length).toBe(0);
        });
    });
});
