/**
 * Monaco Editor 实例类型
 */
import type { editor, languages } from "monaco-editor";

export interface MonacoInstance {
    editor: typeof editor;
    languages: typeof languages;
}
