/**
 * TypeScript 生成器
 *
 * 从 Event DSL AST 生成 TypeScript 类型定义，用于开发时类型检查和 IDE 自动补全
 *
 * 根据 RFC-0001 定义
 *
 * **用途**：生成的 TypeScript 类型用于开发时类型检查和 IDE 自动补全
 */

import type { EventTypeAST, FieldDefinition, FieldType } from '../ast/types';

/**
 * TypeScript 生成器选项
 */
export interface TypeScriptGeneratorOptions {
    /** 是否包含 JSDoc 注释 */
    includeJSDoc?: boolean;
    /** 是否导出类型 */
    exportType?: boolean;
    /** 类型名称前缀 */
    typeNamePrefix?: string;
    /** 类型名称后缀 */
    typeNameSuffix?: string;
}

/**
 * 从 Event DSL AST 生成 TypeScript 类型定义
 *
 * @param ast - Event DSL AST
 * @param options - 生成器选项
 * @returns TypeScript 类型定义字符串
 */
export function generateTypeScript(
    ast: EventTypeAST,
    options: TypeScriptGeneratorOptions = {}
): string {
    const {
        includeJSDoc = true,
        exportType = true,
        typeNamePrefix = '',
        typeNameSuffix = 'Extra',
    } = options;

    const typeName = `${typeNamePrefix}${toPascalCase(ast.type)}${typeNameSuffix}`;
    const lines: string[] = [];

    // 添加 JSDoc 注释
    if (includeJSDoc) {
        lines.push('/**');
        if (ast.name) {
            lines.push(` * ${ast.name}`);
        }
        if (ast.description) {
            lines.push(` * ${ast.description}`);
        }
        lines.push(' *');
        lines.push(' * 从 Event DSL 自动生成');
        lines.push(' */');
    }

    // 导出关键字
    const exportKeyword = exportType ? 'export ' : '';

    // 开始类型定义
    lines.push(`${exportKeyword}interface ${typeName} {`);

    // 生成字段
    ast.fields.forEach((field) => {
        const fieldType = generateFieldType(field);
        const optional = field.required ? '' : '?';
        const fieldName = field.name;

        // 字段 JSDoc 注释
        if (includeJSDoc) {
            const fieldComments: string[] = [];
            if (field.default !== undefined) {
                fieldComments.push(`@default ${JSON.stringify(field.default)}`);
            }
            if (field.min !== undefined) {
                fieldComments.push(`@min ${field.min}`);
            }
            if (field.max !== undefined) {
                fieldComments.push(`@max ${field.max}`);
            }
            if (fieldComments.length > 0) {
                lines.push(`  /**`);
                fieldComments.forEach((comment) => {
                    lines.push(`   * ${comment}`);
                });
                lines.push(`   */`);
            }
        }

        // 字段定义
        lines.push(`  ${fieldName}${optional}: ${fieldType};`);
    });

    // 结束类型定义
    lines.push('}');

    return lines.join('\n');
}

/**
 * 生成字段的 TypeScript 类型
 *
 * @param field - 字段定义
 * @returns TypeScript 类型字符串
 */
function generateFieldType(field: FieldDefinition): string {
    return convertFieldTypeToTypeScript(field.type);
}

/**
 * 将字段类型转换为 TypeScript 类型
 *
 * @param fieldType - 字段类型
 * @returns TypeScript 类型字符串
 */
function convertFieldTypeToTypeScript(fieldType: FieldType): string {
    if (typeof fieldType === 'string') {
        switch (fieldType) {
            case 'string':
            case 'text':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'email':
                return 'string'; // email format
            default:
                return 'string';
        }
    }

    if (typeof fieldType === 'object') {
        if (fieldType.type === 'list') {
            const itemType = convertFieldTypeToTypeScript(fieldType.itemType);
            return `${itemType}[]`;
        }

        if (fieldType.type === 'enum') {
            const enumValues = fieldType.values
                .map((v) => `'${v}'`)
                .join(' | ');
            return enumValues;
        }
    }

    return 'unknown';
}

/**
 * 将字符串转换为 PascalCase
 *
 * @param str - 输入字符串
 * @returns PascalCase 字符串
 */
function toPascalCase(str: string): string {
    return str
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
