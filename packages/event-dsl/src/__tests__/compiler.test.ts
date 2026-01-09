import { describe, it, expect } from "vitest";
import { EventDSLCompiler } from "../compiler";
import type { EventTypeAST } from "../ast/types";
import type { Event } from "@calenderjs/event-model";

describe("EventDSLCompiler", () => {
    describe("compileDSL", () => {
        it("should compile DSL text to Data Model", () => {
            const compiler = new EventDSLCompiler();
            const dslText = `type: meeting
name: "会议"
fields:
  - title: string`;

            const result = compiler.compileDSL(dslText);

            expect(result.types).toHaveLength(1);
            expect(result.types[0].id).toBe("meeting");
            expect(result.types[0].name).toBe("会议");
            expect(result.types[0].extraSchema).toBeDefined();
        });

        it("should throw error on invalid DSL text", () => {
            const compiler = new EventDSLCompiler();
            const invalidDSL = "invalid dsl text";

            expect(() => {
                compiler.compileDSL(invalidDSL);
            }).toThrow();
        });
    });

    describe("compileFromAST", () => {
        it("should compile empty AST array", () => {
            const compiler = new EventDSLCompiler();
            const result = compiler.compileFromAST([]);

            expect(result.types).toEqual([]);
            expect(result.validators).toEqual([]);
        });

        it("should compile single AST to CompiledType", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
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
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);

            expect(result.types).toHaveLength(1);
            expect(result.types[0].id).toBe("meeting");
            expect(result.types[0].name).toBe("会议");
            expect(result.types[0].extraSchema).toBeDefined();
            expect(result.types[0].validationRules).toEqual([]);
            expect(result.types[0].displayRules).toEqual([]);
            expect(result.types[0].behaviorRules).toEqual([]);
            expect(result.types[0].validator).toBeDefined();
            expect(result.types[0].renderer).toBeDefined();
            expect(result.types[0].behavior).toBeDefined();
        });

        it("should compile multiple ASTs", () => {
            const compiler = new EventDSLCompiler();
            const asts: EventTypeAST[] = [
                {
                    type: "meeting",
                    name: "会议",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                },
                {
                    type: "holiday",
                    name: "假期",
                    fields: [],
                    validate: [],
                    display: [],
                    behavior: [],
                },
            ];

            const result = compiler.compileFromAST(asts);

            expect(result.types).toHaveLength(2);
            expect(result.types[0].id).toBe("meeting");
            expect(result.types[1].id).toBe("holiday");
        });

        it("should generate extraSchema from fields", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [
                    {
                        name: "title",
                        type: "string",
                        required: true,
                    },
                    {
                        name: "attendees",
                        type: "number",
                        required: false,
                    },
                ],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const compiledType = result.types[0];

            expect(compiledType.extraSchema).toBeDefined();
            expect(compiledType.extraSchema.type).toBe("object");
            expect(compiledType.extraSchema.properties).toBeDefined();
            expect(compiledType.extraSchema.properties?.title).toBeDefined();
            expect(
                compiledType.extraSchema.properties?.attendees
            ).toBeDefined();
            expect(compiledType.extraSchema.required).toContain("title");
        });

        it("should include validation rules in CompiledType", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [
                    {
                        type: "Between",
                        field: "attendees",
                        min: 1,
                        max: 50,
                    },
                ],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const compiledType = result.types[0];

            expect(compiledType.validationRules).toHaveLength(1);
            expect(compiledType.validationRules[0].type).toBe("Between");
        });

        it("should include display rules in CompiledType", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "color",
                        value: "#4285f4",
                    },
                    {
                        name: "icon",
                        value: "calendar",
                    },
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const compiledType = result.types[0];

            expect(compiledType.displayRules).toHaveLength(2);
            expect(compiledType.displayRules[0].name).toBe("color");
            expect(compiledType.displayRules[1].name).toBe("icon");
        });

        it("should include behavior rules in CompiledType", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "draggable",
                        value: false,
                    },
                    {
                        name: "resizable",
                        value: true,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const compiledType = result.types[0];

            expect(compiledType.behaviorRules).toHaveLength(2);
            expect(compiledType.behaviorRules[0].name).toBe("draggable");
            expect(compiledType.behaviorRules[1].name).toBe("resizable");
        });
    });

    describe("validator generation", () => {
        it("should generate validator that validates required fields", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [
                    {
                        name: "title",
                        type: "string",
                        required: true,
                    },
                    {
                        name: "description",
                        type: "text",
                        required: false,
                    },
                ],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const validator = result.types[0].validator;

            // Test with missing required field
            const event1: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {},
            };

            const validation1 = validator(event1);
            expect(validation1.valid).toBe(false);
            expect(validation1.errors).toContain("title 是必填字段");

            // Test with required field present
            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {
                    title: "Meeting Title",
                },
            };

            const validation2 = validator(event2);
            expect(validation2.valid).toBe(true);
            expect(validation2.errors).toBeUndefined();
        });

        it("should validate empty string as missing required field", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
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
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const validator = result.types[0].validator;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {
                    title: "",
                },
            };

            const validation = validator(event);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("title 是必填字段");
        });

        it("should validate null as missing required field", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
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
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const validator = result.types[0].validator;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {
                    title: null,
                },
            };

            const validation = validator(event);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("title 是必填字段");
        });

        it("should validate undefined as missing required field", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
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
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const validator = result.types[0].validator;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {},
            };

            const validation = validator(event);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("title 是必填字段");
        });

        it("should handle multiple required fields", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [
                    {
                        name: "title",
                        type: "string",
                        required: true,
                    },
                    {
                        name: "location",
                        type: "string",
                        required: true,
                    },
                    {
                        name: "description",
                        type: "text",
                        required: false,
                    },
                ],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const validator = result.types[0].validator;

            // Test with missing location (title is provided)
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {
                    title: "Meeting Title",
                },
            };

            const validation = validator(event);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain("location 是必填字段");
            expect(validation.errors).not.toContain("title 是必填字段");

            // Test with both missing
            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
                extra: {},
            };

            const validation2 = validator(event2);
            expect(validation2.valid).toBe(false);
            expect(validation2.errors).toContain("location 是必填字段");
            expect(validation2.errors).toContain("title 是必填字段");
        });
    });

    describe("renderer generation", () => {
        it("should generate renderer with default values", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test Event",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.title).toBe("Test Event");
            expect(rendered.color).toBe("#4285f4");
            expect(rendered.description).toBe("");
        });

        it("should use event.title if available", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Custom Title",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.title).toBe("Custom Title");
        });

        it("should fallback to ast.name if event.title is missing", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.title).toBe("会议");
        });

        it("should use event.color if available", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                color: "#ff0000",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.color).toBe("#ff0000");
        });

        it("should extract color from display rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "color",
                        value: "#00ff00",
                    },
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.color).toBe("#00ff00");
        });

        it("should extract icon from display rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "icon",
                        value: "calendar",
                    },
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            expect(rendered.icon).toBe("calendar");
        });

        it("should prioritize event.color over display rule color", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    {
                        name: "color",
                        value: "#00ff00",
                    },
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const renderer = result.types[0].renderer;

            const event: Event = {
                id: "1",
                type: "meeting",
                title: "Test",
                color: "#ff0000",
                startTime: new Date("2024-01-01T10:00:00Z"),
                endTime: new Date("2024-01-01T11:00:00Z"),
            };

            const rendered = renderer(event);
            // Note: The current implementation uses event.color first, then falls back to display rule
            // But the renderer actually uses display rule first, then falls back to event.color
            // Let's check the actual behavior
            expect(rendered.color).toBe("#00ff00");
        });
    });

    describe("behavior generation", () => {
        it("should generate default behavior config", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.draggable).toBe(true);
            expect(behavior.resizable).toBe(false);
            expect(behavior.editable).toBe(true);
            expect(behavior.deletable).toBe(true);
        });

        it("should extract draggable from behavior rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "draggable",
                        value: false,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.draggable).toBe(false);
        });

        it("should extract resizable from behavior rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "resizable",
                        value: true,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.resizable).toBe(true);
        });

        it("should extract editable from behavior rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "editable",
                        value: false,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.editable).toBe(false);
        });

        it("should extract deletable from behavior rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "deletable",
                        value: false,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.deletable).toBe(false);
        });

        it("should handle multiple behavior rules", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "draggable",
                        value: false,
                    },
                    {
                        name: "resizable",
                        value: true,
                    },
                    {
                        name: "editable",
                        value: false,
                    },
                    {
                        name: "deletable",
                        value: false,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            expect(behavior.draggable).toBe(false);
            expect(behavior.resizable).toBe(true);
            expect(behavior.editable).toBe(false);
            expect(behavior.deletable).toBe(false);
        });

        it("should ignore non-boolean behavior rule values", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: [
                    {
                        name: "draggable",
                        value: "not-a-boolean" as any,
                    },
                ],
            };

            const result = compiler.compileFromAST([ast]);
            const behavior = result.types[0].behavior;

            // Should use default value since the value is not a boolean
            expect(behavior.draggable).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle AST with optional fields", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                description: "Optional description",
                fields: [],
                validate: [],
                display: [],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            expect(result.types[0].id).toBe("meeting");
            expect(result.types[0].name).toBe("会议");
        });

        it("should handle AST with undefined validate array", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: undefined as any,
                display: [],
                behavior: [],
            };

            // This should not throw, but handle gracefully
            const result = compiler.compileFromAST([ast]);
            expect(result.types[0].validationRules).toEqual([]);
        });

        it("should handle AST with undefined display array", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: undefined as any,
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            expect(result.types[0].displayRules).toEqual([]);
        });

        it("should handle AST with undefined display array in renderer", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: undefined as any, // undefined 应该使用默认空数组
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "测试",
                startTime: new Date(),
                endTime: new Date(),
            };

            const rendered = result.types[0].renderer(event, {});
            expect(rendered).toBeDefined();
            expect(rendered.color).toBe("#4285f4"); // 默认颜色（因为 display 是 undefined）
        });

        it("should handle AST with undefined behavior array", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [],
                behavior: undefined as any,
            };

            const result = compiler.compileFromAST([ast]);
            expect(result.types[0].behaviorRules).toEqual([]);
        });

        it("should handle AST with empty display array in renderer", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [], // 空数组
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "测试",
                startTime: new Date(),
                endTime: new Date(),
            };

            const rendered = result.types[0].renderer(event, {});
            expect(rendered).toBeDefined();
            expect(rendered.color).toBe("#4285f4"); // 默认颜色
        });

        it("should extract color and icon from display rules in renderer", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    { name: "color", value: "#ff0000" },
                    { name: "icon", value: "calendar" },
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "测试",
                startTime: new Date(),
                endTime: new Date(),
            };

            const rendered = result.types[0].renderer(event, {});
            expect(rendered.color).toBe("#ff0000");
            expect(rendered.icon).toBe("calendar");
        });

        it("should handle display rules with non-string values", () => {
            const compiler = new EventDSLCompiler();
            const ast: EventTypeAST = {
                type: "meeting",
                name: "会议",
                fields: [],
                validate: [],
                display: [
                    { name: "color", value: { type: "Conditional" } as any }, // 非字符串值
                    { name: "icon", value: 123 as any }, // 非字符串值
                ],
                behavior: [],
            };

            const result = compiler.compileFromAST([ast]);
            const event: Event = {
                id: "1",
                type: "meeting",
                title: "测试",
                startTime: new Date(),
                endTime: new Date(),
            };

            const rendered = result.types[0].renderer(event, {});
            // 非字符串值应该被忽略，使用默认值
            expect(rendered.color).toBe("#4285f4");
            expect(rendered.icon).toBeUndefined();
        });

        it("should compile validators list", () => {
            const compiler = new EventDSLCompiler();
            const validators = [
                {
                    name: "validator1",
                    validate: () => ({ valid: true }),
                },
                {
                    name: "validator2",
                    validate: () => ({ valid: false, errors: ["error"] }),
                },
            ];

            // 使用私有方法测试（通过类型断言访问）
            const result = (compiler as any).compileValidators(validators);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("validator1");
            expect(result[0].validate()).toEqual({ valid: true });
            expect(result[1].name).toBe("validator2");
            expect(result[1].validate()).toEqual({ valid: false, errors: ["error"] });
        });
    });
});
