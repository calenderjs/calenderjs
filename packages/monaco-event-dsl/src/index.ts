/**
 * @calenderjs/monaco-event-dsl
 *
 * Monaco Editor Event DSL 语言支持包
 * 为 Event DSL 提供语法高亮、自动完成和自定义主题
 */

export { registerEventDSL } from "./register";
export type { MonacoInstance } from "./types";

// 重新导出类型以便使用
export type { editor, languages } from "monaco-editor";
