# RFC 0025: CI: Pull Request Workflow (Unit + E2E)

**Status:** Implemented

## Summary

新增 `.github/workflows/pull-request.yml`：PR 触发两个并行 job —— `unit-test`（`turbo run test`）与 `e2e-test`（构建 + Playwright 三引擎 + RFC-0015 覆盖率门槛），作为 PR 合入前的强制检查。

## Problem

仓库当前无 `.github/workflows/`，PR 全靠人工本地跑 `pnpm test` / `pnpm test:e2e`，无强制门槛。RFC-0015 已定义的 39 项用户流程覆盖与代码覆盖率门槛（`demos/react/e2e/check-coverage.mjs`）目前只能本地触发，CI 缺失导致验收标准未被强制执行。

## Goals

- PR 打开/更新时自动触发：unit test（`turbo run test`）与 e2e test（build + 三引擎 Playwright + 覆盖率门槛）。
- 两个 job 并行跑，互不阻塞，PR 更快拿到反馈。
- e2e job 复用 RFC-0015 既有脚本（`pnpm test:e2e`），不重复定义覆盖率逻辑。
- Node/pnpm 版本与仓库 `engines`/`packageManager` 字段一致（pnpm 10.27.0；Node 走 `engines` 允许区间，CI 固定 22.x LTS）。
- Playwright 浏览器二进制走官方 action 缓存，避免每次 PR 重新下载三引擎。

## Non-goals

- 不处理 push-to-main 的发布/部署流程（`qingniao release` 相关，超出本 RFC）。
- 不新增 lint/typecheck job（已有 `pnpm lint`/`pnpm typecheck`，是否纳入 CI 另起 RFC）。
- 不改动 RFC-0015 既定的覆盖率口径或用户流程清单。
- 不配置分支保护规则（GitHub 仓库设置项，非 workflow 文件范围）。

## Design

新文件 `.github/workflows/pull-request.yml`，触发器 `on: pull_request`（默认 opened/synchronize/reopened）。

两个并行 job，共享 setup 步骤（checkout、pnpm/node 安装、`pnpm install --frozen-lockfile`）：

1. **unit-test**
   - `pnpm test`（即 `turbo run test`，含各包 vitest 单测，依赖 `build` turbo task 自动触发）。

2. **e2e-test**
   - 安装 Playwright 浏览器二进制（`pnpm test:e2e:install`，按 lockfile hash 缓存 `~/.cache/ms-playwright`）。
   - `pnpm test:e2e`（即 build demos-react → `build:e2e` → `E2E_REQUIRE_COMPLETE=1 playwright test` → `check-coverage.mjs`，三引擎 chromium/firefox/webkit，RFC-0015 既定门槛）。
   - 失败时上传 `demos/react/playwright-report/`（或 monocart 报告目录）为 artifact，便于排查。

两 job 均用 `actions/setup-node@v4`（node-version 对齐 `engines` 区间内的 22.x LTS）+ `pnpm/action-setup@v4`（version 对齐 `packageManager: pnpm@10.27.0`），pnpm store 走 `actions/cache` 缓存。

涉及文件：
- 新增 `.github/workflows/pull-request.yml`
- 不改动任何现有 package.json / turbo.json / RFC-0015 脚本

## Acceptance

- workflow 文件通过 `actionlint`（或 GitHub 自身 YAML 语法校验）无报错。
- 在真实 PR 上验证：unit-test 与 e2e-test 两个 job 并行触发，均可见于 PR Checks。
- e2e-test 实际跑通三引擎且覆盖率门槛生效（复现 `pnpm test:e2e` 本地行为）。
- unit-test 失败时阻止 PR 合并（若后续配置分支保护，由仓库设置承接，本 RFC 只保证 job 本身正确上报失败状态）。
