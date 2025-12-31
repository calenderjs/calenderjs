# RFC-0003: Multi-Tenant Calendar Service

**状态**: Future Plan（未来计划）  
**创建日期**: 2024-12-19  
**作者**: WSX Team  
**关联 RFC**: RFC-0001, RFC-0002

## 摘要

设计并实现基于 Next.js 的多租户日历服务架构。该服务支持客户注册、员工登录、Google Calendar 同步和 Slack 集成，提供完整的基于日历的预约管理系统。服务使用 RFC-0001 的组件库和 RFC-0002 的 DSL 系统。

**重要说明**：本 RFC 是未来计划，当前阶段仅保留在文档中，暂不实现。当前阶段专注于 RFC-0001（组件库）、RFC-0002（DSL）和 RFC-0004（演示网站）的实现。

## 动机

### 为什么需要多租户服务？

- **SaaS 模式**：支持多个客户（租户）使用同一套系统
- **数据隔离**：确保每个租户的数据完全隔离
- **可扩展性**：支持从单个客户到大规模企业的扩展
- **统一管理**：提供统一的管理界面和 API
- **成本效益**：共享基础设施，降低运营成本

### 为什么需要第三方集成？

- **Google Calendar 同步**：与现有日历系统集成，提高用户便利性
- **Slack 集成**：在团队协作工具中直接管理预约，提高工作效率
- **生态扩展**：为未来集成更多第三方服务打下基础

## 详细设计

### 1. 项目结构

```
apps/
├── calendar-service/             # Next.js 服务应用
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (tenant)/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── calendar/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx        # 租户布局
│   │   ├── api/
│   │   │   ├── tenants/
│   │   │   ├── appointments/
│   │   │   ├── sync/
│   │   │   │   ├── google/
│   │   │   │   └── slack/
│   │   │   └── auth/
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db/                   # 数据库层
│   │   │   ├── tenant.ts
│   │   │   ├── user.ts
│   │   │   └── appointment.ts
│   │   ├── auth/                  # 认证层
│   │   │   ├── middleware.ts
│   │   │   └── session.ts
│   │   ├── sync/                  # 同步服务
│   │   │   ├── google.ts
│   │   │   └── slack.ts
│   │   └── dsl/                   # DSL 服务
│   │       └── loader.ts
│   ├── components/
│   │   ├── CalendarView.tsx       # 使用 @calenderjs/core 组件
│   │   └── AppointmentForm.tsx
│   └── package.json
│
└── package.json
```

### 2. 数据模型

```typescript
// lib/db/types.ts

// 租户模型
export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;              // 子域名（如：acme.calenderjs.com）
  domain?: string;                 // 自定义域名
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings;
}

// 租户设置
export interface TenantSettings {
  // DSL 配置
  appointmentDSL?: AppointmentDSL;
  // 集成配置
  integrations?: {
    googleCalendar?: GoogleCalendarConfig;
    slack?: SlackConfig;
  };
  // 业务配置
  businessHours?: {
    start: string;                  // 如 "09:00"
    end: string;                    // 如 "18:00"
    timezone: string;               // 时区
  };
}

// 用户模型
export interface User {
  id: string;
  tenantId: string;                // 租户 ID
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'employee';
  createdAt: Date;
  updatedAt: Date;
}

// 预约模型（扩展 RFC-0001）
export interface Appointment {
  id: string;
  tenantId: string;                 // 租户 ID
  userId: string;                   // 创建者 ID
  type?: string;                   // DSL 类型 ID
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  color?: string;
  allDay?: boolean;
  recurring?: RecurringRule;
  attendees?: string[];
  location?: string;
  // DSL 扩展字段
  dslData?: Record<string, any>;
  // 同步信息
  syncInfo?: {
    googleCalendar?: {
      eventId: string;
      calendarId: string;
    };
    slack?: {
      messageId: string;
      channelId: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. 多租户中间件

```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from './tenant';

export async function tenantMiddleware(request: NextRequest) {
  // 从请求中提取租户信息
  const tenant = await getTenantFromRequest(request);
  
  if (!tenant) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 将租户信息添加到请求头
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.id);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 获取租户信息
async function getTenantFromRequest(
  request: NextRequest
): Promise<Tenant | null> {
  // 从子域名获取
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // 从路径获取（如 /t/[tenantId]）
  const pathname = request.nextUrl.pathname;
  const tenantMatch = pathname.match(/^\/t\/([^/]+)/);
  const tenantId = tenantMatch?.[1];

  // 从会话获取
  const session = await getSession(request);
  const sessionTenantId = session?.tenantId;

  // 查询数据库
  const tenantIdToUse = tenantId || sessionTenantId;
  if (!tenantIdToUse) {
    return null;
  }

  return await getTenantById(tenantIdToUse);
}
```

### 4. API 路由设计

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/auth/session';
import { getAppointments, createAppointment } from '@/lib/db/appointment';
import { loadDSLRuntime } from '@/lib/dsl/loader';

export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const appointments = await getAppointments(tenantId, {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // 验证预约数据（使用 DSL）
  const tenant = await getTenant(tenantId);
  if (tenant.settings.appointmentDSL && body.type) {
    const dslRuntime = await loadDSLRuntime(tenant.settings.appointmentDSL);
    const validation = dslRuntime.validate(body, body.type);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
  }

  const appointment = await createAppointment(tenantId, body);
  return NextResponse.json(appointment);
}
```

