# RFC 0031: 共用 pointer-event 拖拽引擎 (child of 0030)

**Status:** Implemented

**Parent:** [0030](0030-drag-interaction-rework.md)

## Summary

新增一个 WeekView/DayView 共用的 pointer-event 拖拽辅助模块，封装"按下→跟手移动→松手提交"的通用状态机，替代原生 HTML5 `draggable`/`dataTransfer`。0032/0033/0034 都在这个引擎之上接入各自的业务逻辑（改时间、跨列改日期、改时长），本 RFC 只负责底层机制，不改任何视图组件的渲染或业务逻辑。

## Problem

见父 RFC-0030 Problem：原生 DnD 对真实指针输入的识别不稳定（实测真实鼠标手势在 Day 视图完全不触发 `dragstart`），且没有中间态坐标可用于实时视觉反馈。三个消费场景（Week 移动、Day 移动、resize）如果各自写一遍 pointer 状态机，会重复三份几乎相同的 down/move/up 处理逻辑，且难以保证行为一致（例如都需要处理指针丢失、`pointercancel`、拖出视口等边界）。

## Goals

- 新增 `packages/calendar/src/utils/pointer-drag.ts`（或等价位置，视 `packages/calendar/src/utils/` 现有结构命名），导出一个可复用的拖拽辅助函数/类，接口形如：
  ```ts
  startPointerDrag(downEvent: PointerEvent, handlers: {
    onMove: (dx: number, dy: number, moveEvent: PointerEvent) => void;
    onEnd: (dx: number, dy: number, endEvent: PointerEvent) => void;
    onCancel?: () => void;
  }): void
  ```
  具体签名在实现时可调整，但必须覆盖：`pointerdown` 触发、`pointermove` 持续回调相对位移、`pointerup` 提交最终位移、`pointercancel`/指针丢失时安全中止（不留下监听器泄漏）。
- 内部用 `setPointerCapture`/`releasePointerCapture` 保证拖拽过程中指针移出元素边界也能持续收到 move 事件（这是原生 DnD 做不到、需要手写状态机替代的关键能力）。
- 不依赖任何具体业务语义（不知道"小时格"、"事件"是什么），保持通用、可被 WeekView/DayView/resize 三处复用。
- 附带最小单元测试（vitest），覆盖 down→move→up 的正常路径和 down→cancel 的中止路径。

## Non-goals

- 不在本 RFC 里接入任何实际视图——0032/0033/0034 各自负责接入和业务逻辑。
- 不处理触屏多指手势（当前日历组件面向桌面鼠标/触控板场景，多点触控不在范围内）。
- 不改变 `event-update`/`event-update-request` 等既有自定义事件的名称或语义。

## Design

涉及文件：
- 新增 `packages/calendar/src/utils/pointer-drag.ts`：核心拖拽状态机。
- 新增 `packages/calendar/src/utils/pointer-drag.test.ts`：单元测试。
- 不改动 `WeekView.wsx`/`DayView.wsx`——留给子 RFC 0032/0033/0034。

技术要点：
- 用 `pointerdown`（而非 `mousedown`/`touchstart`）作为起点，同时兼容鼠标和触控板，且原生支持 `setPointerCapture`。
- `onMove` 回调给相对位移（dx/dy）而非绝对坐标，调用方自行换算成"第几小时格"/"第几天列"，引擎本身不耦合网格布局。
- 清理：无论 `pointerup`/`pointercancel`，都必须移除 `pointermove`/`pointerup`/`pointercancel` 监听器，避免泄漏。

## Acceptance

- `pointer-drag.ts` 单元测试通过：模拟 down→move→up 序列，`onMove` 被正确调用且传入正确的相对位移；down→cancel 序列触发 `onCancel` 而非 `onEnd`。
- 代码不依赖任何 WeekView/DayView 特定的类名或业务字段，可被三个子 RFC 直接 import 使用。
- `pnpm --filter @calenderjs/calendar test` 全绿。
