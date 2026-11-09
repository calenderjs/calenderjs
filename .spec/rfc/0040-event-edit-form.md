# RFC 0040: 事件编辑弹窗：多字段表单 (child of 0038)

**Status:** Approved

**Parent:** [0038](0038-event-edit-popup-umbrella.md)

## Summary

将 React Demo 当前只编辑标题的内联编辑栏替换为多字段事件编辑弹窗。表单固定字段为标题、开始时间、结束时间；`Event.data` 字段根据当前事件类型编译后的 JSON Schema 动态渲染。保存复用 RFC-0044 已接通的 `proposeEventUpdate` 和 host `event-update` 数据流，不增加第二条更新路径。

## Problem

- RFC-0039 已通过 `event-edit-request` 打开编辑 UI；当前 Demo 收到请求后只编辑 `title`。
- RFC-0044 已让 React `CalendarRef` 暴露 `proposeEventUpdate`，并让 Demo host 在 `event-update` 回调中更新权威 `events`。本 RFC 不再把“保存绕过权限和校验”列为现状，也不重复实现这条链路。
- 开始/结束时间及类型数据（例如 `location`）不能从编辑 UI 修改。
- `EventTypeDataModel.dataSchema` 来自 DSL 字段定义；默认 Demo 中 `attendees` 是必填数组，`location` 是字符串。MVP 不编辑数组，因此不能用清空 `attendees` 作为表单校验失败验收。

## Goals

- 在 Month、Week、Day 视图打开同一事件编辑弹窗，提供 `title`、`startTime`、`endTime` 和当前事件类型 `dataSchema.properties` 中的字段。
- 根据 JSON Schema 将 `string` 映射为文本输入、`number` 映射为数字输入、`boolean` 映射为复选框、含 `enum` 映射为选择框；必填信息来自 `dataSchema.required`。
- `array`、嵌套 `object`、`null` 或不支持的 Schema 字段以只读方式显示，原值随草稿保留，不静默清空或删除。
- 编辑草稿期间不修改 host `events`。保存调用现有 `proposeEventUpdate(updatedEvent)`；通过后由 host 的 `event-update` handler 更新 `events`，Calendar 再由 props 显示新值。
- 表单以 Calendar 当前权限查询结果决定是否可编辑。`editable: false` 时字段只读、没有保存按钮；提议阶段仍由 `proposeEventUpdate` 再检查权限和 DSL 规则。
- DSL 校验拒绝时在弹窗内显示错误，保留草稿和原事件，不关闭弹窗。

## Non-goals

- 不创建通用表单包、不引入表单库依赖；表单只服务 React Demo。
- 不编辑 `array`、嵌套 `object`、`null` 或未知 Schema 类型；不实现 JSON Schema 通用渲染器。
- 不实现事件创建、删除、异步持久化、后端审批或异步失败回传。
- 不改变 `proposeEventUpdate`、`canPerformAction` 或运行时权限/校验语义。
- 不改 `packages/calendar/src/Calendar.wsx`；其 `canPerformAction` 与 `proposeEventUpdate` 已提供所需行为。
- 本 Demo 时间输入按浏览器本地时区解释。仅当 `Event.timeZone` 与浏览器解析出的时区一致时，开始/结束时间可编辑；不一致时这两个字段只读并说明原因。保存生成新的 `Date` 时间戳并保留 `Event.timeZone`。MVP 不增加任意 IANA 时区的编辑/转换 UI。

## Design

表单字段来源是编译后的 `EventTypeDataModel.dataSchema`，不是原始 DSL AST。当前 Demo 只编译一个类型，按 `event.type` 与当前 `compiledDataModel.id` 匹配后读取其 schema；类型不匹配或没有 schema 时，只显示固定事件字段，不猜测其他类型的字段。

React wrapper 当前只透出 `proposeEventUpdate`。为满足打开时只读权限要求，给 `CalendarRef` 增加 `canPerformAction(action, event): boolean` 的只读转发，直接调用底层 Calendar 同名方法，不复制权限逻辑。保存时仍调用 `proposeEventUpdate`，处理表单打开后权限发生变化的情况。

表单数据在独立 draft 中编辑。开始/结束时间使用 `datetime-local`；只有事件 `timeZone` 与浏览器解析出的时区一致时才可编辑，输入按浏览器本地时间转换为 `Date`，不修改 `timeZone` 字段。时区不一致或缺失时，时间字段只读，避免把本地钟面值误当成事件时区。提交构造完整 Event，保留未知或只读的 `data` 字段。数字空值不转换为 `0`；可选字段空值从草稿 `data` 中移除，必填字段空值交给现有校验通道拒绝。不得将 `proposeEventUpdate` 的 `true` 描述为后端持久化成功；它表示权限/校验通过且 `event-update` 已派发，沿用 RFC-0044 的 host 同步更新流程。

### Task 1: 暴露 React 权限查询

- 文件：`packages/react/src/Calendar.tsx`、`packages/react/src/__tests__/Calendar.test.tsx`
- 给 `CalendarRef` 增加 `canPerformAction(action, event)`，仅转发底层 Calendar 方法。
- 单测覆盖允许/拒绝结果及底层方法调用；保留 `proposeEventUpdate` 作为提交时的最终权限与校验网关。

