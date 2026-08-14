# @calenderjs/react-event-editor

React Event DSL 编辑器组件。基于 Monaco Editor，语言支持来自 `@calenderjs/monaco-event-dsl`。

与 `@calenderjs/react`（日历 wrapper）分离：只做日历时不装本包，也不拉 Monaco。

## 安装

```bash
pnpm add @calenderjs/react-event-editor @calenderjs/monaco-event-dsl monaco-editor @monaco-editor/react
```

`monaco-editor` 与 `@monaco-editor/react` 为 peer dependency，需由宿主安装。

## 使用

```tsx
import { EventEditor } from '@calenderjs/react-event-editor';
import { Editor } from '@monaco-editor/react';
import { useState } from 'react';

function App() {
  const [dsl, setDsl] = useState('type: meeting\nname: "团队会议"');

  return (
    <EventEditor
      EditorComponent={Editor}
      value={dsl}
      onChange={setDsl}
      height="100%"
      darkMode={false}
    />
  );
}
```

`EditorComponent` 必需：由调用方传入，本包不内置 Monaco React 实现。

## 与 Calendar 组合

```tsx
import { Calendar, ResizableSplitter } from '@calenderjs/react';
import { EventEditor } from '@calenderjs/react-event-editor';
import { Editor } from '@monaco-editor/react';

function App() {
  return (
    <ResizableSplitter
      left={
        <EventEditor EditorComponent={Editor} value={''} height="100%" />
      }
      right={<Calendar view="month" />}
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `EditorComponent` | `React.ComponentType<EditorProps>` | - | Monaco Editor 组件（必需） |
| `value` | `string` | `""` | Event DSL 代码内容 |
| `onChange` | `(value: string \| undefined) => void` | - | 代码变化回调 |
| `height` | `string \| number` | `"100%"` | 编辑器高度 |
| `darkMode` | `boolean` | `false` | 暗色主题 |
| `className` | `string` | `""` | CSS 类名 |
| `style` | `React.CSSProperties` | - | 内联样式 |
| `options` | `editor.IStandaloneEditorConstructionOptions` | - | Monaco 选项（与默认合并） |
| `onMount` | `(editor, monaco) => void` | - | 挂载回调 |

## 默认 Monaco 选项

- `minimap: { enabled: false }`
- `fontSize: 14`
- `wordWrap: "on"`
- `lineNumbers: "on"`
- `scrollBeyondLastLine: false`
- `suggestOnTriggerCharacters: true`
- `quickSuggestions: true`
- `tabSize: 2`
- `autoIndent: "full"`

## CSS 变量

```css
:root {
  --event-editor-bg-color: #fff;
  --event-editor-bg-color-dark: #1e1e1e;
}
```
