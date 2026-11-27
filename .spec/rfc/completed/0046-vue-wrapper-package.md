# RFC 0046: 新增 @calenderjs/vue 包与 demos/vue（验证框架中立设计）

**Status:** Implemented

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

- `pnpm --filter @calenderjs/vue typecheck`/`lint`/`test` 全部通过——**已验证**：typecheck 0 错误；lint 0 错误（过程中发现并修复了 `eslint.config.js` 手动 reduce-merge `eslint-plugin-vue` flat config 导致 `vue/comment-directive` 等依赖 processor 的规则失效的 bug，改为正确展开各 config 对象）；单测 9/9 通过，覆盖 props→property 同步、全部 12 个事件的转发、`expose()` 的全部方法（含底层方法缺失时的安全兜底）。
- 覆盖率：构建产物通过 externals 校验（`vue`/`@calenderjs/calendar` 保持 external，未内联运行时）。
- **真实浏览器验证（RFC-0027 金科玉律）**：`pnpm --filter @calenderjs/demos-vue dev`（端口 5205）启动成功（HTTP 200 验证）。**未能完成人工交互式浏览器验证**——本次会话 `claude-in-chrome` MCP 连接失败（非本仓库代码问题），无法人工点击验证。替代证据：Playwright chromium 项目下对"展示事件 → 双击打开编辑 → 保存 → 日历刷新"及权限拒绝/校验失败场景的自动化断言全部通过（见下），含失败时自动截图/trace，但**不等同于人工浏览器验证，如实记录此差距**。
- E2E：`demos/vue/e2e/demo.spec.ts` 已交付，5 个场景与 `demos/react`/`demos/wsx` 对应（展示事件、双击编辑、保存成功、权限拒绝、校验失败）：
  - **chromium: 5/5 通过**（5.3s–8.5s）。
  - **webkit: 5/5 通过**（8.7s–14.4s）。
  - **firefox: 5/5 失败**——根因已排查，非本次改动引入的缺陷：使用同一台机器上 `demos/wsx` 既有的、此前已验证通过的 firefox E2E 套件重新运行，同样失败（`nsIWebProgress.removeProgressListener`/`cannot find context for userContextId` 等 Firefox 内部崩溃特征），且 `pnpm exec playwright install firefox --force` 重装浏览器二进制后问题依旧，确认是本机 Firefox 1543 二进制当前不稳定，与 `demos/vue`/`@calenderjs/vue` 代码无关。未对测试代码做任何合并/跳过/改写来掩盖此问题。
- 验收如实报告：`demos/vue` 开发服务器已启动确认可访问；chromium/webkit 下已通过自动化 E2E 验证交互行为；**未完成人工浏览器点击验证**（环境工具不可用）；firefox E2E 因机器环境问题未能验证，非代码缺陷。
