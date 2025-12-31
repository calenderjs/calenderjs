# CalenderJS

基于日历的预约管理系统，支持 Appointment DSL、多租户架构和第三方集成。

## 项目概述

CalenderJS 是一个完整的日历预约管理解决方案，包含：

1. **CalenderJS 组件库**：基于 Web Components 的日历组件集合（RFC-0001）
2. **Appointment DSL**：领域特定语言，用于定义和扩展特殊预约事件类型（RFC-0002）
3. **React 演示网站**：展示组件和 DSL 功能的演示网站（RFC-0004，React + Vite）
4. **Next.js 多租户服务**：支持多租户的日历服务（RFC-0003，未来计划，使用 Next.js）

**当前阶段**：
- 实现 RFC-0001（组件库）和 RFC-0002（DSL）
- 实现 RFC-0004（React + Vite 演示网站）
- RFC-0003（Next.js 业务服务）保留在文档中，作为未来计划

## 项目结构

```
calenderjs/
├── docs/
│   ├── rfc/
│   │   ├── 0001-calendar-appointment-management.md
│   │   ├── 0002-appointment-dsl.md
│   │   └── 0003-tob-calendar-service.md
│   ├── examples/
│   │   └── appointment-dsl-examples.ts
│   └── setup/
│       └── pnpm-nx-setup.md
│
├── packages/
│   ├── core/                      # 核心日历组件库（RFC-0001）
│   │   ├── src/
│   │   │   ├── Calendar.wsx
│   │   │   ├── views/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── dsl/                       # Appointment DSL 支持（RFC-0002）
│   │   ├── src/
│   │   │   ├── compiler.ts
│   │   │   ├── runtime.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   └── integrations/              # 第三方集成组件
│       ├── src/
│       │   ├── GoogleCalendarSync.wsx
│       │   └── SlackIntegration.wsx
│       └── package.json
│
├── apps/
│   └── calendar-service/          # Next.js 多租户服务
│       ├── app/
│       ├── lib/
│       └── package.json
│
└── package.json                   # Monorepo 根配置
```

## 核心概念

### 1. Appointment DSL

Appointment DSL 是用于定义预约类型和业务规则的领域特定语言。它允许你：

- **声明式定义**：通过 DSL 声明预约的业务规则
- **类型安全**：生成 TypeScript 类型定义
- **可扩展性**：轻松添加新的预约类型
- **业务逻辑分离**：将业务规则从组件逻辑中分离

**示例**：

```typescript
const meetingType: AppointmentType = {
  id: 'meeting',
  name: '会议',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'attendees', type: 'array', items: { type: 'string' } }
  ],
  display: {
    color: '#4285f4',
    titleTemplate: '${title}'
  },
  behavior: {
    draggable: true,
    minDuration: 15,
    timeConstraints: [
      { type: 'workingHours', value: { start: '09:00', end: '18:00' } }
    ]
  }
};
```

### 2. 多租户架构

服务支持多租户模式：

- **租户隔离**：每个租户的数据完全隔离
- **子域名支持**：每个租户可以有自己的子域名（如：acme.calenderjs.com）
- **独立配置**：每个租户可以配置自己的 DSL 和集成设置
- **可扩展性**：支持从单个客户到大规模企业的扩展

### 3. 第三方集成

#### Google Calendar 同步

- 双向同步预约
- 支持 OAuth 2.0 认证
- 自动处理冲突

#### Slack 集成

- 发送预约通知
- 快速创建预约
- 团队协作支持

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发所有包

```bash
pnpm dev
```

### 开发特定包

```bash
# 开发组件库
pnpm --filter @calenderjs/core dev

# 开发服务
pnpm --filter calendar-service dev

# 使用 nx
nx dev @calenderjs/core
nx dev calendar-service
```

### 构建所有包

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 查看依赖图

```bash
nx graph
```

## 文档

### RFC 文档

- **[RFC-0001: Calendar Component for Appointment Management](./docs/rfc/0001-calendar-appointment-management.md)**
  - 基于 WSX 的纯前端日历组件库（无服务）
  - 提供月视图、周视图、日视图三种显示模式
  - 支持拖拽、调整大小等交互功能
  - 参考 Google 日历的 UI/UX 设计

- **[RFC-0002: Appointment DSL](./docs/rfc/0002-appointment-dsl.md)**
  - 领域特定语言，用于定义预约类型和业务规则
  - 支持声明式定义、类型安全、可扩展
  - 包含编译器和运行时系统
  - 与 RFC-0001 组件库集成

- **[RFC-0003: Multi-Tenant Calendar Service](./docs/rfc/0003-multi-tenant-service.md)** ⏳ 未来计划
  - 基于 Next.js 的多租户日历服务（ToB）
  - 支持客户注册、员工登录
  - 集成 Google Calendar 和 Slack
  - 使用 RFC-0001 组件和 RFC-0002 DSL
  - **状态**：仅保留在 RFC 文档中，暂不实现

- **[RFC-0004: React Demo Site](./docs/rfc/0004-react-demo-site.md)**
  - 基于 React + Vite 的演示网站
  - 展示组件使用和 DSL 功能
  - 提供 React 集成示例
  - 适合快速上手和组件展示

### 设置文档

- [pnpm + Nx Monorepo 设置指南](./docs/setup/pnpm-nx-setup.md)

## 技术栈

- **前端组件**: Web Components (WSX)
- **服务框架**: Next.js 14
- **数据库**: PostgreSQL
- **ORM**: Prisma / Drizzle
- **认证**: NextAuth.js
- **构建工具**: Vite, Nx
- **包管理**: pnpm
- **Monorepo**: pnpm + Nx

## 许可证

MIT
