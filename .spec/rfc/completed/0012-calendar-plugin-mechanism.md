# RFC-0012: Calendar 插件机制（框架中立详情渲染）

**Status:** Implemented

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
import { EventDetailPluginRegistry, appointmentPlugin, defaultPlugin } from "@calenderjs/calendar";

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
import { EventDetailPluginRegistry, appointmentPlugin, defaultPlugin } from "@calenderjs/calendar";

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
import { EventDetailPluginRegistry, appointmentPlugin, defaultPlugin } from "@calenderjs/calendar";

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

### 5. 插件归属：内置插件属于 `@calenderjs/calendar`，非 demo 自造 fixture（本次修订补充）

本 RFC 前几版的示例代码（第 3 节）直接写了 `appointmentPlugin`/`defaultPlugin` 却未交代它们的归属，这是一处规格空白：插件是宿主（host）用来支持自己业务类型的扩展点，但**默认兜底插件（`defaultPlugin`，`type: "*"`）和至少一个参考实现插件（`appointmentPlugin`，覆盖 `data.attendees`/`data.location` 这类通用会议/预约字段）属于 `@calenderjs/calendar` 包本身的产品代码**，与 `EventDetailPluginRegistry` 一起从 `@calenderjs/calendar` 导出——不是每个 demo/host 各自手写的测试假数据。理由：

- `defaultPlugin` 是机制本身工作所需的兜底行为（Goals 第 4 条），不提供它注册表就无法满足"完全没有插件时返回兜底结构"的要求，因此它是核心产品代码而非示例。
- `appointmentPlugin` 作为一个典型场景的参考实现，让新接入方有真实可用的起点可以参考/复用，而不是每个 host 都从零写一遍几乎相同的翻译逻辑——这正是插件机制要解决的"无法跨项目复用"问题（Problem 第 1 条）的直接体现：机制本身如果只给接口不给任何真实实现，问题并未被真正解决。
- 三个 demo（WSX/React/Vue）的 E2E 验证（Acceptance）需要"同一份可复用代码/fixture 的三种引用方式"——三者应当 `import { defaultPlugin, appointmentPlugin, EventDetailPluginRegistry } from "@calenderjs/calendar"` 使用同一份真实产品代码，而不是从一个单独的测试专用 fixture 包里引入三份"看起来像插件"的假对象。若后续场景需要更多示例插件（如 `holidayPlugin`），同样在 `@calenderjs/calendar` 内新增，不在测试代码里定义。
- Host 仍然可以（且被鼓励）注册自己的自定义插件覆盖/扩展默认行为——`@calenderjs/calendar` 提供的内置插件是"开箱可用的基线"，不是强制宿主必须使用的唯一实现；本节只澄清"机制 + 基线插件"均来自核心包，不是说禁止宿主自定义。

## Acceptance

- 单测覆盖 `EventDetailPluginRegistry`：注册、重复注册报错、注销、按 `type` 匹配、按 `priority` 排序（含未设置 `priority` 时默认值 0 的分支）、无匹配时退到默认插件、完全没有插件时返回兜底结构、`supports` 返回 false 时不参与匹配——**已验证**：12/12 单测通过。
- **三种消费方式各自的 E2E 验证**（按 AGENTS.md 4a 要求）——**已验证**：
  - 原生 WSX demo（`demos/wsx`）：新增 E2E 场景覆盖"点击不同 type 的事件，详情面板显示对应插件翻译后的字段"（第二条示例事件改为 `type: "holiday"` 以触发 `defaultPlugin` 分支）。chromium/webkit 共 12/12 通过（含既有 5 条 + 新增 1 条 × 2 浏览器）。
  - React demo（`demos/react`）：同等 E2E 场景，直接 `import { appointmentPlugin, defaultPlugin } from "@calenderjs/calendar"`（经 `EventDetailPluginRegistry` 注册）。由于该 demo 的 DSL 校验只定义了 `meeting` 一种类型，未改动既有事件类型以免破坏既有 DSL 校验类 E2E；仅验证 `appointmentPlugin` 路径（`defaultPlugin` 路径已在 WSX/Vue 两处验证）。chromium 55/55 通过（含既有 54 条 + 新增 1 条），无回归。
  - Vue demo（`demos/vue`）：同等 E2E 场景，第二条示例事件同样改为 `type: "holiday"`。chromium/webkit 共 12/12 通过。
  - 三处均 `import { EventDetailPluginRegistry, appointmentPlugin, defaultPlugin } from "@calenderjs/calendar"`，引用同一份真实产品代码，未各自手写假插件、未使用任何单独 fixture 包。
- **真实浏览器验证（RFC-0027 金科玉律）**——**已实际执行**：三个 demo 分别启动 `pnpm dev`，用 Chrome 实际点击操作：
  - `demos/wsx`：点击"团队会议"（meeting）正确显示参与者/地点（appointmentPlugin）；点击"客户演示"（holiday）正确回退显示"附加数据" JSON（defaultPlugin）。
  - `demos/react`：点击"团队会议"正确显示参与者（user1@example.com、user2@example.com）/地点（会议室 A）。
  - `demos/vue`：点击"团队会议"/"客户演示"同样正确切换插件渲染结果，与 WSX/React 行为一致。
  - 三处截图/交互确认插件切换逻辑在三种框架消费方式下行为一致（框架中立性得到实证，而非仅靠单测/类型检查推断）。
- 覆盖率：`packages/calendar/src/plugins/` 新增生产代码——语句 100%、分支 96.29%（`EventDetailPluginRegistry.ts` 单文件分支 94.11%）、函数 90%、行 100%，均超过 80% 门槛。
