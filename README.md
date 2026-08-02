# CalenderJS

基于日历的事件/预约管理系统。WSX Web Components 日历组件 + Event DSL + React 封装。

---

## For AI agents

> **Start here.** This section routes LLMs to the right docs before any code change.

| Priority | File | Purpose |
|----------|------|---------|
| 1 | [docs/llm-guide.md](./docs/llm-guide.md) | Task routing, file map, invariants, implementation status |
| 2 | [TASK_TRACKING.md](./TASK_TRACKING.md) | Current sprint — what is **pending** right now |
| 3 | [AGENTS.md](./AGENTS.md) | Rules: pnpm only, RFC-driven, WSX conventions |
| 4 | [llms.txt](./llms.txt) | Compact link index ([llms.txt spec](https://llmstxt.org/)) |

### Quick facts (machine-readable)

```
repo:           calenderjs monorepo
calendar_pkg:   @calenderjs/calendar     # NOT @calenderjs/core
calendar_tag:   wsx-calendar
event_ssot:     packages/event-model/src/Event.ts
event_field:    data
milestone:      M4 DSL integration
package_mgr:    pnpm                     # NEVER npx
test:           vitest via pnpm scripts
wsx_skill:      .cursor/skills/wsx-work/SKILL.md
```

### Task → file routing

| Task | Go to |
|------|-------|
| Edit calendar views | `packages/calendar/src/views/*.wsx` + wsx-work skill |
| Change Event model | `packages/event-model/src/Event.ts` |
| Change DSL grammar | `packages/event-dsl/src/event-dsl.pegjs` |
| React integration | `packages/react/src/` |
| Know what's done vs planned | [docs/llm-guide.md §2](./docs/llm-guide.md#2-implementation-status) |

---

## 项目概述

CalenderJS 提供：

1. **日历组件**（`@calenderjs/calendar`）：基于 WSX 的 `<wsx-calendar>`，月/周/日视图
2. **Event DSL**（`@calenderjs/event-dsl`）：PEG.js 文本 DSL，定义事件类型与业务规则
3. **Event 数据模型**（`@calenderjs/event-model`）：Event 接口 SSOT + JSON Schema 校验
4. **Event 运行时**（`@calenderjs/event-runtime`）：验证、渲染增强、权限检查
5. **React 集成**（`@calenderjs/react`）：Calendar、EventEditor、ResizableSplitter
6. **演示与文档**：`demos/react/`（React Demo）、`site/`（官网与文档站）

**当前里程碑**：M4 DSL 集成（详见 [ROADMAP.md](./ROADMAP.md)）

## 项目结构

```
calenderjs/
├── packages/
│   ├── core/                 # 核心模型、上下文、工具函数
│   ├── calendar/             # WSX 日历组件 <wsx-calendar>
│   ├── event-model/          # Event 接口 SSOT、EventValidator
│   ├── event-dsl/            # PEG.js DSL 解析、编译器、生成器
│   ├── event-runtime/        # EventRuntime（验证/渲染/行为）
│   ├── date-time/            # 日期时间工具
│   ├── react/                # React 封装
│   └── monaco-event-dsl/     # Monaco Editor DSL 集成
├── demos/react/                # React + Vite 演示
├── site/                       # WSX 官网（i18n、路由、文档）
├── docs/
│   ├── llm-guide.md            # AI 代理主指南
│   ├── rfc/                    # RFC 驱动开发文档
│   ├── persona/                # AI 角色定义
│   └── examples/               # 示例代码
├── llms.txt                    # AI 链接索引
├── ROADMAP.md                  # 路线图与 RFC 状态
└── TASK_TRACKING.md            # 当前 Sprint 任务
```

### 包依赖关系

```
event-model (SSOT)
    ↑
core ← date-time
    ↑
event-dsl (编译时)     event-runtime (运行时)
    ↑                        ↑
calendar ←───────────────────┘
    ↑
react → demos/react
```

## 快速开始

### 前置要求

- Node.js >= 20.19.0 或 >= 22.12.0
- pnpm >= 10.0.0

### 安装

```bash
pnpm install
```

### 开发

```bash
pnpm dev                    # pangu 开发所有包
pnpm dev:react              # React 演示站
pnpm --filter @calenderjs/site dev   # 官网
```

### 构建与测试

```bash
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm validate:docs   # LLM doc links + sync llms.txt to site/public
```

### 单包操作

```bash
pnpm --filter @calenderjs/calendar test
pnpm --filter @calenderjs/calendar build
pnpm --filter @calenderjs/event-dsl build
```

## 使用示例

### Web Component

```html
<script type="module">
  import '@calenderjs/calendar';
</script>

<wsx-calendar view="month" date="2024-12-30"></wsx-calendar>
```

```typescript
import { Calendar } from '@calenderjs/calendar';
import type { Event } from '@calenderjs/event-model';

const calendar = document.querySelector('wsx-calendar') as Calendar;

const events: Event[] = [
  {
    id: '1',
    type: 'meeting',
    title: '团队会议',
    startTime: new Date('2024-12-30T10:00:00'),
    endTime: new Date('2024-12-30T11:00:00'),
    color: '#4285f4',
    data: { location: '会议室 A' },
  },
];

calendar.events = events;
```

### React

```tsx
import { Calendar } from '@calenderjs/react';
import type { Event } from '@calenderjs/event-model';

function App() {
  const events: Event[] = [/* ... */];

  return <Calendar view="month" events={events} />;
}
```

详见 [packages/react/README.md](./packages/react/README.md)。

### Event DSL

```typescript
import { parse, compile } from '@calenderjs/event-dsl';

const ast = parse(`
  type meeting {
    name: "团队会议"
    fields {
      title: string required
      location: string
    }
  }
`);

const compiled = compile(ast);
```

详见 [packages/event-dsl/README.md](./packages/event-dsl/README.md)。

## 核心概念

### Event 数据模型

- **Event** 是技术模型：所有日历活动（会议、预约、假日等）都是 Event，`type` 区分业务类型
- **Appointment** 是业务概念，通过 DSL 定义，编译后生成符合 Event 接口的数据
- 扩展字段为 `data`（RFC-0011）

### Event DSL 架构

| 层 | 包 | 职责 |
|----|-----|------|
| 编译时 | `@calenderjs/event-dsl` | PEG 解析 → AST → 编译器 → 类型/Schema 生成 |
| 运行时 | `@calenderjs/event-runtime` | 验证、渲染增强、行为检查（`canPerform`） |
| 数据模型 | `@calenderjs/event-model` | Event 接口 SSOT + JSON Schema 结构校验 |

### Calendar 与 DSL

- Calendar 接受 `events` 数组进行纯数据驱动渲染（已实现）
- Calendar 将接受 `EventRuntime` property 进行 DSL 驱动增强（M4 进行中）
- 无 runtime 时降级为纯数据驱动

## 文档

### AI / LLM

- [docs/llm-guide.md](./docs/llm-guide.md) — AI 代理主指南
- [llms.txt](./llms.txt) — 链接索引
- [AGENTS.md](./AGENTS.md) — 开发规范（`CLAUDE.md`、`GEMINI.md` 同步）

### 路线图与任务

- [ROADMAP.md](./ROADMAP.md) — RFC 状态、里程碑、架构决策
- [TASK_TRACKING.md](./TASK_TRACKING.md) — 当前 Sprint 任务

### RFC 文档

| RFC | 标题 | 状态 |
|-----|------|------|
| [0002](./docs/rfc/0002-event-dsl.md) | Event DSL | Implemented（集成进行中） |
| [0004](./docs/rfc/0004-react-demo-site.md) | React Package & Demo | Implemented |
| [0005](./docs/rfc/0005-calendar-component.md) | Calendar Component | In Progress |
| [0008](./docs/rfc/0008-calendar-component-api-redesign.md) | Calendar API 重新设计 | Implemented |
| [0010](./docs/rfc/0010-week-view-layout-fix.md) | Week View 布局修复 | Implemented |
| [0013](./docs/rfc/completed/0013-fix-today-handling.md) | 今天高亮修复 | Implemented |
| [0011](./docs/rfc/0011-event-data-model-integration.md) | Event 数据模型与 DSL 集成 | Draft |
| [0012](./docs/rfc/0012-calendar-plugin-mechanism.md) | Calendar 插件机制 | Draft |
| [0003](./docs/rfc/0003-multi-tenant-service.md) | Multi-Tenant Service | Future Plan |

### 包文档

- [@calenderjs/calendar](./packages/calendar/) — 日历 Web Component
- [@calenderjs/react](./packages/react/README.md) — React 封装
- [@calenderjs/event-dsl](./packages/event-dsl/README.md) — Event DSL
- [@calenderjs/event-model](./packages/event-model/README.md) — Event 数据模型
- [@calenderjs/core](./packages/core/README.md) — 核心模型与工具

## 技术栈

| 类别 | 技术 |
|------|------|
| UI 组件 | WSX (`@wsxjs/wsx-core`) Web Components |
| React 集成 | `@calenderjs/react` |
| DSL 解析 | PEG.js (peggy) |
| 数据校验 | AJV + JSON Schema |
| 构建 | Vite + Turbo |
| 包管理 | pnpm workspaces |
| 测试 | Vitest + happy-dom |

## 许可证

MIT
