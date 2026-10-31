# RFC 0033: DayView 接入 pointer-event 拖拽 (child of 0030)

**Status:** Implemented

**Parent:** [0030](0030-drag-interaction-rework.md)

## Summary

`DayView.wsx` 里把事件移动（改时间）的实现从原生 HTML5 DnD 换成 RFC-0031 的 pointer-event 引擎，解法与 RFC-0032（WeekView）同构，但 DayView 只有单列、无需处理跨日期。

## Problem

本次会话实测的关键证据就来自 DayView：用真实鼠标拖拽手势（`left_click_drag`，等价于用户物理操作）对 `DayView.wsx` 当前基于原生 DnD 的事件框**完全不触发**——事件纹丝不动，而同一个操作换成 JS 直接派发 `DragEvent` 序列却能成功。这证明原生 DnD 的手势识别层本身就不可靠，是用户反馈"拖一次就卡住"的真实机制：不是代码逻辑卡死，是浏览器根本没识别出这是一次拖拽手势，静默无响应。

## Goals

- 事件移动改时间用 RFC-0031 的 `startPointerDrag` 重新实现：`pointerdown` 启动，`onMove` 实时更新事件框视觉位置（按小时格吸附或自由移动，具体吸附粒度沿用现有行为），`onEnd` 提交最终 `startTime`/`endTime` 到 `event-update`。
- 拖拽过程中事件框跟手移动，与 RFC-0032 要求一致的视觉连续性。
- 移除 `draggable="true"`、`onDragStart`/`onDragEnd`/`onDragOver`/`onDrop`。
- 新机制必须用真实鼠标手势（不是合成 DragEvent）反复测试验证稳定触发——这是本 RFC 存在的直接原因。

## Non-goals

- 不改动 resize——RFC-0034 范围。
- DayView 本身无跨日期拖拽需求（单列），不新增。

## Design

涉及文件：
- `packages/calendar/src/views/DayView.wsx`：替换现有 `handleDragStart`/`handleDragEnd`/`handleDragOver`/`handleDrop`（约 376 行起）为基于 RFC-0031 引擎的实现。
- 依赖 `packages/calendar/src/utils/pointer-drag.ts`（RFC-0031）。
- 实现模式参考 RFC-0032 在 WeekView 的落地方式，保持两个视图的拖拽代码风格一致。

## Acceptance

- **真实鼠标手势**（不是 JS 合成 DragEvent）连续多次拖拽（至少 3 次）稳定触发 `event-update`——这是本 RFC 要解决的具体 bug，验证方式必须用真实指针输入，不能只用程序派发的事件证明"逻辑是对的"。
- 拖拽过程中事件框可见地跟手移动。
- `event-update` payload 的 `startTime`/`endTime` 正确反映拖拽目标时间。
- 对应 e2e 用例新增/更新，三引擎通过。
- 遵循 RFC-0027 金科玉律：关单前浏览器人工验证记录写入实施记录。

## Implementation record

- `DayView.wsx` uses RFC-0031 `startPointerDrag` for event movement. Resize-handle detection reads `composedPath()` so shadow-DOM pointer targets resolve correctly.
- E16 performs three consecutive real pointer drags and checks each committed time. Chromium, Firefox, and WebKit pass.
- Browser interaction record (MCP `page.mouse` pointer input): moved `团队会议` to 14:00–16:00. The event block grew from 60px to 108px during resize, then committed with `已更新事件: 团队会议`.
- Verification: the RFC E2E matrix passed 33/33 across three engines. Calendar unit tests passed 107 tests.
