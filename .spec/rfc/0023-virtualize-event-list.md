# RFC 0023: Virtualize large event lists (child of 0017)

**Status:** Implemented

**Parent:** [0017](0017-calendar-follow-ons.md)

## Summary

事件很多时，日历只渲染视口附近的事件，而不是为每一个事件都创建 DOM。

## Problem

RFC-0005 把「1000 个事件在 100ms 内渲染」和虚拟滚动写进了组件总规格。这是性能工作，不是日历本体的完成条件。

## Goals

在月、周或日视图中，远超一屏的事件不会全部变成 DOM 节点。滚动时视口内的事件仍然可见、可点。

## Non-goals

不改变 Event 模型。不实现拖拽（RFC-0020）或视图动画（RFC-0022）。不在本 RFC 里承诺 RFC-0005 旧表里的全部性能数字，除非虚拟化之后测到了。

## Design

在承担大量事件块的视图里按视口回收节点。在 `DayView.wsx`（日视图）与 `WeekView.wsx`（周视图）中：
1. 监听滚动容器（`.day-view-body` / `.week-view-body`）的 `scroll` 事件，动态跟踪 `scrollTop` 与 `viewportHeight`；
2. 当单日事件数量较少时（日视图 <= 20，周视图 <= 15）直接全量渲染，避免不必要的计算或布局抖动；
3. 当事件数量超出阈值时，基于时间轴高度（24小时 * 48px = 1152px）和视口区间（加减 150px 缓冲区）进行可见性过滤；
4. 滚出视口与缓冲区范围的事件节点被自动回收（不生成 DOM）。月视图显示芯片摘要，暂无需虚拟化。

## Acceptance

构造远多于一屏的事件后，视图里的事件 DOM 节点数明显少于事件总数。滚到另一时间范围后，该范围内的事件出现，滚出视口的节点被回收。少量事件时的显示与现在一致。已由 `DayView.test.ts` 与 `WeekView.test.ts` 验证。

