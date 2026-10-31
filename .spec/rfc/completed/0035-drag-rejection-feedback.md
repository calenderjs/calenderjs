# RFC 0035: 拖拽/resize 改时间不应被 validate 规则拦截

**Status:** Implemented

## Summary

拖拽改时间/跨列改日期、resize 改时长，底层都复用了 `Calendar.wsx` 的通用更新入口 `proposeEventUpdate`，而这个入口从 RFC-0005 起就设计为对所有更新无差别地跑 `validateEventForUpdate`（Event DSL 的 `validate` 规则，如 `startTime.hour >= 9`）。调研确认：`validate` 从设计意图上是**数据级校验**（这条事件记录的最终状态合法吗），不是"拦截用户的编辑操作"；RFC-0020（拖拽改时间）落地时从未讨论过这个耦合是否合理，直接沿用了通用更新入口，属于设计疏漏，不是故意的业务规则。结果是：用户拖拽/resize 把事件挪到 `validate` 范围之外的时段，更新被静默拒绝，事件弹回原位，没有任何提示——体感上等同于"拖拽机制坏了"。

## Problem

本次会话里用户报告"周视图事件只能往下拖、不能往上拖"。排查确认 RFC-0032 换的 pointer-event 拖拽机制本身没问题——命中测试、坐标换算全部正确。真正发生的是：demo 默认 DSL 定义了 `startTime.hour >= 9` 和 `<= 18`（营业时间限制），用户把事件拖到 9 点之前的格子，`proposeEventUpdate`（`Calendar.wsx:734` 附近）正确执行了它当前的设计——校验失败，派发 `event-update-error`，事件不更新。

深挖这个设计本身是否合理：

- 查 `event-runtime-integration.ts` 的 `validateEventWithRuntime`：`validateEventForCreate`/`validateEventForUpdate` 两者走的是**完全相同**的 `runtime.validate(event, context)`，没有任何区分"这是新建还是编辑"的机制或参数。
- 查 RFC-0002（event-dsl 设计文档）：`validate(event, context) → ValidationResult` 的描述和示例，从头到尾把 `validate` 定位成"验证一个事件对象的最终状态"，没有提过要用它拦截"编辑/移动"这类操作本身。
- 查 RFC-0020（拖拽改时间）：全文没有一处提到 `validate`、校验、营业时间——设计拖拽功能时根本没人评估过"拖拽产生的新 startTime/endTime 要不要重新过一遍创建时的校验规则"这个问题，纯属直接复用了已有的 `proposeEventUpdate` 入口。
- 查 `EventRuntime.ts` 顶部架构注释（第 17-23 行、第 68 行）原文明确写着：「运行时验证（EventRuntime）**角色**：验证用户手动创建/编辑的 Event 数据是否符合 DSL 定义的业务规则；**使用场景**：应用层，当用户通过表单输入 Event 数据时」「Calendar 组件不需要运行时，直接使用 Event 对象。运行时主要用于**应用层**的业务规则验证和权限检查」。这段注释支持"拖拽不该自动触发校验"的方向，但这段注释本身已经过时——它说"Calendar 组件不需要运行时"，和 CLAUDE.md 当前记录的架构决策（"Calendar 接受 EventRuntime；无 runtime 时降级"）矛盾，且同一段把"权限检查"也归为应用层职责，但 `canPerformAction("editable", ...)` 现状就是跑在 Calendar 组件内部、本 RFC 也不打算动它。**这段注释不能单独作为论据**，引用时只作为"这里确实存在过把 validate 定位成应用层职责的设计意图"的旁证，不是决定性证据。

本 RFC 的立场是产品决策，不依赖对 `validate` 历史定位的推论——源码里能找到的注释和文档对 `validate` 的描述本身不一致（见上一条，"创建"还是"创建/编辑"、"应用层"还是"组件内部"都存在矛盾表述），不足以单独支撑任何结论。决策就是一句话：**直接操作类手势（拖拽、resize、键盘移动/改时长）表达的是用户对一个已存在事件的明确意图，不经过这些手势再次确认"这个最终状态是否合法"；表单提交/新建这类"用户正在输入数据"的场景，`validate` 继续全量生效**。这是本 RFC 划的边界，区分原则是"操作类型"（直接操作 vs. 数据输入提交），不是"创建 vs. 编辑"。

**备选方案：校验但不阻断，而不是直接跳过**——曾考虑让 `proposeEventUpdate` 仍然跑 `validateEventForUpdate`，但不拿校验结果决定是否放行，而是把校验结果塞进 `event-update` 事件的 `detail`（如 `detail.validation`）一起派发出去，由宿主应用决定要不要提示用户。这样 `no conflict` 之类的规则不会彻底失效，只是从"阻断"降级成"可见的警告信号"。**本 RFC 选择直接跳过（不校验、不附带警告信号）**，原因：（1）附带校验结果需要在 `proposeEventUpdate` 的返回路径和事件 detail 结构上做更大改动，而当前问题的核心是"用户的编辑操作被挡住了"，跳过校验是解决这个问题的最小改动；（2）是否需要"警告但不阻断"的信号机制，属于更通用的产品功能（本质是给 `validate` 增加一种新的非阻断性校验模式），不是本 RFC 要解决的"拖拽被挡"这一具体问题，留给后续单独评估（与 Non-goals 第 4 条"不重新设计 validate API"一致）。

