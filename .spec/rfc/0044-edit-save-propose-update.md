# RFC 0044: 编辑保存通过变更提议通知 host (child of 0038)

**Status:** Approved

**Parent:** [0038](0038-event-edit-popup-umbrella.md)

## Summary

编辑器只维护当前编辑的 Event 草稿。保存时，Calendar 通过 `proposeEventUpdate(updatedEvent)` 检查权限和 DSL 校验规则，然后向 host 派发 `event-update`。Calendar 不把草稿写入自己的权威事件状态；host 决定如何处理变更，并通过更新 `events` 属性把接受后的 Event 传回 Calendar。

本 RFC 定义现有 React demo 的编辑保存数据流，并补齐 React wrapper 所需的调用与错误事件转发。变更载荷是符合当前 DSL 规则的 Event 实例，不是 DSL 定义文本。

## Problem

React demo 的编辑保存路径直接调用 `setEvents`，绕过 Calendar 的 `proposeEventUpdate`。这让保存路径没有经过 `editable` 权限和 DSL 校验，也没有通过 Calendar 的 `event-update` 通道通知 host。与此同时，React wrapper 没有在 `CalendarRef` 上暴露 `proposeEventUpdate`，也没有转发 `event-update-denied` 和 `event-update-error`。

Calendar 的 `events` 由 React props 提供，host 才是事件数据的权威拥有者。若 Calendar 保存时自行改内部事件，React props 与组件内部状态会出现两份权威数据；后续 props 更新还可能覆盖组件内改动。

## Goals

- 将编辑草稿与当前 `events` 分开。编辑中只改草稿，不提前改 host 或 Calendar 的事件数据。
- 保存时调用 Calendar 的 `proposeEventUpdate(updatedEvent)`。该方法现有权限和校验行为保持不变。
- `CalendarRef` 暴露 `proposeEventUpdate(event): boolean`，直接转发到底层 Web Component，不添加业务逻辑。
- React wrapper 转发 `event-update-denied` 和 `event-update-error`，让 demo 能区分权限拒绝与校验失败。
- Demo host 收到 `event-update` 后自行决定如何处理变更；接受时更新自己的 `events` state，再通过 props 传回 Calendar。
- 权限拒绝或 DSL 校验失败时，不更新事件，保留编辑草稿并显示对应错误。

## Non-goals

- 不修改 DSL 定义文本。DSL 描述事件类型和规则；本 RFC 发送的是变更后的 Event 实例。
- 不让 Calendar 和 host 同时持有可写的权威事件副本。
- 不改变 `proposeEventUpdate`、`canPerformAction`、`validateEventForUpdate` 的签名或语义。
- 不实现 host 的数据库持久化、异步审批或异步失败回传协议。`proposeEventUpdate` 返回 `true` 仅表示权限/校验通过且 `event-update` 已派发，不代表 host 或后端已持久化。
- 不改变编辑器的打开手势、表单字段或 UI 形态；这些分别由 RFC-0039 和 RFC-0040 负责。

## Design

数据流：

1. `event-edit-request` 携带当前 Event；demo 用它初始化独立编辑草稿。
2. 用户编辑草稿。当前 `events` 和日历视图保持不变。
3. 保存调用 `calendarRef.current.proposeEventUpdate(updatedEvent)`。
4. Calendar 运行现有 `editable` 权限检查和 DSL 校验。拒绝时派发 `event-update-denied` 或 `event-update-error`；通过时派发 `event-update`，detail 仍为 `{ event }`。
5. Demo host 收到 `event-update` 后决定是否以及如何更新自己的 `events` state。更新后的 props 是 Calendar 显示新值的唯一来源。

编辑 UI 在提议通过组件权限/校验并派发后关闭。异步持久化确认和失败反馈由 host 管理；Calendar 不把 `proposeEventUpdate` 的返回值解释为后端保存成功。

涉及文件：

- `packages/react/src/Calendar.tsx`：
  - 在 `CalendarRef` 增加 `proposeEventUpdate(event: Event): boolean`，转发到底层元素的方法。
  - 增加 `onEventUpdateDenied` 和 `onEventUpdateError` props，并绑定/清理对应 DOM 事件监听器。错误 payload 使用底层现有事件 detail，不改组件事件契约。
- `demos/react/src/App.tsx`：
  - `handleSaveEdit` 只构造草稿 Event 并调用 ref 方法，不直接调用 `setEvents`。
  - `handleEventUpdate` 作为 demo host 的处理入口，决定接受后更新 `events` state；Calendar 随后通过 `events` props 收到新数据。
  - 监听权限拒绝和校验错误。两种错误都保留草稿和编辑 UI；显示对应提示。
