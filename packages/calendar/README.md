# @calenderjs/calendar

基于 WSX 框架的事件日历 Web Component。

## 安装

```bash
pnpm add @calenderjs/calendar @wsxjs/wsx-core
```

## 使用

```html
<script type="module">
  import "@calenderjs/calendar";
</script>

<wsx-calendar view="month" date="2024-12-30"></wsx-calendar>
```

```typescript
import { Calendar } from "@calenderjs/calendar";
import type { Event } from "@calenderjs/event-model";

const el = document.querySelector("wsx-calendar") as Calendar;
el.events = [
  {
    id: "1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date("2024-12-30T10:00:00"),
    endTime: new Date("2024-12-30T11:00:00"),
    color: "#4285f4",
  },
];
```

## 属性

| 属性     | 类型                         | 说明                 |
| -------- | ---------------------------- | -------------------- |
| `view`   | `'month' \| 'week' \| 'day'` | 当前视图             |
| `date`   | `string`                     | 当前日期（ISO 格式） |
| `events` | `Event[]`                    | 事件列表             |
| `user`   | `User`                       | 当前用户             |

支持 property 和 attribute 两种设置方式（RFC-0008）。

## React

使用 `@calenderjs/react` 封装，见 [packages/react/README.md](../react/README.md)。

## 相关 RFC

- [RFC-0005](../../docs/rfc/0005-calendar-component.md) — Calendar Component
- [RFC-0008](../../docs/rfc/0008-calendar-component-api-redesign.md) — API 设计
