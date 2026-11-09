# RFC-0012: Calendar 插件机制（框架中立详情渲染）

**Status:** Draft

## Summary

为不同 `Event.type` 提供可扩展的"详情展示"渲染逻辑，而不需要修改 `@calenderjs/calendar` 核心代码。**本次修订**纠正了初版设计中的架构错误：插件机制不属于 Calendar 组件内部渲染职责，也绝不能只挂在某一个框架封装（如 React）上——它必须是框架中立的纯函数式工具，在原生 WSX、`@calenderjs/react`、`@calenderjs/vue`（RFC-0046）三种消费方式下行为完全一致。

## Problem

### 初版设计的架构错误（本次修订要解决的问题）

原 RFC-0012（2026-01-01 版本）设计 `Calendar.renderEventDetailCard(event): string | HTMLElement`，让 `Calendar.wsx` 组件自己管理插件注册表、自己决定渲染什么 HTML。这个设计和仓库实际演进出来的架构完全冲突：

- **实际架构**（RFC-0018/0035/0039/0044 确立）：`Calendar.wsx` 只负责派发事件——单击派发 `event-click`，双击/键盘派发 `event-edit-request`，保存时 host 调用 `proposeEventUpdate()` 得到 `event-update`/`event-update-denied`/`event-update-error`。**Calendar 组件本身从不渲染任何详情卡片或编辑框 UI**，UI 完全由 host（demo app / 宿主应用）自己决定。
- `packages/react/src/Calendar.tsx` 证实了这一点：它只是把这些 `CustomEvent` 转发成 `onEventClick`/`onEventEditRequest` React props，自己也不渲染任何卡片 UI。
- 原设计如果照做，意味着要在 Calendar 组件内部塞一个 HTML 字符串渲染器，这既绕开了 host 决定 UI 的既定架构，也会把"渲染"这件事从宿主框架（React/Vue 有自己的渲染系统）手里抢过来，用字符串拼接去跟组件化框架打架。

### 真正要解决的问题

1. 不同 `Event.type`（`appointment`/`holiday`/`meeting`...）的 `data` 字段结构不同，host 在收到 `event-click`/`event-edit-request` 后，怎么把 `event.data` 翻译成"这类事件该显示哪些字段、怎么标注"，目前只能每个 host 手写 `if (event.type === "appointment") {...}` 式分支，无法跨项目复用。
2. 这个"翻译规则"不能是 React-only 的方案（违反框架中立原则，见 AGENTS.md 4a），必须在原生 WSX demo、React demo、Vue demo 三处都能复用同一套规则定义。

## Goals

- 定义一个**纯数据/纯函数**的插件接口：输入 `Event`，输出"这个事件该如何展示"的结构化描述（字段列表 + 标签 + 格式化后的值），**不输出 HTML 字符串，不输出 HTMLElement，不做任何 DOM 操作**。
- 插件注册表（`EventDetailPluginRegistry`）是一个独立的、不依赖任何 UI 框架、不依赖 Calendar 组件实例的类，可以在 `@calenderjs/calendar`（或拆出的 `@calenderjs/event-model`/新增轻量包，设计阶段待定，见 Design）中提供，供任意 host 直接 import 使用。
- host（原生 WSX / React / Vue）各自监听 `event-click`/`event-edit-request`，拿到 `event` 后调用 `registry.describe(event)`，自己决定用什么组件渲染这份结构化描述——渲染永远是 host 的职责，插件只负责"数据翻译"。
- 默认插件（`type: "*"`）兜底：没有匹配的具体插件时，返回事件的通用字段（title/start/end/data 原始 JSON）。

## Non-goals

- 不在 `Calendar.wsx` 内新增任何渲染方法或 UI 相关 API——`canPerformAction`/`proposeEventUpdate`/`validateEventForUpdate` 等既有方法不受影响，不修改。
- 不规定 host 具体怎么渲染详情卡片的 UI（弹窗/侧栏/inline 展开都行），这是 host 自己的产品决策，RFC 只管"数据怎么来"。
- 不做插件市场、插件热加载、插件权限系统（同初版 Out-of-Scope，继续有效）。
- 不在本 RFC 内实现 `@calenderjs/vue`——该包的交付是 RFC-0046 的范围，本 RFC 只要求插件机制的 API 设计必须同时可用于 WSX/React/Vue 三种消费方式，具体 Vue 封装包留给 0046。

## Design

### 1. 插件接口（框架中立，纯函数）

```typescript
// packages/calendar/src/plugins/types.ts（或拆分到独立的
// @calenderjs/event-detail-plugins 包，视实现时机而定）

import type { Event } from "@calenderjs/event-model";

/** 一个详情字段的结构化描述，host 拿这个去渲染，自己决定用什么 UI 组件 */
export interface EventDetailField {
  key: string;
  label: string;
  value: string;
}

/** 插件 describe() 的返回值——纯数据，没有任何 HTML/DOM */
export interface EventDetailDescription {
  title: string;
  fields: EventDetailField[];
}

export interface EventDetailPlugin {
  /** 插件名称，用于注册/注销时的唯一标识 */
  name: string;
  /** 支持的 Event.type，"*" 表示默认兜底插件 */
  type: string;
  /** 优先级，数字越大越优先，默认 0 */
  priority?: number;
  /** 是否支持该 event（通常直接比较 event.type === this.type） */
  supports(event: Event): boolean;
  /**
   * 把 event 翻译成结构化描述。
   * 纯函数：不操作 DOM，不返回字符串拼接的 HTML，不依赖任何渲染框架。
   */
  describe(event: Event): EventDetailDescription;
}
```

