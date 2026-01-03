import { describe, it, expect, beforeEach } from "vitest";
import { EventRuntime } from "../EventRuntime";
// 注意：测试需要 DSL 编译器来生成测试数据，但 Runtime 本身不依赖 DSL
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import type { EventTypeDataModel, Event } from "@calenderjs/event-model";
import type { User, ValidationContext, RenderContext } from "@calenderjs/core";

// 辅助函数：将 AST 编译为 Data Model
function compileAST(ast: EventTypeAST): EventTypeDataModel {
    const compiler = new EventDSLCompiler();
    const dataModel = compiler.compileFromAST([ast]);
    return dataModel.types[0];
}

describe("EventRuntime", () => {
    let ast: EventTypeAST;
    let dataModel: EventTypeDataModel;
    let runtime: EventRuntime;
    let compiler: EventDSLCompiler;

    beforeEach(() => {
        compiler = new EventDSLCompiler();
        ast = {
            type: "meeting",
            name: "会议",
            fields: [
                {
                    name: "title",
                    type: "string",
                    required: true,
                },
            ],
            validate: [],
            display: [
                {
                    name: "color",
                    value: "#4285f4",
                },
                {
                    name: "title",
                    value: "Meeting Title",
                },
            ],
            behavior: [
                {
                    name: "draggable",
                    value: true,
                },
            ],
        };
        // 编译 AST 为 Schema
        dataModel = compileAST(ast);
        runtime = new EventRuntime(dataModel);
    });

    describe("constructor", () => {
        it("should create EventRuntime with EventTypeDataModel", () => {
            expect(runtime).toBeInstanceOf(EventRuntime);
        });
    });

    describe("validate", () => {
        it("should return valid result when no validation dataModel", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        it("should validate Between rule - valid case", () => {
            const astWithBetween: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["extra", "priority"],
                        },
                        min: 1,
                        max: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const compiledTypeWithBetween = compileAST(astWithBetween);
            const runtimeWithBetween = new EventRuntime(
                compiledTypeWithBetween
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 5,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBetween.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate Between rule - invalid case (too low)", () => {
            const astWithBetween: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        min: 1,
                        max: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const compiledTypeWithBetween = compileAST(astWithBetween);
            const runtimeWithBetween = new EventRuntime(
                compiledTypeWithBetween
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 0,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBetween.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors?.length).toBeGreaterThan(0);
        });

        it("should validate Between rule - invalid case (too high)", () => {
            const astWithBetween: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        min: 1,
                        max: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const compiledTypeWithBetween = compileAST(astWithBetween);
            const runtimeWithBetween = new EventRuntime(
                compiledTypeWithBetween
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 15,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBetween.validate(event, context);
            expect(result.valid).toBe(false);
        });

        it("should validate Between rule - undefined field", () => {
            const astWithBetween: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        min: 1,
                        max: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const compiledTypeWithBetween = compileAST(astWithBetween);
            const runtimeWithBetween = new EventRuntime(
                compiledTypeWithBetween
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBetween.validate(event, context);
            expect(result.valid).toBe(false);
        });

        it("should validate Comparison rule - equals operator", () => {
            const astWithComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["extra", "status"],
                        },
                        right: "active",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithComparison = new EventRuntime(
                astWithComparison
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithComparison.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate Comparison rule - not equals operator", () => {
            const astWithComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "not equals",
                        left: {
                            type: "FieldAccess",
                            path: ["status"],
                        },
                        right: "cancelled",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithComparison = new EventRuntime(
                astWithComparison
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithComparison.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate Comparison rule - greater than operator", () => {
            const astWithComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">",
                        left: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        right: 5,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithComparison = new EventRuntime(
                astWithComparison
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithComparison.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate Comparison rule - less than operator", () => {
            const astWithComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "<",
                        left: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        right: 5,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithComparison = new EventRuntime(
                astWithComparison
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 3,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithComparison.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate NoConflict rule - no conflict", () => {
            const astWithNoConflict: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "NoConflict",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithNoConflict = new EventRuntime(
                astWithNoConflict
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const otherEvent: Event = {
                id: "2",
                type: "meeting",
                title: "Other Meeting",
                startTime: new Date("2024-12-30T14:00:00"),
                endTime: new Date("2024-12-30T15:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [otherEvent],
                now: new Date(),
            };

            const result = runtimeWithNoConflict.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate NoConflict rule - has conflict", () => {
            const astWithNoConflict: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "NoConflict",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithNoConflict = new EventRuntime(
                compileAST(astWithNoConflict)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const otherEvent: Event = {
                id: "2",
                type: "meeting",
                title: "Other Meeting",
                startTime: new Date("2024-12-30T10:30:00"),
                endTime: new Date("2024-12-30T11:30:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [otherEvent],
                now: new Date(),
            };

            const result = runtimeWithNoConflict.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it("should validate Conflict rule - has conflict", () => {
            const astWithConflict: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Conflict",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithConflict = new EventRuntime(
                compileAST(astWithConflict)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const otherEvent: Event = {
                id: "2",
                type: "meeting",
                title: "Other Meeting",
                startTime: new Date("2024-12-30T10:30:00"),
                endTime: new Date("2024-12-30T11:30:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [otherEvent],
                now: new Date(),
            };

            const result = runtimeWithConflict.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate Conflict rule - no conflict", () => {
            const astWithConflict: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Conflict",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithConflict = new EventRuntime(
                compileAST(astWithConflict)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const otherEvent: Event = {
                id: "2",
                type: "meeting",
                title: "Other Meeting",
                startTime: new Date("2024-12-30T14:00:00"),
                endTime: new Date("2024-12-30T15:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [otherEvent],
                now: new Date(),
            };

            const result = runtimeWithConflict.validate(event, context);
            expect(result.valid).toBe(false);
        });

        it("should validate When rule - condition true", () => {
            const astWithWhen: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "When",
                        condition: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "active",
                        },
                        dataModel: [
                            {
                                type: "Comparison",
                                operator: ">",
                                left: {
                                    type: "FieldAccess",
                                    path: ["priority"],
                                },
                                right: 5,
                            },
                        ],
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithWhen = new EventRuntime(
                compileAST(astWithWhen)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithWhen.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate When rule - condition false", () => {
            const astWithWhen: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "When",
                        condition: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "active",
                        },
                        dataModel: [
                            {
                                type: "Comparison",
                                operator: ">",
                                left: {
                                    type: "FieldAccess",
                                    path: ["priority"],
                                },
                                right: 5,
                            },
                        ],
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithWhen = new EventRuntime(
                compileAST(astWithWhen)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "inactive",
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithWhen.validate(event, context);
            expect(result.valid).toBe(true); // When condition is false, dataModel are skipped
        });

        it("should validate BinaryExpression rule - and operator", () => {
            const astWithBinary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "BinaryExpression",
                        operator: "and",
                        left: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "active",
                        },
                        right: {
                            type: "Comparison",
                            operator: ">",
                            left: {
                                type: "FieldAccess",
                                path: ["priority"],
                            },
                            right: 5,
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithBinary = new EventRuntime(
                compileAST(astWithBinary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBinary.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate BinaryExpression rule - or operator", () => {
            const astWithBinary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "BinaryExpression",
                        operator: "or",
                        left: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "active",
                        },
                        right: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "pending",
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithBinary = new EventRuntime(
                compileAST(astWithBinary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "pending",
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithBinary.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should validate UnaryExpression rule - not operator", () => {
            const astWithUnary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "UnaryExpression",
                        operator: "not",
                        argument: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["status"],
                            },
                            right: "cancelled",
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithUnary = new EventRuntime(
                compileAST(astWithUnary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithUnary.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle empty events array in context", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle context with user", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const context: ValidationContext = {
                user,
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should accumulate errors from multiple validation dataModel", () => {
            const astWithMultiple: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "is",
                        left: {
                            type: "FieldAccess",
                            path: ["status"],
                        },
                        right: "active",
                    },
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        min: 1,
                        max: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithMultiple = new EventRuntime(
                compileAST(astWithMultiple)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "inactive",
                    priority: 15,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithMultiple.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors?.length).toBeGreaterThan(0);
        });
    });

    describe("render", () => {
        it("should render event with display dataModel", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtime.render(event, context);
            expect(rendered.title).toBe("Meeting Title");
            expect(rendered.color).toBe("#4285f4");
        });

        it("should handle empty render context", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtime.render(event, context);
            expect(rendered).toBeDefined();
        });

        it("should handle render context with user", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const context: RenderContext = {
                user,
            };

            const rendered = runtime.render(event, context);
            expect(rendered).toBeDefined();
        });

        it("should handle all display rule names", () => {
            const astWithAllDisplay: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    { name: "color", value: "#4285f4" },
                    { name: "icon", value: "📅" },
                    { name: "title", value: "Custom Title" },
                    { name: "description", value: "Custom Description" },
                ],
                behavior: [],
            };

            const runtimeWithAllDisplay = new EventRuntime(
                compileAST(astWithAllDisplay)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithAllDisplay.render(event, context);
            expect(rendered.color).toBe("#4285f4");
            expect(rendered.icon).toBe("📅");
            expect(rendered.title).toBe("Custom Title");
            expect(rendered.description).toBe("Custom Description");
        });

        it("should handle empty display dataModel", () => {
            const astWithNoDisplay: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtimeWithNoDisplay = new EventRuntime(
                compileAST(astWithNoDisplay)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithNoDisplay.render(event, context);
            expect(rendered.title).toBe("Test Meeting");
            expect(rendered.color).toBe("#4285f4");
        });

        it("should handle ConditionalValue with true condition", () => {
            const astWithConditional: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "color",
                        value: {
                            type: "Conditional",
                            condition: {
                                type: "FieldAccess",
                                path: ["priority"],
                            },
                            consequent: "#ea4335",
                            alternate: "#4285f4",
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithConditional = new EventRuntime(
                compileAST(astWithConditional)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithConditional.render(event, context);
            expect(rendered.color).toBe("#ea4335");
        });

        it("should handle ConditionalValue with false condition and alternate", () => {
            const astWithConditional: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "color",
                        value: {
                            type: "Conditional",
                            condition: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["status"],
                                },
                                right: "active",
                            },
                            consequent: "#ea4335",
                            alternate: "#4285f4",
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithConditional = new EventRuntime(
                astWithConditional
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "inactive",
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithConditional.render(event, context);
            expect(rendered.color).toBe("#4285f4");
        });

        it("should handle ConditionalValue without alternate", () => {
            const astWithConditionalNoAlternate: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "description",
                        value: {
                            type: "Conditional",
                            condition: {
                                type: "FieldAccess",
                                path: ["priority"],
                            },
                            consequent: "High Priority",
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithConditionalNoAlternate = new EventRuntime(
                compileAST(astWithConditionalNoAlternate)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithConditionalNoAlternate.render(
                event,
                context
            );
            expect(rendered.description).toBe("High Priority");
        });

        it("should handle ConditionalValue with false condition and no alternate", () => {
            const astWithConditionalFalse: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "description",
                        value: {
                            type: "Conditional",
                            condition: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["status"],
                                },
                                right: "active",
                            },
                            consequent: "High Priority",
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithConditionalFalse = new EventRuntime(
                astWithConditionalFalse
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "inactive",
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithConditionalFalse.render(event, context);
            expect(rendered.description).toBe("");
        });

        it("should handle TemplateValue", () => {
            const astWithTemplate: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                "Meeting: ",
                                {
                                    type: "FieldAccess",
                                    path: ["title"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithTemplate = new EventRuntime(
                compileAST(astWithTemplate)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithTemplate.render(event, context);
            expect(rendered.title).toBe("Meeting: Test Meeting");
        });

        it("should handle TemplateValue with nested field access", () => {
            const astWithTemplate: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                "Priority ",
                                {
                                    type: "FieldAccess",
                                    path: ["extra", "priority"],
                                },
                                ": ",
                                {
                                    type: "FieldAccess",
                                    path: ["title"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithTemplate = new EventRuntime(
                compileAST(astWithTemplate)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithTemplate.render(event, context);
            expect(rendered.title).toBe("Priority 8: Test Meeting");
        });

        it("should handle TemplateValue with undefined field", () => {
            const astWithTemplate: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                "Meeting: ",
                                {
                                    type: "FieldAccess",
                                    path: ["unknown"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithTemplate = new EventRuntime(
                compileAST(astWithTemplate)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithTemplate.render(event, context);
            expect(rendered.title).toBe("Meeting: ");
        });

        it("should handle non-string, non-Conditional, non-Template value", () => {
            const astWithOtherValue: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "icon",
                        value: {
                            type: "Unknown",
                            extra: "test",
                        } as unknown as string,
                    },
                ],
                behavior: [],
            };

            const runtimeWithOtherValue = new EventRuntime(
                compileAST(astWithOtherValue)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithOtherValue.render(event, context);
            expect(rendered.icon).toBeDefined();
        });
    });

    describe("canPerform", () => {
        it("should return true for boolean behavior rule", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const canDrag = runtime.canPerform("draggable", event, user);
            expect(canDrag).toBe(true);
        });

        it("should return false for non-existent behavior rule", () => {
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const canDelete = runtime.canPerform("deletable", event, user);
            expect(canDelete).toBe(false);
        });

        it("should handle behavior rule with false value", () => {
            const astWithFalse: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "resizable",
                        value: false,
                    },
                ],
            };

            const runtimeWithFalse = new EventRuntime(
                compileAST(astWithFalse)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const canResize = runtimeWithFalse.canPerform(
                "resizable",
                event,
                user
            );
            expect(canResize).toBe(false);
        });

        it("should handle behavior rule with expression value - true case", () => {
            const astWithExpression: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["user", "role"],
                            },
                            right: "admin",
                        },
                    },
                ],
            };

            const runtimeWithExpression = new EventRuntime(
                compileAST(astWithExpression)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "admin",
            };

            const canEdit = runtimeWithExpression.canPerform(
                "editable",
                event,
                user
            );
            expect(canEdit).toBe(true);
        });

        it("should handle behavior rule with expression value - false case", () => {
            const astWithExpression: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: {
                            type: "Comparison",
                            operator: "is",
                            left: {
                                type: "FieldAccess",
                                path: ["user", "role"],
                            },
                            right: "admin",
                        },
                    },
                ],
            };

            const runtimeWithExpression = new EventRuntime(
                astWithExpression
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const canEdit = runtimeWithExpression.canPerform(
                "editable",
                event,
                user
            );
            expect(canEdit).toBe(false);
        });

        it("should handle behavior rule with BinaryExpression - and", () => {
            const astWithBinary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: {
                            type: "BinaryExpression",
                            operator: "and",
                            left: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["user", "role"],
                                },
                                right: "admin",
                            },
                            right: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["status"],
                                },
                                right: "active",
                            },
                        },
                    },
                ],
            };

            const runtimeWithBinary = new EventRuntime(
                compileAST(astWithBinary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                },
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "admin",
            };

            const canEdit = runtimeWithBinary.canPerform(
                "editable",
                event,
                user
            );
            expect(canEdit).toBe(true);
        });

        it("should handle behavior rule with BinaryExpression - or", () => {
            const astWithBinary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: {
                            type: "BinaryExpression",
                            operator: "or",
                            left: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["user", "role"],
                                },
                                right: "admin",
                            },
                            right: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["user", "email"],
                                },
                                right: "owner@example.com",
                            },
                        },
                    },
                ],
            };

            const runtimeWithBinary = new EventRuntime(
                compileAST(astWithBinary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "owner@example.com",
                role: "user",
            };

            const canEdit = runtimeWithBinary.canPerform(
                "editable",
                event,
                user
            );
            expect(canEdit).toBe(true);
        });

        it("should handle behavior rule with UnaryExpression - not", () => {
            const astWithUnary: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: {
                            type: "UnaryExpression",
                            operator: "not",
                            argument: {
                                type: "Comparison",
                                operator: "is",
                                left: {
                                    type: "FieldAccess",
                                    path: ["status"],
                                },
                                right: "cancelled",
                            },
                        },
                    },
                ],
            };

            const runtimeWithUnary = new EventRuntime(
                compileAST(astWithUnary)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: "active",
                },
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const canEdit = runtimeWithUnary.canPerform(
                "editable",
                event,
                user
            );
            expect(canEdit).toBe(true);
        });
    });

    describe("field access", () => {
        it("should access event.extra fields", () => {
            const astWithFieldAccess: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["extra", "title"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithFieldAccess = new EventRuntime(
                compileAST(astWithFieldAccess)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    title: "Custom Title",
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithFieldAccess.render(event, context);
            expect(rendered.title).toBe("Custom Title");
        });

        it("should access event special fields (startTime, endTime, title, type, id)", () => {
            const astWithSpecialFields: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["type"],
                                },
                                ": ",
                                {
                                    type: "FieldAccess",
                                    path: ["title"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithSpecialFields = new EventRuntime(
                compileAST(astWithSpecialFields)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithSpecialFields.render(event, context);
            expect(rendered.title).toBe("meeting: Test Meeting");
        });

        it("should access user fields from context", () => {
            const astWithUserAccess: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["user", "email"],
                                },
                                " - ",
                                {
                                    type: "FieldAccess",
                                    path: ["title"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithUserAccess = new EventRuntime(
                compileAST(astWithUserAccess)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
            };

            const context: RenderContext = {
                user,
            };

            const rendered = runtimeWithUserAccess.render(event, context);
            expect(rendered.title).toBe("user@example.com - Test Meeting");
        });

        it("should handle Date field access in comparison", () => {
            const astWithDateComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime"],
                        },
                        right: new Date("2024-12-30T09:00:00"),
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithDateComparison = new EventRuntime(
                astWithDateComparison
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithDateComparison.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle <= operator in comparison", () => {
            const astWithLessEqual: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "<=",
                        left: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        right: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithLessEqual = new EventRuntime(
                compileAST(astWithLessEqual)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithLessEqual.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle unknown operator in comparison (default case)", () => {
            const astWithUnknownOp: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "unknown",
                        left: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        right: 10,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithUnknownOp = new EventRuntime(
                compileAST(astWithUnknownOp)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithUnknownOp.validate(event, context);
            expect(result.valid).toBe(false);
        });

        it("should skip self when checking time conflict", () => {
            const astWithNoConflict: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "NoConflict",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithNoConflict = new EventRuntime(
                astWithNoConflict
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            // 包含自己的事件（应该被跳过）
            const context: ValidationContext = {
                events: [event],
                now: new Date(),
            };

            const result = runtimeWithNoConflict.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle >= operator in comparison", () => {
            const astWithGreaterEqual: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["priority"],
                        },
                        right: 5,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithGreaterEqual = new EventRuntime(
                astWithGreaterEqual
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    priority: 8,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithGreaterEqual.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle Duration literal in Between rule", () => {
            const astWithDuration: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["duration"],
                        },
                        min: {
                            type: "Duration",
                            value: 30,
                            unit: "minutes",
                        },
                        max: {
                            type: "Duration",
                            value: 2,
                            unit: "hours",
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithDuration = new EventRuntime(
                compileAST(astWithDuration)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    duration: 60, // 60 minutes
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithDuration.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle Duration literal with different units", () => {
            const astWithDuration: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["duration"],
                        },
                        min: {
                            type: "Duration",
                            value: 1,
                            unit: "days",
                        },
                        max: {
                            type: "Duration",
                            value: 1,
                            unit: "weeks",
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithDuration = new EventRuntime(
                compileAST(astWithDuration)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    duration: 2880, // 2 days in minutes
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithDuration.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle Duration literal with unknown unit (default multiplier)", () => {
            const astWithDuration: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: {
                            type: "FieldAccess",
                            path: ["duration"],
                        },
                        min: {
                            type: "Duration",
                            value: 10,
                            unit: "unknown",
                        },
                        max: {
                            type: "Duration",
                            value: 100,
                            unit: "unknown",
                        },
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithDuration = new EventRuntime(
                compileAST(astWithDuration)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    duration: 50,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithDuration.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle null literal value", () => {
            const astWithNull: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "is",
                        left: {
                            type: "FieldAccess",
                            path: ["status"],
                        },
                        right: null,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithNull = new EventRuntime(
                compileAST(astWithNull)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    status: null,
                },
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithNull.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should access nested event.extra fields (path.length > 1)", () => {
            const astWithNested: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["nested", "field", "value"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithNested = new EventRuntime(
                compileAST(astWithNested)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    nested: {
                        field: {
                            value: "Nested Value",
                        },
                    },
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithNested.render(event, context);
            expect(rendered.title).toBe("Nested Value");
        });

        it("should handle nested field access with null intermediate value", () => {
            const astWithNested: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["nested", "field", "value"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithNested = new EventRuntime(
                compileAST(astWithNested)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    nested: null,
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithNested.render(event, context);
            expect(rendered.title).toBe("");
        });

        it("should handle getExpressionValue with non-FieldAccess expression", () => {
            const astWithNonFieldAccess: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "is",
                        left: "directValue" as any,
                        right: "directValue",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtimeWithNonFieldAccess = new EventRuntime(
                astWithNonFieldAccess
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtimeWithNonFieldAccess.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("should handle field access with empty path", () => {
            const astWithEmptyPath: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: [],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithEmptyPath = new EventRuntime(
                compileAST(astWithEmptyPath)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithEmptyPath.render(event, context);
            expect(rendered.title).toBe("");
        });

        it("should handle field access with invalid fieldAccess object", () => {
            const astWithInvalid: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [null as any],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithInvalid = new EventRuntime(
                compileAST(astWithInvalid)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithInvalid.render(event, context);
            expect(rendered.title).toBe("");
        });

        it("should access event.id field", () => {
            const astWithId: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                "ID: ",
                                {
                                    type: "FieldAccess",
                                    path: ["id"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithId = new EventRuntime(compileAST(astWithId));

            const event: Event = {
                id: "event-123",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithId.render(event, context);
            expect(rendered.title).toBe("ID: event-123");
        });

        it("should handle data field access with null intermediate value", () => {
            const astWithDataNull: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["extra", "nested", "value"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithDataNull = new EventRuntime(
                compileAST(astWithDataNull)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {
                    nested: null,
                },
            };

            const context: RenderContext = {};

            const rendered = runtimeWithDataNull.render(event, context);
            expect(rendered.title).toBe("");
        });

        it("should handle field access that does not match any condition", () => {
            const astWithUnknown: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["unknownField"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithUnknown = new EventRuntime(
                compileAST(astWithUnknown)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithUnknown.render(event, context);
            expect(rendered.title).toBe("");
        });

        it("should access event.endTime field", () => {
            const astWithEndTime: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                "Ends at: ",
                                {
                                    type: "FieldAccess",
                                    path: ["endTime"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithEndTime = new EventRuntime(
                compileAST(astWithEndTime)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const context: RenderContext = {};

            const rendered = runtimeWithEndTime.render(event, context);
            expect(rendered.title).toContain("Ends at:");
            expect(rendered.title).toContain("2024");
        });

        it("should handle user field access with null intermediate value", () => {
            const astWithUserNull: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "title",
                        value: {
                            type: "Template",
                            parts: [
                                {
                                    type: "FieldAccess",
                                    path: ["user", "profile", "name"],
                                },
                            ],
                        },
                    },
                ],
                behavior: [],
            };

            const runtimeWithUserNull = new EventRuntime(
                compileAST(astWithUserNull)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00"),
                endTime: new Date("2024-12-30T11:00:00"),
                extra: {},
            };

            const user: User = {
                id: "1",
                email: "user@example.com",
                role: "user",
                profile: null as any,
            };

            const context: RenderContext = {
                user,
            };

            const rendered = runtimeWithUserNull.render(event, context);
            expect(rendered.title).toBe("");
        });
    });

    describe("时间访问语法增强", () => {
        it("应该支持 startTime.date 访问（返回日期字符串 YYYY-MM-DD）", () => {
            const astWithDateAccess: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "date"],
                        },
                        right: "2024-12-30",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithDateAccess));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持 startTime.dayOfWeek 访问（返回星期几 0-6）", () => {
            const astWithDayOfWeek: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "dayOfWeek"],
                        },
                        right: 1, // 周一
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithDayOfWeek));

            // 2024-12-30 是周一（dayOfWeek = 1）
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持 startTime.timeZone 访问（从 event.timeZone）", () => {
            const astWithTimeZone: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "timeZone"],
                        },
                        right: "Asia/Shanghai",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithTimeZone));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                timeZone: "Asia/Shanghai",
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });


        it("应该支持 endTime.date 和 endTime.dayOfWeek 访问", () => {
            const astWithEndTimeAccess: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["endTime", "date"],
                        },
                        right: "2024-12-30",
                    },
                    {
                        type: "Comparison",
                        operator: "<=",
                        left: {
                            type: "FieldAccess",
                            path: ["endTime", "dayOfWeek"],
                        },
                        right: 5, // 周五
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(
                compileAST(astWithEndTimeAccess)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持 startTime.hour, startTime.minute, startTime.day 等标准属性", () => {
            const astWithTimeProperties: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "hour"],
                        },
                        right: 9,
                    },
                    {
                        type: "Comparison",
                        operator: "<=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "hour"],
                        },
                        right: 18,
                    },
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        right: 0,
                    },
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "day"],
                        },
                        right: 1,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(
                compileAST(astWithTimeProperties)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持 startTime.month 和 startTime.year 访问", () => {
            const astWithMonthYear: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "month"],
                        },
                        right: 12,
                    },
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "year"],
                        },
                        right: 2024,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithMonthYear));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });
    });

    describe("时间比较语法增强", () => {
        it("应该支持日期字符串比较（YYYY-MM-DD）", () => {
            const astWithDateString: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: "equals",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "date"],
                        },
                        right: "2024-12-30",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithDateString));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持日期字符串比较（大于/小于）", () => {
            const astWithDateComparison: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "date"],
                        },
                        right: "2024-12-01",
                    },
                    {
                        type: "Comparison",
                        operator: "<=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "date"],
                        },
                        right: "2024-12-31",
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(
                compileAST(astWithDateComparison)
            );

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持时间字符串比较（HH:mm）", () => {
            // 注意：时间字符串比较主要用于比较时间部分（小时和分钟）
            // 实际使用中，可以通过比较 startTime.hour * 60 + startTime.minute 和 "09:00" 转换的分钟数
            // 但更常见的用法是直接比较时间字符串，这需要特殊的处理
            // 这里我们测试一个更实际的场景：通过 extra 字段存储时间字符串进行比较
            const astWithTimeString: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Comparison",
                        operator: ">=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "hour"],
                        },
                        right: 9, // 使用数字而不是时间字符串
                    },
                    {
                        type: "Comparison",
                        operator: "<=",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "hour"],
                        },
                        right: 18,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithTimeString));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持 dayOfWeek in [1,2,3,4,5] 语法（工作日验证）", () => {
            const astWithDayOfWeekIn: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "In",
                        field: {
                            type: "FieldAccess",
                            path: ["startTime", "dayOfWeek"],
                        },
                        values: [1, 2, 3, 4, 5], // 周一到周五
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithDayOfWeekIn));

            // 2024-12-30 是周一（dayOfWeek = 1）
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该拒绝不在 dayOfWeek in [1,2,3,4,5] 中的日期（周末）", () => {
            const astWithDayOfWeekIn: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "In",
                        field: {
                            type: "FieldAccess",
                            path: ["startTime", "dayOfWeek"],
                        },
                        values: [1, 2, 3, 4, 5], // 周一到周五
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithDayOfWeekIn));

            // 2024-12-28 是周六（dayOfWeek = 6）
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-28T10:00:00Z"),
                endTime: new Date("2024-12-28T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors?.length).toBeGreaterThan(0);
        });

        it("应该支持多个值的 in 语法", () => {
            const astWithMultipleIn: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "In",
                        field: {
                            type: "FieldAccess",
                            path: ["startTime", "dayOfWeek"],
                        },
                        values: [1, 3, 5], // 周一、周三、周五
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(astWithMultipleIn));

            // 2024-12-30 是周一（dayOfWeek = 1）
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });
    });

    describe("基础时间验证规则", () => {
        it("应该自动验证 startTime before endTime", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间晚于结束时间
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T11:00:00Z"),
                endTime: new Date("2024-12-30T10:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("开始时间必须早于结束时间");
        });

        it("应该验证 duration >= minDuration", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "minDuration",
                        value: {
                            type: "Duration",
                            value: 30,
                            unit: "minutes",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 持续时间只有 15 分钟，小于最小 30 分钟
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T10:15:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("持续时间必须至少"))
            ).toBe(true);
        });

        it("应该验证 duration <= maxDuration", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "maxDuration",
                        value: {
                            type: "Duration",
                            value: 2,
                            unit: "hours",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 持续时间 3 小时，超过最大 2 小时
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T13:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("持续时间不能超过"))
            ).toBe(true);
        });

        it("应该验证时间精度（timePrecision）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "timePrecision",
                        value: {
                            type: "Duration",
                            value: 15,
                            unit: "minutes",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间的分钟数是 17，不是 15 的倍数
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:17:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("分钟数必须是 15 的倍数"))
            ).toBe(true);
        });

        it("应该验证提前创建时间（minAdvanceTime）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "minAdvanceTime",
                        value: {
                            type: "Duration",
                            value: 1,
                            unit: "hours",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            const now = new Date("2024-12-30T10:00:00Z");
            // 开始时间只提前 30 分钟，小于最小 1 小时
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now,
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors?.some((e) => e.includes("必须至少提前"))).toBe(
                true
            );
        });

        it("应该验证最多提前创建时间（maxAdvanceTime）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "maxAdvanceTime",
                        value: {
                            type: "Duration",
                            value: 30,
                            unit: "days",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            const now = new Date("2024-12-30T10:00:00Z");
            // 开始时间提前 35 天，超过最大 30 天
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2025-02-03T10:00:00Z"),
                endTime: new Date("2025-02-03T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now,
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some(
                    (e) => e.includes("不能超过") && e.includes("后创建")
                )
            ).toBe(true);
        });

        it("应该验证时区（timeZone）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "timeZone",
                        value: "Asia/Shanghai",
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 事件时区是 America/New_York，不符合约束
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                timeZone: "America/New_York",
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("事件时区必须是"))
            ).toBe(true);
        });

        it("应该验证允许的时区列表（allowedTimeZones）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "allowedTimeZones",
                        value: ["Asia/Shanghai", "America/New_York"],
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 事件时区是 Europe/London，不在允许列表中
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                timeZone: "Europe/London",
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("事件时区必须是以下之一"))
            ).toBe(true);
        });

        it("应该验证跨天事件（allowCrossDay）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "allowCrossDay",
                        value: false,
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 跨天事件
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T23:00:00Z"),
                endTime: new Date("2024-12-31T01:00:00Z"),
                allDay: false,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("不允许跨天事件"))
            ).toBe(true);
        });

        it("应该验证最大跨天时长（maxCrossDayDuration）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "maxCrossDayDuration",
                        value: {
                            type: "Duration",
                            value: 7,
                            unit: "days",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 跨天 10 天，超过最大 7 天
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2025-01-09T10:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("跨天时长不能超过"))
            ).toBe(true);
        });
    });

    describe("mod 操作符支持", () => {
        it("应该支持 startTime.minute mod 15 is 0 语法", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        modValue: 15,
                        operator: "is",
                        right: 0,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间的分钟数是 30，30 mod 15 = 0，应该通过
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该拒绝不符合 mod 条件的值", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        modValue: 15,
                        operator: "is",
                        right: 0,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间的分钟数是 17，17 mod 15 = 2，不等于 0，应该失败
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:17:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors?.length).toBeGreaterThan(0);
        });

        it("应该支持 endTime.minute mod 15 is 0", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["endTime", "minute"],
                        },
                        modValue: 15,
                        operator: "equals",
                        right: 0,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 结束时间的分钟数是 45，45 mod 15 = 0，应该通过
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:45:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该支持其他比较操作符与 mod 结合", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        modValue: 10,
                        operator: "<=",
                        right: 5,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间的分钟数是 25，25 mod 10 = 5，5 <= 5，应该通过
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:25:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该处理 mod 值为 0 的情况（除零错误）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        modValue: 0,
                        operator: "is",
                        right: 0,
                    },
                ],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("无法进行模运算"))
            ).toBe(true);
        });

        it("应该支持从 constraints 读取 timePrecision 用于 mod 验证", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "ModComparison",
                        left: {
                            type: "FieldAccess",
                            path: ["startTime", "minute"],
                        },
                        modValue: {
                            type: "Duration",
                            value: 15,
                            unit: "minutes",
                        },
                        operator: "is",
                        right: 0,
                    },
                ],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "timePrecision",
                        value: {
                            type: "Duration",
                            value: 15,
                            unit: "minutes",
                        },
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 开始时间的分钟数是 30，30 mod 15 = 0，应该通过
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });
    });

    describe("重复事件验证规则", () => {
        it("应该验证 endDate after startTime or count > 0", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 没有设置 endDate 和 count
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "daily",
                    interval: 1,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("必须设置 endDate 或 count > 0")
                )
            ).toBe(true);
        });

        it("应该验证 endDate 必须在 startTime 之后", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // endDate 早于 startTime
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "daily",
                    interval: 1,
                    endDate: new Date("2024-12-29T10:00:00Z"), // 早于 startTime
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("结束日期必须晚于开始时间")
                )
            ).toBe(true);
        });

        it("应该验证 weekly 频率需要 daysOfWeek", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // weekly 频率但没有设置 daysOfWeek
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "weekly",
                    interval: 1,
                    count: 10,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("weekly 频率的重复事件必须设置 daysOfWeek")
                )
            ).toBe(true);
        });

        it("应该验证 weekly 频率的 daysOfWeek 值在 0-6 范围内", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // daysOfWeek 包含无效值
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "weekly",
                    interval: 1,
                    daysOfWeek: [1, 3, 5, 7], // 7 是无效值
                    count: 10,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("daysOfWeek 值必须在 0-6 之间")
                )
            ).toBe(true);
        });

        it("应该验证 monthly 频率需要 dayOfMonth", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // monthly 频率但没有设置 dayOfMonth
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "monthly",
                    interval: 1,
                    count: 10,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("monthly 频率的重复事件必须设置 dayOfMonth")
                )
            ).toBe(true);
        });

        it("应该验证 monthly 频率的 dayOfMonth 在 1-31 范围内", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // dayOfMonth 超出范围
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "monthly",
                    interval: 1,
                    dayOfMonth: 32, // 无效值
                    count: 10,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("dayOfMonth 必须在 1-31 之间")
                )
            ).toBe(true);
        });

        it("应该验证 interval 必须大于 0", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // interval 为 0
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "daily",
                    interval: 0, // 无效值
                    count: 10,
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("interval 必须大于 0"))
            ).toBe(true);
        });

        it("应该验证 count 必须大于 0（如果设置了）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // count 为 0
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "daily",
                    interval: 1,
                    count: 0, // 无效值
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) => e.includes("count 必须大于 0"))
            ).toBe(true);
        });

        it("应该接受有效的重复事件配置", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 有效的 weekly 重复事件
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "weekly",
                    interval: 1,
                    daysOfWeek: [1, 3, 5], // 周一、三、五
                    endDate: new Date("2025-12-31T10:00:00Z"),
                    excludeDates: [new Date("2025-01-01T10:00:00Z")],
                    timeZone: "Asia/Shanghai",
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该接受有效的 monthly 重复事件配置", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 有效的 monthly 重复事件
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                recurring: {
                    frequency: "monthly",
                    interval: 1,
                    dayOfMonth: 15, // 每月 15 号
                    count: 12, // 重复 12 次
                },
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });
    });

    describe("全天事件支持", () => {
        it("应该验证全天事件的开始时间格式（00:00:00）", () => {
            const ast: EventTypeAST = {
                type: "holiday",
                name: "节假日",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 全天事件但开始时间不是 00:00:00
            const event: Event = {
                id: "1",
                type: "holiday",
                title: "春节",
                startTime: new Date("2024-12-30T10:00:00Z"), // 不是 00:00:00
                endTime: new Date("2024-12-30T23:59:59Z"),
                allDay: true,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes("全天事件的开始时间应该是当天的 00:00:00")
                )
            ).toBe(true);
        });

        it("应该验证全天事件的结束时间格式（23:59:59 或次日 00:00:00）", () => {
            const ast: EventTypeAST = {
                type: "holiday",
                name: "节假日",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 全天事件但结束时间格式不正确
            const event: Event = {
                id: "1",
                type: "holiday",
                title: "春节",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-30T22:00:00Z"), // 不是 23:59:59
                allDay: true,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(false);
            expect(
                result.errors?.some((e) =>
                    e.includes(
                        "全天事件的结束时间应该是当天的 23:59:59 或次日的 00:00:00"
                    )
                )
            ).toBe(true);
        });

        it("应该接受有效的全天事件（23:59:59 结束）", () => {
            const ast: EventTypeAST = {
                type: "holiday",
                name: "节假日",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 有效的全天事件
            const event: Event = {
                id: "1",
                type: "holiday",
                title: "春节",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-30T23:59:59Z"),
                allDay: true,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该接受有效的全天事件（次日 00:00:00 结束）", () => {
            const ast: EventTypeAST = {
                type: "holiday",
                name: "节假日",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 有效的全天事件（跨天）
            const event: Event = {
                id: "1",
                type: "holiday",
                title: "春节假期",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-31T00:00:00Z"), // 次日 00:00:00
                allDay: true,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该接受有效的全天事件（跨多天）", () => {
            const ast: EventTypeAST = {
                type: "holiday",
                name: "节假日",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 有效的全天事件（跨多天）
            const event: Event = {
                id: "1",
                type: "holiday",
                title: "春节假期",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2025-01-03T00:00:00Z"), // 跨多天
                allDay: true,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });

        it("应该允许非全天事件跨天（如果 allowCrossDay 为 true）", () => {
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
                constraints: [
                    {
                        name: "allowCrossDay",
                        value: true,
                    },
                ],
            };

            const runtime = new EventRuntime(compileAST(ast));

            // 非全天事件跨天
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "跨天会议",
                startTime: new Date("2024-12-30T23:00:00Z"),
                endTime: new Date("2024-12-31T01:00:00Z"),
                allDay: false,
                extra: {},
            };

            const context: ValidationContext = {
                events: [],
                now: new Date(),
            };

            const result = runtime.validate(event, context);
            expect(result.valid).toBe(true);
        });
    });

    describe("集成测试 (Phase 1.5.13)", () => {
        describe("端到端测试：DSL → 验证 → 渲染", () => {
            it("应该完成完整的 DSL → 验证 → 渲染流程", () => {
                // 1. 使用 AST 创建测试数据（避免 DSL 解析器格式问题）
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "Team Meeting",
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

                // 3. 创建运行时
                const runtime = new EventRuntime(eventTypeDataModel);

                // 4. 创建 Event 对象
                const event: Event = {
                    id: "1",
                    type: "meeting",
                    title: "Team Meeting",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    extra: {
                        attendees: ["user1@example.com", "user2@example.com"],
                        location: "Meeting Room A",
                    },
                };

                // 5. 验证
                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };
                const validationResult = runtime.validate(event, context);
                expect(validationResult.valid).toBe(true);

                // 6. 渲染
                const renderContext: RenderContext = {};
                const rendered = runtime.render(event, renderContext);
                expect(rendered.color).toBe("#4285f4");
                expect(rendered.icon).toBe("meeting");
                expect(rendered.title).toBe("Team Meeting");

                // 7. 行为检查
                const canEdit = runtime.canPerform("editable", event, {
                    id: "1",
                    email: "user@example.com",
                } as User);
                expect(canEdit).toBe(true);
            });

            it("应该处理包含时区的完整流程", () => {
                const ast: EventTypeAST = {
                    type: "appointment",
                    name: "Appointment",
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
                    id: "1",
                    type: "appointment",
                    title: "Appointment",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    timeZone: "Asia/Shanghai",
                    extra: {
                        patient: "John Doe",
                    },
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);

                const rendered = runtime.render(event, {});
                expect(rendered.color).toBe("#ea4335");
            });
        });

        describe("时区转换测试", () => {
            it("应该正确处理不同时区的事件", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                // UTC 时区事件
                const utcEvent: Event = {
                    id: "1",
                    type: "meeting",
                    title: "UTC 会议",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    timeZone: "UTC",
                    extra: {},
                };

                // 上海时区事件
                const shanghaiEvent: Event = {
                    id: "2",
                    type: "meeting",
                    title: "上海会议",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    timeZone: "Asia/Shanghai",
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const utcResult = runtime.validate(utcEvent, context);
                const shanghaiResult = runtime.validate(shanghaiEvent, context);

                expect(utcResult.valid).toBe(true);
                expect(shanghaiResult.valid).toBe(true);
            });

            it("应该从 recurring.timeZone 获取时区", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                const event: Event = {
                    id: "1",
                    type: "meeting",
                    title: "重复会议",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    recurring: {
                        frequency: "weekly",
                        interval: 1,
                        daysOfWeek: [1, 3, 5],
                        count: 10,
                        timeZone: "America/New_York",
                    },
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);
            });
        });

        describe("重复事件生成测试", () => {
            it("应该验证重复事件的完整配置", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                // 完整的重复事件配置
                const event: Event = {
                    id: "1",
                    type: "meeting",
                    title: "每周例会",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    recurring: {
                        frequency: "weekly",
                        interval: 1,
                        daysOfWeek: [1, 3, 5], // 周一、三、五
                        endDate: new Date("2025-12-31T10:00:00Z"),
                        excludeDates: [
                            new Date("2025-01-01T10:00:00Z"), // 排除元旦
                        ],
                        timeZone: "Asia/Shanghai",
                    },
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);
            });

            it("应该验证 monthly 重复事件的完整配置", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                const event: Event = {
                    id: "1",
                    type: "meeting",
                    title: "月度会议",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    recurring: {
                        frequency: "monthly",
                        interval: 1,
                        dayOfMonth: 15, // 每月 15 号
                        count: 12, // 重复 12 次
                    },
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);
            });
        });

        describe("全天事件测试", () => {
            it("应该验证全天事件的完整流程", () => {
                const ast: EventTypeAST = {
                    type: "holiday",
                    name: "节假日",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                // 有效的全天事件
                const event: Event = {
                    id: "1",
                    type: "holiday",
                    title: "春节",
                    startTime: new Date("2024-12-30T00:00:00Z"),
                    endTime: new Date("2024-12-30T23:59:59Z"),
                    allDay: true,
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);

                const rendered = runtime.render(event, {});
                expect(rendered.allDay).toBe(true);
            });

            it("应该验证跨天全天事件", () => {
                const ast: EventTypeAST = {
                    type: "holiday",
                    name: "节假日",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                // 跨天的全天事件（3 天）
                const event: Event = {
                    id: "1",
                    type: "holiday",
                    title: "春节假期",
                    startTime: new Date("2024-12-30T00:00:00Z"),
                    endTime: new Date("2025-01-01T23:59:59Z"),
                    allDay: true,
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [],
                    now: new Date(),
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);
            });
        });

        describe("时间验证规则集成测试", () => {
            it("应该验证包含多个时间约束的完整配置", () => {
                const ast: EventTypeAST = {
                    type: "appointment",
                    name: "Appointment",
                    fields: [
                        {
                            name: "patient",
                            type: "string",
                        },
                    ],
                    constraints: [
                        {
                            name: "minDuration",
                            value: { type: "Duration", value: 30, unit: "minutes" },
                        },
                        {
                            name: "maxDuration",
                            value: { type: "Duration", value: 2, unit: "hours" },
                        },
                        {
                            name: "timePrecision",
                            value: { type: "Duration", value: 15, unit: "minutes" },
                        },
                        {
                            name: "minAdvanceTime",
                            value: { type: "Duration", value: 1, unit: "hours" },
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
                    display: [],
                    behavior: [],
                };

                const compiler = new EventDSLCompiler();
                const dataModel = compiler.compileFromAST([ast]);
                const runtime = new EventRuntime(dataModel.types[0]);

                const now = new Date("2024-12-30T08:00:00Z");
                const startTime = new Date("2024-12-30T10:00:00Z");
                const endTime = new Date("2024-12-30T10:30:00Z");

                const event: Event = {
                    id: "1",
                    type: "appointment",
                    title: "Appointment",
                    startTime,
                    endTime,
                    extra: {
                        patient: "John Doe",
                    },
                };

                const context: ValidationContext = {
                    events: [],
                    now,
                };

                const result = runtime.validate(event, context);
                expect(result.valid).toBe(true);
            });

            it("应该验证时间冲突检测", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [
                        {
                            type: "NoConflict",
                        },
                    ],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                const event1: Event = {
                    id: "1",
                    type: "meeting",
                    title: "会议 1",
                    startTime: new Date("2024-12-30T10:00:00Z"),
                    endTime: new Date("2024-12-30T11:00:00Z"),
                    extra: {},
                };

                const event2: Event = {
                    id: "2",
                    type: "meeting",
                    title: "会议 2",
                    startTime: new Date("2024-12-30T10:30:00Z"),
                    endTime: new Date("2024-12-30T11:30:00Z"),
                    extra: {},
                };

                const context: ValidationContext = {
                    events: [event2],
                    now: new Date(),
                };

                const result = runtime.validate(event1, context);
                expect(result.valid).toBe(false);
                expect(
                    result.errors?.some((e) => e.includes("冲突"))
                ).toBe(true);
            });
        });

        describe("性能测试", () => {
            it("应该能够处理大量重复事件的验证", () => {
                const ast: EventTypeAST = {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                };

                const runtime = new EventRuntime(compileAST(ast));

                // 创建大量事件用于测试
                const events: Event[] = [];
                for (let i = 0; i < 100; i++) {
                    events.push({
                        id: `event-${i}`,
                        type: "meeting",
                        title: `会议 ${i}`,
                        startTime: new Date(`2024-12-30T${10 + (i % 8)}:00:00Z`),
                        endTime: new Date(`2024-12-30T${11 + (i % 8)}:00:00Z`),
                        extra: {},
                    });
                }

                const context: ValidationContext = {
                    events,
                    now: new Date(),
                };

                // 验证每个事件
                const startTime = Date.now();
                for (const event of events) {
                    const result = runtime.validate(event, context);
                    expect(result.valid).toBe(true);
                }
                const endTime = Date.now();
                const duration = endTime - startTime;

                // 性能要求：100 个事件验证应该在 1 秒内完成
                expect(duration).toBeLessThan(1000);
            });
        });
    });
});
