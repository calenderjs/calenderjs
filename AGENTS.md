# AGENTS.md - calenderjs 项目指南

> **AI 代理入口**：[docs/llm-guide.md](./docs/llm-guide.md)（任务路由、文件地图、实现状态）· [llms.txt](./llms.txt)（链接索引）

本文档为 AI 代理与开发者提供项目上下文、角色定义和开发规范。

## 项目概览

CalenderJS 是基于日历的事件/预约管理系统 monorepo：

- **日历组件**：`@calenderjs/calendar`（WSX Web Component `<wsx-calendar>`）
- **Event DSL**：`@calenderjs/event-dsl`（PEG.js 文本 DSL）
- **数据模型**：`@calenderjs/event-model`（Event 接口 SSOT）
- **运行时**：`@calenderjs/event-runtime`（验证/渲染/行为）
- **React**：`@calenderjs/react`（日历）+ `@calenderjs/react-event-editor`（DSL 编辑器）+ `demos/react/`
- **官网**：`site/`（WSX + i18n）

当前里程碑：**M4 DSL 集成**（详见 [.spec/ROADMAP.md](./.spec/ROADMAP.md)、[.spec/TASK_TRACKING.md](./.spec/TASK_TRACKING.md)）

### 包一览

| 包                               | 说明                               |
| -------------------------------- | ---------------------------------- |
| `@calenderjs/core`               | 核心模型、上下文、工具函数         |
| `@calenderjs/calendar`           | WSX 日历组件（月/周/日视图）       |
| `@calenderjs/event-model`        | Event 接口 SSOT、JSON Schema 校验  |
| `@calenderjs/event-dsl`          | DSL 解析、编译器、生成器（编译时） |
| `@calenderjs/event-runtime`      | EventRuntime（运行时）             |
| `@calenderjs/date-time`          | 日期时间工具                       |
| `@calenderjs/react`              | React 日历封装                     |
| `@calenderjs/react-event-editor` | React Event DSL 编辑器（Monaco）   |
| `@calenderjs/monaco-event-dsl`   | Monaco Editor DSL 语言插件         |

### 关键架构决策

| 决策                 | 选择                                                    |
| -------------------- | ------------------------------------------------------- |
| Calendar 与 DSL      | DSL 驱动；Calendar 接受 EventRuntime，无 runtime 时降级 |
| Event vs Appointment | Appointment 是业务概念，Event 是技术模型                |
| DSL 形态             | 文本 DSL（PEG.js → AST）                                |
| 扩展字段             | `data`（RFC-0011）                                      |
| 编译/运行时          | `event-dsl`（编译时）与 `event-runtime`（运行时）分离   |

---

## 角色列表

所有角色定义位于 `docs/persona/` 目录：

### 技术专家

- [Linus Torvalds](docs/persona/linus-torvalds.md) - Linux 内核创造者，代码质量与简洁性专家
- [Evan You](docs/persona/evan-you.md) - Vue.js 和 Vite 创造者，前端开发专家
- [Addy Osmani](docs/persona/addy-osmani.md) - Chrome 团队工程师，Web 性能专家
- [Jake Archibald](docs/persona/jake-archibald.md) - Chrome 团队工程师，Service Worker 专家
- [Ryan Dahl](docs/persona/ryan-dahl.md) - Node.js 和 Deno 创造者
- [John Carmack](docs/persona/john-carmack.md) - 游戏引擎大师，id Software 联合创始人
- [Nikola Tesla](docs/persona/nikola-tesla.md) - 发明家和电气工程先驱

### 软件工程

- [Kent Beck](docs/persona/kent-beck.md) - 测试驱动开发(TDD)创始人，极限编程(XP)联合创始人
- [Robert C. Martin (Uncle Bob)](docs/persona/robert-c-martin-uncle-bob.md) - Clean Code 和 SOLID 原则倡导者

### AI/ML 专家

- [Jeremy Howard](docs/persona/jeremy-howard.md) - fast.ai 联合创始人，实用 AI 教育倡导者
- [Yann LeCun](docs/persona/yann-lecun.md) - 深度学习先驱，Meta AI 首席科学家，图灵奖得主
- [Andrej Karpathy](docs/persona/andrej-karpathy.md) - OpenAI 研究员，前 Tesla AI 总监，LLM 工程实践专家
- [Christopher Manning](docs/persona/christopher-manning.md) - NLP 理论专家，斯坦福大学教授

