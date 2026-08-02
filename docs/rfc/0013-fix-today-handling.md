# RFC 0013: 修复月视图中的"今天"高亮显示问题

**状态**: Implemented
**创建日期**: 2026-03-01
**完成日期**: 2026-03-15
**作者**: CalenderJS Team

## 摘要

本 RFC 提议修复日历组件月视图中的一个视觉错误，即当浏览非当前月份时，"今天"的高亮样式被错误地应用到了上个月或下个月的日期上（例如：今天是 11 月 30 日，在浏览 12 月时，11 月 30 日的灰色日期块被显示为"今天"）。

## 动机

当查看非当前月份（例如：今天是 11 月 30 日，查看 12 月视图）时，属于上个月的灰色日期 "30"（代表 11 月 30 日）被高亮显示为 "今天"。这会造成困惑，因为 "今天" 的样式（蓝色背景/文本）主要用于强调当前上下文中的重要日期。当前的实现覆盖了 "非本月"（other-month）的灰色样式，使其看起来像一个普通的活动日期。

## 设计

修复涉及修改 `MonthView.wsx` 中的渲染逻辑。

### 当前逻辑

```typescript
const isToday = isSameDay(normalizedDate, this._today);
// ...
class={`month-view-cell ... ${isToday ? "today" : ""}`}
```

### 建议逻辑

我们将限制 `today` 类的应用，仅当该日期**同时**属于当前显示的月份时才应用。

```typescript
const isToday = isSameDay(normalizedDate, this._today);
// ...
// 仅当是今天且属于当前月份时才应用 'today' 类
const shouldHighlightToday = isToday && isCurrentMonth;
class={`month-view-cell ... ${shouldHighlightToday ? "today" : ""}`}
```

或者，我们可以保留 `today` 类，但通过修改 CSS 确保 `other-month` 的样式优先级更高。但在逻辑层面上移除 "今天" 的状态对于 "聚焦当前月" 的视图来说是更清晰的 UX 选择。

## 附加变更：移除"选中日期" (Selected Date) 状态

用户指出不需要"选中日期"的高亮状态，且该状态的来源不明确。我们将从所有视图中完全移除"选中日期"的视觉样式。

### 变更内容

1.  **MonthView**: 移除单元格的 `selected` 类。
2.  **WeekView**: 移除日期头部的 `selected` 类。
3.  **DayView**: 确保没有 `selected` 样式被应用。
4.  **Calendar**: 仍然保留 `currentDate` 用于控制视图显示的基准日期，但不再通过 UI 强调显示它。

## 实施计划

1.  **复现**: 创建一个单元测试 `packages/calendar/src/views/__tests__/Reproduction.test.ts`，模拟当前日期并渲染不同的月份视图，断言 "今天" 的单元格（位于非本月区域）目前具有 `today` 类。
2.  **修复**: 更新 `packages/calendar/src/views/MonthView.wsx`。
3.  **移除选中状态**: 修改 `MonthView`, `WeekView`, `DayView` 移除 `isSelected` 判断及相关 CSS 类。
4.  **验证**:
    -   运行复现单元测试，确认修复前失败，修复后通过。
    -   运行现有测试。
    -   **视觉验证**: 启动日历演示并在浏览器中验证行为。

## 替代方案

-   **仅 CSS 修复**: 我们可以使用 CSS 优先级使 `.other-month.today` 看起来不同。然而，在逻辑中简单地隐藏 "今天" 状态更健壮，并能防止意外的样式冲突。
