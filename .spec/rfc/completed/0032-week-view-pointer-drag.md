# RFC 0032: WeekView 接入 pointer-event 拖拽 (child of 0030)

**Status:** Implemented

**Parent:** [0030](0030-drag-interaction-rework.md)

## Summary

`WeekView.wsx` 里把事件移动（改时间+可能跨列改日期）的实现从 `draggable`/`dragstart`/`dragover`/`drop`/`dataTransfer` 换成 RFC-0031 的 pointer-event 引擎，并在拖拽过程中加实时视觉反馈（事件框跟手移动）。

## Problem

`WeekView.wsx:375-424` 当前的 `handleDragStart`/`handleDragEnd`/`handleDragOver`/`handleDrop` 全部基于原生 HTML5 DnD。本次会话实测：用真实 `DragEvent` 序列验证逻辑本身是对的（日期+时间都能正确更新），但原生 DnD 的手势识别层对真实指针输入不稳定（在 DayView 同款机制下，真实鼠标拖拽完全不触发），用户体验为"有时能拖有时不能"。另外拖拽过程中事件框不会跟手移动，只有松手瞬间跳变到新位置，视觉上生硬、不专业。

## Goals

- 事件的"移动改时间/跨列改日期"用 RFC-0031 的 `startPointerDrag` 重新实现：`pointerdown` 在事件框上启动拖拽，`onMove` 根据相对位移实时计算当前悬停的日期列+小时格并更新事件框的视觉位置（CSS transform 或重新计算 top/left，不触发实际数据提交），`onEnd` 时才真正计算最终目标日期+小时并提交 `event-update`。
- 拖拽过程中事件框必须跟手移动，提供连续视觉反馈（不再是"松手瞬间跳变"）。
- 保留现有列边界判定逻辑（拖出当前周视图范围之外的处理方式与现状一致，不新增跨周拖拽）。
- 移除 `draggable="true"` 属性和所有 `onDragStart`/`onDragEnd`/`onDragOver`/`onDrop` handler（改用 pointer 事件）。

## Non-goals

- 不改动 resize（拖拽改时长）——那是 RFC-0034 的范围，即便两者都用同一个 RFC-0031 引擎。
- 不改变 hour-cell 的 DOM 结构或 key 策略（RFC-0029 已修好的 168 格渲染不受影响）。
- 不新增跨周/跨月拖拽能力。

## Design

涉及文件：
- `packages/calendar/src/views/WeekView.wsx`：替换 `handleDragStart`/`handleDragEnd`/`handleDragOver`/`handleDrop`，改为基于 RFC-0031 `startPointerDrag` 的新实现；移除事件框上的 `draggable`/`onDragStart`/`onDragEnd`，hour-cell 上移除 `onDragOver`/`onDrop`。
- 依赖 `packages/calendar/src/utils/pointer-drag.ts`（RFC-0031 产出）。
- 拖拽中的视觉反馈：维护一个临时状态（如 `@state draggingPreview`）记录当前预览位置，渲染时若存在预览状态则用预览位置覆盖实际数据位置。

## Acceptance

- 真实浏览器连续测试（鼠标/触控板手势，不只是 JS 派发的合成 DragEvent）：至少连续 3 次拖拽均成功触发，不出现"有时不触发"。
- 拖拽过程中事件框可见地跟随指针位置实时移动。
- 跨列拖拽（改日期）和同列拖拽（只改时间）都通过手动验证，`event-update` payload 的 `startTime`/`endTime` 符合拖拽目标格。
- 对应 e2e（`demos/react/e2e/week-drag.spec.ts` 或新增用例）更新/新增，覆盖新实现下的拖拽路径，三引擎通过。
- 遵循 RFC-0027 金科玉律：关单前必须有真实浏览器人工验证记录。

## 实施记录

