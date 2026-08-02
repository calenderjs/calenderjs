---
name: wsx-work
description: Guides all work on WSX (Web Components Syntax Extension) in CalenderJS. Use when editing .wsx files, implementing calendar views/components, writing or fixing WSX tests, or when the user mentions WSX, Web Components, DayView, WeekView, MonthView, or calendar component implementation. Enforces Vue vs WSX boundary and WSX testing patterns.
---

# WSX 工作指南 (WSX Work)

本技能适用于在 CalenderJS 项目中进行的**任何 WSX 相关开发**：组件实现、测试编写与修复、与 Vue/React 的边界决策。AI 在处理 `.wsx` 文件、日历视图或 WSX 测试时必须遵循本指南。

## 1. 技术边界（铁律）

### 绝不混合 Vue 与 WSX

- **禁止**：在 `.wsx` 中导入或使用 Vue（`ref`、`computed`、`vue-router`、`pinia` 等）。
- **禁止**：在 `.vue` 中实现 WSX 组件逻辑或导入 `@wsxjs/wsx-core` 做组件实现。
- **正确**：
  - `.wsx` → 仅用 WSX 技术栈（`@autoRegister`、`WebComponent`、`@state`、样式 `?inline`）。
  - Vue 应用 → 仅用 Vue；通过 **Web Components** 使用 WSX 组件（如 `<wsx-calendar>`），通过属性和 CustomEvent 通信。

### 决策规则

| 需求类型 | 使用 | 产物 |
|----------|------|------|
| 日历组件核心、视图、可复用 UI 组件 | **WSX** | `.wsx`，`@calenderjs/calendar` |
| 在 Vue 应用里用日历、Vue 包装、路由/状态/业务 | **Vue** | `.vue`，通过 `<wsx-calendar>` 等使用 |
| 在 React 应用里用日历 | **React** | `.tsx` 包装器，`@calenderjs/react` |

**包职责**：`@calenderjs/calendar` = WSX 核心；`@calenderjs/react` / `@calenderjs/vue` = 集成层，依赖 calendar，不反之。

## 2. WSX 组件实现要点

- 使用 `@autoRegister({ tagName: "wsx-xxx" })`，继承 `WebComponent`（或 `LightComponent`）。
- 状态用 `@state`，不用 Vue 的 `ref`/`reactive`。
- 样式：`import styles from "./X.css?inline"`，在 constructor 中 `super({ styles, styleName: "wsx-xxx" })`。
- 对外通信：`CustomEvent` + `detail`，例如 `this.dispatchEvent(new CustomEvent('date-change', { detail: { date }, bubbles: true }))`。
- 在 Vue 中使用：仅通过标签、属性、事件（`@date-change="handler"`），不直接操作组件内部或私有属性。

## 3. WSX 测试（必守）

### 渲染是异步的

- `@state` 变更会**同步**触发重渲染调度，但 **DOM 更新是异步的**。
- **禁止**用 `setTimeout` 等固定延时等待 DOM；**必须**用基于帧的等待（见下）。

### 等待渲染完成

在断言 DOM 前必须等待渲染完成。使用以下辅助函数（或等价实现）：

```typescript
async function waitForRender(): Promise<void> {
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            Promise.resolve().then(() => resolve());
        });
    });
}
```

使用方式：修改 `@state` 或 props 后 `await waitForRender()`，再在 `shadowRoot` 下做 `querySelector` / 断言。

### Shadow DOM

- WSX 使用 Shadow DOM，所有组件内部 DOM 在 `component.shadowRoot` 下。
- **禁止**：用 `document.querySelector` 查组件内部；**正确**：`component.shadowRoot?.querySelector(selector)`。
- 测试前可断言 `expect(component.shadowRoot).toBeTruthy()`。

### 只测公共 API

- 通过**属性（attributes）**和**属性（properties）**设置输入；通过 **CustomEvent** 验证输出。
- **禁止**：直接改内部/私有状态、测内部方法或实现细节。

### 生命周期与清理

- 组件挂载：`document.createElement("wsx-xxx")` 后 `container.appendChild(component)`，会触发 `onConnected`。
- 每个用例后清理：`component?.remove()`、`container?.remove()`（在 `afterEach` 中）。

### 测试应覆盖

- 初始化（onConnected）、清理（onDisconnected）。
- 通过 attribute 与 property 设置并同步（含 onAttributeChanged）。
- `@state` 变更后的重渲染（设置状态 → `await waitForRender()` → 断言 DOM）。
- 事件分发（CustomEvent）、Shadow DOM 存在与样式注入、边界数据。

## 4. 常见错误（必须避免）

- 在 `.wsx` 中写 `import { ref } from 'vue'` 或使用任何 Vue API。
- 在 WSX 测试中用 `setTimeout` 等待 DOM，或假设 `@state` 改完立刻可查 DOM。
- 用 `document.querySelector` 查组件内部，而不是 `component.shadowRoot?.querySelector`。
- 在测试里直接改 `(component as any)._xxx` 或测内部方法。
- 在 Vue 里通过 ref 直接改 Web Component 内部状态；应通过属性/公开方法或事件交互。

## 5. 工作流检查清单

进行 WSX 相关修改时：

- [ ] 确认是组件/视图实现 → 用 WSX（`.wsx`）；是应用/集成 → 用 Vue/React，不混用。
- [ ] `.wsx` 中无任何 Vue 依赖；Vue 仅通过 Web Components 使用 WSX。
- [ ] 新增/修改测试：用 `waitForRender()` 等待再断言 DOM；仅通过 `shadowRoot` 查内部；测公共 API 与事件。
- [ ] 测试清理：`afterEach` 中移除 component 与 container。

## 6. 参考文档

- 边界与决策树、包结构、完整示例：[docs/vue-vs-wsx-boundary.md](../../../docs/vue-vs-wsx-boundary.md)
- 测试模板、场景与工具函数：[docs/wsx-testing-guide.md](../../../docs/wsx-testing-guide.md)
- 测试问题与改进优先级：[docs/wsx-testing-summary.md](../../../docs/wsx-testing-summary.md)

更多代码示例与完整测试模板见上述文档。需要按文档索引查阅时，见 [reference.md](reference.md)。
