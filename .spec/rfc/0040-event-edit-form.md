# RFC 0040: 事件编辑弹窗：多字段表单 (child of 0038)

**Status:** Draft

**Parent:** [0038](0038-event-edit-popup-umbrella.md)

## Summary

把 demo 里现在的"点击事件只能改标题"的内联编辑（`App.tsx` 的 `editingId`/`editingTitle`），换成能改多个字段的弹窗表单：固定字段（标题、开始/结束时间）+ 该事件类型 DSL 定义的 `data` 字段（如 `attendees`/`location`），都能改；提交复用现有的 `proposeEventUpdate` 校验通道，不新开一条更新路径。

## Problem

现状（`demos/react/src/App.tsx:213-229`）：

- `handleEventClick` 只存 `editingId` + `editingTitle` 两个 state。
- 编辑 UI（约 476-495 行）是一个条件渲染的 `<input>`，只绑定标题。
- `handleSaveEdit` 直接 `setEvents` 本地替换，**没有经过** `Calendar.wsx` 的 `proposeEventUpdate`/`event-update-request` 通道——绕过了 RFC-0018 的 `editable` 权限网关和 RFC-0035 落地的 validate 规则，是一个既有的技术债（本 RFC 顺带修掉，不是本 RFC 的主要目标，但不能在新表单里继续绕过）。
- 事件类型的其他字段（DSL `fields:` 里定义的、落在 `Event.data` 里的字段，例如当前默认 DSL 的 `attendees`/`location`）在 UI 上完全不可编辑，只能改 DSL 文本重新生成整个事件集合。
- 固定字段 `startTime`/`endTime` 同样不可通过 UI 编辑（只能拖拽/resize 改，RFC-0020/0021/0032~0037；这是"直接操纵"路径，不是"表单输入"路径，两者性质不同，见 RFC-0035 的"操作类型"区分）。

## Goals

- 事件编辑弹窗支持编辑：标题（`title`）、开始时间（`startTime`）、结束时间（`endTime`），以及该事件 `type` 对应的 DSL `data` 字段（从 `EventTypeDataModel.dataSchema`，即 JSON Schema 生成表单字段：`string`/`number`/`boolean`/`enum` 映射到对应的 input/select）。
- 表单渲染字段集合**动态**，由事件的 `type` 查到的 schema 决定——不同事件类型显示不同字段，不硬编码 `attendees`/`location` 这类具体字段名。
- 提交统一走 `proposeEventUpdate(updatedEvent)`（**不传** `skipValidation`，表单输入场景继续全量校验，对齐 RFC-0035 的"数据输入提交 vs. 直接操纵手势"区分原则）——校验失败时表单内联显示错误，不关闭弹窗；`editable: false` 时字段渲染为只读（禁用态），不是悄悄提交后被拒绝。
- 修掉现有技术债：新表单的保存路径必须经过 `proposeEventUpdate`，不能像现在的 `handleSaveEdit` 一样直接 `setEvents`。

## Non-goals

- 不做字段级 UI 组件库/表单生成器包——按 Simplicity First，表单渲染逻辑留在 demo 层（`demos/react/src/App.tsx` 或该文件拆出的一个组件），不新建 npm 包，不引入表单库依赖；JSON Schema → 表单字段的映射是一段直接的 if/switch，不是通用引擎。
- 不支持嵌套 `object`/`array` 类型字段的复杂编辑 UI（如果 DSL 定义了嵌套对象字段，MVP 只做扁平字段：`string`/`number`/`boolean`/`enum`；嵌套字段留空或只读，后续需要再开 RFC）。
- 不改变 `proposeEventUpdate`/`canPerformAction`/`validateEventForUpdate` 的现有签名或语义（RFC-0035 已定稿，不重新讨论）。
- 不实现弹窗的打开触发机制——由 0039 负责派发 `event-edit-request`，本 RFC 只管收到这个事件之后弹出的表单内容。
- 不做多事件类型并存的 DSL 编辑器改版（demo 目前一次只有一个 DSL 文本/一个 compiledDataModel；表单按 `event.type` 去查对应 schema，如果查不到就用当前 `compiledDataModel`，不新增多类型管理 UI）。

