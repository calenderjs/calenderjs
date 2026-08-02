---
title: Event DSL 指南
order: 2
category: guide
description: Event DSL 语法与结构说明。
---

# Event DSL 指南

Event DSL 用于声明式定义事件类型、字段、校验规则与展示规则。

## 基本结构

```yaml
type: meeting
name: "会议"
description: "可选描述"

fields:
  - title: string, required
  - attendees: list of email
  - location: string

validate:
  attendees.count between 1 and 50

display:
  color: "#4285f4"
  icon: "meeting"

behavior:
  editable: true
  draggable: true
```

## 字段类型

- `string`、`number`、`boolean`
- `list of <type>`：如 `list of email`
- `required` 表示必填

## 校验规则

在 `validate:` 下写约束，例如：

- `attendees.count between 1 and 50`
- `startTime.hour >= 9`

## 展示

- `display.color`：事件块颜色
- `display.icon`：图标标识

编译后由 `@calenderjs/event-runtime` 在运行时做校验与渲染。