### 设计专家

- [Don Norman](docs/persona/don-norman.md) - UX 设计之父，《设计心理学》作者
- [Saul Bass](docs/persona/saul-bass.md) - 电影标题设计和品牌设计大师
- [Salvador Dalí](docs/persona/salvador-dalí.md) - 超现实主义艺术大师
- [Leonardo da Vinci](docs/persona/leonardo-da-vinci.md) - 文艺复兴大师，跨学科天才
- [Pablo Picasso](docs/persona/pablo-picasso.md) - 现代艺术大师，立体主义创造者
- [Osamu Tezuka](docs/persona/osamu-tezuka.md) - 日本漫画之神，动画大师

### 商业与管理

- [Marc Benioff](docs/persona/marc-benioff.md) - Salesforce 创始人，SaaS 先驱
- [Tim Cook](docs/persona/tim-cook.md) - 苹果公司 CEO，运营管理专家
- [Sheryl Sandberg](docs/persona/sheryl-sandberg.md) - Facebook/Meta 前 COO，《向前一步》作者
- [Dale Carnegie](docs/persona/dale-carnegie.md) - 人际关系大师，《人性的弱点》作者

## 使用方式

每个角色文件包含：角色介绍、核心哲学、沟通原则、需求确认流程、决策输出模式、代码审查标准。

## 软件架构宗师之心法

详见：[软件架构宗师之心法](docs/persona/software-architecture-master.md)

---

## 行为准则

**所有 AI 代理必须严格遵守：**

1. **尊重项目配置**
   - **严禁**随意使用 `npx` 或猜测命令
   - **必须**先检查 `package.json`、`turbo.json`
   - 使用 `pnpm` 运行脚本（`pnpm test`、`pnpm build` 等）
   - Monorepo 任务通过 Turbo 或 `pnpm --filter` 执行

2. **RFC 驱动开发**
   - 非琐碎变更**必须**先在 `.spec/rfc/` 创建或更新 RFC
   - 严禁无 RFC 支持的重大重构或功能移除
   - RFC 必须反映当前决策状态

3. **语言规范**
   - 默认使用**中文**与用户沟通（除非用户明确要求其他语言）

4. **WSX 组件开发**
   - 日历组件位于 `packages/calendar/`，使用 `.wsx` 文件
   - 参考 `.cursor/skills/wsx-work/SKILL.md` 了解 WSX 开发约定

---

## 项目开发规范

### 包管理器

本项目使用 **pnpm**，**严禁使用 npx**。

### 常用命令

| 任务                 | 命令                                      |
| -------------------- | ----------------------------------------- |
| 运行所有测试         | `pnpm test`                               |
| 运行 calendar 包测试 | `pnpm --filter @calenderjs/calendar test` |
| 构建所有包           | `pnpm build`                              |
| 构建 calendar 包     | `pnpm build:calendar`                     |
| 开发模式             | `pnpm dev`                                |
| React 演示           | `pnpm dev:react`                          |
| 代码检查             | `pnpm lint`                               |
| 类型检查             | `pnpm typecheck`                          |
| 校验 LLM 文档链接    | `pnpm validate:docs`                      |

### Cursor 规则

AI 代理自动加载 `.cursor/rules/`：

- `00-llm-onboarding.mdc` — 始终生效，任务路由与不变量
- `wsx-calendar.mdc` — 编辑 `packages/calendar/**` 时生效

### 关键约定

- 测试框架：**vitest**（通过 pnpm 脚本调用，不要直接用 npx）
- Monorepo 工具：**Turbo + pnpm workspaces**
- 运行时版本：Node >= 20.19.0 或 >= 22.12.0，pnpm 10.27.0（Volta 管理）
- RFC 文档位于 `.spec/rfc/`，实现前必须经过审批流程
- 日历组件标签：`<wsx-calendar>`，主包 `@calenderjs/calendar`（非 `@calenderjs/core`）

---

_最后更新：2026年3月_

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
