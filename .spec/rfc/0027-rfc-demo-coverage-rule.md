# RFC 0027: RFC-demo coverage golden rule

**Status:** Draft

## Summary

立黄金规则：任何改变可观察行为的 RFC，验收标准必须包含"demo 已更新到能让人亲手跑一遍"，落入 `AGENTS.md`（CLAUDE.md 同步引用 AGENTS.md 为准）。同时这次先补上已知缺口：`demos/react` 默认停在 month view，month view 没有 drag/resize 代码，用户打开 demo 感觉"整个日历是只读的"，根本找不到 RFC-0020/0021 已经做好的拖拽改时间/改时长功能。

## Problem

实测现象（本次会话里真实复现）：打开 `pnpm dev:react`，默认 `currentView = "month"`（`demos/react/src/App.tsx` 里 `useState<...>("month")`），MonthView.wsx 里没有任何 `drag`/`Drag`/`handleEventKeyDown`/`tabIndex` 代码——RFC-0020（拖拽改时间）、RFC-0021（拖拽改时长）全部只实现在 WeekView/DayView。用户必须自己点"周"或"日"按钮才能撞见这两个已经关单的功能，demo 本身没有任何引导、没有示例操作提示，等同于交付了功能却没交付"能被发现、能被验证"的使用路径。

这不是孤例：RFC 关单流程（`specify advance/archive`）只检查 RFC 文档状态和 ROADMAP/TASK_TRACKING 对齐，不检查 demo 是否真的练到了这个功能。只要 PR 里代码测试绿、RFC 文档标了 Implemented，就能合并——即便 demo 完全没有改一行去展示它。

## Goals

- `AGENTS.md` 新增"金科玉律"条目：**凡 RFC 改变用户可观察行为（新交互、新 API、新模式），其 Acceptance 必须包含 demo 更新项；关单前必须人工在 demo 里实际跑通一次**。CLAUDE.md 已声明"以 AGENTS.md 为准"，故只需改 AGENTS.md，CLAUDE.md 不动。
- 修 demo 当前这次具体缺口：`demos/react` 默认视图改为能展示拖拽的视图（`week`），或者在 month 视图上加一条可见提示（例如"切到周/日视图可拖拽改时间"）引导用户切视图。
- demo 里应同时能演示 editable 与（待 RFC-0026 落地后）readonly 两种模式的对比，不能只有一种能跑通的路径。
- `specify` 工作流的 RFC 模板里，`## Acceptance` 的指导文字应提示"是否需要 demo 更新"（文档层面提示，不强制机器校验）。

## Non-goals

- 不新增自动化工具去机器检测"demo 是否覆盖了 RFC"——这次只靠流程纪律（人工关单前自查）与文档约束，不做静态分析或 CI 门槛（后续若需要可另开 RFC）。
- 不要求历史上所有已关单 RFC 补建demo（那是存量债务，超出本 RFC；只处理 0020/0021 这个已经被用户实测撞到的具体缺口，以及今后新 RFC 的流程）。
- 不改变 demo 的技术栈或整体信息架构，只改默认视图/引导文案与关单流程文档。

## Design

涉及文件：
- `AGENTS.md`：在"行为准则"章节新增一条金科玉律（RFC 驱动开发那条下面），文字对齐现有中文行文风格。
- `demos/react/src/App.tsx`：`currentView` 初始值从 `"month"` 改为 `"week"`（或保留 month 但加可见的 UI hint，待实现时二选一，具体取舍在 PR 里定，不在本 RFC 锁死——两者都能满足"用户打开就能看到/被引导到拖拽功能"这一验收标准）。
- `.spec/rfc/` 模板或 `specify` skill 文档（如可改）：`## Acceptance` 提示语里加一句"是否需要同步更新 demo"。

## Acceptance

- `AGENTS.md` 能看到新增的金科玉律条目，措辞明确、可执行（不是空话）。
- 打开 `pnpm dev:react`（不做任何点击）即可看到或被引导到拖拽改时间/改时长的入口——不再需要用户自己摸索切视图。
- 本 RFC 关单前，亲手在浏览器里跑一遍 drag-move 和 drag-resize，截图或描述实际操作结果（不是看代码推断）。
- 之后新开的 RFC，只要涉及可观察行为变化，Acceptance 里能看到 demo 更新项（下一个被这条规则约束到的 RFC 作为验证）。