### Task 2: 实现 Schema 字段映射与表单

- 文件：`demos/react/src/event-edit-form.ts`、`demos/react/src/event-edit-form.test.ts`、`demos/react/src/EventEditDialog.tsx`、`demos/react/src/index.css`、`demos/react/package.json`
- 纯函数把 Schema 属性映射成字段描述，处理 `required`、`enum` 和只读类型；对 string/number/boolean/enum 的映射、必填状态、数组只读及空数字序列化写单元测试。
- Demo 现无单测脚本。添加 `test` 脚本，用仓库已有 `tsx` 执行 Node `node:test`，不增加新依赖；根目录 `pnpm test` 通过 Turbo `test` 任务发现并运行该包测试。
- 创建可访问的编辑弹窗，含固定字段、动态字段、只读权限状态、提交错误、保存和取消操作。弹窗只操作草稿；取消、权限拒绝和校验拒绝都不改变事件。

### Task 3: 将 Demo 接入现有 host 数据流

- 文件：`demos/react/src/App.tsx`
- 用选中的 Event 草稿和 `EventEditDialog` 替换 `editingId`、`editingTitle` 与标题内联编辑栏。
- `event-edit-request` 初始化草稿；权限查询决定只读态；提交调用 `calendarRef.current.proposeEventUpdate(updatedEvent)`；错误回调显示错误并保留草稿；成功后由既有 `handleEventUpdate` 更新 host `events`，保存 handler 关闭弹窗。
- 保持 `handleEventUpdate` 为唯一的 Demo host 更新入口，不在保存 handler 直接调用 `setEvents`。

### Task 4: 增加浏览器验收

- 文件：`demos/react/e2e/demo.spec.ts`
- P1：在 Month、Week、Day 各验证打开弹窗、改标题/本地时区下的时间/`location`、保存、host 收到更新且日历显示新值；另验证时区不一致事件时间只读。
- P0：将开始时间改到当前 DSL `startTime.hour >= 9` 规则之外，验证错误可见、草稿保留、host Event 和 Calendar 显示值不变。
- P2：设置 `editable: false`，验证弹窗字段只读、无保存按钮，事件值不变。
- 使用真实 Chromium 浏览器和真实 Demo/Calendar；不使用 mock 替代用户流程。本轮不要求 Firefox/WebKit。

## Acceptance

- Month、Week、Day 三视图均可打开编辑弹窗；表单显示标题、开始/结束时间及当前 Event 类型支持的 DSL data 字段。
- string/number/boolean/enum 映射正确；required 字段有明确必填状态；array、object、null 和未知类型显示为只读且保留原值。
- 成功编辑标题、时间和 `location` 后，变更经过 `proposeEventUpdate` → `event-update` → host `events` → Calendar props 的完整链路。
- 校验失败后 host Event 与 Calendar 显示均不变，弹窗和草稿保留，错误可读。
- `editable: false` 时弹窗只读且无保存按钮；提交仍受现有权限检查保护。
- 新增单测全部通过；Schema 映射、序列化及权限转发新增代码行覆盖率 100%。E2E 中 P0、P1、P2 场景各 100% 通过，无失败或跳过用例。
- RFC 相关生产代码聚合行覆盖率高于 80%；记录每个受影响文件的覆盖行数及可覆盖行数。
- 实际启动 React Demo，用 Chromium 走通成功、拒绝和只读流程；记录命令、浏览器及结果。Firefox/WebKit 留待后续。

## Implementation verification

- Unit: `pnpm --filter @calenderjs/demos-react test` — 4/4 passed; `event-edit-form.ts` 22/22 executable lines, 100% line/branch/function coverage.
- Root Turbo test routing: `pnpm test --filter=@calenderjs/demos-react --filter=@calenderjs/react` — both package test tasks passed (4 Demo tests, 8 React tests); prerequisite builds completed.
- Wrapper: `pnpm --filter @calenderjs/react test` — 8/8 passed; permission forwarding test covers allow, deny, argument forwarding, and missing underlying method fallback.
- Chromium E2E: `pnpm --filter @calenderjs/demos-react exec playwright test --project=chromium` — 51/51 passed, 0 failed, 0 skipped. P0 1/1, P1 4/4, P2 1/1; Month/Week/Day success, validation rejection, permission read-only, and timezone mismatch all exercised. Firefox/WebKit not run per scope.
- Typecheck/lint: React and Demo typechecks passed; Demo lint passed.
- RFC production line coverage (weighted by executable lines): `packages/react/src/Calendar.tsx` 208/238 (87.39%); `demos/react/src/App.tsx` 70/72 (97.22%); `demos/react/src/EventEditDialog.tsx` 18/20 (90.00%); `demos/react/src/event-edit-form.ts` 18/22 (81.81%) under Chromium instrumentation. Aggregate: 314/352 (89.20%), above 80%. The helper's dedicated unit run independently reports 22/22 lines covered.
- Overall React Demo source coverage from Chromium run: 64.40% lines across all demo source; this is broader than RFC-affected production files and is not the RFC aggregate metric.
- Permission query behavior is covered for allowed, denied, and unavailable underlying method paths. Schema mapping/serialization unit coverage is 100%.
