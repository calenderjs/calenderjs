# RFC 0043: CI 门禁与 main 分支保护

**Status:** Implemented

## Summary

补齐 PR workflow 的手动触发、最小权限、lint、类型检查与完整构建门禁，并为 `main` 配置必须通过 PR 和 CI 的规则集。先让 GitHub Actions 实际运行，再用 GitHub 报告的准确 job 名配置 required checks。

## Problem

`.github/workflows/pull-request.yml` 只运行单测和 E2E，没有手动触发入口，也未在 workflow 中声明 token 权限。typecheck、lint、完整构建和 bundle 边界检查只由本地 Git hooks 执行。`main` 当前没有分支保护规则，因此 PR 检查不强制，直接推送也不会触发现有 workflow。

## Goals

- 为 PR workflow 增加 `workflow_dispatch`，并声明 `contents: read`。
- 在 GitHub Actions 运行 `pnpm lint`、`pnpm typecheck` 和 `pnpm build`，保留现有单测与 E2E。
- 让全部发布包 build 与 bundle 边界检查在 GitHub 上运行。
- 保护 `main`：要求 PR、要求全部验证 jobs 通过、禁止删除和 force push，不配置绕过者。
- 只使用真实 GitHub run 报告的 status-check 名称，不猜 job context。

## Non-goals

- 不新增发布、部署或版本自动升级 workflow。
- 不要求特定数量的 PR review；仓库尚无此策略。
- 不改变产品功能或优先级定义。若新启用的 E2E CI 揭示验收断言与其他明确行为契约冲突，只校正失效断言。
- 不更改 RFC 0042 或其工作区改动。

## Design

方案一是在现有 `.github/workflows/pull-request.yml` 增加触发器、权限和三个独立 job。方案二是拆成 reusable workflow 并由多个入口调用。推荐方案一：当前只有一个 PR workflow，没有重复逻辑；拆分只会增加配置和调用链。

改动范围：

- `.github/workflows/pull-request.yml`：保留 `pull_request` 目标 `main`，新增 `workflow_dispatch`；顶层设置 `permissions: contents: read`；新增 `Lint`、`Typecheck`、`Build` jobs。`Build` 运行 `pnpm build`，覆盖 Turbo package build 和 `verify:bundles`。`Typecheck` 先运行 `pnpm build`，因为包间类型声明由构建产出，随后运行 `pnpm typecheck`。现有 `Unit Tests`、`E2E Tests` 保持独立并行。
- `scripts/verify-package-bundles.mjs`：当前检查用 `source.length` 计数，却把结果标成 bytes。当前 Calendar ESM/CJS 产物分别为 129,761 和 130,665 bytes；所需依赖仍保持外部导入，禁止内联标记不存在。将门槛改为 `Buffer.byteLength(source, "utf8")`，并把 Calendar 上限设为 140,000 bytes。其他包上限不变。
- GitHub Ruleset：目标只匹配 `refs/heads/main`；要求 PR 和五个验证 jobs；禁止删除和 non-fast-forward 更新；不设 bypass actors。先推送 workflow 并手动运行，再读取 GitHub 实际报告的 job contexts，使用这些准确名称写 required checks。当前仓库没有规则集或 branch protection。

项目 default workflow token 权限已确认为 read，但 workflow 仍显式写 `contents: read`，避免未来依赖仓库默认设置。当前 GitHub Actions 没有 runs；本地和 GitHub 验证结果分开记录。

## Acceptance

- `pull-request.yml` 在 PR 和手动触发时运行；五个 jobs 全部成功。
- workflow 权限只含 `contents: read`。
- `pnpm build` 与 `verify:bundles` 通过；Calendar 校验使用真实 UTF-8 字节数，预算为 140,000 bytes；其他包预算不变。
- GitHub 为 `main` 返回 active ruleset：必须 PR 和五个实际 run contexts；禁止 branch deletion 与 force push；无 bypass actors。
- `main` 的 branch protection/effective rules 查询确认规则生效。
- E06 业务规则用例在 Chromium、Firefox、WebKit 均通过：验证状态显示拒绝，日历继续保留已存在事件，符合 E20/E26 对已存在事件的操作契约。
- RFC 校验、`specify sync-check`、workflow YAML/action 检查、文档检查与 `git diff --check` 通过。
- 本 RFC 不改生产运行时代码；测试通过率、E2E 场景和代码覆盖率报告按“不适用”记录理由。

## Implementation record

- Added manual workflow dispatch and explicit read-only `contents` permission. Added separate lint, typecheck, and full build plus bundle verification jobs.
- Changed bundle verification to count UTF-8 bytes. Raised Calendar package cap from 120,000 to 140,000 bytes after confirming current ESM and CJS bundles are 129,761 and 130,665 bytes and all required dependencies remain external.
- Local `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:docs`, RFC validation, `specify sync-check`, YAML parsing, and `git diff --check` passed.
- First hosted run confirmed build, lint, and unit tests pass. Typecheck exposed that clean CI checkout lacks generated workspace declarations; its job now builds packages before typechecking. E2E was still running when this record was written.
- Second hosted run confirmed lint, typecheck, build, and unit tests pass. It exposed a stale E06 assertion that hid already-existing calendar events after a business-rule rejection, contradicting E20/E26 behavior. Corrected E06 to assert rejected validation status while retaining existing events; product behavior remains unchanged.
- Local `pnpm test:e2e` passed: 117/117 tests across Chromium, Firefox, and WebKit; RFC-0015 coverage gates passed (lines/statements 95.83%, functions 91.43%, branches 90.70%).
- Hosted workflow run [41326382431](https://github.com/calenderjs/calenderjs/actions/runs/41326382431) passed all five jobs at commit `562e05390f66f4d6a74ade1bb17fac5646c0bfd2`.
- Created active repository ruleset `Protect main` (ID `26317123`): `refs/heads/main`, pull request required, strict required checks `Unit Tests`, `E2E Tests`, `Lint`, `Typecheck`, `Build and bundle checks` from GitHub Actions app 15368, deletion and non-fast-forward blocked, zero bypass actors. Effective rules query confirmed all rules.
- `pnpm validate:docs`, RFC validation, `specify sync-check`, workflow YAML parsing, and `git diff --check` passed. RFC 0042 working-tree changes were preserved.
