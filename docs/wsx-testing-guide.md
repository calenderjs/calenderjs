# WSX 组件测试指南 (AI 工作指南)

> **作者**: WSX Master + Guardian (测试守护者)  
> **创建日期**: 2025-01-08  
> **目标读者**: **AI Agents** (这是 AI 的工作指南)  
> **目的**: 指导 AI 如何编写符合 WSX 设计理念的高质量测试

## 📋 核心原则

### WSX 测试哲学

**WSX 组件测试应该**：
- ✅ 测试 Web Components 标准行为（Custom Elements API）
- ✅ 测试 WSX 响应式系统（`@state` 装饰器）
- ✅ 测试组件生命周期（`onConnected`, `onDisconnected` 等）
- ✅ 测试属性（Attributes）和属性（Properties）的同步
- ✅ 测试 Shadow DOM 隔离和样式封装
- ✅ 测试事件分发（CustomEvent）

**WSX 组件测试不应该**：
- ❌ 依赖框架特定的测试工具（如 React Testing Library）
- ❌ 使用 `setTimeout` 等待 DOM 更新（应该使用正确的异步等待方式）
- ❌ 直接操作组件内部状态（应该通过属性/属性）
- ❌ 忽略 Shadow DOM 的存在
- ❌ 测试实现细节而非公共 API

## 🎯 WSX 组件特性

### 1. Web Components 标准

WSX 组件是标准的 Web Components，测试应该遵循 Web Components 测试模式：

```typescript
// 导入以注册组件
import "DayView.wsx";
// ✅ 正确：使用标准 Web Components API
const component = document.createElement("wsx-day-view");
document.body.appendChild(component);
// 组件会自动调用 connectedCallback (WSX 的 onConnected)
```

### 2. 响应式状态（@state）

WSX 使用 `@state` 装饰器实现响应式状态，状态变化会**立即触发重渲染调度**，但**实际渲染是异步的**：

```typescript
// ✅ 正确：@state 变化会触发重渲染调度（同步）
component.viewDate = new Date(2024, 0, 15);
// ⚠️ 注意：渲染是异步调度的，需要等待渲染完成
// 使用 await waitForRender() 等待渲染完成
await waitForRender();
const dateElement = component.shadowRoot?.querySelector(".day-view-date");
expect(dateElement?.textContent).toContain("2024");
```

**重要理解**：
- `@state` 变化 → **同步触发**重渲染调度
- 实际 DOM 更新 → **异步执行**（通过调度机制）
- 测试需要等待渲染完成才能验证 DOM

### 3. Shadow DOM

WSX 的 `WebComponent` 使用 Shadow DOM，测试必须通过 `shadowRoot` 访问内容：

```typescript
// ✅ 正确：通过 shadowRoot 访问 Shadow DOM 内容
const shadowRoot = component.shadowRoot;
const element = shadowRoot?.querySelector(".day-view-event");
```

### 4. 属性同步

WSX 组件支持属性和属性的双向绑定：

```typescript
// ✅ 通过属性设置（字符串）
component.setAttribute("view-date", "2024-01-15");

// ✅ 通过属性设置（类型化）
component.viewDate = new Date(2024, 0, 15);
```

## 📝 测试模板

### 等待渲染完成的辅助函数

```typescript
/**
 * 等待 WSX 组件渲染完成
 * 
 * WSX 的 @state 变化会触发重渲染调度，但渲染是异步的。
 * 使用这个函数等待渲染完成。
 */
async function waitForRender(): Promise<void> {
    // 使用 requestAnimationFrame 等待下一帧（渲染通常在这一帧完成）
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            // 再等待一个微任务，确保所有异步更新完成
            Promise.resolve().then(() => {
                resolve();
            });
        });
    });
}

/**
 * 等待组件初始化完成（包括首次渲染）
 */
async function waitForComponentInit(component: HTMLElement): Promise<void> {
    if (!component.isConnected) {
        throw new Error("Component must be connected to DOM before initialization");
    }
    // 等待首次渲染
    await waitForRender();
}
```

### 基础测试模板

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../DayView.wsx"; // 导入以注册组件
import type DayView from "../DayView.wsx";

// 等待渲染完成的辅助函数
async function waitForRender(): Promise<void> {
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            Promise.resolve().then(() => {
                resolve();
            });
        });
    });
}

