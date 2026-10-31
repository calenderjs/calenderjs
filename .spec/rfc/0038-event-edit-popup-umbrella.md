# RFC 0038: 日历事件编辑弹窗 (Umbrella)

**Status:** Draft

**Type:** Umbrella

## Summary

当前点击事件只能内联编辑标题一个字段（`demos/react/src/App.tsx` 的 `editingId`/`editingTitle`），没有弹窗、没有其他字段。本 umbrella 把"像 Google Calendar 一样双击/快捷键打开事件编辑弹窗，弹窗里能改多个字段"这个主题拆成两个独立关注点：触发方式（0039）和弹窗表单本身（0040）。

## Problem

现状两个缺口，都在用户请求里明确指出：

1. 打开编辑的手势不对——现在是单击直接进内联编辑，不是双击，也没有快捷键；Google Calendar 的习惯是单击选中/预览，双击或 Enter 才进编辑。
2. 编辑面能改的字段只有 `title`——`EventDataModel`/DSL 定义的其他字段（`startTime`/`endTime`、每种事件类型的 `data` 字段，如 `attendees`/`location`）都改不了。

两者是同一个用户旅程的两段（先触发、再填表），但触发机制（事件派发、点击/双击手势判定、WeekView/MonthView/DayView 三视图一致性）和表单渲染/校验/提交（DSL 字段 schema 驱动的动态表单、validate 规则、提交走哪条更新通道）是两套不同的实现关注点，分拆成 child RFC。

## Goals

- 子项 0039：把"打开事件编辑"的触发方式从单击改为双击（或快捷键），对齐 Google Calendar 习惯。
- 子项 0040：事件编辑弹窗改成真正的多字段表单，字段集合由该事件类型的 DSL 定义驱动。
- 两个子项都收口在 Month/Week/Day 三视图一致可用。

## Non-goals

- 不做事件创建弹窗的改版（新建事件走时间槽点击，`handleSlotClick`，维持现状，除非后续单开 RFC）。
- 不改变现有的权限/validate 网关语义（RFC-0018 的 `canPerform`、RFC-0035 的 validate-skip-on-direct-manipulation）——表单提交属于"数据输入提交"场景，继续走全量 validate，这是 RFC-0035 已经定的规则，不在本 umbrella 重新讨论。
- 不处理事件删除 UI（已有独立的 `.month-view-event-delete` 等机制，不动）。

## Children

| RFC | Concern |
|-----|---------|
| [0039](0039-event-edit-trigger.md) | 双击/快捷键触发事件编辑弹窗 |
| [0040](0040-event-edit-form.md) | 事件编辑弹窗：多字段表单 |

## Acceptance

两个子项都 Approved/Implemented 后关闭本 umbrella。不为新工作重开；后续如果要做"新建事件弹窗"或"删除确认弹窗"，开新 RFC 或新 umbrella。
