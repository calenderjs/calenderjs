# RFC 0034: Resize 拖拽改时长实时预览 (child of 0030)

**Status:** Implemented

**Parent:** [0030](0030-drag-interaction-rework.md)

## Summary

`WeekView.wsx`/`DayView.wsx` 的 resize handle（拖拽改时长）用 RFC-0031 的 pointer-event 引擎补上缺失的实时预览：拖拽过程中事件框高度应跟随指针位置实时变化，而不是现状的"松手瞬间才跳变"。

## Problem

`WeekView.wsx` 的 `handleResizeMouseDown`（约 426-465 行）已经是基于原生 `mousedown`/`mousemove`/`mouseup`（不是 HTML5 DnD），但代码里 `// 实时预览移动` 注释下方从未实现任何逻辑——拖拽过程中事件框尺寸不变，只有松手那一刻才跳变到最终时长。用户反馈"改时间范围的事件不会跟着拖拽位置 resize"，指的正是这个视觉上的缺失。`DayView.wsx` 有同款 resize handle（约 573 行），同样缺实时预览。

## Goals

- resize handle 的 `mousedown`/`mousemove`/`mouseup` 手写逻辑改用 RFC-0031 的 `startPointerDrag`（统一到同一套引擎，不再是独立的 mouse-event 手写状态机），消除两套不同拖拽实现并存的不一致。
- `onMove` 阶段：根据指针的垂直位移实时计算预览时长，更新事件框的视觉高度（不提交数据）。
- `onEnd` 阶段：按最终位移计算新的 `endTime`，按现有的 48px/小时吸附到整小时，不改变吸附逻辑本身，只补实时反馈，然后提交 `event-update`。
- WeekView 和 DayView 的 resize 都要补上这个实时预览，保持两视图行为一致。

## Non-goals

- 不改变 resize 的吸附粒度、最小时长限制等既有业务规则——只补视觉反馈，不改判定逻辑。
- 不新增"双向 resize"（从顶部拖拽改 startTime）——现状只支持从底部 handle 拖拽改 endTime，本 RFC 不扩展这个范围。

## Design

涉及文件：
- `packages/calendar/src/views/WeekView.wsx`：`handleResizeMouseDown` 改用 RFC-0031 引擎，补实时预览状态。
- `packages/calendar/src/views/DayView.wsx`：同款改动。
- 依赖 `packages/calendar/src/utils/pointer-drag.ts`（RFC-0031）。
- 视觉反馈实现：`onMove` 直接改事件元素的临时 inline height，`onEnd`/`onCancel` 恢复原值；提交后由 Calendar 更新事件数据并重新渲染。直接 DOM 预览避免拖拽中状态渲染替换当前捕获指针的节点。

## Acceptance

- 真实浏览器实测：拖拽 resize handle 时，事件框高度随指针移动实时变化（不是松手瞬间跳变）。
- WeekView 和 DayView 都验证过，行为一致。
- 松手后最终 `endTime` 的计算结果与重构前一致（不引入回归），吸附粒度不变。
- 对应 e2e 用例新增/更新，覆盖 resize 实时预览可观察到的最终状态（e2e 测最终结果，不测中间帧动画本身）。
- 遵循 RFC-0027 金科玉律：关单前浏览器人工验证记录写入实施记录。

## Implementation record

- DayView and WeekView use RFC-0031 `startPointerDrag`. `onMove` updates the event element's temporary inline height; `onEnd` restores it before Calendar renders the committed duration.
- E18 and E19 assert that height changes before pointer release and that the committed end time changes. Chromium, Firefox, and WebKit pass.
- Browser interaction record (MCP `page.mouse` pointer input): WeekView `客户演示` grew from 124px to 172px while the pointer moved 52px. Releasing committed 14:00–17:30 and logged `已更新事件: 客户演示`.
- Verification: the RFC E2E matrix passed 33/33 across three engines. Calendar unit tests passed 107 tests.