- `WeekView.wsx`：`handleDragStart`/`handleDragEnd`/`handleDragOver`/`handleDrop` 替换为 `handleEventPointerDown` + `commitEventDrop`，基于 RFC-0031 的 `startPointerDrag`。新增 `@state _dragPreview` 记录拖拽中的实时偏移（渲染时用 `transform: translate(dx, dy)` 覆盖），松手时用 `findMatchAtPoint`（RFC-0031 新增的跨 shadow DOM 命中测试工具）在指针坐标找真实落点 hour-cell，换算新的 `startTime`/`endTime`，照旧派发 `event-update-request`（Calendar.wsx 的 `proposeEventUpdate` 网关行为不变）。hour-cell 增加 `data-column-date`/`data-hour` 属性供落点查找读取。移除 `draggable`/`onDragStart`/`onDragEnd`/`onDragOver`/`onDrop`。resize handle 的 `onMouseDown` 加了 `closest(".week-view-resize-handle")` 判断，避免被新的 `onPointerDown` 吞掉。
- 加了一个 4px 的拖拽判定阈值（`DRAG_THRESHOLD`），位移小于阈值视为点击（保留点击打开事件的行为），通过 `_suppressNextClick` 标记避免拖拽结束后紧跟着误触发 `handleEventClick`。
- **过程中发现并修复三个真实 bug（均非凭空猜测，均实测复现）：**
  1. **`document.elementsFromPoint` 不穿透 shadow DOM**：WeekView/DayView 都嵌套在 `<wsx-calendar>` 的 shadow DOM 里，命中测试在 host 元素那层就停住，永远找不到真正的 hour-cell。修复：RFC-0031 的 `pointer-drag.ts` 新增 `elementFromPointDeep`/`findMatchAtPoint`，手动逐层下钻 `shadowRoot.elementFromPoint`。
  2. **`setPointerCapture` 对合成/非真实指针输入会抛 `NotFoundError`**：Chrome 的 `left_click_drag`（CDP 合成鼠标手势）触发的 `pointerdown` 没有建立"活跃指针"，调用 `setPointerCapture` 直接抛错，由于原代码用 `target?.setPointerCapture?.()` 的可选链不捕获异常，整个 `startPointerDrag` 函数体在第一行就被中断，`pointermove`/`pointerup` 的监听器从未注册。修复：`setPointerCapture`/`releasePointerCapture` 都包一层 `try/catch`，失败时静默跳过（拖拽仍可继续，只是失去跨元素边界持续追踪的保证）。这个问题同样会影响触控板等非鼠标输入的边缘情况，不只是测试工具。
  3. **拖拽预览框的 `pointer-events` 没有关掉，导致松手瞬间命中测试打到自己**：`_dragPreview` 状态在 `onEnd` 回调里先被清空（`this._dragPreview = null`），但 WSX 的 `@state` 更新是异步应用到 DOM 的；`commitEventDrop` 紧接着同步执行命中测试时，DOM 上的预览 `transform` 还没清除，预览框仍然视觉覆盖在松手点上方，`elementFromPointDeep` 命中的是预览框本身而非它下面的 hour-cell，`closest()` 找不到匹配，拖拽悄悄失败。修复：`.week-view-event.dragging` 加 `pointer-events: none`，命中测试直接穿透拖拽中的事件框。
- 浏览器真实验证（Claude in Chrome + 真实鼠标 `left_click_drag` 手势，不是 JS 合成 DragEvent，针对 bug 3 的真实发生场景做了针对性复测）：
  - 第一次拖拽：周日 10:00"团队会议"→ 周一 13:00，`event-update-request`→`event-update` 链路触发，UI 显示"已更新事件: 团队会议"，事件正确落在周一 13:00-14:00。
  - 第二次连续拖拽（同一事件）：周一 13:00 → 周三 10:00，同样成功，证明不存在"拖一次就卡住"。
  - 两次拖拽都同时改变了日期（跨列）和时间（跨小时格），不是只改日期不改时间。
- e2e：`demos/react/e2e/week-drag.spec.ts` 新增 `E15`（连续两次真实拖拽 + 验证同时改日期和时间），保留原有 `E14`（RFC-0029 的跨列场景）不变。三引擎 `pnpm test:e2e`：72/72 全绿，RFC-0015 覆盖率门禁通过（demo src lines/statements 100%，functions 96.77%，branches 97.56%，门槛 94%/90%）。
- 单元测试：`pointer-drag.test.ts` 新增 `elementFromPointDeep`/`findMatchAtPoint` 测试（4 条）+ `setPointerCapture` 抛错容错测试（1 条），calendar 包总测试数 106（含原有全部用例），`WeekView.test.ts` 里原先断言 `draggable="true"` 属性的用例改为断言 `.draggable` class（机制替换后不再有该原生属性）。
