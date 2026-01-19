# @calenderjs/react

React wrapper for `@calenderjs/calendar` Web Component.

## 安装

```bash
pnpm add @calenderjs/react @calenderjs/calendar @monaco-editor/react
```

**注意**: `@monaco-editor/react` 是 peer dependency，如果使用 `EventEditor` 组件则需要安装。

## 使用方式

### 基础使用

```tsx
import { Calendar } from '@calenderjs/react';

function App() {
  return (
    <Calendar 
      view="month" 
      date="2024-12-30"
    />
  );
}
```

### 使用事件回调

```tsx
import { Calendar } from '@calenderjs/react';

function App() {
  const handleDateChange = (e: CustomEvent<{ date: Date }>) => {
    console.log('Date changed:', e.detail.date);
  };

  const handleViewChange = (e: CustomEvent<{ view: 'month' | 'week' | 'day' }>) => {
    console.log('View changed:', e.detail.view);
  };

  return (
    <Calendar 
      view="month"
      date={new Date()}
      onDateChange={handleDateChange}
      onViewChange={handleViewChange}
    />
  );
}
```

### 使用 ref 控制组件

```tsx
import { Calendar, CalendarRef } from '@calenderjs/react';
import { useRef } from 'react';

function App() {
  const calendarRef = useRef<CalendarRef>(null);

  const handleGoToToday = () => {
    calendarRef.current?.goToToday();
  };

  const handleSetView = (view: 'month' | 'week' | 'day') => {
    calendarRef.current?.setView(view);
  };

  return (
    <div>
      <button onClick={handleGoToToday}>今天</button>
      <button onClick={() => handleSetView('week')}>周视图</button>
      <Calendar ref={calendarRef} />
    </div>
  );
}
```

### 设置事件数据

```tsx
import { Calendar } from '@calenderjs/react';
import type { Event } from '@calenderjs/event-model';

function App() {
  const events: Event[] = [
    {
      id: '1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2024-12-30T10:00:00'),
      endTime: new Date('2024-12-30T11:00:00'),
      data: {},
    },
  ];

  return (
    <Calendar 
      view="month"
      events={events}
    />
  );
}
```

## EventEditor 组件

`EventEditor` 是一个基于 Monaco Editor 的 Event DSL 专用编辑器组件，提供语法高亮、自动完成等功能。

### 基础使用

```tsx
import { EventEditor } from '@calenderjs/react';
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

**注意**: `EventEditor` 是一个标准 React 组件，需要用户自己导入 `Editor` 组件并传入 `EditorComponent` prop。

### 与 Calendar 结合使用

```tsx
import { EventEditor, Calendar, ResizableSplitter } from '@calenderjs/react';
import { Editor } from '@monaco-editor/react';
import { useState } from 'react';

function App() {
  const [dsl, setDsl] = useState('type: meeting\nname: "会议"');
  
  return (
    <ResizableSplitter
      left={
        <div style={{ padding: '20px' }}>
          <h2>Event DSL 编辑器</h2>
          <EventEditor
            EditorComponent={Editor}
            value={dsl}
            onChange={setDsl}
            height="calc(100% - 60px)"
            darkMode={false}
          />
        </div>
      }
      right={
        <div style={{ padding: '20px' }}>
          <h2>日历</h2>
          <Calendar view="month" />
        </div>
      }
    />
  );
}
```

### EventEditor Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `EditorComponent` | `React.ComponentType<EditorProps>` | - | Monaco Editor 组件（必需，从 `@monaco-editor/react` 导入） |
| `value` | `string` | `""` | Event DSL 代码内容 |
| `onChange` | `(value: string \| undefined) => void` | - | 代码变化时的回调 |
| `height` | `string \| number` | `"100%"` | 编辑器高度 |
| `darkMode` | `boolean` | `false` | 是否使用暗色主题 |
| `className` | `string` | `""` | 自定义 CSS 类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |
| `options` | `editor.IStandaloneEditorConstructionOptions` | - | Monaco Editor 选项（会与默认选项合并） |
| `onMount` | `(editor, monaco) => void` | - | 编辑器挂载时的回调 |

### 默认编辑器选项

EventEditor 提供以下默认配置：

- `minimap: { enabled: false }` - 禁用小地图
- `fontSize: 14` - 字体大小 14px
- `wordWrap: "on"` - 启用自动换行
- `lineNumbers: "on"` - 显示行号
- `scrollBeyondLastLine: false` - 不滚动到最后一行之后
- `suggestOnTriggerCharacters: true` - 触发字符时显示建议
- `quickSuggestions: true` - 快速建议
- `tabSize: 2` - Tab 大小为 2 个空格
- `autoIndent: "full"` - 完整自动缩进

可以通过 `options` 属性覆盖这些默认值。

### EventEditor CSS 变量

组件使用 CSS 变量来支持主题定制，所有变量都使用 `--event-editor-` 前缀：

```css
:root {
  /* 编辑器容器 */
  --event-editor-bg-color: #fff;              /* 浅色模式背景色 */
  --event-editor-bg-color-dark: #1e1e1e;       /* 暗色模式背景色 */
}
```

### 暗色模式示例

```css
.dark-mode {
  --event-editor-bg-color-dark: #1e1e1e;
}
```

## ResizableSplitter 组件

`ResizableSplitter` 是一个通用的可调整大小的分割面板组件，可用于创建可拖拽调整的左右分栏布局。

### 基础使用

```tsx
import { ResizableSplitter } from '@calenderjs/react';

function App() {
  return (
    <ResizableSplitter
      left={<div>左侧内容</div>}
      right={<div>右侧内容</div>}
      initialLeftWidth={40}
      minLeftWidth={20}
      maxLeftWidth={80}
    />
  );
}
```

### 与 Calendar 结合使用

```tsx
import { ResizableSplitter, Calendar } from '@calenderjs/react';

