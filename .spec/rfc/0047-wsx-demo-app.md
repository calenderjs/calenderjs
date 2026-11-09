# RFC 0047: 新增 demos/wsx 原生 Web Component 技术 demo

**Status:** Draft

## Summary

新增 `demos/wsx`——一个与 `demos/react`、`demos/vue`（RFC-0046）平级的独立技术 demo，直接用原生 `<wsx-calendar>` Web Component（不经任何框架封装），复刻同样一批交互验证场景。**注意区分**：这不是 `apps/site`（GitHub Pages 官网展示站点，只给访客看能力，不承担验证职责）——`apps/site` 已有自己的 RFC-0045，两者是完全不同的东西，不能互相替代。

## Problem

- AGENTS.md 4a 要求任何跨框架能力的改动，必须在原生 WSX、React、Vue 三种消费方式下各自验证，但目前只有 `demos/react` 一个技术 demo，原生 WSX 这一环没有专门的验证场所。
- `apps/site` 之前被错误地当作"原生 WSX 验证点"使用（RFC-0012/0046 曾引用它），但 `apps/site` 定位是官网展示（GitHub Pages），不是测试/E2E 基础设施，混用会导致：官网改版/重设计（如视觉方向调整）无意中破坏验证用例，或者验证用例的噪音（编辑表单、错误提示等）污染访客该看到的简洁展示页。两者必须分离。

## Goals

- `demos/wsx` 直接使用 `<wsx-calendar>`（通过 `@calenderjs/calendar` 包，不经 `@calenderjs/react`/`@calenderjs/vue`），用原生 DOM API（`addEventListener`/直接设置 element property）驱动交互，不借助任何框架。
- 复刻 `demos/react` 的核心验证场景：展示事件列表、双击/键盘打开编辑、保存走 `proposeEventUpdate`、监听 `event-update`/`event-update-denied`/`event-update-error` 三种结果并给出可见反馈。
- 作为 AGENTS.md 4a"三件套"之一，供 RFC-0012（插件机制）、未来任何声称"框架中立"的设计在这里落地验证。
- 结构对齐 `demos/react`（同样的 Vite 项目骨架、同样的 Playwright E2E 测试模式），方便后续三个 demo 并排维护。

## Non-goals

- 不是 `apps/site` 的替代品，不改 `apps/site` 任何文件——那是 RFC-0045 的范围，职责不重叠。
- 不引入任何框架（React/Vue/其它）依赖——这正是它存在的意义：验证纯 Web Component 场景。
- 不要求比 `demos/react` 更丰富的功能（如 DSL 编辑器、Monaco 集成）——保持跟 `demos/react` 对等的最小验证集合即可，避免维护负担不对称。

## Design

涉及文件（新增）：

- `demos/wsx/package.json`：仿照 `demos/react/package.json`，`name: "@calenderjs/demos-wsx"`，依赖只需要 `@calenderjs/calendar`/`@calenderjs/core`/`@calenderjs/event-model`（不依赖任何框架包），构建工具用 Vite；直接把 `<wsx-calendar>` 当普通自定义元素使用（不经 `.wsx` 编译），以验证组件对任何宿主环境的开箱可用性。
- `demos/wsx/src/`：承载事件列表 state（原生 JS 对象/数组，不用响应式框架）、`addEventListener("event-edit-request", ...)` 打开编辑表单、`proposeEventUpdate` 调用、三种结果回调的 UI 反馈。
- `demos/wsx/e2e/`：Playwright 测试，场景对齐 `demos/react/e2e/` 已有用例（展示、双击编辑触发、保存成功/拒绝/校验失败）。
- `pnpm-workspace.yaml`：确认 `demos/*` glob 已覆盖 `demos/wsx`（无需改动，现有 `demos/*` 已包含）。

## Acceptance

- `pnpm --filter @calenderjs/demos-wsx typecheck`/`lint` 通过。
- E2E：`demos/wsx` 的 Playwright 场景覆盖事件展示、双击编辑触发、保存成功走 `event-update`、权限拒绝走 `event-update-denied`、校验失败走 `event-update-error`，与 `demos/react` 对应场景一一对齐，100% 通过率。
- 真实浏览器验证（RFC-0027 金科玉律）：实际启动 `demos/wsx` 的 dev server，在浏览器里走一遍上述交互，不得仅凭代码改动推断。
- **跨 demo 一致性**：`demos/wsx`、`demos/react`、`demos/vue`（RFC-0046 交付后）三处的编辑/保存/权限/校验交互必须行为等价，且不得各自硬编码一套不同的测试 fixture——三处应引用同一份事件/校验规则定义（具体共享机制留给实现阶段决定，可以是共享的 `.spec`/fixture 文件）。