describe("DayView 组件", () => {
    let container: HTMLElement;
    let component: DayView;

    beforeEach(() => {
        // 创建容器
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        // 清理组件
        if (component?.parentNode) {
            component.remove();
        }
        if (container?.parentNode) {
            container.remove();
        }
    });

    it("应该正确初始化", async () => {
        // 创建组件（会自动注册，因为已导入）
        component = document.createElement("wsx-day-view") as DayView;
        
        // 添加到 DOM（触发 connectedCallback/onConnected）
        container.appendChild(component);
        
        // 等待首次渲染完成
        await waitForRender();
        
        // 验证组件已连接
        expect(component.isConnected).toBe(true);
        
        // 验证 Shadow DOM 存在
        expect(component.shadowRoot).toBeTruthy();
    });
});
```

## 🔍 测试场景

### 1. 测试组件初始化

```typescript
it("应该在连接到 DOM 时初始化", () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    
    // WSX 的 onConnected 会被自动调用
    expect(component.isConnected).toBe(true);
    expect(component.shadowRoot).toBeTruthy();
    
    // 验证默认状态
    expect(component.viewDate).toBeInstanceOf(Date);
    expect(component.events).toEqual([]);
});
```

### 2. 测试属性设置（Attributes）

```typescript
it("应该通过属性设置 viewDate", () => {
    component = document.createElement("wsx-day-view") as DayView;
    
    // 在添加到 DOM 前设置属性
    component.setAttribute("view-date", "2024-01-15T00:00:00.000Z");
    container.appendChild(component);
    
    // 验证属性已同步到内部状态
    const expectedDate = new Date("2024-01-15T00:00:00.000Z");
    expect(component.viewDate.getTime()).toBe(expectedDate.getTime());
});
```

### 3. 测试属性设置（Properties）

```typescript
it("应该通过属性设置 events", async () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    await waitForRender(); // 等待首次渲染
    
    const events: Event[] = [
        {
            id: "event-1",
            type: "meeting",
            title: "测试事件",
            startTime: new Date(2024, 0, 15, 10, 0, 0),
            endTime: new Date(2024, 0, 15, 11, 0, 0),
            data: {},
        },
    ];
    
    // 通过属性设置（类型化）
    component.events = events;
    // @state 变化会触发重渲染调度，但渲染是异步的
    await waitForRender(); // 等待渲染完成
    
    // 验证状态已更新
    expect(component.events).toEqual(events);
    
    // 验证 DOM 已更新（通过 Shadow DOM）
    const shadowRoot = component.shadowRoot;
    const eventElements = shadowRoot?.querySelectorAll(".day-view-event");
    expect(eventElements?.length).toBe(1);
});
```

### 4. 测试响应式更新（@state）

```typescript
it("应该在 @state 变化时自动重渲染", async () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    await waitForRender(); // 等待首次渲染
    
    const initialDate = new Date(2024, 0, 15);
    component.viewDate = initialDate;
    await waitForRender(); // 等待渲染完成
    
    // 验证初始渲染
    const shadowRoot = component.shadowRoot;
    const dateElement = shadowRoot?.querySelector(".day-view-date");
    expect(dateElement?.textContent).toContain("2024");
    expect(dateElement?.textContent).toContain("1月");
    expect(dateElement?.textContent).toContain("15");
    
    // 更新状态
    const newDate = new Date(2024, 1, 20);
    component.viewDate = newDate;
    await waitForRender(); // 等待渲染完成（@state 变化触发异步渲染）
    
    // 验证 DOM 已更新
    const updatedDateElement = shadowRoot?.querySelector(".day-view-date");
    expect(updatedDateElement?.textContent).toContain("2月");
    expect(updatedDateElement?.textContent).toContain("20");
});
```

### 5. 测试事件分发

```typescript
it("应该在事件点击时分发 CustomEvent", () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    
    const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "测试事件",
        startTime: new Date(2024, 0, 15, 10, 0, 0),
        endTime: new Date(2024, 0, 15, 11, 0, 0),
        data: {},
    };
    
    component.viewDate = new Date(2024, 0, 15);
    component.events = [event];
    
    // 监听自定义事件
    let receivedEvent: Event | null = null;
    component.addEventListener("event-click", ((e: CustomEvent) => {
        receivedEvent = e.detail.event;
    }) as EventListener);
    
    // 触发点击（通过 Shadow DOM）
    const shadowRoot = component.shadowRoot;
    const eventElement = shadowRoot?.querySelector(".day-view-event") as HTMLElement;
    eventElement?.click();
    
    // 验证事件已分发
    expect(receivedEvent).toBeTruthy();
    expect(receivedEvent?.id).toBe("event-1");
});
```

### 6. 测试 Shadow DOM 隔离

```typescript
it("应该使用 Shadow DOM 隔离样式", () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    
    // 验证 Shadow DOM 存在
    expect(component.shadowRoot).toBeTruthy();
    
    // 验证样式已注入（通过 Shadow DOM）
    const shadowRoot = component.shadowRoot;
    const styleElement = shadowRoot?.querySelector("style");
    expect(styleElement).toBeTruthy();
    
    // 验证组件内容在 Shadow DOM 中
    const dayViewElement = shadowRoot?.querySelector(".day-view");
    expect(dayViewElement).toBeTruthy();
    
    // 验证外部 DOM 无法直接访问 Shadow DOM 内容
    const externalQuery = document.querySelector(".day-view");
    expect(externalQuery).toBeNull(); // Shadow DOM 隔离
});
```

### 7. 测试生命周期

```typescript
it("应该在 onConnected 时初始化", () => {
    component = document.createElement("wsx-day-view") as DayView;
    
    // 在添加到 DOM 前，组件未初始化
    expect(component.isConnected).toBe(false);
    
    // 添加到 DOM 触发 onConnected
    container.appendChild(component);
    
    // 验证已初始化
    expect(component.isConnected).toBe(true);
    expect(component.shadowRoot).toBeTruthy();
});