function App() {
  return (
    <ResizableSplitter
      left={
        <div style={{ padding: '20px' }}>
          <h2>编辑器</h2>
          <textarea style={{ width: '100%', height: '100%' }} />
        </div>
      }
      right={
        <div style={{ padding: '20px' }}>
          <h2>日历</h2>
          <Calendar view="month" />
        </div>
      }
      initialLeftWidth={50}
      minLeftWidth={30}
      maxLeftWidth={70}
    />
  );
}
```

## API

### Calendar Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `view` | `'month' \| 'week' \| 'day'` | `'month'` | 初始视图 |
| `date` | `string \| Date` | 当前日期 | 初始日期 |
| `events` | `Event[]` | `[]` | 事件列表（数据模型） |
| `user` | `any` | `undefined` | 当前用户 |
| `onDateChange` | `(e: CustomEvent<{ date: Date }>) => void` | - | 日期变化回调 |
| `onViewChange` | `(e: CustomEvent<{ view: 'month' \| 'week' \| 'day' }>) => void` | - | 视图切换回调 |
| `className` | `string` | - | CSS 类名 |
| `style` | `React.CSSProperties` | - | 内联样式 |

### CalendarRef

| 方法 | 说明 |
|------|------|
| `getElement()` | 获取底层的 Web Component 实例 |
| `setView(view)` | 设置当前视图 |
| `setDate(date)` | 设置当前日期 |
| `goToToday()` | 跳转到今天 |

### ResizableSplitter Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `left` | `React.ReactNode` | - | 左侧面板内容（必需） |
| `right` | `React.ReactNode` | - | 右侧面板内容（必需） |
| `initialLeftWidth` | `number` | `40` | 初始左侧面板宽度（百分比，0-100） |
| `minLeftWidth` | `number` | `20` | 左侧面板最小宽度（百分比） |
| `maxLeftWidth` | `number` | `80` | 左侧面板最大宽度（百分比） |
| `className` | `string` | `""` | 自定义 CSS 类名 |

## CSS 变量自定义

所有组件都支持通过 CSS 变量进行自定义。Calendar 组件使用 `--calender-` 前缀，ResizableSplitter 组件使用 `--resizable-splitter-` 前缀。

### Calendar CSS 变量

Calendar 组件支持大量 CSS 变量来自定义外观。主要变量包括：

```css
:root {
  /* 基础颜色 */
  --calender-bg-color: #fff;
  --calender-text-color: #202124;
  --calender-primary-color: #1a73e8;
  
  /* 状态颜色 */
  --calender-today-bg-color: #e8f0fe;
  --calender-selected-bg-color: #e8f0fe;
  --calender-hover-bg-color: #f1f3f4;
  
  /* 边框 */
  --calender-border-color: #dadce0;
  --calender-border-radius: 4px;
  
  /* 字体 */
  --calender-font-family: 'Google Sans', Roboto, Arial, sans-serif;
  --calender-font-size: 14px;
  
  /* 尺寸 */
  --calender-month-cell-min-height: 100px;
  --calender-hour-cell-height: 48px;
  
  /* 过渡 */
  --calender-transition-duration: 0.2s;
}
```

完整的 CSS 变量列表请参考 `@calenderjs/calendar` 包的 `CSS_VARIABLES.md` 文档。

### ResizableSplitter CSS 变量

组件使用 CSS 变量来支持主题定制，所有变量都使用 `--resizable-splitter-` 前缀：

```css
:root {
  /* 分割器主体 */
  --resizable-splitter-width: 4px;              /* 分割器宽度 */
  --resizable-splitter-bg-color: #ddd;           /* 分割器背景色 */
  --resizable-splitter-hover-bg-color: #bbb;    /* 分割器悬停背景色 */
  --resizable-splitter-transition: background-color 0.2s; /* 过渡效果 */

  /* 分割器手柄 */
  --resizable-splitter-handle-width: 20px;       /* 手柄宽度 */
  --resizable-splitter-handle-height: 40px;      /* 手柄高度 */
  --resizable-splitter-handle-border-radius: 4px; /* 手柄圆角 */
  --resizable-splitter-handle-bg-color: rgba(0,0,0,0.1); /* 手柄背景色 */

  /* 分割器圆点 */
  --resizable-splitter-dot-size: 3px;            /* 圆点大小 */
  --resizable-splitter-dot-color: #999;         /* 圆点颜色 */
  --resizable-splitter-dot-gap: 2px;            /* 圆点间距 */
}
```

### 暗色模式示例

```css
.dark-mode {
  /* Calendar 暗色模式 */
  --calender-bg-color: #1e1e1e;
  --calender-text-color: #e0e0e0;
  --calender-border-color: #3a3a3a;
  --calender-primary-color: #4285f4;
  --calender-today-bg-color: #1a3a5a;
  --calender-hover-bg-color: #2a2a2a;
  
  /* ResizableSplitter 暗色模式 */
  --resizable-splitter-bg-color: #333;
  --resizable-splitter-hover-bg-color: #555;
  --resizable-splitter-handle-bg-color: rgba(255,255,255,0.1);
  --resizable-splitter-dot-color: #ccc;
}
```

## 注意事项

1. 确保已安装 `@calenderjs/calendar` 包
2. Web Component 会自动注册，无需手动注册
3. 组件是纯数据驱动的，只处理数据模型，不涉及 DSL
4. `ResizableSplitter` 是一个纯 React 组件，不依赖 Web Components
5. 所有组件都支持通过 CSS 变量进行主题自定义
