---
title: Getting Started
order: 1
category: guide
description: 5 分钟上手 CalenderJS：安装、第一个日历与 Event DSL。
---

# 快速开始

本指南帮助你在 5 分钟内运行第一个 CalenderJS 日历与 Event DSL。

## 安装

在已有项目中安装所需包：

```bash
# 日历组件（必选）
pnpm add @calenderjs/calendar @calenderjs/date-time @calenderjs/event-model

# Event DSL（按需）
pnpm add @calenderjs/event-dsl @calenderjs/event-runtime

# React 集成（若使用 React）
pnpm add @calenderjs/react
```

## 使用日历组件

在 HTML 中直接使用 Web Component：

```html
<wsx-calendar
  view="month"
  view-date="2025-03-01"
  events="[]"
></wsx-calendar>
```

或通过 React 包装器：

```tsx
import { Calendar } from "@calenderjs/react";

<Calendar view="month" date={new Date()} events={[]} />
```

## 使用 Event DSL

定义事件类型并编译为 Data Model：

```typescript
import { parseEventDSL, EventDSLCompiler } from "@calenderjs/event-dsl";

const dsl = `
type: meeting
name: "会议"
fields:
  - attendees: list of email, required
  - location: string
display:
  color: "#4285f4"
  icon: "meeting"
`;

const ast = parseEventDSL(dsl);
const compiler = new EventDSLCompiler();
const dataModel = compiler.compileFromAST([ast]);
```

## 下一步

- [DSL 语法指南](./dsl-guide.md)
- [演示站点](/demos) 查看完整 DSL → 日历流程