it("应该在 onDisconnected 时清理", () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    
    // 验证已连接
    expect(component.isConnected).toBe(true);
    
    // 移除组件触发 onDisconnected
    component.remove();
    
    // 验证已断开连接
    expect(component.isConnected).toBe(false);
});
```

### 8. 测试属性变化（onAttributeChanged）

```typescript
it("应该在属性变化时更新状态", () => {
    component = document.createElement("wsx-day-view") as DayView;
    container.appendChild(component);
    
    const initialDate = new Date(2024, 0, 15);
    component.viewDate = initialDate;
    
    // 通过属性改变（触发 onAttributeChanged）
    const newDate = new Date(2024, 1, 20);
    component.setAttribute("view-date", newDate.toISOString());
    
    // 验证状态已更新
    expect(component.viewDate.getTime()).toBe(newDate.getTime());
});
```

## ❌ 常见错误（避免这些）

### 错误 1: 使用 setTimeout 等待 DOM 更新

```typescript
// ❌ 错误：使用固定的 setTimeout 不可靠
component.events = events;
await new Promise(resolve => setTimeout(resolve, 10)); // ❌ 不可靠！

// ✅ 正确：使用 requestAnimationFrame + Promise 等待渲染完成
component.events = events;
await waitForRender(); // ✅ 等待渲染完成
const eventElements = component.shadowRoot?.querySelectorAll(".day-view-event");
expect(eventElements?.length).toBe(events.length);
```

### 错误 1.1: 假设渲染是同步的

```typescript
// ❌ 错误：假设 @state 变化后 DOM 立即更新
component.events = events;
const eventElements = component.shadowRoot?.querySelectorAll(".day-view-event");
expect(eventElements?.length).toBe(events.length); // ❌ 可能失败，因为渲染是异步的

// ✅ 正确：等待渲染完成后再验证
component.events = events;
await waitForRender(); // ✅ 等待异步渲染完成
const eventElements = component.shadowRoot?.querySelectorAll(".day-view-event");
expect(eventElements?.length).toBe(events.length);
```

### 错误 2: 忽略 Shadow DOM

```typescript
// ❌ 错误：直接查询 DOM（无法访问 Shadow DOM 内容）
const eventElement = document.querySelector(".day-view-event"); // ❌ 返回 null

// ✅ 正确：通过 shadowRoot 访问
const shadowRoot = component.shadowRoot;
const eventElement = shadowRoot?.querySelector(".day-view-event");
```

### 错误 3: 直接操作内部状态

```typescript
// ❌ 错误：直接操作私有状态
(component as any)._viewDate = new Date(); // ❌ 违反封装

