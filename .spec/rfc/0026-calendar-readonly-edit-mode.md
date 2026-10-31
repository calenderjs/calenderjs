# RFC 0026: Calendar readonly/edit mode

**Status:** Draft

## Summary

新增 Calendar 顶层 `mode` attribute/property（`"readonly" | "editable"`，默认 `"editable"`），作为统一开关：`readonly` 时短路所有 drag-move、drag-resize、keyboard-move/resize 入口，不管 DSL per-type `behavior.editable` 怎么定义。`mode="readonly"` 优先级高于（覆盖）per-type `editable: true`；`mode="editable"` 时仍受 per-type `editable: false` 约束（两层叠加，`mode` 只能收紧不能放宽）。

## Problem

当前"可编辑"只有 DSL 里按 event type 配置的 `behavior.editable`（`packages/event-model/src/runtime-types.ts:55`），经 `Calendar.wsx` 的 `canPerformAction("editable", event)` 网关生效。这个网关坐镇在 `proposeEventUpdate` 内部，而 `proposeEventUpdate` 本身只有一个调用点——`handleChildEventUpdateRequest`（`Calendar.wsx:331`），它是 WeekView/DayView 所有拖拽、resize、keyboard-edit 操作派发 `event-update-request` 自定义事件后的**唯一**汇合点。

结果：没有办法让整个日历变成纯浏览模式（例如访客视角、历史归档视图）——除非在 DSL 里给每个 event type 都手写 `editable: false`。而且就算写了，用户仍能在 UI 上正常启动一次拖拽手势（视觉上跟手移动），只是松手提交时被权限拒绝、事件弹回原位——这是本次会话 RFC-0035 同类问题的翻版：操作被拒绝但缺乏即时反馈，体验上像是"卡住了"。

## Goals

- Calendar 新增 `mode` attribute（纳入 `observedAttributes`）与同名 property getter/setter，风格对齐现有 `view`/`date`。
- `mode="readonly"`：在 `handleChildEventUpdateRequest` 这一个汇合点短路——不调用 `proposeEventUpdate`，直接派发 `event-update-denied`（复用既有事件名，调用方不需要区分"权限不足"和"只读模式"两种拒绝原因）。
- `mode="editable"`（默认，保持现状）：沿用现有 per-type `editable` 网关逻辑，不改变任何现有行为。
- **`mode` 不下发给 WeekView/DayView**——两个视图继续对 `mode` 一无所知，继续按现状正常渲染拖拽手势、resize handle、keyboard 监听；readonly 的效果体现在"操作提交后被拒绝"，不体现在"UI 层面不让你开始操作"。
- React 封装（`packages/react/src/Calendar.tsx`）同步暴露 `mode` prop。

## Non-goals

- 不做字段级/用户级权限模型（谁能编辑谁的事件），仍是 RFC-0018 `canPerform` 的范畴。
- 不改变 per-type `editable` 的既有语义或 DSL 语法。
- 不新增除 readonly/editable 外的第三种模式（如"仅本人可编辑"）；未来需要再开新 RFC。
- 不处理 MonthView 的 drag（MonthView 当前本就没有 drag 代码，超出本 RFC；是否给 MonthView 加 drag 属于 RFC-0017 范畴）。
- 不要求 WeekView/DayView 感知 `mode` 存在，也不要求在拖拽/resize 启动前就阻止用户发起手势——这是刻意的设计取舍（见 Design 一节），不是遗漏。

## Design

**关键决策：`mode` 的拦截点收口在 `Calendar.wsx` 一层，不下发到 WeekView/DayView。**

RFC-0026 最初草案（写于 RFC-0032 重构拖拽机制之前）设想的是在 WeekView/DayView 里各自判断 `mode`，短路 `draggable`/`onDragStart`/`onDragEnd`、不渲染 resize handle、keydown 里跳过 Arrow 分支——这个方案有两个问题：
1. 两个视图各写一遍判断逻辑，是重复实现的信号（真正该收口到一层）。
2. 和拖拽机制的具体实现细节强耦合——写的时候 WeekView 用的还是原生 HTML5 DnD（`draggable`/`onDragStart`），RFC-0032 已经把它换成 pointer-event（`onPointerDown`/`startPointerDrag`），RFC-0033 还要再对 DayView 做一次同样的重构。如果 `mode` 的判断逻辑散在视图层、绑死在"怎么拖"的具体 API 上，每次拖拽实现换代都要跟着重新改一遍。

