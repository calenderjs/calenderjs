# RFC 0041: RFC 验收测试门槛

**Status:** Implemented

## Summary

为每个 RFC 统一测试验收标准：相关单元测试与 P0、P1、P2 E2E 用例通过率均为 100%，RFC 涉及生产代码的聚合行覆盖率高于 80%。RFC 可按功能风险增加更严格门槛，不得降低本标准。

## Problem

当前 `AGENTS.md` 要求 RFC 驱动开发，但没有规定 RFC 的测试通过率、E2E 优先级或整体覆盖率门槛。RFC 可以在测试部分只写“测试通过”，也没有统一说明跳过用例和不适用优先级如何处理。RFC-0015 已为 React demo 规定更高的场景与代码覆盖率标准，但这不是所有 RFC 都能直接采用的通用规则。

## Goals

- 在 `AGENTS.md` 定义适用于每个 RFC 的单元测试、E2E 和整体代码覆盖率门槛。
- 区分测试通过率与代码覆盖率，避免把“测试全通过”误写为“100% 代码覆盖”。
- 要求 RFC 列出适用的 P0、P1、P2 E2E 场景及可核对的测试证据。
- 保留 RFC-0015 等已有 RFC 中更严格的专属门槛。

## Non-goals

- 不改动现有测试代码、CI 工作流或覆盖率工具。
- 不追溯修改已归档 RFC。
- 不要求每个 RFC 都新增 E2E；纯文档或内部变更可将 E2E 标为不适用并说明理由。
- 不把通过率 100% 等同于代码覆盖率 100%。

## Design

有两个文档落点：一是在 `AGENTS.md` 的“行为准则”中增加可执行的 RFC 验收规则；二是新增独立测试策略文档，再从 `AGENTS.md` 链接。推荐方案一。规则短且属于所有代理必须遵守的项目约定，放在现有 RFC 驱动条目旁，最容易被发现，也避免增加第二份规范来源。

规则使用以下口径：

- RFC 中列出的相关单元测试通过率必须为 100%。失败或跳过的相关用例不能算通过；若确实不适用或受外部条件阻塞，RFC 必须逐项说明，不能静默忽略。
- 对变更涉及的用户流程，RFC 必须标注适用的 P0、P1、P2 E2E 场景。每个适用级别的场景通过率必须为 100%，并记录执行浏览器或运行环境及结果。某级别不适用时须说明理由。
- RFC 变更涉及的生产代码，聚合行覆盖率必须高于 80%。按所有受影响包的总覆盖行数除以总可覆盖行数计算，不取各包百分比的简单平均。RFC 验收须记录覆盖率报告和分子、分母；没有报告就不能声称达标。
- RFC 必须为每个适用 E2E 场景标注优先级。P0 表示核心流程或数据完整性、安全性；P1 表示主要功能流程；P2 表示受支持的次要流程、边界行为或兼容性回归。
- 通过率和覆盖率分开报告。测试通过率 100% 不代表代码覆盖率 100%。
- RFC 可定义更高或更细的覆盖门槛；不得覆盖或降低本基线。已有专项 RFC 的更严格门槛继续有效。

本变更只修改根目录 `AGENTS.md`，在“RFC 驱动开发”条目下新增测试验收规则。`CLAUDE.md` 若引用 `AGENTS.md`，保持现状，不重复维护规则。

## Acceptance

- `AGENTS.md` 明确写出相关单元测试通过率 100%、适用 P0/P1/P2 E2E 场景通过率各 100%、RFC 变更涉及生产代码的聚合行覆盖率高于 80%。
- `AGENTS.md` 说明跳过、失败、不适用场景必须记录，不得计作通过或静默排除。
- `AGENTS.md` 说明专项 RFC 可设置更严格门槛，不能降低通用基线。
- 文档校验、RFC 校验与 `specify sync-check` 通过；`git diff --check` 通过。

## Implementation record

- Added RFC test gates to the root `AGENTS.md`: relevant unit tests and applicable P0, P1, and P2 E2E scenarios require 100% pass rates. RFC-scoped production code requires weighted aggregate line coverage above 80%.
- Defined P0, P1, and P2, documented skip and not-applicable handling, and preserved stricter RFC-specific gates.
- `pnpm validate:docs`, RFC validation, `specify sync-check`, and `git diff --check` passed.
