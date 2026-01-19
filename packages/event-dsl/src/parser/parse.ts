/**
 * Event DSL 解析器
 *
 * 使用 Peggy 生成的解析器解析 DSL 文本为 AST
 */

import { EventTypeAST } from "../ast/types";

// Peggy 生成的解析器（构建时生成）
// @ts-ignore - 构建时生成的文件
import { parse as peggyParse } from "../generated/parser.js";

/**
 * 解析 Event DSL 文本为 AST
 *
 * @param dslText DSL 文本
 * @returns EventTypeAST
 */
export function parseEventDSL(dslText: string): EventTypeAST {
    try {
        const result = peggyParse(dslText);

        // 规范化 AST 结构
        return normalizeAST(result);
    } catch (error: any) {
        throw new Error(`Failed to parse Event DSL: ${error.message}`);
    }
}

/**
 * 规范化 AST 结构
 */
function normalizeAST(result: any): EventTypeAST {
    // 规范化 validate 数组：如果元素是 [空白, 规则] 格式，提取规则对象
    const normalizedValidate = (result.validate || []).map((rule: any) => {
        if (
            Array.isArray(rule) &&
            rule.length === 2 &&
            Array.isArray(rule[0])
        ) {
            return rule[1];
        }
        return rule;
    });

    // 规范化 behavior 数组：如果 value 是 LogicalExpression 格式但实际是 Boolean，提取正确的值
    const normalizedBehavior = (result.behavior || []).map((rule: any) => {
        if (rule && typeof rule === "object" && "value" in rule) {
            const value = rule.value;
            // 如果 value 是 LogicalExpression（数组格式），检查是否是简单的 Boolean
            if (Array.isArray(value) && value.length === 2) {
                const head = value[0];
                const tail = value[1];
                // 如果 head 是 FieldAccess 且 path 是 ["true"] 或 ["false"]，且 tail 是空数组，则转换为 Boolean
                if (
                    head?.type === "FieldAccess" &&
                    Array.isArray(head.path) &&
                    head.path.length === 1
                ) {
                    const pathValue = head.path[0];
                    if (pathValue === "true" && (!tail || tail.length === 0)) {
                        return { ...rule, value: true };
                    }
                    if (pathValue === "false" && (!tail || tail.length === 0)) {
                        return { ...rule, value: false };
                    }
                }
            }
        }
        return rule;
    });

    return {
        type: result.type || "",
        name: result.name || "",
        description: result.description,
        fields: result.fields || [],
        validate: normalizedValidate,
        display: result.display || [],
        behavior: normalizedBehavior,
        constraints: result.constraints || [],
        recurring: result.recurring,
    };
}
