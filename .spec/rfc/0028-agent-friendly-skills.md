# RFC 0028: Agent-friendly skills for calenderjs usage

**Status:** Draft

## Summary

新增 `skills/calenderjs-usage/SKILL.md`（Agent Skill 格式），教会任何来操作这个仓库之外、**消费** calenderjs 的 AI agent：怎么装、怎么在 React 里用、怎么在原生/Vue 等框架里用底层 Web Component `<wsx-calendar>`、常见坑（SSR 占位、DSL 写法、EventRuntime 接线）。目标读者是另一个项目里的 agent，不是本仓的开发 agent（本仓已有 `docs/llm-guide.md` 服务后者，两者不重复）。

## Problem

当前 `docs/llm-guide.md` / `AGENTS.md` / `llms.txt` 都是**面向本仓维护者**的文档——讲这个 monorepo 自己怎么开发、RFC 流程、包依赖关系。没有一份文档是写给"我是另一个项目的 agent，我想把 `@calenderjs/calendar` 装进我的项目里用"这种场景的。

具体空白：
- 没有任何地方写"怎么 `pnpm add @calenderjs/calendar`，然后在非 React 项目（比如 Vue、原生 HTML）里直接用 `<wsx-calendar>` 标签"——而这其实是可行的，因为 calendar 包底层就是标准 Web Component，不依赖 React。
- React 用法虽然 demo 里有，但没有抽成一份独立、agent 可以直接照抄的"最小可用代码"参考。
- 没有一份"DSL 怎么写、EventRuntime 怎么接、mode/readonly（待 RFC-0026）怎么配"的速查文档。

## Goals

- 新增 `skills/calenderjs-usage/SKILL.md`，覆盖：
  - 安装：`pnpm add @calenderjs/calendar`（WC 本体）、`@calenderjs/react`（React 封装，可选）。
  - 原生/Vue/Angular 等场景：直接用 `<wsx-calendar>` 自定义元素 + property 赋值（`events`/`eventTypeDefinitions`/`eventRuntime`/`mode`），不需要任何框架封装。
  - React 场景：`import { Calendar } from "@calenderjs/react"`，最小可用代码片段（对齐 demo 实际用法，不是臆造 API）。
  - Event DSL 最小示例（抄 `demos/react/src/App.tsx` 里的 `DEFAULT_DSL`），以及 EventRuntime 怎么编译/接线。
  - 常见坑：SSR 场景的 isClient 占位（`packages/react/src/Calendar.tsx` 的 `isClient` 处理）、`eventDSL` 已废弃改用 `eventTypeDefinitions`。
- Skill 文档保持和实际代码同步——这份文档本身也要被 RFC-0027 的"demo/文档先跑通再关单"纪律约束：写完先在一个空项目里实际跑一遍再关单，不是照代码推测。
- 和 `docs/llm-guide.md` 明确分工：`llms.txt` / `docs/llm-guide.md` 一句话注明"开发本仓用 llm-guide；**消费**这个库用 `skills/calenderjs-usage/SKILL.md`"，避免两份文档互相打架。

## Non-goals

- 不新增 Vue 专属适配包（`@calenderjs/vue` 之类）——现状就是原生 WC 天然兼容 Vue，文档只需要说清楚这点，不需要新写代码封装层。若未来确实需要 Vue 专属 ergonomics（如 Vue reactive props 自动双向绑定），另开 RFC。
- 不覆盖 RFC-0007（VS Code 插件/在线编辑器，已 Rejected）范畴的工具。
- 不做成一个独立发布的 npm 包或网站，先落在仓库内 `skills/` 目录，是否对外单独发布是后续决策。
- 不替代或重写 `docs/llm-guide.md`，只做好分工交叉引用。

## Design

涉及文件：
- 新增 `skills/calenderjs-usage/SKILL.md`：主文档，按 Goals 列的几块内容组织。
- `llms.txt` / `docs/llm-guide.md`：各加一行交叉引用，指向新 skill 文档，并注明读者分野（本仓开发者 vs 外部消费者）。
- 内容来源：`demos/react/src/App.tsx`（实际可跑的 React 用法与 DSL 示例）、`packages/calendar/src/Calendar.wsx` 的 `observedAttributes`/getter-setter（WC 原生用法的属性清单）、`packages/react/src/Calendar.tsx`（React props 定义与 SSR 占位逻辑）。
- 若 RFC-0026（readonly/edit mode）先于本 RFC 落地，skill 文档需要包含 `mode` 属性说明；若本 RFC 先落地，关单前需补一次更新把 `mode` 加进去（视两者实际落地顺序，在 Acceptance 里留检查项）。

## Acceptance

- `skills/calenderjs-usage/SKILL.md` 存在，且其中给出的每一段代码片段都在一个干净的临时项目里实际跑通过（React 一次、原生 HTML + `<wsx-calendar>` 一次），不是凭代码读出来的推测写法。
- 文档里的属性/API 名称（`eventTypeDefinitions`、`eventRuntime`、`mode` 等）和当前 `Calendar.wsx` 实际的 `observedAttributes`/getter 名字逐一核对一致。
- `llms.txt` 能看到指向新 skill 的链接，且读者分工说明清楚（开发本仓 vs 消费本仓产出的包）。
- 若 RFC-0026 已关单，`mode` 用法在 skill 文档里出现；若未关单，本 RFC 关单时需说明这是已知留白，待 0026 落地后补一次更新（不能假装不存在）。
