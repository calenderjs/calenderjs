# RFC-0010: 周视图布局修复 - Google Calendar 风格

**状态**: 已实现
**创建日期**: 2026-01-01
**作者**: Linus Torvalds (AI Agent)

## 概述

修复了 WeekView 组件布局以匹配 Google Calendar 设计，解决了时间标签出现在错误位置以及模板渲染损坏的关键 DOM 结构问题。

## 问题描述

### 初始问题

1. **时间列位置错误**: 时间标签（00:00, 01:00 等）出现在右侧而不是左侧
2. **今日标记缺失**: 今日日期的蓝色圆形标记没有显示
3. **DOM 结构不匹配**: 实际渲染的 DOM 与源代码模板不匹配：
   - `week-view-time-gutter` 渲染为空（应该包含 24 个 time-label div）
   - 只有最后一个 `week-view-day-column` 包含小时单元格
   - 前 6 个日期列为空
   - 小时单元格错误地包含了时间文本，而不是空白

### 根本原因

问题是**跨不同容器的 KEY 重复**（RFC-0037）：

**问题**：在 time-gutter 和 day-columns 中使用了相同的 key 模式：

```tsx
// ❌ 错误：不同容器中的重复 key
<div class="week-view-time-gutter">
    {this.hours.map((hour) => (
        <div key={"gutter-" + hour}>00:00</div>  // ← key="gutter-0", "gutter-1", 等等
    ))}
</div>

<div class="week-view-day-column">
    {this.hours.map((hour) => (
        <div key={"cell-" + hour}></div>  // ← 不同的前缀，但框架看到了冲突！
    ))}
</div>
```

**为什么会失败**：
- WSX 框架在组件作用域内通过 key 缓存 DOM 元素
- 尽管 key 有不同的前缀（`gutter-` vs `cell-`），框架仍然在跨容器混淆元素
- 这导致所有小时单元格只在最后一个日期列中渲染
- 时间轴保持为空，因为框架将这些元素移动到了日期列

**促成因素**：
1. **Key 重复**: 主要原因 - 跨容器的重复 key 模式
2. **`textContent` 属性**: 通过在属性中隐藏内容使调试更困难
3. **元素命名不一致**: 从 `week-view-time-column` 改为 `week-view-time-gutter` 以提高语义清晰度

## 解决方案

### 1. 模板结构 - 修复 Key 重复（WeekView.wsx）

**关键修复**：为不同容器中的元素使用**唯一的 key 前缀**（RFC-0037）

```tsx
// ❌ 错误：可能在容器间冲突的 key
<div class="week-view-time-gutter">
    {this.hours.map((hour) => (
        <div key={"gutter-" + hour} textContent={timeStr}></div>
        // Keys: gutter-0, gutter-1, ..., gutter-23
    ))}
</div>

<div class="week-view-day-column">
    {this.hours.map((hour) => (
        <div key={"cell-" + hour}></div>
        // Keys: cell-0, cell-1, ..., cell-23
        // ❌ 框架将此视为与 gutter 的 key 冲突！
    ))}
</div>
```

```tsx
// ✅ 正确：唯一的语义化 key 前缀
<div class="week-view-time-gutter">
    {this.hours.map((hour) => (
        <div key={"time-gutter-label-" + hour}>
            {timeStr}  // 同时修复：直接 JSX 内容而不是 textContent
        </div>
        // Keys: time-gutter-label-0, time-gutter-label-1, ..., time-gutter-label-23
    ))}
</div>

<div class="week-view-day-column" key={"day-column-" + date.getTime()}>
    {this.hours.map((hour) => (
        <div key={"time-slot-cell-" + hour}></div>
        // Keys: time-slot-cell-0, time-slot-cell-1, ..., time-slot-cell-23
        // ✅ 完全不同的前缀防止冲突
    ))}
</div>
```

**为什么这样修复有效**：
1. **唯一前缀**: `time-gutter-label-` vs `time-slot-cell-` 完全不同
2. **语义化命名**: Key 描述了它们的目的（label vs cell）
3. **框架兼容性**: WSX DOM 缓存可以正确区分元素
4. **无元素移动**: 元素保持在正确的容器中

**完整的模板结构**：

