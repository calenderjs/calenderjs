# RFC-0015: React Demo 浏览器端到端验收

**Status:** Implemented  
**状态**: Implemented  
**创建日期**: 2026-09-07  
**完成日期**: 2026-09-20  
**关联 RFC**: RFC-0004、RFC-0008、RFC-0014  
**授权**: 用户要求先建立 RFC，再完成 E2E 与 100% 覆盖验收。

## 问题

React demo 没有浏览器测试入口。现有 `end-to-end.test.ts` 是 Node 数据管线
测试；React wrapper 无测试仍成功，Calendar 的 26 个视图断言被跳过。
这些结果不能证明 Monaco 输入、React 生命周期、Web Component 注册、真实
浏览器布局与生产包加载之间的集成正确。

## 目标与边界

本 RFC 只解决 React demo 的可重复浏览器验收。测试真实 DSL 文本、真实
Monaco、真实 React wrapper 与 Calendar；不替换业务模块或伪造成功状态。
保留现有 API、DSL 语法和用户未提交的文档修改。

100% 用户流程覆盖与行、语句、函数、分支代码覆盖分别报告，不能互相替代。
用户流程以本 RFC 的固定清单为分母，每项必须对应实际执行的测试断言。

### 覆盖口径（已确定）

| 维度 | 分母 | 门槛 | 强制入口 |
| --- | --- | --- | --- |
| 用户流程 | E01–E13 × chromium/firefox/webkit = 39 | **100%** | `E2E_REQUIRE_COMPLETE=1` + `feature-reporter` |
| demo 源码 | `demos/react/src/**/*.{ts,tsx}` | lines/statements ≥ **94%**；functions/branches ≥ **90%** | `e2e/check-coverage.mjs` |
| 消费的包产物 | monocart 报告中的 `packages/*/dist` | **只报告，不设 e2e 门槛**（各包单测负责） | monocart |

已知未覆盖（不删减分母、不 ignore）：

- `App` 中 `validateBase` 失败分支（默认事件恒过基础校验，非用户流程）
- `MonacoEnvironment.getWorker`（V8 覆盖常无法归因到该工厂函数）

## 方案对比

1. 仅补 Vitest DOM 集成测试：速度快，能验证属性与回调；无法证明浏览器布局、
   Monaco worker 与打包后动态加载正常，不足以完成本需求。
2. Playwright 测试生产构建 demo，必要时增加 wrapper 隔离回归页面及组件测试：
   覆盖真实用户边界，失败保留 trace、截图和报告。选择此方案。

## 技术设计

- `demos/react/playwright.config.ts` 通过官方 `webServer` 启动 Vite preview，
  使用独立固定端口与 strictPort，不复用未知进程。
- 根 `pnpm test:e2e` 先经 Turbo 构建 demo 与依赖，再执行官方 Playwright CLI，
  并在 `E2E_REQUIRE_COMPLETE=1` 下跑场景门禁与 demo src 代码覆盖门禁。
- Chromium、Firefox、WebKit 执行相同用户流程；固定浏览器日期、语言、时区，
  另覆盖 UTC、洛杉矶与上海及夏令时边界。
- 选择器优先角色、可访问名称、真实组件 DOM；使用自动等待断言，不用固定睡眠。
- Monaco 资源由 demo 自身 ESM/worker 提供；`replaceDSL` 经真实 `model.setValue`。
- 测试中记录未处理页面异常；首次失败即失败，不用重试掩盖不稳定。

## 固定验收清单

