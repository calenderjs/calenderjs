# RFC-0014: EventRuntime 时间字段时区语义

**状态**: Implemented  
**创建日期**: 2026-08-16  
**作者**: CalenderJS Team  
**关联 RFC**: RFC-0002, RFC-0005

## 摘要

统一 Event DSL 中 `startTime.*` 与 `endTime.*` 字段访问的时区语义，修复
`EventRuntime` 无条件使用 UTC 字段导致本地时间事件错误地未通过业务规则的问题。

## 问题

RFC-0002 将 `startTime.hour` 描述为事件时间的小时字段，但当前运行时无条件调用
`Date#getUTCHours()`。当应用使用本地时间创建事件时，例如本地 14:00，在 UTC
负偏移地区可能被解析为 21:00，导致 `startTime.hour <= 18` 错误失败。

同时，`Event` 已支持 IANA `timeZone`，运行时却仅返回时区名称，没有用它解析
`hour`、`date`、`dayOfWeek` 等字段。

## 目标

1. 明确定义所有时间字段访问的统一时区优先级。
2. 保持未声明时区事件的现有 UTC 行为，避免兼容性破坏。
3. 让使用本地时间的应用通过显式 IANA 时区获得符合用户预期的验证结果。
4. 无效 IANA 时区不得导致 `EventRuntime.validate()` 抛出异常。

## 非目标

- 不改变 `Date` 和 ISO 字符串表示的绝对时间点。
- 不改变全天事件约束、冲突检测或重复事件生成算法。
- 不引入第三方时区运行时。

## 方案

### 时区优先级

时间字段按以下顺序解析：

1. `event.timeZone`
2. `event.recurring.timeZone`
3. UTC

应用若以本地墙上时间创建事件，必须同时设置浏览器或业务场景对应的 IANA
时区，例如 `America/Los_Angeles`。

### 支持字段

`startTime` 与 `endTime` 使用相同规则：

| 字段        | 返回值                                     |
| ----------- | ------------------------------------------ |
| `hour`      | 0–23                                       |
| `minute`    | 0–59                                       |
| `second`    | 0–59                                       |
| `day`       | 1–31                                       |
| `month`     | 1–12                                       |
| `year`      | 四位公历年份                               |
| `date`      | `YYYY-MM-DD`                               |
| `dayOfWeek` | 0（周日）至 6（周六）                      |
| `timeZone`  | 解析所用的显式时区；未声明时为 `undefined` |

显式时区通过平台 `Intl.DateTimeFormat` 解析。未声明时区时直接使用 UTC Date
访问器。无效日期或无效 IANA 时区返回 `undefined`，使对应验证规则失败，而不是
抛出运行时异常。

## 兼容性

- 未设置 `timeZone` 的现有事件继续使用 UTC，无行为变化。
- 已设置 `event.timeZone` 或 `recurring.timeZone` 的事件，时间字段将从“错误的
  UTC 字段”改为指定时区字段。
- React demo 将显式设置浏览器本地 IANA 时区，避免依赖宿主机器 UTC 偏移。

## 实现

- 新增内部纯函数模块，负责日期规范化、IANA 时区转换和字段读取。
- `EventRuntime.evaluateFieldAccess()` 委托该模块处理所有时间属性。
- 不导出新的公共 API，不增加运行时依赖。

## 测试策略

1. 未声明时区时验证 UTC 兼容行为。
2. 同一时间点在 UTC、上海和纽约时区产生不同字段。
3. 覆盖跨日的 `date`、`day`、`dayOfWeek`。
4. 覆盖 `recurring.timeZone` 回退。
5. 覆盖无效 IANA 时区不抛异常且规则失败。
6. 回归 React demo 的本地 10:00 与 14:00 事件。

## 备选方案

### 始终使用宿主本地时区

实现简单，但服务端部署位置会改变验证结果，且忽略 `Event.timeZone`，不可接受。

### 未声明时区时使用宿主本地时区

更符合部分 UI 直觉，但会改变现有 UTC 行为。此兼容性变更应留待未来主版本评估。

## 实施检查清单

- [x] 新增时区感知的纯函数时间字段解析
- [x] EventRuntime 接入统一解析
- [x] React demo 显式设置本地 IANA 时区
- [x] 添加 UTC、IANA、重复事件和无效时区回归测试
- [x] 通过全量构建、测试、类型检查、lint 和格式检查
