# RFC 0048: 新增 apps/calendarify：Google/Outlook 日历聚合管理应用（验证 calenderjs 生产可用性）

**Status:** Draft

## Summary

新增 `apps/calendarify`：一个部署在 Vercel 上的 Next.js (App Router) 应用，通过 Google Calendar API 与 Microsoft Graph（Outlook）API 聚合用户的真实日历数据，用 `@calenderjs/react` + `@calenderjs/calendar` 渲染展示与编辑。这是对 calenderjs 是否具备"生产可用性"（对接真实第三方日历服务）的实证项目，而不是又一个技术验证 demo。

## Problem

calenderjs 当前所有 demo（`demos/react`、`demos/wsx`、`demos/vue` 待建）都只用内存里手写的假数据验证组件行为，从未对接过任何真实日历后端。用户想知道：这套组件能不能真的拿来管理自己的 Google/Outlook 日历？答案目前是"不知道"——没有 OAuth、没有第三方 API 客户端、没有 token 持久化、没有把远程事件映射成 `@calenderjs/event-model` 的 `Event` 再喂给 Calendar 组件的真实案例。本 RFC 就是把这条链路跑通一次，作为生产可用性的实证。

## Goals

- 用户可以用 Google 账号和/或 Microsoft 账号登录 `apps/calendarify`，授权读取（至少）其日历事件。
- 应用把 Google Calendar / Outlook 的事件数据映射为 `@calenderjs/event-model` 的 `Event`，通过 `@calenderjs/react` 的 `<Calendar>` 组件在一个日历视图里同时显示两个来源的事件。
- OAuth token（access + refresh）持久化在真实数据库（Vercel Postgres 或 Supabase，二选一，Design 中定稿），支持 token 过期后静默刷新，不要求用户每次都重新登录。
- 验证 `proposeEventUpdate` 编辑流程下，本地修改能真实回写到对应的 Google Calendar / Outlook 事件（至少标题/时间的编辑回写一种源）。
- 证明 `Event.data` 扩展字段、`EventRuntime` 校验、`Calendar.wsx` 的事件派发契约在真实第三方数据的不规则性下仍然成立（而不是只在手写的干净 fixture 下成立）。

## Non-goals

- 不做双向实时同步（webhook/push notification 订阅、变更冲突合并策略）——首版只做"登录后拉取 + 本地编辑回写"，不做远程→本地的自动增量同步。已拆分为 [RFC-0049](pending/0049-calendarify-bidirectional-sync.md)（Pending，占位暂缓，非本次范围）。
- 不做多租户/团队共享日历、不做权限分级——每个登录用户只管理自己账号下的日历。已拆分为 [RFC-0050](pending/0050-calendarify-multi-tenant.md)（Pending，占位暂缓，非本次范围）。
- 不支持 Google/Outlook 之外的其它日历服务（iCloud、CalDAV 通用协议等）。已拆分为 [RFC-0051](pending/0051-calendarify-caldav-icloud.md)（Pending，占位暂缓，非本次范围）。
- 不在本 RFC 内扩展 `@calenderjs/calendar` 核心能力——如果发现组件本身有 bug 或缺口，另开 RFC 修，本 RFC 只负责"接起来验证"，不负责"顺手把 calendar 包改大"。
- 不做离线模式/PWA。
- 不解决 RFC-0012（插件机制）、RFC-0046（Vue 包）——两者独立推进，互不阻塞。

## Design

### 技术栈与部署

