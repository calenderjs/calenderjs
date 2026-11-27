# RFC 0027: RFC-demo coverage golden rule

**Status:** Draft

## Summary

立黄金规则：任何改变可观察行为的 RFC，验收标准必须包含"demo 已更新到能让人亲手跑一遍"，落入 `AGENTS.md`（CLAUDE.md 同步引用 AGENTS.md 为准）。

**现状核对（本次更新时重新读过源码，核实本 RFC 最初的具体诱因已不成立）**：最初草案写于 MonthView.wsx 还没有任何拖拽代码的时期。此后 RFC-0036（月视图拖拽改时间，已 Implemented 并归档于 `.spec/rfc/completed/0036-month-view-drag-move.md`）已经补上了这块——`MonthView.wsx` 现在和 WeekView/DayView 一样有完整的 `startPointerDrag`/`handleEventKeyDown`/`tabIndex`。`demos/react` 默认 `currentView` 仍是 `"month"`（`demos/react/src/App.tsx:83`），但 month 视图本身已不是只读，用户打开 demo 默认就能在月视图里拖拽改时间。本 RFC 最初列的"具体缺口"已不存在，但黄金规则这个流程纪律目标本身不依赖该缺口，继续保留。

## Problem

黄金规则要解决的根本问题：RFC 关单流程（`specify advance/archive`）只检查 RFC 文档状态和 ROADMAP/TASK_TRACKING 对齐，不检查 demo 是否真的练到了这个功能。只要 PR 里代码测试绿、RFC 文档标了 Implemented，就能合并——即便 demo 完全没有改一行去展示它。这是本 RFC 真正要堵的流程漏洞，不依赖 MonthView 拖拽缺口是否还在。

（历史记录：最初触发本 RFC 的具体现象是"`pnpm dev:react` 默认 month view 且 MonthView.wsx 当时没有 drag 代码"，当时 RFC-0020/0021 只落地在 WeekView/DayView。该具体现象已被 RFC-0036 解决，不再是本 RFC 要修的东西，仅保留作为"为什么会发现这条流程漏洞"的背景。）

这不是孤例：RFC 关单流程（`specify advance/archive`）只检查 RFC 文档状态和 ROADMAP/TASK_TRACKING 对齐，不检查 demo 是否真的练到了这个功能。只要 PR 里代码测试绿、RFC 文档标了 Implemented，就能合并——即便 demo 完全没有改一行去展示它。

## Goals

- `AGENTS.md` 新增"金科玉律"条目：**凡 RFC 改变用户可观察行为（新交互、新 API、新模式），其 Acceptance 必须包含 demo 更新项；关单前必须人工在 demo 里实际跑通一次**。CLAUDE.md 已声明"以 AGENTS.md 为准"，故只需改 AGENTS.md，CLAUDE.md 不动。
- demo 里应同时能演示 editable 与（待 RFC-0026 落地后）readonly 两种模式的对比，不能只有一种能跑通的路径。
- `specify` 工作流的 RFC 模板里，`## Acceptance` 的指导文字应提示"是否需要 demo 更新"（文档层面提示，不强制机器校验）。

## Non-goals

- 不新增自动化工具去机器检测"demo 是否覆盖了 RFC"——这次只靠流程纪律（人工关单前自查）与文档约束，不做静态分析或 CI 门槛（后续若需要可另开 RFC）。
- 不要求历史上所有已关单 RFC 补建demo（那是存量债务，超出本 RFC）。
- 不改变 demo 默认视图或加引导 UI——月视图拖拽缺口已由 RFC-0036 解决，不再需要本 RFC 动 `demos/react/src/App.tsx` 的默认视图/文案。
- 不改变 demo 的技术栈或整体信息架构。

## Design

涉及文件：
- `AGENTS.md`：在"行为准则"章节新增一条金科玉律（RFC 驱动开发那条下面），文字对齐现有中文行文风格。
- `.spec/rfc/` 模板或 `specify` skill 文档（如可改）：`## Acceptance` 提示语里加一句"是否需要同步更新 demo"。
- `demos/react/src/App.tsx`：**不改动**——默认视图保持 `"month"`，因为 MonthView 现已有完整拖拽/resize/keyboard-edit，不存在"打开即只读"的问题，无需再改默认视图或加引导文案。

## Acceptance

- `AGENTS.md` 能看到新增的金科玉律条目，措辞明确、可执行（不是空话）。
- 打开 `pnpm dev:react`（不做任何点击）即可在默认 month 视图里拖拽改时间——验证 RFC-0036 的修复仍然有效，未退化。
- 本 RFC 关单前，亲手在浏览器里跑一遍 month 视图下的 drag-move 和 drag-resize，描述实际操作结果（不是看代码推断）。
- 之后新开的 RFC，只要涉及可观察行为变化，Acceptance 里能看到 demo 更新项（下一个被这条规则约束到的 RFC 作为验证）。
