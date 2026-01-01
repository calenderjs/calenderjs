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
    return {
        type: result.type || "",
        name: result.name || "",
        description: result.description,
        fields: result.fields || [],
        validate: result.validate || [],
        display: result.display || [],
        behavior: result.behavior || [],
        constraints: result.constraints || [],
    };
}