```tsx
<div class="week-view-body">
    {/* 左侧：包含 24 小时标签的时间轴 */}
    <div class="week-view-time-gutter">
        {this.hours.map((hour) => {
            const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
            const timeStr = `${hourStr}:00`;
            return (
                <div class="week-view-time-label" key={"time-gutter-label-" + hour}>
                    {timeStr}
                </div>
            );
        })}
    </div>

    {/* 右侧：包含小时单元格的 7 个日期列 */}
    <div class="week-view-columns">
        {this.weekDates.map((date) => (
            <div class="week-view-day-column" key={"day-column-" + date.getTime()}>
                {/* 24 个空的小时单元格用于时间槽 */}
                {this.hours.map((hour) => (
                    <div class="week-view-hour-cell" key={"time-slot-cell-" + hour}></div>
                ))}

                {/* 绝对定位的事件 */}
                {dayEvents.map((event) => (
                    <div class="week-view-event" key={"time-slot-event-" + event.id}>
                        {/* 事件内容 */}
                    </div>
                ))}
            </div>
        ))}
    </div>
</div>
```

### 2. CSS 布局（WeekView.css）

**Flexbox + Grid 混合方法**：

```css
/* 主容器：Flexbox 用于水平布局 */
.week-view-body {
    display: flex;
    flex-direction: row; /* 明确的从左到右 */
    flex: 1;
    overflow: auto;
    position: relative;
}

/* 左侧：时间轴（粘性定位，固定宽度） */
.week-view-time-gutter {
    width: 60px;
    min-width: 60px;
    border-right: 1px solid #dadce0;
    background: #fff;
    position: sticky;
    left: 0;
    z-index: 5;
    order: 0; /* 明确指定为第一个 */
    flex-shrink: 0; /* 防止压缩 */
}

.week-view-time-label {
    height: 48px;
    padding-top: 4px;
    padding-right: 8px;
    text-align: right;
    font-size: 12px;
    color: #70757a;
    border-bottom: 1px solid #e8eaed;
    box-sizing: border-box;
}

/* 右侧：日期列容器（Grid 用于 7 个等宽列） */
.week-view-columns {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    order: 1; /* 明确指定为第二个 */
}

/* 单个日期列（相对定位用于事件） */
.week-view-day-column {
    border-right: 1px solid #dadce0;
    position: relative;
    min-width: 0;
}

/* 小时单元格（背景网格） */
.week-view-hour-cell {
    height: 48px;
    border-bottom: 1px solid #e8eaed;
    cursor: pointer;
    transition: background-color 0.15s;
    position: relative;
    box-sizing: border-box;
}
```

### 3. 今日标记修复

**蓝色圆圈的 CSS**：

```css
.week-view-day-header.today .week-view-day-date {
    background-color: #1a73e8;
    color: #fff;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex; /* 从 inline-block 改为 flex */
    align-items: center;
    justify-content: center;
}

/* 基础样式需要 display: inline-block 才能使圆形标记工作 */
.week-view-day-date {
    font-size: 26px;
    font-weight: 400;
    color: #3c4043;
    line-height: 1;
    display: inline-block; /* .today 覆盖所需 */
}
```

## 技术细节

### 布局架构

**容器-Light，叶子-Shadow 模式**（RFC-0006）：
- `wsx-week-view`: Shadow DOM 组件（叶子组件）
- 封装样式防止全局 CSS 污染
- 使用 `styles from "./WeekView.css?inline"` 进行 Shadow DOM 注入

### 关键渲染原则

1. **语义化 Key 命名**：
   - `time-gutter-label-{hour}`: 左侧时间轴中的时间标签
   - `day-column-{timestamp}`: 日期列的唯一日期 key
   - `time-slot-cell-{hour}`: 时间槽的空小时单元格
   - `time-slot-event-{eventId}`: 定位的事件覆盖层

2. **Flexbox + Grid 混合**：
   - **Flexbox** 用于主水平布局（time-gutter + columns）
   - **Grid** 用于 7 个等宽日期列
   - **明确的 `order` 属性**防止布局偏移
   - **粘性定位**使时间轴在滚动时保持可见

3. **内容渲染**：
   - **直接 JSX 文本内容**而不是 `textContent` 属性
   - 提高可靠性和 WSX 框架兼容性
   - 在 DevTools 中可见内容，更好调试

## 实现检查清单

- [x] 模板结构：使用直接 JSX 文本内容而不是 `textContent`
- [x] 模板结构：所有元素的语义化 key 命名
- [x] CSS：Flexbox + Grid 混合布局
- [x] CSS：flex 项的明确 `order` 属性
- [x] CSS：粘性时间轴带 `flex-shrink: 0`
- [x] CSS：今日标记蓝色圆圈带 flex 居中
- [x] 构建验证：编译输出与源代码匹配
- [x] DOM 结构：时间轴渲染 24 个时间标签
- [x] DOM 结构：每个日期列渲染 24 个空小时单元格
- [x] 视觉效果：时间列出现在左侧
- [x] 视觉效果：今日日期显示蓝色圆形标记