### 2. 注册表（独立类，不属于 Calendar 实例）

```typescript
// packages/calendar/src/plugins/EventDetailPluginRegistry.ts

export class EventDetailPluginRegistry {
  private plugins: EventDetailPlugin[] = [];

  register(plugin: EventDetailPlugin): void {
    if (this.plugins.some((p) => p.name === plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.push(plugin);
  }

  unregister(name: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== name);
  }

  /** 按 event.type 查找优先级最高的匹配插件，没有则退到 "*" 默认插件 */
  describe(event: Event): EventDetailDescription {
    const candidates = this.plugins
      .filter((p) => p.type !== "*" && p.supports(event))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const plugin = candidates[0] ?? this.plugins.find((p) => p.type === "*");
    if (!plugin) {
      return { title: event.title, fields: [] };
    }
    return plugin.describe(event);
  }
}
```

这个类**不是** `Calendar.wsx` 的成员，也不依赖 `Calendar` 实例——它是一个独立的、host 自己 `new` 出来、自己持有的对象。`@calenderjs/calendar` 包导出它，但 `Calendar.wsx` 组件本身不持有、不创建、不使用它。

### 3. 三种消费方式下的使用方式（框架中立验证，AGENTS.md 4a 要求）

#### 原生 WSX（`demos/wsx`，见 RFC-0047；注意不是 `apps/site`——后者是官网展示站点，不承担框架中立验证职责）

```tsx
import { EventDetailPluginRegistry } from "@calenderjs/calendar";

const registry = new EventDetailPluginRegistry();
registry.register(appointmentPlugin);
registry.register(defaultPlugin);

// 监听 wsx-calendar 派发的 event-click
element.addEventListener("event-click", (e) => {
  const description = registry.describe(e.detail.event);
  this.showDetailPanel(description); // host 自己的 WSX 渲染逻辑
});
```

#### React（`@calenderjs/react` / `demos/react`）

```tsx
const registry = useMemo(() => {
  const r = new EventDetailPluginRegistry();
  r.register(appointmentPlugin);
  r.register(defaultPlugin);
  return r;
}, []);

<Calendar
  onEventClick={(event) => {
    const description = registry.describe(event);
    setDetailPanel(description); // host 自己的 React state/渲染
  }}
/>;
```

#### Vue（`@calenderjs/vue` / `demos/vue`，RFC-0046 交付包后适用同一注册表）

```vue
<script setup>
const registry = new EventDetailPluginRegistry();
registry.register(appointmentPlugin);
registry.register(defaultPlugin);

function onEventClick(event) {
  detailDescription.value = registry.describe(event); // host 自己的 Vue 渲染
}
</script>
```

三处使用的是**同一个** `EventDetailPluginRegistry` 类和同一批插件对象，没有任何框架专属代码——这正是 AGENTS.md 4a 要求的验证方式。

### 4. 插件生命周期

沿用初版的 `register`/`unregister` 思路，但去掉 `initialize(calendar)`/`destroy()` 生命周期钩子——因为插件现在不持有、不依赖 `Calendar` 实例，没有需要初始化/销毁的状态耦合，保持插件对象是无副作用的纯对象。

## Acceptance

- 单测覆盖 `EventDetailPluginRegistry`：注册、重复注册报错、注销、按 `type` 匹配、按 `priority` 排序、无匹配时退到默认插件、完全没有插件时返回兜底结构——100% 分支覆盖。
- **三种消费方式各自的 E2E 验证**（按 AGENTS.md 4a 要求，不得只跑一种就算完成）：
  - 原生 WSX demo（`demos/wsx`，依赖 RFC-0047 先交付；不是 `apps/site`）：E2E 场景覆盖"点击不同 `type` 的事件，详情面板显示对应插件翻译后的字段"。
  - React demo（`demos/react`）：同等 E2E 场景，使用同一 `EventDetailPluginRegistry`、同一插件定义（可共享测试 fixture，不得各自定义一套假插件）。
  - Vue demo（`demos/vue`，依赖 RFC-0046 先交付包）：同等 E2E 场景。
  - 三处 E2E 用的插件注册逻辑必须是同一份可复用代码/fixture 的三种引用方式，而不是三份独立手写的插件定义——否则无法证明"框架中立"。
- 真实浏览器验证（RFC-0027 金科玉律）：三个 demo 分别手动跑一遍点击交互，确认详情面板内容随 `Event.type` 切换插件渲染结果。
- 覆盖率：`EventDetailPluginRegistry` 所在包的新增生产代码行覆盖率 ≥ 80%。