**接受的代价**：DSL 支持 `no conflict with other events` 这类基于"其他事件"的校验规则（`EventRuntime.ts` 冲突检测、`event-dsl.pegjs` 语法支持），`validateEventForUpdate` 专门构造了排除自身的 `[...others, event]` 上下文来支持它（`Calendar.wsx:690`）。整体跳过 validate 后，拖拽/resize 可以把事件挪到和其他事件时间重叠的位置，不再被挡，应用层也不会收到任何信号。**这是本 RFC 接受的结果，不是遗漏**——用户已明确拒绝用确认对话框拦截编辑操作，这条规则（以及其他任何 validate 规则）对拖拽场景一并失效，由应用层自行决定如何处理拖拽产生的"校验上不合法但用户明确想要"的事件状态（见 Design 一节的 demo 改动）。

## Goals

- WeekView/DayView 所有经由 `event-update-request` 发起的更新——拖拽改时间/跨列改日期、resize 改时长、**以及键盘移动（方向键）/键盘改时长（Shift+方向键）**——跳过 `validateEventForUpdate` 的 DSL `validate` 规则校验，只保留 `canPerformAction("editable", event)` 权限门禁（没有编辑权限的事件类型依然不能拖/resize/键盘编辑，这个判断和 `validate` 是两套独立机制，不受影响）。这四类操作目前全部派发同一个 `event-update-request` 事件，在单一汇合点统一放行，不单独为拖拽开后门。
- 具体实现：`proposeEventUpdate` 增加可选参数 `options: { skipValidation?: boolean }`（默认 `false`，不影响现有调用方），`skipValidation: true` 时跳过 `validateEventForUpdate` 这一步，只保留 `editable` 检查。
- 不改变 `proposeEventCreate`/新建事件表单的校验行为——新建时 `validate` 规则继续全量生效，这正是它设计上该管的场景。
- 调整 demo（`demos/react/src/App.tsx`）的应用层二次校验，使其不会把"经 Calendar 放行但违反 validate 规则"的事件从渲染列表里整个剔除（现状会让事件从日历上消失，而不是停留在拖拽后的新位置）——具体处理方式见 Design 一节。
- 兼容性说明：`event-update-error` 事件此后不会再经由 WeekView/DayView 的拖拽/resize/键盘路径派发（这些路径现在只会得到 `event-update` 成功或 `event-update-denied` 权限拒绝两种结果）。`event-update-error` 本身不删除，`proposeEventUpdate` 在不传 `skipValidation` 时仍会按原逻辑派发它（供未来表单编辑等场景使用）。

## Non-goals

- 不删除或削弱 DSL `validate` 规则本身的定义能力——规则依然对"新建事件"和"（未来可能有的）表单编辑"生效，只是经 `event-update-request` 发起的更新（拖拽/resize/键盘编辑）不再触发它。
- 不改变 `canPerformAction("editable", ...)` 权限门禁逻辑——这是独立于 `validate` 的另一套机制，继续按原样工作。
- 不区分 `behavior.draggable`——本 RFC 只处理 `editable` 门禁，`editable: true` + `draggable: false` 组合的行为不在本次改动范围内，维持现状。
- MonthView 的拒绝反馈由 RFC-0036 接入同一更新汇合点，并在 MonthView 内实现短暂抖动；本 RFC 的校验/权限决策仍只改 Calendar 汇合点。
- 不在本 RFC 里重新设计 EventRuntime 的 `validate` API 本身（比如加一个 `context: "create" | "update" | "move"` 参数）——先用最小改动（新增一条跳过校验的更新路径）解决问题，是否需要在 EventRuntime 层面做更通用的区分，留给后续评估。

## Design

**关键决策：改动收口在 `Calendar.wsx` 唯一的汇合点 `handleChildEventUpdateRequest`，不逐个视图改。**

WeekView/DayView 本身调用不到 `proposeEventUpdate`——全仓库该方法只有一个真实调用点：`Calendar.wsx:333` 的 `handleChildEventUpdateRequest`（拖拽、resize、键盘移动/改时长产生的 `event-update-request` 都汇合于此）。因此不需要"等 RFC-0033/0034 落地后再同步处理 DayView/resize"——改这一处，WeekView、DayView（无论当前走原生 DnD 还是未来的 pointer-event）、resize、键盘路径在同一次改动里一起生效，不存在"部分视图已跳过校验、部分视图仍全量校验"的中间状态。