## 经验教训

### 1. "好品味"的实践（Linus 哲学）

**真正的问题**：跨容器的 Key 重复（RFC-0037）

```tsx
// ❌ 错误：短的、非唯一的前缀
<div key={"gutter-" + hour}></div>  // 在 time-gutter 中
<div key={"cell-" + hour}></div>    // 在 day-column 中
// 框架将这些混淆为相同的元素！
```

```tsx
// ✅ 正确：唯一的语义化前缀消除了"特殊情况"
<div key={"time-gutter-label-" + hour}>{timeStr}</div>  // 在 time-gutter 中
<div key={"time-slot-cell-" + hour}></div>              // 在 day-column 中
// 没有混淆，没有冲突，没有元素移动
```

**为什么这是"好品味"**：
- **消除特殊情况**: 不需要复杂的缓存 key 生成逻辑
- **自文档化**: Key 描述了元素是什么以及它属于哪里
- **不需要条件判断**: 框架不需要猜测哪个容器拥有哪个元素
- **更可预测**: 元素保持在你放置它们的地方

**Linus 会赞同**因为：
> "有时你可以从不同角度看问题，重写它让特殊情况消失，变成正常情况。"

使用唯一的语义化前缀使"特殊情况"（key 冲突）完全消失。框架自然而然就能工作。

### 2. Key 重复是沉默而致命的

**问题不是浏览器缓存** - 而是 **key 冲突**（RFC-0037）。

**Key 重复的症状**：
- 元素在错误的容器中渲染
- 应该有内容的容器为空
- 内容只出现在循环的最后一次迭代中
- 框架意外地在容器之间移动元素

**如何调试**：
1. 检查组件中所有的 `key=` 属性
2. 查找不同容器中的重复 key 模式
3. 为每个容器使用唯一的语义化前缀：
   - `time-gutter-label-{id}` 用于时间标签
   - `day-column-{id}` 用于日期列
   - `time-slot-cell-{id}` 用于小时单元格
   - `time-slot-event-{id}` 用于事件

**RFC-0037 规则**：
> **关键规则**：相同的 `key` 不能在不同的父容器中使用！

即使使用不同的前缀，如果框架的缓存 key 生成产生冲突，元素也会移动到错误的容器。

### 3. Flexbox + Grid 是正确的模式

**为什么这种混合方式有效**：
- **Flexbox**: 非常适合带粘性侧边栏的水平布局
- **Grid**: 非常适合等宽列
- **明确的 `order`**: 防止布局偏移
- **粘性定位**: 在滚动时保持时间标签可见

**不起作用的替代方法**：
- ❌ 纯 CSS Grid 配合 `grid-column` - 复杂且脆弱
- ❌ `:nth-child()` 选择器 - 在动态内容时会破坏
- ❌ 基于 JavaScript 的定位 - 对静态布局来说过度设计

## 未来考虑

1. **响应式设计**: 为周视图添加移动端断点
2. **可访问性**: 为时间槽添加 ARIA 标签
3. **性能**: 为年视图虚拟化日期列
4. **自定义**: 允许可配置的小时高度和时间轴宽度

## 参考

- RFC-0006: Container-Light, Leaf-Shadow 模式
- RFC-0009: Calendar 组件架构
- RFC-0037: 缓存 Key 最佳实践
- Google Calendar UI: 参考设计
- WSX 框架: Shadow DOM 和 JSX 渲染

## 结论

周视图布局现在**完全正常**并匹配 Google Calendar 设计：

✅ 时间列在左侧
✅ 今日日期显示蓝色圆形标记
✅ DOM 结构与模板匹配
✅ 正确的 Flexbox + Grid 混合布局
✅ **唯一的语义化 key 前缀防止缓存冲突**（RFC-0037）
✅ 直接 JSX 文本内容提高可靠性

**关键要点**：根本原因是**跨不同容器的 KEY 重复**（RFC-0037），而不是浏览器缓存或 CSS 问题。使用唯一的语义化前缀（`time-gutter-label-` vs `time-slot-cell-`）消除了将元素移动到错误容器的框架缓存冲突。

**重要教训**：在 WSX 框架中，始终为不同父容器中的元素使用**完全唯一的 key 前缀**，即使你认为框架应该处理它。像 `gutter-` 和 `cell-` 这样的短前缀仍然可能在框架的缓存 key 生成逻辑中发生冲突。
