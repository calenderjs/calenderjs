# RFC 0017: Calendar follow-ons (Umbrella)

**Status:** Implemented

**Type:** Umbrella

## Summary

RFC-0005 只保留日历组件本体。从它身上拆出去的每一件后续工作各是一张子 RFC。本伞只索引这些子项，不含实现。

## Problem

RFC-0005 同时写了运行时门禁、显示合并、拖拽、改时长、视图动画和虚拟滚动。一件事一张 RFC，这些 concern 不能继续堆在 0005 里。

## Goals

下列子 RFC 都变为 Approved 或 Implemented 后，本伞可以关闭。

## Non-goals

不重开 RFC-0005 来装新工作。不包含 EventDataGenerator（RFC-0011）、插件机制（RFC-0012）、文档站（RFC-0006）、VS Code 扩展（RFC-0007）。关闭后若再有日历后续，另开伞或独立 RFC。

## Children

| RFC | Concern |
|-----|---------|
| [0024](completed/0024-rename-event-dsl-property.md) | Rename eventDSL to eventTypeDefinitions |
| [0018](completed/0018-gate-actions-with-can-perform.md) | Gate edit and delete with canPerform |
| [0019](completed/0019-merge-runtime-description.md) | Merge runtime description into display events |
| [0020](0020-drag-events-to-new-time.md) | Drag events to a new time |
| [0021](0021-resize-event-duration.md) | Resize event duration by dragging the edge |
| [0022](0022-animate-view-switch.md) | Animate calendar view switches |
| [0023](0023-virtualize-event-list.md) | Virtualize large event lists |

## Acceptance

七个子 RFC 均已 Approved 或 Implemented 时，本伞可 `advance` 为 Implemented 并归档。不得为了新需求重新打开本伞。
