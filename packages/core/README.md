# @calenderjs/core

CalenderJS 核心包 — 提供通用数据模型、上下文接口和工具函数。

> **注意**：日历 Web Component 位于 `@calenderjs/calendar`（`<wsx-calendar>`），不在本包中。

## 职责

- 核心数据模型（`User` 等）
- 上下文接口（渲染、验证、行为检查上下文）
- 通用类型定义与工具函数

## 安装

```bash
pnpm add @calenderjs/core
```

## 使用示例

```typescript
import type { User } from "@calenderjs/core";
import {} from /* 工具函数 */ "@calenderjs/core";

const user: User = {
  id: "1",
  email: "user@example.com",
  role: "user",
};
```

## 与 Calendar 的关系

```
@calenderjs/event-model   # Event 接口 SSOT
@calenderjs/core          # 核心模型、上下文、工具（本包）
@calenderjs/calendar      # WSX 日历组件 <wsx-calendar>
@calenderjs/react         # React 封装
```

Calendar 组件通过 `@calenderjs/calendar` 导入：

```typescript
import { Calendar } from "@calenderjs/calendar";
// 或 React
import { Calendar } from "@calenderjs/react";
```

## 相关包

- [@calenderjs/calendar](../calendar/) — 日历 Web Component
- [@calenderjs/event-model](../event-model/) — Event 数据模型
- [@calenderjs/event-dsl](../event-dsl/) — Event DSL
