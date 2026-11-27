# RFC 0026: Calendar readonly/edit mode

**Status:** Implemented

## Summary

新增 Calendar 顶层 `mode` attribute/property（`"readonly" | "editable"`，默认 `"editable"`），作为统一开关：`readonly` 时短路所有 drag-move、drag-resize、keyboard-move/resize 入口，不管 DSL per-type `behavior.editable` 怎么定义。`mode="readonly"` 优先级高于（覆盖）per-type `editable: true`；`mode="editable"` 时仍受 per-type `editable: false` 约束（两层叠加，`mode` 只能收紧不能放宽）。

## Problem

当前"可编辑"只有 DSL 里按 event type 配置的 `behavior.editable`（`packages/event-model/src/runtime-types.ts:55`），经 `Calendar.wsx` 的 `canPerformAction("editable", event)` 网关生效。这个网关坐镇在 `proposeEventUpdate` 内部，而 `proposeEventUpdate` 本身只有一个调用点——`handleChildEventUpdateRequest`（`Calendar.wsx:349`），它是 WeekView/DayView/MonthView 所有拖拽、resize、keyboard-edit 操作派发 `event-update-request` 自定义事件后的**唯一**汇合点。

结果：没有办法让整个日历变成纯浏览模式（例如访客视角、历史归档视图）——除非在 DSL 里给每个 event type 都手写 `editable: false`。而且就算写了，用户仍能在 UI 上正常启动一次拖拽手势（视觉上跟手移动），只是松手提交时被权限拒绝、事件弹回原位——这一体感问题 RFC-0035（已 Implemented）已经解决：`handleChildEventUpdateRequest` 拒绝时会调用发起视图的 `showUpdateRejected(eventId)`，让事件框弹回。本 RFC 的 readonly 短路分支需要复用同一条反馈路径，否则会退化成"卡住了"的体验。

## Goals

- Calendar 新增 `mode` attribute（纳入 `observedAttributes`）与同名 property getter/setter，风格对齐现有 `view`/`date`。
- `mode="readonly"`：在 `handleChildEventUpdateRequest` 这一个汇合点短路——不调用 `proposeEventUpdate`，派发 `event-update-denied`（复用既有事件名，调用方不需要区分"权限不足"和"只读模式"两种拒绝原因），并调用 `e.target` 上的 `showUpdateRejected?.(event.id)`（复用 RFC-0035 已落地的视图弹回机制）。
- `mode="editable"`（默认，保持现状）：沿用现有 per-type `editable` 网关逻辑，不改变任何现有行为。
- **`mode` 不下发给 WeekView/DayView/MonthView**——三个视图继续对 `mode` 一无所知，继续按现状正常渲染拖拽手势、resize handle、keyboard 监听；readonly 的效果体现在"操作提交后被拒绝"，不体现在"UI 层面不让你开始操作"。
- React 封装（`packages/react/src/Calendar.tsx`）同步暴露 `mode` prop。

## Non-goals

- 不做字段级/用户级权限模型（谁能编辑谁的事件），仍是 RFC-0018 `canPerform` 的范畴。
- 不改变 per-type `editable` 的既有语义或 DSL 语法。
- 不新增除 readonly/editable 外的第三种模式（如"仅本人可编辑"）；未来需要再开新 RFC。
- 不要求 WeekView/DayView/MonthView 感知 `mode` 存在，也不要求在拖拽/resize 启动前就阻止用户发起手势——这是刻意的设计取舍（见 Design 一节），不是遗漏。

## Design

**关键决策：`mode` 的拦截点收口在 `Calendar.wsx` 一层，不下发到 WeekView/DayView/MonthView。**

当前实际现状核对（本次更新时重新读过源码）：WeekView、DayView、MonthView 三个视图均已统一使用 `packages/calendar/src/utils/pointer-drag.ts` 的 `startPointerDrag`/`onPointerDown`（无任何一处仍用原生 HTML5 `draggable`/`onDragStart`/`onDragEnd`）。拖拽机制已经是统一实现，不存在"部分视图还没迁移"的情况，`mode` 的设计不需要再等待任何拖拽重构。

若在 WeekView/DayView/MonthView 里各自判断 `mode`，短路 `onPointerDown`/`startPointerDrag`、不渲染 resize handle、keydown 里跳过 Arrow 分支——这个方案的问题是：三个视图各写一遍判断逻辑，是重复实现的信号，真正该收口到一层。

更深的设计：无论 WeekView/DayView/MonthView 内部怎么触发拖拽/resize/keyboard-edit，它们最终都走同一条路——派发 `event-update-request` 自定义事件，被 `Calendar.wsx:331` 的 `handleChildEventUpdateRequest` 接住，再转给 `proposeEventUpdate`。这就是天然的单一汇合点，`mode` 只需要在这里判断一次。