// ✅ 正确：通过公共 API（属性或属性）
component.viewDate = new Date(); // ✅ 通过属性
component.setAttribute("view-date", date.toISOString()); // ✅ 通过属性
```

### 错误 4: 测试实现细节

```typescript
// ❌ 错误：测试内部方法
expect((component as any).initializeFromAttributes).toBeDefined(); // ❌ 实现细节

// ✅ 正确：测试公共行为
component.setAttribute("view-date", "2024-01-15");
expect(component.viewDate).toBeInstanceOf(Date); // ✅ 公共 API
```

### 错误 5: 不清理组件

```typescript
// ❌ 错误：不清理组件
it("测试", () => {
    const component = document.createElement("wsx-day-view");
    document.body.appendChild(component);
    // 没有清理！
});

// ✅ 正确：使用 beforeEach/afterEach 清理
afterEach(() => {
    if (component?.parentNode) {
        component.remove();
    }
});
```

## 🛠️ 测试工具函数

### Shadow DOM 查询辅助函数

```typescript
/**
 * 在 Shadow DOM 中查询元素
 */
function queryShadowSelector<T extends Element = Element>(
    component: HTMLElement,
    selector: string
): T | null {
    return (component.shadowRoot?.querySelector(selector) as T) || null;
}

/**
 * 在 Shadow DOM 中查询所有元素
 */
function queryShadowSelectorAll<T extends Element = Element>(
    component: HTMLElement,
    selector: string
): T[] {
    return Array.from(component.shadowRoot?.querySelectorAll(selector) || []) as T[];
}
```

### 组件创建辅助函数

```typescript
/**
 * 创建并初始化 WSX 组件
 */
function createComponent<T extends HTMLElement>(
    tagName: string,
    attributes?: Record<string, string>
): T {
    const component = document.createElement(tagName) as T;
    
    // 设置属性
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            component.setAttribute(key, value);
        });
    }
    
    // 添加到 DOM（触发 onConnected）
    document.body.appendChild(component);
    
    return component;
}
```

## 📊 测试覆盖率要求

### 必须测试的内容

- ✅ 组件初始化（onConnected）
- ✅ 组件清理（onDisconnected）
- ✅ 属性设置（Attributes）
- ✅ 属性设置（Properties）
- ✅ 属性变化（onAttributeChanged）
- ✅ 响应式状态更新（@state）
- ✅ 事件分发（CustomEvent）
- ✅ Shadow DOM 隔离
- ✅ 样式注入
- ✅ 边界条件（空数据、无效数据等）

### 测试覆盖率目标

- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

## 🎯 完整测试示例

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../DayView.wsx";
import type DayView from "../DayView.wsx";
import type { Event } from "@calenderjs/event-model";

describe("DayView 组件", () => {
    let container: HTMLElement;
    let component: DayView;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (component?.parentNode) {
            component.remove();
        }
        if (container?.parentNode) {
            container.remove();
        }
    });

    describe("初始化", () => {
        it("应该在连接到 DOM 时初始化", () => {
            component = document.createElement("wsx-day-view") as DayView;
            container.appendChild(component);
            
            expect(component.isConnected).toBe(true);
            expect(component.shadowRoot).toBeTruthy();
            expect(component.viewDate).toBeInstanceOf(Date);
            expect(component.events).toEqual([]);
        });
    });

    describe("属性设置", () => {
        it("应该通过属性设置 viewDate", () => {
            component = document.createElement("wsx-day-view") as DayView;
            const date = new Date(2024, 0, 15);
            component.setAttribute("view-date", date.toISOString());
            container.appendChild(component);
            
            expect(component.viewDate.getTime()).toBe(date.getTime());
        });

        it("应该通过属性设置 events", () => {
            component = document.createElement("wsx-day-view") as DayView;
            container.appendChild(component);
            
            const events: Event[] = [
                {
                    id: "event-1",
                    type: "meeting",
                    title: "测试事件",
                    startTime: new Date(2024, 0, 15, 10, 0, 0),
                    endTime: new Date(2024, 0, 15, 11, 0, 0),
                    data: {},
                },
            ];
            
            component.events = events;
            
            expect(component.events).toEqual(events);
            
            const shadowRoot = component.shadowRoot;
            const eventElements = shadowRoot?.querySelectorAll(".day-view-event");
            expect(eventElements?.length).toBe(1);
        });
    });

    describe("响应式更新", () => {
        it("应该在 @state 变化时自动重渲染", () => {
            component = document.createElement("wsx-day-view") as DayView;
            container.appendChild(component);
            
            const date = new Date(2024, 0, 15);
            component.viewDate = date;
            
            const shadowRoot = component.shadowRoot;
            const dateElement = shadowRoot?.querySelector(".day-view-date");
            expect(dateElement?.textContent).toContain("2024");
            expect(dateElement?.textContent).toContain("1月");
            expect(dateElement?.textContent).toContain("15");
        });
    });

    describe("事件分发", () => {
        it("应该在事件点击时分发 CustomEvent", () => {
            component = document.createElement("wsx-day-view") as DayView;
            container.appendChild(component);
            
            const event: Event = {
                id: "event-1",
                type: "meeting",
                title: "测试事件",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                data: {},
            };
            
            component.viewDate = new Date(2024, 0, 15);
            component.events = [event];
            
            let receivedEvent: Event | null = null;
            component.addEventListener("event-click", ((e: CustomEvent) => {
                receivedEvent = e.detail.event;
            }) as EventListener);
            
            const shadowRoot = component.shadowRoot;
            const eventElement = shadowRoot?.querySelector(".day-view-event") as HTMLElement;
            eventElement?.click();
            
            expect(receivedEvent).toBeTruthy();
            expect(receivedEvent?.id).toBe("event-1");
        });
    });

    describe("Shadow DOM", () => {
        it("应该使用 Shadow DOM 隔离样式", () => {
            component = document.createElement("wsx-day-view") as DayView;
            container.appendChild(component);
            
            expect(component.shadowRoot).toBeTruthy();
            
            const shadowRoot = component.shadowRoot;
            const styleElement = shadowRoot?.querySelector("style");
            expect(styleElement).toBeTruthy();
            
            const dayViewElement = shadowRoot?.querySelector(".day-view");
            expect(dayViewElement).toBeTruthy();
            
            // 验证外部无法访问 Shadow DOM 内容
            const externalQuery = document.querySelector(".day-view");
            expect(externalQuery).toBeNull();
        });
    });
});
```

