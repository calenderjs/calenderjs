# RFC 0039: 双击/快捷键触发事件编辑弹窗 (child of 0038)

**Status:** Implemented

**Parent:** [0038](../0038-event-edit-popup-umbrella.md)

## Summary

MonthView/WeekView/DayView 三视图里，事件元素目前都是单击（`onClick`）直接触发 `event-click`；本 RFC 把"打开编辑"换成双击或键盘 Enter/Space，单击改为只派发选中/预览信号，不再直接进编辑态——对齐 Google Calendar 的交互习惯。

## Problem

三视图现状（均已读源码确认）：

- `WeekView.wsx:711`、`DayView.wsx:541`（变量名不同但同构）、`MonthView.wsx:408-413`：`.{view}-event` 元素的 `onClick` 直接调用 `handleEventClick`，派发 `event-click`，宿主应用（demo）据此进入编辑态（`App.tsx:213-218` 的 `handleEventClick` 直接 `setEditingId`）。单击 = 编辑，没有"先选中、看一眼"的中间态。
- 键盘路径不统一：WeekView（`WeekView.wsx:531-534`）和 DayView（`DayView.wsx:429` 起同构逻辑）的 `handleEventKeyDown` 已经把 Enter/Space 映射到 `handleEventClick`，但 MonthView 的 `.month-view-event` 完全没有 `tabIndex`/`onKeyDown`——不可聚焦、键盘不可达，确认过（`grep` 全文件无匹配）。
- 没有 `dblclick` 监听，三个视图都没有。
- 拖拽判定（WeekView/DayView 的 `DRAG_THRESHOLD` + `_suppressNextClick`）只区分"点击 vs. 拖拽"，不区分"单击 vs. 双击"——双击手势要新增判定，不能和现有拖拽阈值逻辑混在一起，否则拖拽结束的 `onEnd` 回调和 dblclick 事件可能重复触发或互相干扰。

## Goals

- 三视图的事件元素改为双击（`dblclick`）触发打开编辑弹窗（弹窗本身是 0040 的范围，本 RFC 只管触发信号）。
- 新增独立事件名 `event-edit-request`（`detail: { event }`，与 `event-click` 同形状但语义不同），双击、以及键盘 Enter/Space 都派发这个事件，不复用 `event-click`。
- 单击（`event-click`）保留，但语义改为"选中/预览"，不再触发编辑态——宿主应用（demo）自行决定单击后做什么（例如只是高亮，不打开任何表单）。
- MonthView 的 `.month-view-event` 补上 `tabIndex={0}` + `onKeyDown`，对齐 WeekView/DayView 的 Enter/Space → `event-edit-request` 行为，三视图键盘可达性一致。
- 双击判定与现有拖拽手势（`handleEventPointerDown`/`startPointerDrag`）互不干扰：一次拖拽结束不应同时触发 dblclick；一次双击不应被拖拽阈值逻辑吃掉。

## Non-goals

- 不实现编辑弹窗本身（UI、字段、提交）——0040 的范围。
- 不改变现有的拖拽/resize/MonthView 拖拽改日期逻辑（RFC-0031~0036）。
- 不改变 `.month-view-event-delete` 删除按钮的点击行为。
- 不新增"单击预览"的具体 UI 表现（高亮/弹出小卡片等）——本 RFC 只保证 `event-click` 继续派发，具体宿主怎么用由应用层决定，不在 Calendar 组件里规定视觉效果。
- 不处理触屏双击等价手势（如双击模拟的 touch 事件）——桌面鼠标 dblclick 和键盘 Enter/Space 是本 RFC 的两条路径，移动端不在范围内。

## Design

涉及文件：