涉及文件：
- `packages/calendar/src/Calendar.wsx`：
  - `observedAttributes` 加 `"mode"`；新增 `@state _mode: "readonly" | "editable" = "editable"` + getter/setter（对齐 `view`/`date` 的实现风格）。
  - `handleChildEventUpdateRequest` 开头加判断：`mode === "readonly"` 时派发 `event-update-denied`（`detail: { event }`，与现有 `proposeEventUpdate` 内部权限拒绝时派发的事件同形状），并对 `e.target` 调用 `showUpdateRejected?.(event.id)`（与下方权限拒绝分支一致的反馈方式），`return`，不调用 `proposeEventUpdate`。
  - `renderWeekView`/`renderDayView`/`renderMonthView` **不改动**——不传 `mode` 给子视图。
- `packages/calendar/src/views/WeekView.wsx`、`DayView.wsx`、`MonthView.wsx`：**不改动**。三者继续对 `mode` 无感知，照常渲染拖拽手势/resize handle/keyboard 监听，照常在松手/按键时派发 `event-update-request`；`readonly` 下这些请求会在 Calendar 层被拒绝，视图自己不需要知道原因。
- `packages/react/src/Calendar.tsx`：`CalendarProps` 加 `mode?: "readonly" | "editable"`，走现有 attribute 同步机制（对齐 `view`/`date` 的处理方式）。
- 优先级：`mode="readonly"` 时直接短路，不再查 per-type `editable`；`mode="editable"`（默认）时保持现状，仍过 per-type `editable` 网关。

**已知的用户体感取舍（刻意，非遗漏）**：readonly 模式下，用户在 UI 上仍能正常发起一次拖拽手势（事件框跟手移动的视觉预览不受影响，因为那是视图内部状态，不经过 Calendar），松手提交时才被拒绝。这和 RFC-0035（已 Implemented 并归档于 `.spec/rfc/completed/0035-drag-rejection-feedback.md`）处理的"权限拒绝需要视觉反馈"是同一类问题，且该机制已完整落地。**现状核对（本次更新时重新读过源码，修正此前一次误判）**：RFC-0035 落地的方法名是 `showUpdateRejected(eventId)`——不是 `notifyUpdateDenied`——`Calendar.wsx:356` 的 `handleChildEventUpdateRequest` 在 `proposeEventUpdate` 返回 `false` 时，直接在派发事件的 `e.target`（即发起请求的视图实例）上调用 `source.showUpdateRejected?.(event.id)`；WeekView（`WeekView.wsx:488`）、DayView（`DayView.wsx:418`）、MonthView（`MonthView.wsx:371`）三个视图都已各自实现这个方法，用于把事件框弹回原状态。**本 RFC 的 readonly 短路分支必须复用这同一条路径**：短路时同样要在 `handleChildEventUpdateRequest` 里对 `e.target` 调用 `showUpdateRejected?.(event.id)`，不能只派发 `event-update-denied` 就完事——否则 readonly 下的拒绝会丢失视觉反馈，和 editable 下权限拒绝的体验不一致。

## Acceptance

- `mode="readonly"` 时：用户仍可在 WeekView/DayView/MonthView 发起拖拽/resize 手势（视觉预览正常跟手），但松手提交后事件不会真正更新——`event-update-request` 被 Calendar 层拦截，派发 `event-update-denied`，不触达 `proposeEventUpdate`；且发起视图的 `showUpdateRejected(eventId)` 被调用，事件框弹回原状态（和 editable 下权限拒绝的视觉反馈一致，不是新增的 UI，是复用既有机制）。
- `mode="editable"`（或不设，默认值）时：行为与当前完全一致，现有拖拽/resize/keyboard 相关测试不受影响。
- 新增单测覆盖：`mode="readonly"` 时 `handleChildEventUpdateRequest` 不调用 `proposeEventUpdate`、派发 `event-update-denied`、调用 `showUpdateRejected`；`mode="editable"` 时行为路径不变（仍调用 `proposeEventUpdate`）。
- React 包装层 `mode` prop 正确透传到底层 Web Component attribute。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：`mode="readonly"` 下拖拽一个事件，确认视觉上能拖动但松手后弹回原位；`mode="editable"` 下同样操作能正常成功提交。

## 验收记录（实际跑过，非代码推断）

- 单测：`packages/calendar` 15/15 通过（含本 RFC 新增 3 项：readonly 短路、editable 行为不变、attribute/property 一致性）；`packages/react` 10/10 通过（含本 RFC 新增 2 项：mode prop 透传、未设时不透传）。
- `pnpm --filter @calenderjs/calendar typecheck/lint`、`pnpm --filter @calenderjs/react typecheck/lint` 均通过。
- 真实浏览器验证（`pnpm dev:react`，Chrome，demo 默认 month 视图）：
  - 通过 `document.querySelector("wsx-calendar").mode = "readonly"` 设置后拖拽"团队会议"事件（11/27 → 11/25）：事件视觉上未移动，`event-update-denied` 监听器收到 `event-1`。
  - 切回 `mode = "editable"` 后同样的拖拽操作：事件成功移动到 11/25，UI 显示"已更新事件: 团队会议"确认提示。
- 本次未验证项：demo 未新增 `mode` 切换 UI 控件（不在本 RFC Design 范围内），验证通过浏览器控制台直接设置 property 完成，非点击 UI 按钮触发。