### 5. 第三方集成

#### 5.1 Google Calendar 同步

```typescript
// lib/sync/google.ts
import { google } from 'googleapis';

export class GoogleCalendarSync {
  private oauth2Client: OAuth2Client;

  constructor(credentials: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });
  }

  /**
   * 同步预约到 Google Calendar
   */
  async syncAppointment(appointment: Appointment): Promise<void> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // 如果已有同步信息，更新事件
    if (appointment.syncInfo?.googleCalendar?.eventId) {
      await calendar.events.update({
        calendarId: appointment.syncInfo.googleCalendar.calendarId,
        eventId: appointment.syncInfo.googleCalendar.eventId,
        requestBody: this.appointmentToGoogleEvent(appointment),
      });
    } else {
      // 创建新事件
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: this.appointmentToGoogleEvent(appointment),
      });

      // 更新预约的同步信息
      await updateAppointmentSyncInfo(appointment.id, {
        googleCalendar: {
          eventId: event.data.id!,
          calendarId: 'primary',
        },
      });
    }
  }

  /**
   * 从 Google Calendar 同步事件
   */
  async syncFromGoogle(calendarId: string): Promise<Appointment[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    const events = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 100,
    });

    return events.data.items?.map(event => this.googleEventToAppointment(event)) || [];
  }

  private appointmentToGoogleEvent(appointment: Appointment): any {
    return {
      summary: appointment.title,
      description: appointment.description,
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: appointment.attendees?.map(email => ({ email })),
      location: appointment.location,
    };
  }

  private googleEventToAppointment(event: any): Appointment {
    return {
      id: event.id,
      title: event.summary || '',
      description: event.description,
      startTime: new Date(event.start.dateTime || event.start.date),
      endTime: new Date(event.end.dateTime || event.end.date),
      location: event.location,
      attendees: event.attendees?.map((a: any) => a.email),
      syncInfo: {
        googleCalendar: {
          eventId: event.id,
          calendarId: event.organizer?.email || 'primary',
        },
      },
    };
  }
}
```

#### 5.2 Slack 集成

