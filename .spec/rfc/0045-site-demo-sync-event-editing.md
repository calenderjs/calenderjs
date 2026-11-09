# RFC 0045: 官网 demo 同步事件编辑能力 (child of 0038)

**Status:** Draft

**Parent:** [0038](0038-event-edit-popup-umbrella.md)

## Summary

`apps/site/src/components/pages/DemosPage.wsx`（原 `site/`，已迁移到 `apps/site/`）里嵌的 `<wsx-calendar>` 演示只渲染两条静态 `SAMPLE_EVENTS_JSON`，没接任何交互事件。日历组件早已支持双击/键盘打开编辑（RFC-0039，已 Implemented）和 `proposeEventUpdate` 权限/校验门（RFC-0035），demo 却完全没展示这些能力——访问官网的人看不到日历真正可编辑。本 RFC 只给官网 demo 接上这条已有能力，不新增日历组件任何功能。

## Problem

- `apps/site/src/components/pages/DemosPage.wsx` 的 `<wsx-calendar>` 只传 `view`/`date`/`events`，没有监听 `event-edit-request`/`event-update`/`event-update-denied`/`event-update-error`，双击事件没有可见反应。
- 事件数据是组件内联常量 `SAMPLE_EVENTS_JSON`，页面级没有 state，`events` 只在初次渲染赋值一次，交互后无法把结果渲染回日历。
- 官网是外部用户对 CalenderJS 能力的第一印象来源；RFC-0039（双击编辑触发）和 RFC-0044（草案，编辑保存走 `proposeEventUpdate` 通知 host）做完后，官网 demo 没跟上，造成"文档/demo 落后于实际能力"的债。

## Goals

- `DemosPage.wsx` 增加 `events` 的组件内 state（WSX `@state`），双击日历事件后用现有 `event-edit-request` 打开一个最小编辑 UI（单字段标题编辑即可，参照 `demos/react` 对应交互，保持这是"演示"而非完整编辑器）。
- 编辑保存时调用 `wsx-calendar` 元素的 `proposeEventUpdate` 方法（原生 WSX DOM 方法调用，非 React ref），成功后监听 `event-update` 更新本地 state；校验失败/权限拒绝时监听 `event-update-denied`/`event-update-error` 并给出可见提示，不静默失败。
- 若 demo 示例事件类型可配置 `behavior.editable:false` 或校验规则，至少展示一条，让访问者直观看到权限/校验门在起作用；若当前 demo 未接 `EventRuntime`，不强行引入 runtime——退化到无 runtime 时的直接更新路径，与 `Calendar.wsx` 本身"无 runtime 时降级"的既有行为一致。

## Non-goals

- 不改 `packages/calendar/src/Calendar.wsx` 或 `packages/react/*`——本 RFC 只动 `apps/site/`。
- 不实现官网专属的新 DSL 编辑器/Monaco 集成（那是 `react-event-editor`/`monaco-event-dsl` 的范围）。
- 不等待 RFC-0044 实现完成才能做——0044 的目标是让 demo 的保存路径不绕过 `proposeEventUpdate`；本 RFC 对官网 demo 直接按同一条正确路径实现，不复制 0044 已识别的反模式。
- 不处理 `site/`→`apps/site/` 本次目录迁移本身（迁移已由用户直接完成，不是本 RFC 范围；本 RFC 的 Design/Acceptance 一律使用迁移后的 `apps/site/` 路径）。

## Design

涉及文件：

- `apps/site/src/components/pages/DemosPage.wsx`：
  - `SAMPLE_EVENTS_JSON` 改为 `@state private _events: Event[]`（初值用现有两条样例数据）。
  - `<wsx-calendar>` 加 `event-edit-request` 监听（WSX 事件绑定约定），打开一个内联最小编辑表单（标题字段，参照 `demos/react` 单字段编辑 UX）。
  - 保存按钮调用日历元素的 `proposeEventUpdate(updatedEvent)`；监听 `event-update` 写回 `_events`；监听 `event-update-denied`/`event-update-error` 在表单内联显示提示，不关闭表单。
- `apps/site/src/components/pages/DemosPage.css`：为新增编辑表单补最小样式，复用现有 `demos-*` 命名前缀。
- 不改 `i18n.ts` 之外的现有国际化文案结构，新增文案 key 按现有 `common` namespace 补充。

## Acceptance

- 单测：WSX 组件测试覆盖 `event-edit-request` 打开表单、保存成功走 `event-update`、权限拒绝走 `event-update-denied`、校验失败走 `event-update-error` 四条路径（参照 `packages/calendar/src/__tests__` 现有测试风格）。
- 真实浏览器验证（RFC-0027 金科玉律）：`pnpm --filter @calenderjs/site dev`，打开 `/demos`，双击日历事件，改标题保存，确认日历刷新；若 demo 事件类型配置了 `editable:false`，确认双击/保存被拒绝且有提示。
- `pnpm --filter @calenderjs/site typecheck`、`pnpm --filter @calenderjs/site lint`（若该包有 lint 脚本）、`pnpm validate:docs` 全部通过（后者需确认 `apps/site/` 迁移后文档链接已同步）。
- 覆盖率/E2E 门槛：本 RFC 改动限于 `apps/site/` 展示层，不改变生产计算逻辑；单测 100% 通过率适用；行覆盖率门槛对 demo 展示代码适用性较低，关单时需说明覆盖率不适用的理由或给出实际覆盖数据，不得默认豁免。
- 说明：`apps/site` 是 GitHub Pages 官网展示站点，不是框架中立验证体系的一部分（AGENTS.md 4a 的三件套验证点是 `demos/wsx`/`demos/react`/`demos/vue`，见 RFC-0047）。本 RFC 只负责让官网 demo 模块展示出真实的编辑交互，不承担跨框架一致性验证职责。