- `demos/react/e2e/demo.spec.ts`：增加真实浏览器验收，验证 Demo 中用户可完成编辑保存及错误反馈；不能只用组件单测或 mock 代替。
- `packages/calendar/src/Calendar.wsx`：不改动。现有 `proposeEventUpdate` 已检查权限、校验并派发结果事件。

同步 host 在 `event-update` 回调中更新 state 后，Calendar 通过新 props 显示事件。若 host 不更新数据，Calendar 保持原 Event；事件通知本身不等于持久化确认。

### Task 1: 暴露 React 更新提议 API

- 文件：`packages/react/src/Calendar.tsx`、`packages/react/src/__tests__/Calendar.test.tsx`
- 在 `CalendarRef` 增加 `proposeEventUpdate(event)` 转发，并转发拒绝/校验失败回调。
- 通过真实 React wrapper 测试验证 ref 调用到底层方法、三个更新结果事件被正确转发及卸载时监听器清理。
- 预期：React 使用方能提交 Event 提议并观察拒绝原因；wrapper 不自行修改事件数据。

### Task 2: 接通 React Demo host 数据流

- 文件：`demos/react/src/App.tsx`
- 保存操作只提交编辑草稿；`handleEventUpdate` 在 host 层接受提议并更新 `events` state；Calendar 通过新 props 呈现变更。
- 权限拒绝或 DSL 校验失败时保留草稿并显示错误。移除保存按钮直接改 `events` 的路径。
- 预期：Demo 展示单一权威数据流，成功更新经 `event-update`，失败不改事件。

### Task 3: 增加 Demo 浏览器验收

- 文件：`demos/react/e2e/demo.spec.ts`
- 用 Playwright 真实浏览器覆盖成功保存与 host 回传、权限拒绝、DSL 校验失败及错误反馈。
- 每个 E2E 场景标注 P0/P1/P2；不以 mock、单测或静态断言替代用户流程。
- 预期：React Demo 在真实浏览器证明保存事件、host state 和 Calendar props 完成闭环。

## Acceptance

- React Demo 必须提供真实可操作的事件编辑保存流程，展示 host 接收变更、更新 `events`、Calendar 根据新 props 刷新的完整闭环；权限拒绝和 DSL 校验错误也必须对用户可见。
- 单测覆盖 ref 转发、成功提议事件、host 接受后回传 props、权限拒绝和校验失败路径。相关单测通过率为 100%；失败或跳过的相关用例不算通过。
- `demos/react/e2e/demo.spec.ts` 必须有真实浏览器 E2E 覆盖以上 Demo 行为，适用场景通过率为 100%：
  - P0（数据完整性）：权限拒绝或 DSL 校验失败后，host 的 Event 和 Calendar 显示值都不变。
  - P1（核心流程）：打开编辑 → 修改 → 保存 → 派发 `event-update` → host 更新 state → Calendar 收到新 props 并显示新值。
  - P2（错误反馈）：拒绝/校验失败时编辑草稿保留，用户能看到对应错误。
  - 每个场景记录实际浏览器及执行结果；如某优先级不适用，明确说明理由。
- 实际启动 React Demo 并在浏览器走通上述交互；运行 `pnpm --filter @calenderjs/demos-react test:e2e`，记录报告及各优先级通过率。仅有单测、mock 或静态检查不算 E2E 验收。
- RFC 涉及生产代码时，受影响包按可覆盖行数加权后的聚合行覆盖率高于 80%；验收记录覆盖率报告、覆盖行数和可覆盖行数。

## Verification record

验证日期：2026-11-08。当前按用户指示完成 Chromium 验收；Firefox 和 WebKit 留待后续。

- React wrapper 单测：7/7 通过；`Calendar.tsx` 行覆盖 203/233（87.12%）。RFC 0044 wrapper 用例 4/4 通过。
- React Demo Chromium E2E：47/47 通过（100%）。P0：2/2；P1：1/1；P2：2/2。P0/P2 的权限拒绝与 DSL 校验失败都验证事件不变、草稿保留和错误可见。
- 手动浏览器验收：通过 `agent-browser` 打开已构建 Demo，双击事件、编辑标题并保存；host action log 与 Calendar 均显示新标题。
- 变更生产文件加权行覆盖：React `Calendar.tsx` 203/233，加 Demo 源码 74/77，合计 277/310（89.35%），高于 80%。
- 完整多浏览器命令因本机缺少 Firefox/WebKit 可执行文件而未通过；Chromium 结果独立通过。按用户指示，此轮不安装或运行 Firefox/WebKit。
- DSL 校验失败用例保持现有标题编辑表单不变；测试在真实浏览器中打开编辑草稿后，通过 Calendar 实际 DOM API 提交违反时间规则的 Event，验证校验事件、草稿保留及 host/日历数据不变。