更深的设计：无论 WeekView/DayView 内部怎么触发拖拽/resize/keyboard-edit，它们最终都走同一条路——派发 `event-update-request` 自定义事件，被 `Calendar.wsx:331` 的 `handleChildEventUpdateRequest` 接住，再转给 `proposeEventUpdate`。这就是天然的单一汇合点，`mode` 只需要在这里判断一次。

涉及文件：
- `packages/calendar/src/Calendar.wsx`：
  - `observedAttributes` 加 `"mode"`；新增 `@state _mode: "readonly" | "editable" = "editable"` + getter/setter（对齐 `view`/`date` 的实现风格）。
  - `handleChildEventUpdateRequest` 开头加判断：`mode === "readonly"` 时直接派发 `event-update-denied`（`detail: { event }`，与现有 `proposeEventUpdate` 内部权限拒绝时派发的事件同形状），`return`，不调用 `proposeEventUpdate`。
  - `renderWeekView`/`renderDayView`/`renderMonthView` **不改动**——不传 `mode` 给子视图。
- `packages/calendar/src/views/WeekView.wsx`、`DayView.wsx`：**不改动**。两者继续对 `mode` 无感知，照常渲染拖拽手势/resize handle/keyboard 监听，照常在松手/按键时派发 `event-update-request`；`readonly` 下这些请求会在 Calendar 层被拒绝，视图自己不需要知道原因。
- `packages/react/src/Calendar.tsx`：`CalendarProps` 加 `mode?: "readonly" | "editable"`，走现有 attribute 同步机制（对齐 `view`/`date` 的处理方式）。
- 优先级：`mode="readonly"` 时直接短路，不再查 per-type `editable`；`mode="editable"`（默认）时保持现状，仍过 per-type `editable` 网关。

**已知的用户体感取舍（刻意，非遗漏）**：readonly 模式下，用户在 UI 上仍能正常发起一次拖拽手势（事件框跟手移动的视觉预览不受影响，因为那是 WeekView 内部状态，不经过 Calendar），松手提交时才被拒绝。这和 RFC-0035 处理的"权限拒绝需要视觉反馈"是同一类问题——`handleChildEventUpdateRequest` 拒绝时需要调用发起方视图的 `notifyUpdateDenied(eventId)` 方法（RFC-0035 落地的机制，用于跨 ShadowRoot 通知 WeekView/DayView），否则用户体验是"拖得动但松手无效、不知道为什么"。本 RFC 的 readonly 短路分支复用同一个 `notifyUpdateDenied` 出口，不新增一套通知机制。

## Acceptance

- `mode="readonly"` 时：用户仍可在 WeekView/DayView 发起拖拽/resize 手势（视觉预览正常跟手），但松手提交后事件不会真正更新——`event-update-request` 被 Calendar 层拦截，派发 `event-update-denied`，不触达 `proposeEventUpdate`。
- `event-update-denied` 派发后，WeekView/DayView 必须有可感知的视觉反馈（事件框弹回原状态+短暂提示），通过调用 RFC-0035 落地的 `notifyUpdateDenied(eventId)` 方法实现（如果 RFC-0035 已落地）；不能是静默失败。
- `mode="editable"`（或不设，默认值）时：行为与当前完全一致，现有 RFC-0020/0021/0032 的拖拽/resize/keyboard 测试不受影响。
- 新增单测覆盖：`mode="readonly"` 时 `handleChildEventUpdateRequest` 不调用 `proposeEventUpdate`、直接派发 `event-update-denied`；`mode="editable"` 时行为路径不变（仍调用 `proposeEventUpdate`）。
- React 包装层 `mode` prop 正确透传到底层 Web Component attribute。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：`mode="readonly"` 下拖拽一个事件，确认视觉上能拖动但松手后弹回原位，有拒绝提示；`mode="editable"` 下同样操作能正常成功提交。
