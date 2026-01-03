/**
 * Event DSL 编译器
 *
 * 将 DSL AST 编译为 Data Model (Event 对象，包含规则和数据)
 *
 * **架构说明**：
 * - Event DSL 是生成工具，用于生成符合 Event Data Model 的数据
 * - Event Data Model 是 SSOT，定义了 Event 接口结构（在 @calenderjs/event-model 中）
 * - 编译器将 AST 编译成 Data Model，包含：
 *   - extraSchema: JSON Schema（从 DSL fields 生成，用于验证 Event.extra 结构）
 *   - validationRules: 业务规则（从 DSL validate 部分生成）
 *   - displayRules: 显示规则（从 DSL display 部分生成）
 *   - behaviorRules: 行为规则（从 DSL behavior 部分生成）
 */

import type { EventTypeAST } from "./ast/types";
import { generateJSONSchema } from "./generators/json-schema";
import { parseEventDSL } from "./parser/parse";
import type {
    ValidatorFunction,
    RendererFunction,
    BehaviorConfig,
    JSONSchema,
    ValidationResult,
    RenderedEvent,
    EventTypeDataModel,
    EventDSLDataModel,
} from "@calenderjs/event-model";
import type { Event } from "@calenderjs/event-model";

// 注意：EventTypeDataModel 在 @calenderjs/event-model 中定义
// DSL 编译成 Data Model，Runtime 使用 Data Model

/**
 * Event DSL 编译器
 *
 * 将 DSL AST 编译成 Data Model (Event 对象，包含规则和数据)
 */
export class EventDSLCompiler {
    /**
     * 从 DSL 文本编译成 Data Model（推荐方法）
     *
     * @param dslText - Event DSL 文本
     * @returns 编译后的 Data Model
     */
    compileDSL(dslText: string): EventDSLDataModel {
        const ast = parseEventDSL(dslText);
        return this.compileFromAST([ast]);
    }

    /**
     * 从 AST 编译成 Data Model
     *
     * @param asts - Event DSL AST 数组
     * @returns 编译后的 Data Model
     */
    compileFromAST(asts: EventTypeAST[]): EventDSLDataModel {
        return {
            types: asts.map((ast) => this.compileType(ast)),
            validators: [],
        };
    }

    /**
     * 编译单个事件类型 AST 为 Data Model
     *
     * @param ast - Event DSL AST
     * @returns 编译后的 Data Model (EventTypeDataModel)
     */
    private compileType(ast: EventTypeAST): EventTypeDataModel {
        // 生成 extraSchema（从 DSL fields 生成）
        const extraSchema = generateJSONSchema(ast);

        // 生成 validationRules（从 DSL validate 部分生成）
        const validationRules = ast.validate || [];

        // 生成 displayRules（从 DSL display 部分生成）
        const displayRules = ast.display || [];

        // 生成 behaviorRules（从 DSL behavior 部分生成）
        const behaviorRules = ast.behavior || [];

        // 生成 constraints（从 DSL constraints 部分生成）
        const constraints = ast.constraints || [];

        // 生成 recurring（从 DSL recurring 部分生成）
        const recurring = ast.recurring;

        // 生成验证器函数（基础字段验证）
        const validator = this.generateValidator(ast);

        // 生成渲染器函数
        const renderer = this.generateRenderer(ast);

        // 生成行为配置
        const behavior = this.generateBehavior(ast);

        return {
            id: ast.type,
            name: ast.name,
            extraSchema,
            validationRules,
            displayRules,
            behaviorRules,
            constraints,
            recurring,
            validator,
            renderer,
            behavior,
        };
    }

    /**
     * 生成验证器函数（基础字段验证）
     *
     * 注意：业务规则验证由 EventRuntime 处理
     */
    private generateValidator(ast: EventTypeAST): ValidatorFunction {
        return (event: Event): ValidationResult => {
            const errors: string[] = [];

            // 字段验证（从 event.extra 中获取字段值）
            ast.fields.forEach((field) => {
                const value = event.extra?.[field.name];

                // 必填验证
                if (
                    field.required &&
                    (value === undefined || value === null || value === "")
                ) {
                    errors.push(`${field.name} 是必填字段`);
                }
            });

            return {
                valid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
            };
        };
    }

    /**
     * 生成渲染器函数
     */
    private generateRenderer(ast: EventTypeAST): RendererFunction {
        return (event: Event): RenderedEvent => {
            // 默认值
            const rendered: RenderedEvent = {
                title: event.title || ast.name,
                color: event.color || "#4285f4",
                description: "",
            };

            // 从 display 规则中提取颜色和图标
            // 注意：完整的显示规则评估由 EventRuntime 处理
            (ast.display || []).forEach((rule) => {
                if (rule.name === "color" && typeof rule.value === "string") {
                    rendered.color = rule.value;
                }
                if (rule.name === "icon" && typeof rule.value === "string") {
                    rendered.icon = rule.value;
                }
            });

            return rendered;
        };
    }

    /**
     * 生成行为配置
     */
    private generateBehavior(ast: EventTypeAST): BehaviorConfig {
        const behavior: BehaviorConfig = {
            draggable: true,
            resizable: false,
            editable: true,
            deletable: true,
        };

        // 从 behavior 规则中提取行为配置
        (ast.behavior || []).forEach((rule) => {
            if (rule.name === "draggable" && typeof rule.value === "boolean") {
                behavior.draggable = rule.value;
            }
            if (rule.name === "resizable" && typeof rule.value === "boolean") {
                behavior.resizable = rule.value;
            }
            if (rule.name === "editable" && typeof rule.value === "boolean") {
                behavior.editable = rule.value;
            }
            if (rule.name === "deletable" && typeof rule.value === "boolean") {
                behavior.deletable = rule.value;
            }
        });

        return behavior;
    }

    /**
     * 编译验证器列表
     */
    private compileValidators(
        validators: any[]
    ): Array<{ name: string; validate: ValidatorFunction }> {
        return validators.map((validator) => ({
            name: validator.name,
            validate: validator.validate,
        }));
    }
}
