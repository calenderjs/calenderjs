"use client";

import { useMemo } from "react";
import { registerEventDSL } from "@calenderjs/monaco-event-dsl";
import type { editor } from "monaco-editor";
import type { EditorProps } from "@monaco-editor/react";

export interface EventEditorProps {
    /** Event DSL 代码内容 */
    value?: string;
    /** 代码变化时的回调 */
    onChange?: (value: string | undefined) => void;
    /** 编辑器高度 */
    height?: string | number;
    /** 是否使用暗色主题 */
    darkMode?: boolean;
    /** 自定义 CSS 类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** Monaco Editor 选项 */
    options?: editor.IStandaloneEditorConstructionOptions;
    /** 编辑器挂载时的回调 */
    onMount?: (
        editor: editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor")
    ) => void;
    /** Monaco Editor 组件（由用户传入） */
    EditorComponent: React.ComponentType<EditorProps>;
}

/**
 * EventEditor - Event DSL 编辑器组件
 *
 * 基于 Monaco Editor 的 Event DSL 专用编辑器，提供语法高亮、自动完成等功能。
 *
 * **注意**: 这是一个标准 React 组件，需要用户自己导入并传入 `EditorComponent`。
 *
 * @example
 * ```tsx
 * import { EventEditor } from '@calenderjs/react';
 * import { Editor } from '@monaco-editor/react';
 * import { useState } from 'react';
 *
 * function App() {
 *   const [dsl, setDsl] = useState('type: meeting\nname: "会议"');
 *
 *   return (
 *     <EventEditor
 *       EditorComponent={Editor}
 *       value={dsl}
 *       onChange={setDsl}
 *       height="100%"
 *       darkMode={false}
 *     />
 *   );
 * }
 * ```
 */
export default function EventEditor({
    value = "",
    onChange,
    height = "100%",
    darkMode = false,
    className = "",
    style,
    options,
    onMount,
    EditorComponent,
}: EventEditorProps) {
    // 处理编辑器挂载
    const handleMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor")
    ) => {
        // 注册 Event DSL 语言支持
        registerEventDSL(monaco as any);

        // 调用用户提供的 onMount 回调
        onMount?.(editor, monaco);
    };

    // 合并默认选项和用户选项
    const editorOptions = useMemo(
        () => ({
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on" as const,
            lineNumbers: "on" as const,
            scrollBeyondLastLine: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabSize: 2,
            autoIndent: "full" as const,
            ...options,
        }),
        [options]
    );

    return (
        <div
            className={`event-editor ${className}`}
            style={{
                ...style,
                height: typeof height === "number" ? `${height}px` : height,
                width: "100%",
                backgroundColor: darkMode
                    ? "var(--event-editor-bg-color-dark, #1e1e1e)"
                    : "var(--event-editor-bg-color, #fff)",
            }}
        >
            <EditorComponent
                height="100%"
                language="event-dsl"
                value={value}
                onChange={onChange}
                theme={darkMode ? "event-dsl-theme-dark" : "event-dsl-theme"}
                onMount={handleMount}
                options={editorOptions}
            />
        </div>
    );
}
