# @calenderjs/monaco-event-dsl

Monaco Editor 语言支持包 - 为 Event DSL 提供语法高亮和自动完成

## 功能特性

- ✅ Event DSL 语法高亮
- ✅ 智能自动完成建议
- ✅ 代码片段支持（Snippets）
- ✅ 浅色和暗色主题
- ✅ TypeScript 类型定义
- ✅ 零运行时依赖（仅类型依赖）
- ✅ 不包含 Monaco Editor 本身（作为 peer dependency）

## 安装

```bash
pnpm add @calenderjs/monaco-event-dsl monaco-editor
```

**注意**: `monaco-editor` 是 peer dependency，需要单独安装。这个包只提供语言支持，不包含编辑器本身。

## 使用

### 基础用法

```typescript
import { registerEventDSL } from "@calenderjs/monaco-event-dsl";
import { Editor } from "@monaco-editor/react";

function EventDSLEditor() {
    return (
        <Editor
            language="event-dsl"
            theme="event-dsl-theme"
            onMount={(editor, monaco) => {
                // 注册 Event DSL 语言
                registerEventDSL(monaco);
            }}
        />
    );
}
```

### 支持暗色模式

```typescript
import { registerEventDSL } from "@calenderjs/monaco-event-dsl";
import { Editor } from "@monaco-editor/react";
import { useState } from "react";

function EventDSLEditor() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    return (
        <Editor
            language="event-dsl"
            theme={isDarkMode ? "event-dsl-theme-dark" : "event-dsl-theme"}
            onMount={(editor, monaco) => {
                registerEventDSL(monaco);
            }}
        />
    );
}
```

### 使用原生 Monaco Editor

```typescript
import * as monaco from "monaco-editor";
import { registerEventDSL } from "@calenderjs/monaco-event-dsl";

// 注册语言
registerEventDSL(monaco);

// 创建编辑器
const editor = monaco.editor.create(document.getElementById("container"), {
    value: 'type: meeting\nname: "团队会议"',
    language: "event-dsl",
    theme: "event-dsl-theme",
});
```

## API

### `registerEventDSL(monaco: MonacoInstance): void`

注册 Event DSL 语言到 Monaco Editor。此函数会：
1. 注册 `event-dsl` 语言 ID
2. 配置语法高亮规则（Monarch Tokenizer）
3. 注册自动完成提供者
4. 定义浅色和暗色主题（`event-dsl-theme` 和 `event-dsl-theme-dark`）

**参数：**
- `monaco`: Monaco Editor 实例，包含 `editor` 和 `languages` 对象

**注意：** 
- 此函数是幂等的，多次调用只会注册一次
- 此包不包含 Monaco Editor 本身，需要单独安装 `monaco-editor`
- 可以在任何使用 Monaco Editor 的项目中使用（React、Vue、原生 JS 等）

## 支持的语言特性

### 语法高亮

- **关键字**: `type`, `name`, `description`, `fields`, `validate`, `display`, `behavior` 等
- **类型**: `string`, `number`, `boolean`, `email`, `list` 等
- **操作符**: `>=`, `<=`, `>`, `<`, `between` 等
- **字符串**: 双引号和单引号字符串
- **数字**: 整数和布尔值
- **颜色值**: 十六进制颜色代码（如 `#4285f4`）
- **字段访问**: 如 `attendees.count`, `startTime.hour`
- **注释**: 以 `#` 开头的注释

### 自动完成

提供以下自动完成建议：

- 关键字：`type`, `name`, `description`, `fields`, `validate`, `display`, `behavior`
- 类型：`string`, `number`, `boolean`, `email`, `list of`
- 操作符：`>=`, `<=`, `between`

所有建议都支持代码片段，可以快速生成模板代码。

## 主题

包提供了两个预定义主题：

- `event-dsl-theme`: 浅色主题
- `event-dsl-theme-dark`: 暗色主题

## 类型定义

```typescript
import type { MonacoInstance } from "@calenderjs/monaco-event-dsl";

function setupEditor(monaco: MonacoInstance) {
    registerEventDSL(monaco);
}
```

## 许可证

MIT
