/**
 * 注册 Event DSL 语言到 Monaco Editor
 */

import type { MonacoInstance } from "./types";
import type { languages } from "monaco-editor";

// 延迟初始化，等待 monaco 实例
let isRegistered = false;

/**
 * 注册 Event DSL 语言到 Monaco Editor
 *
 * @param monaco - Monaco Editor 实例（包含 editor 和 languages）
 *
 * @example
 * ```typescript
 * import { registerEventDSL } from "@calenderjs/monaco-event-dsl";
 * import { Editor } from "@monaco-editor/react";
 *
 * function MyEditor() {
 *     return (
 *         <Editor
 *             language="event-dsl"
 *             onMount={(editor, monaco) => {
 *                 registerEventDSL(monaco);
 *             }}
 *         />
 *     );
 * }
 * ```
 */
export function registerEventDSL(monaco: MonacoInstance): void {
    if (isRegistered) {
        return; // 已经注册过了
    }
    isRegistered = true;

    // 注册 Event DSL 语言
    monaco.languages.register({ id: "event-dsl" });

    // 定义语法高亮规则
    monaco.languages.setMonarchTokensProvider("event-dsl", {
        // 关键字
        keywords: [
            "type",
            "name",
            "description",
            "fields",
            "validate",
            "display",
            "behavior",
            "required",
            "of",
            "and",
            "or",
            "not",
            "between",
            "in",
            "is",
            "equals",
            "not equals",
            "when",
            "conflict",
            "recurring",
            "constraints",
        ],

        // 操作符
        operators: [">=", "<=", ">", "<", "=", "!=", "mod"],

        // 类型
        types: [
            "string",
            "number",
            "boolean",
            "email",
            "url",
            "date",
            "time",
            "datetime",
            "list",
        ],

        // 符号
        symbols: /[=><!?:&|+\-*\/\^%]+/,

        // 转义序列
        escapes:
            /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        // 词法规则
        tokenizer: {
            root: [
                // 关键字
                [
                    /\b(type|name|description|fields|validate|display|behavior|required|and|or|not|between|in|is|equals|when|conflict|recurring|constraints)\b/,
                    "keyword",
                ],

                // 类型
                [
                    /\b(string|number|boolean|email|url|date|time|datetime|list)\b/,
                    "type",
                ],

                // 操作符
                [/>=|<=|>|<|==|!=|mod/, "operator"],

                // 字符串字面量（双引号）
                [/"[^"]*"/, "string"],

                // 字符串字面量（单引号）
                [/'[^']*'/, "string"],

                // 数字
                [/\d+/, "number"],

                // 布尔值
                [/\b(true|false)\b/, "number"],

                // 颜色值（十六进制）
                [/#[0-9A-Fa-f]{6}/, "string"],

                // 字段访问（如 attendees.count, startTime.hour）
                [
                    /[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+/,
                    "variable",
                ],

                // 标识符
                [/[a-zA-Z_][a-zA-Z0-9_]*/, "identifier"],

                // 注释（以 # 开头）
                [/#.*$/, "comment"],

                // 列表项（以 - 开头）
                [/^\s*-\s*/, "keyword"],

                // 冒号（用于键值对）
                [/:/, "delimiter"],

                // 空白字符
                { include: "@whitespace" },
            ],

            whitespace: [[/[ \t\r\n]+/, "white"]],
        },
    });

    // 定义自动完成建议
    monaco.languages.registerCompletionItemProvider("event-dsl", {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = [
                // 顶级关键字
                {
                    label: "type",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: "type: ${1:event-type}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "定义事件类型",
                    range,
                },
                {
                    label: "name",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'name: "${1:事件名称}"',
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "事件类型名称",
                    range,
                },
                {
                    label: "description",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'description: "${1:事件描述}"',
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "事件类型描述",
                    range,
                },
                {
                    label: "fields",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: "fields:\n  - ${1:fieldName}: ${2:string}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "定义事件字段",
                    range,
                },
                {
                    label: "validate",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: "validate:\n  ${1:field} ${2:>=} ${3:value}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "定义验证规则",
                    range,
                },
                {
                    label: "display",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText:
                        'display:\n  color: "${1:#4285f4}"\n  icon: "${2:icon-name}"',
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "定义显示属性",
                    range,
                },
                {
                    label: "behavior",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText:
                        "behavior:\n  editable: ${1:true}\n  draggable: ${2:true}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "定义行为属性",
                    range,
                },

                // 字段类型
                {
                    label: "string",
                    kind: monaco.languages.CompletionItemKind.TypeParameter,
                    insertText: "string",
                    documentation: "字符串类型",
                    range,
                },
                {
                    label: "number",
                    kind: monaco.languages.CompletionItemKind.TypeParameter,
                    insertText: "number",
                    documentation: "数字类型",
                    range,
                },
                {
                    label: "boolean",
                    kind: monaco.languages.CompletionItemKind.TypeParameter,
                    insertText: "boolean",
                    documentation: "布尔类型",
                    range,
                },
                {
                    label: "email",
                    kind: monaco.languages.CompletionItemKind.TypeParameter,
                    insertText: "email",
                    documentation: "邮箱类型",
                    range,
                },
                {
                    label: "list of",
                    kind: monaco.languages.CompletionItemKind.TypeParameter,
                    insertText: "list of ${1:string}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "列表类型",
                    range,
                },

                // 操作符
                {
                    label: ">=",
                    kind: monaco.languages.CompletionItemKind.Operator,
                    insertText: ">=",
                    documentation: "大于等于",
                    range,
                },
                {
                    label: "<=",
                    kind: monaco.languages.CompletionItemKind.Operator,
                    insertText: "<=",
                    documentation: "小于等于",
                    range,
                },
                {
                    label: "between",
                    kind: monaco.languages.CompletionItemKind.Operator,
                    insertText: "between ${1:min} and ${2:max}",
                    insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                            .InsertAsSnippet,
                    documentation: "范围检查",
                    range,
                },
            ];

            return { suggestions } as { suggestions: languages.CompletionItem[] };
        },
    });

    // 定义主题颜色（可选，用于更好的视觉效果）
    monaco.editor.defineTheme("event-dsl-theme", {
        base: "vs",
        inherit: true,
        rules: [
            { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
            { token: "type", foreground: "267f99" },
            { token: "string", foreground: "a31515" },
            { token: "number", foreground: "098658" },
            { token: "operator", foreground: "000000", fontStyle: "bold" },
            { token: "comment", foreground: "008000", fontStyle: "italic" },
            { token: "variable", foreground: "001080" },
        ],
        colors: {},
    });

    monaco.editor.defineTheme("event-dsl-theme-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
            { token: "type", foreground: "4ec9b0" },
            { token: "string", foreground: "ce9178" },
            { token: "number", foreground: "b5cea8" },
            { token: "operator", foreground: "d4d4d4", fontStyle: "bold" },
            { token: "comment", foreground: "6a9955", fontStyle: "italic" },
            { token: "variable", foreground: "9cdcfe" },
        ],
        colors: {},
    });
}
