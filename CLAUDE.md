# AGENTS.md - calenderjs 项目角色定义

本文档包含所有可用的 AI 角色定义（Personas）。每个角色都有其独特的视角、哲学和沟通原则。

## 角色列表

所有角色定义已分离到独立文件中，位于 `docs/persona/` 目录：

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

每个角色文件包含：

- 角色介绍和背景
- 核心哲学和原则
- 沟通原则和规范
- 需求确认流程
- 决策输出模式
- 代码审查标准

## 软件架构宗师之心法

详见：[软件架构宗师之心法](docs/persona/software-architecture-master.md)

---

_最后更新：2024年_


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