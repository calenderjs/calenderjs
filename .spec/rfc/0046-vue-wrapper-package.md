# RFC 0046: 新增 @calenderjs/vue 包与 demos/vue（验证框架中立设计）

**Status:** Draft

## Summary

新增 `@calenderjs/vue`，作为 `@calenderjs/calendar`（`<wsx-calendar>` Web Component）的 Vue 3 薄封装层，功能对等 `@calenderjs/react`；配套 `demos/vue` 演示应用。本 RFC 的首要目的不是"给 Vue 用户加一个包"，而是**作为框架中立设计原则（AGENTS.md 4a）的强制验证手段**：任何新能力如果只在 React 下验证过，就不能说"框架中立"——必须有 Vue 这第二个独立实现作为对照组，才能暴露出设计里悄悄依赖了 React 特性的地方。

## Problem

- 当前仓库只有 `@calenderjs/react` 一个框架封装。RFC-0012（插件机制）等后续设计声称"框架中立"，但没有第二个框架实现，这个声称无法被验证——任何假设 React（如 `useMemo`/`useImperativeHandle`/合成事件）的设计缺陷都会被掩盖。
- `demos/react` 是目前唯一验证新交互（双击编辑、`proposeEventUpdate`、权限/校验反馈）的地方；原生 WSX 一侧的技术 demo（`demos/wsx`，见 RFC-0047，与官网展示站点 `apps/site` 是两回事）尚不存在，同样缺 Vue 侧的验证。
- AGENTS.md 4a 明确要求"涉及跨框架可用性的改动，必须同时在原生 WSX + React + Vue 三种消费方式下验证"——目前 Vue 这一环完全不存在，规则无法执行。

## Goals

- `@calenderjs/vue` 提供一个 `Calendar` Vue 组件，props/emit/expose 与 `@calenderjs/react` 的 `CalendarProps`/事件回调/`CalendarRef` 功能一一对应（命名可遵循 Vue 惯例，如 `onEventClick` prop 对应 Vue 的 `@event-click` emit，不强行照搬 React 命名）：
  - props：`view`/`date`/`events`/`user`/`eventTypeDefinitions`
  - emit：`date-change`/`view-change`/`event-click`/`event-edit-request`/`date-double-click`/`event-create`/`event-update`/`event-update-denied`/`event-update-error`/`event-delete`/`event-action-denied`/`slot-click`
  - `expose()`：`getElement`/`setView`/`setDate`/`goToToday`/`getEvents`/`getEventDSL`/`addEvent`/`proposeEventUpdate`
- 用 Vue 3 `<script setup>` + `ref`/`watch`/生命周期钩子实现，不借用任何 React 概念；SSR 场景下（如 Nuxt）给出占位符，同 React 封装的"客户端挂载"模式。
- `demos/vue`：复刻 `demos/react` 的核心交互（展示事件、双击打开编辑、保存走 `proposeEventUpdate`、权限拒绝/校验失败的内联提示），验证同一组日历能力在 Vue 下行为一致。
- 作为 RFC-0012 插件机制的验证场之一：`demos/vue` 要能复用和 `demos/react`/`demos/wsx`（RFC-0047）相同的插件 fixture（见 RFC-0012 Acceptance）——注意不是 `apps/site`，官网展示站点不参与此类框架中立验证。

## Non-goals

- 不支持 Vue 2——只做 Vue 3（`<script setup>`/Composition API），与仓库技术栈（Vite 生态）保持一致。
- 不在本 RFC 内对 `@calenderjs/calendar` 或 `@calenderjs/react` 做任何修改——纯新增 Vue 侧封装，不碰既有包。
- 不追求和 `@calenderjs/react` 在实现细节上一致（Vue 的响应式系统/生命周期与 React 不同），只要求**行为**/**API 覆盖面**对等。
- 不实现 RFC-0012 插件机制本身（那是 0012 的范围）——本 RFC 只保证 `demos/vue` 落地后能够接入它。

## Design

涉及文件（新增）：

- `packages/vue/package.json`：仿照 `packages/react/package.json`，`dependencies` 同为 `@calenderjs/calendar`/`@calenderjs/core`/`@calenderjs/event-model`，`peerDependencies` 改为 `vue: ^3.4.0`，构建工具同样用 Vite（`vite-plugin-dts` 生成类型声明，无需 React 专属插件）。
- `packages/vue/src/Calendar.vue`：核心组件。用 `<script setup lang="ts">`，`defineProps`/`defineEmits`/`defineExpose` 对应上面列出的三组 API；内部用 `ref` 持有 `<wsx-calendar>` DOM 引用，`watch` 监听 props 变化后直接赋值给 DOM 元素的 property（同 React 封装"所有属性都通过 property 设置"的方式，不走 attribute），`onMounted`/`onUnmounted` 里 `addEventListener`/`removeEventListener` 转发 `CustomEvent` 成 Vue `emit`。
- `packages/vue/src/index.ts`：导出 `Calendar` 组件与相关类型。
- `packages/vue/vitest.config.ts`：同 `packages/react` 使用 happy-dom 环境。
- `packages/vue/eslint.config.js`：仿照 `packages/react/eslint.config.js` 的两段式配置（测试文件不走 `project` 类型检查）。
- `demos/vue/`：新 Vite + Vue 3 项目，结构参照 `demos/react/`；至少复刻事件展示、双击编辑、`proposeEventUpdate` 保存、权限拒绝/校验失败内联提示这几条已有交互。
- `pnpm-workspace.yaml`：`packages/*` 已覆盖 `packages/vue`，`demos/*` 已覆盖 `demos/vue`，两者无需改动工作区配置（确认现有 glob 已包含，若实现时发现遗漏再调整）。

## Acceptance

- `pnpm --filter @calenderjs/vue typecheck`/`lint`/`test` 全部通过；单测覆盖 `Calendar.vue` 的 props→property 同步、事件转发（每个 emit 至少一条用例）、`expose()` 的每个方法。
- 覆盖率：`packages/vue` 新增生产代码行覆盖率 ≥ 80%。
- **真实浏览器验证（RFC-0027 金科玉律）**：`pnpm --filter demos-vue dev`（或等效脚本名，视实现时命名而定），在浏览器里实际走一遍"展示事件 → 双击打开编辑 → 保存 → 日历刷新"，以及至少一次权限拒绝/校验失败场景，确认行为与 `demos/react` 等价。
- E2E：`demos/vue` 补充与 `demos/react` 对应的 P0/P1 场景（事件展示、双击编辑触发、保存成功/拒绝/校验失败），参照 RFC-0027 的 demo 覆盖率要求执行。
- 验收时需明确报告：是否真的启动过 `demos/vue` 并在浏览器里操作过，不得仅凭类型检查/单测通过就声称"Vue 封装可用"（遵循 AGENTS.md 关于 demo 验证的禁止事项）。
