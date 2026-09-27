# RFC-0016: 周视图表头与时段列对齐

**状态**: Implemented  
**创建日期**: 2026-09-26  
**完成日期**: 2026-09-26  
**关联**: RFC-0010（已归档；本次不重开）

## 摘要

周视图里，星期表头的竖线和下面 24 小时网格的竖线对不齐，越靠右越偏。滚动改到整块周视图上，表头和时段网格共用同一套列宽。

## 与 RFC-0010 的边界

RFC-0010 修的是时间标签位置和重复 `key` 导致的 DOM 错位。列宽轨道当时已经是「时间轴 + 7 列」。本次只修滚动条造成的宽度差，不改事件定位和日期计算。

## 原因

`.week-view-header` 和 `.week-view-body` 各算各的列宽。垂直滚动条只挂在 `.week-view-body` 上，表头仍按整行宽度分成 7 列。下面的网格被滚动条挤窄，竖线从左到右逐渐偏离。

## 设计

滚动容器改为 `.week-view`。表头 `position: sticky` 留在顶部。表头和 `.week-view-body` 使用同一条网格：

`时间轴宽度 + repeat(7, minmax(0, 1fr))`

`.week-view-columns` 使用 `display: contents`，七个日期列直接落在这套轨道上。日期列和时间轴单元格使用 `box-sizing: border-box`，边框计入轨道宽度。只有时段区的时间轴在横向滚动时 `sticky`，表头里的空时间轴跟着表头走。

## 改动

| 文件 | 变更 |
| --- | --- |
| `packages/calendar/src/views/WeekView.css` | 共用列轨道；滚动上移到 `.week-view` |

## 验收

在 React demo 周视图中，七个 `.week-view-day-header` 与对应 `.week-view-day-column` 的左边缘差为 0。表头在纵向滚动时保持可见。