## Design

关键决策：**表单字段来自 JSON Schema（`EventTypeDataModel.dataSchema`），不是原始 DSL AST 的 `FieldDefinition[]`**——`EventDSLCompiler.compileFromAST` 编译后只保留 `dataSchema`（JSON Schema），原始字段级元数据（`description` 之外的展示用信息）不随编译产物保留；JSON Schema 的 `type`/`enum`/`required`/`properties` 已经足够映射出基本输入控件，不需要额外保留 AST。

涉及文件：

- `demos/react/src/App.tsx`：
  - 新增 `handleEventEditRequest`（监听 0039 新增的 `event-edit-request`），打开一个新的弹窗组件（替代现有的 476-495 行内联编辑块），初始化表单状态为该事件的浅拷贝。
  - 新增表单组件（同文件内或拆成 `EventEditDialog.tsx`，视改动量定，不强制拆文件）：
    - 固定字段：标题（text input）、开始/结束时间（datetime-local input，或复用现有时间选择习惯）。
    - 动态字段：遍历 `compiledDataModel.dataSchema.properties`（或按 `event.type` 查到对应的已编译 schema——当前 demo 一次只有一个类型，直接用 `compiledDataModel`），`type: "string"` → text input，`"number"` → number input，`"boolean"` → checkbox，`enum` 存在 → select；值读写 `event.data[fieldName]`。
    - 提交按钮：调用 `calendarRef.current.proposeEventUpdate(updatedEvent)`（通过现有 `CalendarRef` 暴露的方法，或监听返回的 `event-update`/`event-update-error`/`event-update-denied` 事件；具体用哪种调用方式取决于 `@calenderjs/react` 的 `CalendarRef` 现有能力，实现时确认）。校验失败（`event-update-error`）时表单内联显示 `errors`，不关闭弹窗；权限拒绝（`event-update-denied`）时字段整体禁用并提示。
    - `editable: false` 时（`canPerformAction("editable", event)` 返回 `false`）：表单打开即全字段只读，不渲染可提交的保存按钮。
  - 删除现有 `editingId`/`editingTitle`/`handleSaveEdit`（被新表单组件取代，避免并存两套编辑 UI）。
- `packages/react/src/Calendar.tsx` / `CalendarRef`：如果现有 ref 没有暴露 `proposeEventUpdate`，补上（走 Web Component 的同名方法转发，不新增校验逻辑）。
- `packages/calendar/src/Calendar.wsx`：**不改动**——`proposeEventUpdate`/`canPerformAction` 签名已经够用（RFC-0035 落地时就设计好了 `skipValidation` 可选、默认全量校验）。

## Acceptance

- 双击（或 Enter/Space，见 0039）任意事件，弹出表单，能看到标题、开始/结束时间，以及该事件类型 DSL 定义的 `data` 字段。
- 改标题、改时间、改一个 `data` 字段（如默认 DSL 的 `location`）后保存，日历上对应事件更新，且更新经过 `event-update` 事件（可在 `handleEventUpdate` 里观察到），不是绕过校验的直接 `setEvents`。
- 故意把表单填成违反 validate 规则的值（如把 `attendees` 清空，触发 "attendees.count between 1 and 50"）提交，表单内联显示错误，事件不更新，弹窗不关闭。
- 把 DSL 的 `behavior.editable` 改成 `false`，对应类型事件的表单打开后字段只读，没有保存按钮。
- 新增单测覆盖：JSON Schema → 表单字段的映射（string/number/boolean/enum 各一种）、提交成功/校验失败/权限拒绝三种路径。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：完整走一次"双击打开 → 改字段 → 保存 → 日历刷新"流程。