## 📚 总结

### WSX 测试核心要点

1. **使用 Web Components 标准 API**
   - `document.createElement()` 创建组件
   - `appendChild()` 触发 `onConnected`
   - `remove()` 触发 `onDisconnected`

2. **通过 Shadow DOM 访问内容**
   - 始终使用 `component.shadowRoot?.querySelector()`
   - 不要直接查询 `document`

3. **理解 WSX 的异步渲染机制**
   - `@state` 变化会**同步触发**重渲染调度
   - 但实际 DOM 更新是**异步的**（通过调度机制）
   - 必须使用 `waitForRender()` 等待渲染完成
   - 不要使用 `setTimeout`，使用 `requestAnimationFrame + Promise`

4. **测试响应式系统**
   - `@state` 变化会触发重渲染调度
   - 需要等待异步渲染完成才能验证 DOM
   - 使用 `await waitForRender()` 等待

5. **测试公共 API**
   - 通过属性（Attributes）和属性（Properties）设置
   - 通过事件（CustomEvent）通信
   - 不要测试内部实现细节

6. **遵循 Web Components 标准**
   - 测试 Custom Elements 行为
   - 测试 Shadow DOM 隔离
   - 测试事件分发

### 关键理解：WSX 渲染机制

```
@state 变化
    ↓ (同步)
触发重渲染调度
    ↓ (异步)
实际 DOM 更新
    ↓
需要等待渲染完成
```

**测试模式**：
```typescript
// 1. 设置状态（同步触发调度）
component.events = events;

// 2. 等待渲染完成（异步）
await waitForRender();

// 3. 验证 DOM（渲染已完成）
const elements = component.shadowRoot?.querySelectorAll(".day-view-event");
expect(elements?.length).toBe(events.length);
```

---

**最后更新**: 2025-01-08  
**维护者**: WSX Master + Guardian  
**目标读者**: AI Agents（这是 AI 的工作指南）