- `packages/calendar/src/views/MonthView.wsx`、`WeekView.wsx`、`DayView.wsx`：
  - 事件元素的 `onClick` 保留原样（继续派发 `event-click`，语义收窄为"选中/预览"）。
  - 新增 `onDblClick`（WSX 对应 DOM `ondblclick`），调用新方法 `handleEventEditRequest(event)`，派发 `event-edit-request`（`detail: { event }`, `bubbles: true`，与 `event-click`/`event-update-request` 同风格）。
  - `handleEventKeyDown`（WeekView/DayView 已有，MonthView 新增）：Enter/Space 改派发 `event-edit-request`（不再调用 `handleEventClick`/`event-click`）——键盘路径直接对标"双击"语义，不是"单击"语义。
  - MonthView `.month-view-event` 补 `tabIndex={0}` + 新增 `handleEventKeyDown`（Enter/Space → `event-edit-request`），抄 WeekView/DayView 的实现模式。
  - 双击与拖拽互不干扰：浏览器原生 `dblclick` 在两次 `click` 之后才触发，而拖拽路径走的是 `pointerdown`/`pointermove`/`pointerup`（`startPointerDrag`），两套事件互相独立，不共享状态；唯一需要注意的是 `handleEventPointerDown` 里 `e.preventDefault()`（`WeekView.wsx:400`）是否会抑制后续 `click`/`dblclick`——需要在实现时用真实浏览器验证一次点击-双击序列不会被拖拽逻辑吃掉（已有 `_suppressNextClick` 机制处理"拖拽结束抑制紧接的一次 click"，双击时序需要确认两次 click 都不被吃或都被正确处理）。
- `packages/calendar/src/Calendar.wsx`：子视图事件在 ShadowRoot 汇合后由宿主重新派发（`handleChildEventClick`，`event-forwarding.test.ts` 覆盖）。新增同构的 `handleChildEventEditRequest`，监听子视图的 `event-edit-request`，展开 `@state` Proxy 后从宿主重新派发，保证公开事件只触发一次、`target` 为 calendar。
- MonthView 事件元素的 `dblclick` 处理器必须 `stopPropagation()`：`.month-view-cell` 已有 `onDblClick` → `date-double-click`，不拦截的话双击事件会同时派发 `date-double-click`。
- `demos/react/src/App.tsx`：
  - 新增 `handleEventEditRequest` 监听 `event-edit-request`，替换现在 `handleEventClick` 里"点击就进编辑态"的逻辑（`setEditingId`/`setEditingTitle` 移到这个新 handler）。
  - `handleEventClick`（监听 `event-click`）改为仅做选中/预览（例如只 `console.log`，不再 `setEditingId`），避免和新的编辑触发语义混淆；具体"选中"要不要做可见 UI 效果留给 0040 或后续迭代判断，本 RFC 不强制。
- `packages/react/src/Calendar.tsx`：新增 `onEventEditRequest` prop，走现有 attribute/事件转发机制（对齐 `onEventClick`/`onEventUpdate` 的处理方式）。

## Acceptance

- 双击 MonthView/WeekView/DayView 的任意事件，均派发 `event-edit-request`，不是 `event-click`。
- 单击任意事件，仍派发 `event-click`，不派发 `event-edit-request`。
- MonthView 的事件元素可以 Tab 聚焦，聚焦后按 Enter 或 Space 派发 `event-edit-request`。
- WeekView/DayView 聚焦事件后按 Enter/Space 派发 `event-edit-request`（不再是 `event-click`）。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：拖拽一个事件到新时间/日期，松手后不应同时触发 `event-edit-request`；正常双击事件应可靠打开（不被拖拽逻辑吞掉）。
- 新增单测覆盖三视图的 `event-edit-request` 派发路径（双击 + 键盘两条）与 `event-click` 语义不变。
- React 包装层 `onEventEditRequest` prop 正确转发。
- 双击 MonthView 事件只派发 `event-edit-request`，不派发 `date-double-click`。
- Calendar 宿主对每次 `event-edit-request` 只重新派发一次，`target` 为 calendar，`detail.event` 为普通对象。
- 现有 e2e `demo.spec.ts`（"点击事件打开内联编辑栏"）改为双击触发；`navigation.spec.ts` 对 `Event clicked:` 日志的断言保持不变（单击仍派发 `event-click`）。