涉及文件：
- `packages/calendar/src/Calendar.wsx`（以及 `Calendar.wsx.d.ts:27` 的同名签名，两处要同步改）：
  - `proposeEventUpdate(event, options?: { skipValidation?: boolean })`——`skipValidation` 默认 `false`，为真时跳过 `validateEventForUpdate` 这一步，只保留 `editable` 权限检查。现有调用方（含测试里直接调用的两处）不传这个参数，行为不变。
  - `event-update-denied` 本身继续从 Calendar 宿主 `dispatchEvent`（供外部应用监听，行为不变），拒绝时由 `e.target` 取得请求来源视图并直接调用其 `showUpdateRejected(eventId)`，不依赖事件冒泡/派发。WeekView、DayView 与 RFC-0036 接入的 MonthView 都实现该方法；RFC-0026 readonly 拒绝路径复用同一出口。
- `packages/calendar/src/views/WeekView.wsx` / `DayView.wsx`：新增 `showUpdateRejected(eventId)` 方法，收到调用后对匹配事件给出短暂抖动，事件数据保持原值。拖拽/resize 本身不提交预览数据，拒绝时不需状态回滚。MonthView 通过 RFC-0036 加入相同反馈。
- `packages/calendar/src/views/WeekView.css` / `DayView.css`：新增一个表示"被拒绝"的短暂视觉状态类，定义简短的高亮/抖动动画。
- `demos/react/src/App.tsx`：当前 `useEffect`（112-186 行）对 `events` 变化重新跑 `runtime.validate`，不合法的事件在第 161-168 行直接 `return`，不进 `rendered` 数组，渲染用的 `events={renderedEvents}`（第 506 行）。本 RFC 落地后 Calendar 内部放行了"违反 validate 规则但经用户拖拽/resize 产生"的更新，若 demo 这层不调整，这类事件会在 `events` 更新后被二次校验挡掉、从日历上整体消失（比现状弹回原位更差）。
  - **具体规则（不是"可选"）**：第 157-168 行的业务规则校验（`runtime.validate`）不通过时，**仍然 push 进 `rendered`**，只把结果记进 `validationResults`（供侧栏展示），不再 `return` 跳过渲染。第 130-154 行的基础结构校验（`validateBase`）和 data schema 校验（`validateData`）不受影响，继续按现状不渲染——这两类是数据结构本身损坏，和"业务规则不满足但数据结构合法"是两种不同严重度的问题。
  - **视觉区分**：不在日历内给事件加新的标记样式。现有侧栏校验列表（第 478-497 行）已经会对不合法的事件显示 ✗ 和错误信息，这就是用户能看到"这个事件违反了业务规则"的入口，本 RFC 不新增日历内标记。
  - 之所以不需要区分"这是新建还是更新"：`handleSlotClick`（第 228 行起）新建事件时已经把小时钳在 9-17 之间，demo 默认 DSL 的业务规则本就不会被新建路径触发，不需要在 `useEffect` 里额外判断来源。

## Acceptance

- 真实浏览器验证：把 demo 默认 DSL（`startTime.hour >= 9`/`<= 18`）的事件拖到 9 点之前或 18 点之后，事件能正常移动过去并保持在新位置（不会从日历上消失）——这是本 RFC 要解决的核心场景。
- 键盘移动/改时长（方向键/Shift+方向键）同样能把事件挪到 validate 范围之外，不被拦截。
- 把一个 `editable: false` 的事件类型实例尝试拖拽，确认权限门禁依然生效，且现在有可见的拒绝反馈（事件框短暂高亮+弹回原状态），不是静默失败。
- 新建事件表单（如果存在）或 `proposeEventCreate` 路径的校验行为不受影响，继续按原规则拒绝非法新建数据。
- 对应 e2e 用例新增/更新，覆盖"拖到 validate 范围外仍然成功移动且不消失"和"权限拒绝时有视觉反馈"两条路径，以及"键盘移动/改时长越过 validate 范围仍然成功"一条（当前键盘路径只有单测覆盖，补一条真实键盘事件的 e2e）。
- "权限拒绝"场景的 e2e 需要让某个事件类型的 `editable` 为 `false`：通过 demo 的 Monaco DSL 编辑器把目标事件类型的 DSL 改成 `editable: false` 再触发拖拽，或直接在测试里构造一个 `editable: false` 的事件类型（两种都可以，实现时选一种，不强制通过 UI 编辑 DSL）。
- 遵循 RFC-0027 金科玉律：关单前必须有真实浏览器人工验证记录。

## Implementation record

- `proposeEventUpdate(event, { skipValidation: true })` keeps the `editable` permission check and skips only DSL validation. `proposeEventCreate` retains validation. The declaration file matches the implementation signature.
- E20 verifies pointer movement outside the DSL time range. E26 verifies keyboard movement outside that range. E21, E22, and E23 verify denial feedback in DayView, WeekView, and MonthView. The integration test also checks create validation and permission denial.
- Invalid DSL business-rule results stay visible in the React demo and remain listed in its validation panel.
- Browser interaction record (MCP `page.mouse` pointer input): with `editable: false`, dragging `团队会议` toward 08:00 triggered the rejection animation and kept the event at 10:00–11:00.
- Verification: the RFC E2E matrix passed 33/33 across Chromium, Firefox, and WebKit. Calendar unit tests passed 107 tests; monorepo typecheck passed all 11 packages.