| ID | 用户流程 | 必须验证的结果 |
| --- | --- | --- |
| E01 | 首次进入 demo | Monaco 就绪，两条默认事件验证成功且日历可见 |
| E02 | 月、周、日切换 | 对应视图与事件标题、时间、颜色真实显示 |
| E03 | 上一期、下一期、今天 | 日期与事件范围正确；回到固定的今天 |
| E04 | 编辑有效 DSL | 颜色变化从文本经编译到日历；事件数量正确 |
| E05 | DSL 语法错误及修复 | 显示错误、清空无效结果、修复后恢复 |
| E06 | 业务规则拒绝及恢复 | 无效事件显示错误且从日历移除，恢复规则后重新出现 |
| E07 | 数据 schema 拒绝及恢复 | 必填/字段约束错误显示，修复 DSL 后恢复 |
| E08 | 点击事件 | React 回调收到正确事件；不重复派发 |
| E09 | 深浅主题切换 | 页面、Monaco 与日历主题一致；往返保持数据 |
| E10 | 拖动分栏 | 两侧尺寸变化，最小/最大约束有效，释放后停止拖动 |
| E11 | 时区与夏令时 | 默认本地 10:00、14:00 事件通过校验且日期正确 |
| E12 | 窄屏布局 | 关键控件可操作、内容可滚动访问 |
| E13 | 冷启动 wrapper | 初始固定 props 生效，事件监听绑定；更新、卸载正常 |

## 实施检查清单

1. ~~登记 RFC、路线图和任务记录；明确覆盖口径。~~
2. ~~安装 Playwright 与浏览器，增加配置、pnpm 命令及报告忽略项。~~
3. ~~编写并执行上述真实浏览器回归，记录初始失败。~~
4. ~~修复失败揭示的产品问题，保持 API 兼容；重新验证。~~
5. ~~增加覆盖收集与可执行验收门槛，记录分母与未覆盖项。~~
6. ~~执行全部 E2E、相关单测、类型检查、lint、构建与文档检查。~~
7. ~~在本 RFC 记录实际命令、结果、报告路径；全部验收通过后归档。~~

## 风险与兼容性

浏览器下载和真实编辑器启动增加时间与磁盘使用。构建与测试入口分离便于
调试，但标准验收命令必须先构建，避免测试旧产物。测试页面不得成为 demo
产品功能；没有浏览器证据的推断不得写成已修复。

## 验证记录

初始审查：event-runtime 140 通过；calendar 65 通过、26 跳过；编辑器 2 通过；
React 无测试；demo 构建命中 Turbo 缓存。尚无浏览器 E2E 验收结果。

### 2026-09-20：E2E 脚手架与 E01–E13 矩阵

命令：

```bash
pnpm test:e2e:install
pnpm --filter @calenderjs/calendar build
pnpm --filter @calenderjs/demos-react build:e2e
E2E_REQUIRE_COMPLETE=1 pnpm --filter @calenderjs/demos-react test:e2e
```

结果：Chromium / Firefox / WebKit 共 63 例全部通过；
`feature-reporter` 场景覆盖 **39/39 (100%)**。
报告：`demos/react/monocart-report/`、`demos/react/test-results/feature-coverage.json`。

### 2026-09-20：覆盖口径、门禁与全量验收

命令：

```bash
pnpm test:e2e
pnpm --filter @calenderjs/calendar test
pnpm typecheck
pnpm lint
pnpm validate:docs
```

结果：

- 场景覆盖 39/39；demo src 门禁通过（lines/statements ~94.9%，functions ~91.7%，branches ~94.3%）
- calendar 单测 71 passed / 26 skipped
- typecheck / lint / validate:docs 通过
- 报告：`demos/react/test-results/code-coverage-gate.json`

回归修复摘要：

- Monaco：暴露真实 `monaco` API，`replaceDSL` 用 `model.setValue` 驱动 React。
- Firefox：Monaco textarea 常为 hidden，改为 `toBeAttached` + 编辑器壳可见。
- E07：`integer` 非法类型会变成编译错误；改为合法 `number` 触发 data schema 拒绝。
- E08：展开 `@state` Proxy；demo 日志打印 `event.id`。
- E09：选择器改为真实 `.calendar`；主题断言对齐 `vs-dark` base。