- Next.js 14+ App Router，部署在 Vercel。
- 鉴权：[Auth.js](https://authjs.dev/)（NextAuth v5）的 Google Provider + Microsoft Entra ID (Azure AD) Provider，拿到 OAuth access/refresh token。
- Token 持久化：Vercel Postgres（或 Supabase Postgres，二者接口相近，实现时按可用性选一个，不纠结），用 Auth.js 的 Database session + 自定义 `accounts` 表存 `access_token`/`refresh_token`/`expires_at`。
- 日历数据抓取：
  - Google：`googleapis` 官方 SDK 的 `calendar.events.list`。
  - Outlook：Microsoft Graph SDK（`@microsoft/microsoft-graph-client`）的 `/me/events`。
- 两种来源的原始事件在服务端（Next.js Route Handler / Server Action）统一映射成 `@calenderjs/event-model` 的 `Event`：
  ```typescript
  // apps/calendarify/src/lib/adapters/google.ts
  function toCalenderEvent(g: calendar_v3.Schema$Event): Event {
    return {
      id: `google:${g.id}`,
      type: "appointment",
      title: g.summary ?? "(无标题)",
      startTime: new Date(g.start?.dateTime ?? g.start?.date!),
      endTime: new Date(g.end?.dateTime ?? g.end?.date!),
      data: { source: "google", raw: g, htmlLink: g.htmlLink },
    };
  }
  // apps/calendarify/src/lib/adapters/outlook.ts 结构类似，id 前缀 "outlook:"
  ```
- 前端页面 `apps/calendarify/src/app/page.tsx` 用 `@calenderjs/react` 的 `<Calendar events={events} onEventUpdate={...} />`，`events` 来自服务端聚合的两个来源数组合并。
- 编辑回写：监听 `proposeEventUpdate` 触发的 `event-update`，按 `event.id` 前缀（`google:`/`outlook:`）路由到对应的 Route Handler，调 Google `calendar.events.patch` 或 Graph `PATCH /me/events/{id}`。

### 目录结构

```
apps/calendarify/
├── package.json          # @calenderjs/calendarify
├── next.config.ts
├── src/
│   ├── app/
│   │   ├── page.tsx              # 主日历视图
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   └── api/events/route.ts   # 聚合拉取 + 回写
│   └── lib/
│       ├── auth.ts               # Auth.js 配置
│       ├── db.ts                 # Postgres/Supabase client
│       └── adapters/
│           ├── google.ts
│           └── outlook.ts
├── e2e/
│   └── calendarify.spec.ts       # Playwright，mock OAuth/API 层
└── .env.example
```

### 端口

按 `../../spark/port.md` 规则，新增一行，取下一个未占用端口 **5205**（dev）。E2E 用 Playwright + mock 的第三方 API（不依赖真实 Google/Outlook 账号跑 CI），端口 **4179**。

### 敏感信息处理

- Google/Outlook OAuth client secret、数据库连接串全部走 Vercel 环境变量，仓库内只提交 `.env.example`。
- 不在 RFC、commit、日志中出现真实 token/secret。

## Acceptance

- 类型检查/lint 通过（`pnpm --filter @calenderjs/calendarify typecheck` / `lint`）。
- 单测：两个 adapter（`google.ts`/`outlook.ts`）的事件映射函数，覆盖正常事件、全天事件（无 `dateTime` 只有 `date`）、缺失字段兜底——分支覆盖率 ≥ 80%。
- E2E（Playwright，mock 第三方 API 响应，不依赖真实账号跑在 CI 里）：
  - P0：登录后能看到聚合的日历事件（mock 两个来源各若干条）渲染在 `<Calendar>` 上。
  - P0：双击事件编辑标题保存后，本地视图更新且触发了正确来源的回写 API 调用（断言 mock 的 PATCH 请求被调用，参数正确）。
  - P1：token 过期时静默刷新成功，不弹登出。
  - P2：一种来源拉取失败（mock 500）时，另一来源仍正常显示，页面有错误提示而非整页崩溃。
- 真实浏览器验证（RFC-0027 金科玉律）：至少用一个真实 Google 账号（开发者本人测试账号）跑一次完整登录→查看→编辑→回写流程，实际在 Google Calendar 网页上确认回写生效，并记录结果（不得只凭 mock E2E 通过就声称验证完成）。
- 部署验证：实际部署到 Vercel（非仅本地跑通），给出可访问的部署 URL，并说明环境变量配置方式。
