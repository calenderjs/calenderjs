"use client";

import { useMemo, type CSSProperties, type ComponentType } from "react";
import { registerEventDSL } from "@calenderjs/monaco-event-dsl";
import type { editor } from "monaco-editor";
import type { EditorProps } from "@monaco-editor/react";

/** 暗色主题背景 CSS 变量名 */
const EVENT_EDITOR_BG_DARK_VAR = "var(--event-editor-bg-color-dark, #1e1e1e)";
/** 浅色主题背景 CSS 变量名 */
const EVENT_EDITOR_BG_LIGHT_VAR = "var(--event-editor-bg-color, #fff)";
/** Event DSL Monaco 语言 id */
const EVENT_DSL_LANGUAGE_ID = "event-dsl";
/** 浅色主题 id */
const EVENT_DSL_THEME_LIGHT = "event-dsl-theme";
/** 暗色主题 id */
const EVENT_DSL_THEME_DARK = "event-dsl-theme-dark";

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
    style?: CSSProperties;
    /** Monaco Editor 选项 */
    options?: editor.IStandaloneEditorConstructionOptions;
    /** 编辑器挂载时的回调 */
    onMount?: (
        editor: editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor")
    ) => void;
    /** Monaco Editor 组件（由用户传入，避免本包硬绑 @monaco-editor/react 实现） */
    EditorComponent: ComponentType<EditorProps>;
}

/**
 * EventEditor - Event DSL 编辑器组件
 *
 * 基于 Monaco Editor 的 Event DSL 专用编辑器，提供语法高亮、自动完成等功能。
 * 语言注册委托给 `@calenderjs/monaco-event-dsl`。
 *
 * @example
 * ```tsx
 * import { EventEditor } from '@calenderjs/react-event-editor';
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
    // 挂载时向宿主 Monaco 实例注册 Event DSL 语言
    const handleMount = (
        editorInstance: editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor")
    ) => {
        registerEventDSL(monaco as Parameters<typeof registerEventDSL>[0]);
        onMount?.(editorInstance, monaco);
    };

    // 默认 Monaco 选项与用户覆盖合并
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

    const resolvedHeight =
        typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={`event-editor ${className}`}
            style={{
                ...style,
                height: resolvedHeight,
                width: "100%",
                backgroundColor: darkMode
                    ? EVENT_EDITOR_BG_DARK_VAR
                    : EVENT_EDITOR_BG_LIGHT_VAR,
            }}
        >
            <EditorComponent
                height="100%"
                language={EVENT_DSL_LANGUAGE_ID}
                value={value}
                onChange={onChange}
                theme={darkMode ? EVENT_DSL_THEME_DARK : EVENT_DSL_THEME_LIGHT}
                onMount={handleMount}
                options={editorOptions}
            />
        </div>
    );
}