```typescript
// lib/sync/slack.ts
import { WebClient } from '@slack/web-api';

export class SlackIntegration {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  /**
   * 发送预约通知到 Slack
   */
  async notifyAppointment(appointment: Appointment, channelId: string): Promise<void> {
    await this.client.chat.postMessage({
      channel: channelId,
      text: `新的预约: ${appointment.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${appointment.title}*\n${this.formatAppointment(appointment)}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '查看详情',
              },
              url: `https://app.calenderjs.com/appointments/${appointment.id}`,
            },
          ],
        },
      ],
    });
  }

  /**
   * 创建 Slack 交互（如：快速创建预约）
   */
  async createAppointmentFromSlack(payload: SlackInteractionPayload): Promise<Appointment> {
    // 解析 Slack 交互数据
    const appointmentData = this.parseSlackPayload(payload);
    
    // 创建预约
    const appointment = await createAppointment(appointmentData);
    
    // 发送确认消息
    await this.client.chat.postMessage({
      channel: payload.channel.id,
      text: `预约已创建: ${appointment.title}`,
    });

    return appointment;
  }

  private formatAppointment(appointment: Appointment): string {
    return [
      `时间: ${this.formatTimeRange(appointment.startTime, appointment.endTime)}`,
      appointment.location && `地点: ${appointment.location}`,
      appointment.attendees && `参会人: ${appointment.attendees.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
```

### 6. 前端集成

#### 6.1 Next.js 页面组件

```typescript
// app/(tenant)/[tenantId]/calendar/page.tsx
'use client';

import { Calendar } from '@calenderjs/core';
import { AppointmentDSLRuntime } from '@calenderjs/dsl';
import { useEffect, useState } from 'react';

export default function CalendarPage({ params }: { params: { tenantId: string } }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dslRuntime, setDSLRuntime] = useState<AppointmentDSLRuntime | null>(null);

  useEffect(() => {
    // 加载 DSL 配置
    loadDSLConfig(params.tenantId).then(config => {
      const runtime = new AppointmentDSLRuntime(config);
      setDSLRuntime(runtime);
    });

    // 加载预约数据
    loadAppointments(params.tenantId).then(setAppointments);
  }, [params.tenantId]);

  const handleAppointmentCreate = async (appointment: Partial<Appointment>) => {
    // 使用 DSL 验证
    if (dslRuntime && appointment.type) {
      const validation = dslRuntime.validate(appointment, appointment.type);
      if (!validation.valid) {
        alert(validation.errors.join('\n'));
        return;
      }
    }

    const newAppointment = await createAppointment(params.tenantId, appointment);
    setAppointments([...appointments, newAppointment]);
  };

  return (
    <div>
      <Calendar
        appointments={appointments}
        dslRuntime={dslRuntime}
        onAppointmentCreate={handleAppointmentCreate}
        onAppointmentUpdate={handleAppointmentUpdate}
        onAppointmentDelete={handleAppointmentDelete}
      />
    </div>
  );
}
```

## 实现计划

### 阶段 1: 多租户架构（1 周）

1. **租户数据模型**（2 天）
   - 实现租户数据模型
   - 实现用户数据模型
   - 实现预约数据模型扩展

2. **多租户中间件**（2 天）
   - 实现租户识别逻辑
   - 实现租户隔离中间件
   - 实现会话管理

3. **租户隔离**（1 天）
   - 实现数据库查询隔离
   - 实现 API 路由隔离

### 阶段 2: 认证和授权（3 天）

1. **用户注册**（1 天）
   - 实现客户注册流程
   - 实现租户创建

2. **员工登录**（1 天）
   - 实现员工登录
   - 实现会话管理

3. **权限控制**（1 天）
   - 实现基于角色的访问控制（RBAC）
   - 实现 API 权限验证

### 阶段 3: API 实现（4 天）

1. **预约 CRUD API**（2 天）
   - 实现 GET /api/appointments
   - 实现 POST /api/appointments
   - 实现 PUT /api/appointments/:id
   - 实现 DELETE /api/appointments/:id

2. **DSL 配置 API**（1 天）
   - 实现 GET /api/tenants/:id/dsl
   - 实现 PUT /api/tenants/:id/dsl

3. **租户管理 API**（1 天）
   - 实现租户管理接口

### 阶段 4: 前端页面（3 天）

1. **登录/注册页面**（1 天）
   - 实现登录页面
   - 实现注册页面

2. **日历页面**（1 天）
   - 集成 @calenderjs/core 组件
   - 集成 @calenderjs/dsl 运行时

3. **设置页面**（1 天）
   - 实现租户设置
   - 实现 DSL 配置界面

### 阶段 5: 第三方集成（2 周）

1. **Google Calendar 同步**（5 天）
   - 实现 OAuth 认证
   - 实现双向同步
   - 实现冲突处理

2. **Slack 集成**（3 天）
   - 实现 Slack OAuth
   - 实现通知功能
   - 实现交互功能

3. **集成测试**（2 天）
   - 测试同步功能
   - 测试集成稳定性

## 技术栈

### 前端
- **@calenderjs/core**: 基于 RFC-0001 的组件库
- **@calenderjs/dsl**: 基于 RFC-0002 的 DSL 系统
- **Next.js 14**: App Router, Server Components
- **TypeScript**: 类型安全
- **React**: UI 框架

### 后端
- **Next.js API Routes**: API 服务
- **Prisma / Drizzle**: ORM（数据库访问）
- **PostgreSQL**: 数据库
- **NextAuth.js**: 认证

### 第三方集成
- **Google Calendar API**: 日历同步
- **Slack API**: Slack 集成

### 工具
- **pnpm**: 包管理
- **Nx**: Monorepo 管理
- **ESLint / Prettier**: 代码质量

## 安全考虑

1. **多租户数据隔离**
   - 所有数据库查询必须包含 tenantId
   - 使用行级安全策略（RLS）
   - API 中间件验证租户权限

2. **认证和授权**
   - 使用 JWT 或 Session 管理认证
   - 实现基于角色的访问控制（RBAC）
   - 保护 API 端点

3. **第三方集成安全**
   - 安全存储 OAuth tokens
   - 使用环境变量存储密钥
   - 实现 token 刷新机制

4. **数据验证**
   - 使用 DSL 验证所有用户输入
   - 防止 SQL 注入和 XSS 攻击
   - 实现速率限制

## 性能考虑

1. **数据库优化**
   - 为 tenantId 和常用查询字段创建索引
   - 使用连接池
   - 实现查询缓存

2. **API 优化**
   - 实现分页
   - 使用 Server Components 减少客户端负担
   - 实现 API 缓存

3. **前端优化**
   - 使用 React Server Components
   - 实现代码分割
   - 优化组件渲染性能

## 未解决问题

1. **同步冲突处理**：当多个来源修改同一预约时如何处理冲突？
2. **扩展性**：如何支持更多第三方集成？
3. **移动端支持**：是否需要开发移动端应用？
4. **实时同步**：是否需要 WebSocket 支持实时更新？
5. **多区域部署**：如何支持多区域部署和数据本地化？

---

*本 RFC 设计并实现多租户日历服务，使用 RFC-0001 的组件库和 RFC-0002 的 DSL 系统，提供完整的基于日历的预约管理解决方案。*
