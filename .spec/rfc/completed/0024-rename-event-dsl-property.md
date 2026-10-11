# RFC 0024: Rename eventDSL to eventTypeDefinitions (child of 0017)

**Status:** Implemented

**Parent:** [0017](../0017-calendar-follow-ons.md)

## Summary

日历上声明事件类型 DSL 的规范属性名改为 `eventTypeDefinitions`。旧名 `eventDSL` 在弃用期内仍可用。

## Problem

RFC-0005 把属性改名和日历本体写在一起。代码里现在只有 `eventDSL`，没有 `eventTypeDefinitions`。改名是一件独立的兼容性工作。

## Goals

新代码通过 `eventTypeDefinitions` 传入类型 DSL。已有调用方继续传 `eventDSL` 时，行为与现在相同。两套名字指向同一次解析和编译。

## Non-goals

不改 DSL 语法（RFC-0002）。不改编辑器包的属性名，除非它只是把值传给日历。不实现拖拽、门禁或虚拟滚动。

## Design

在 `packages/calendar/src/Calendar.wsx` 增加 `eventTypeDefinitions` getter/setter，内部仍走现有的 DSL 编译路径。`eventDSL` setter 委托到同一路径。类型声明与 React 封装同步暴露新名字，并保留旧名字。

## Acceptance

只设置 `eventTypeDefinitions` 时，日历按该 DSL 编译 Runtime。只设置 `eventDSL` 时结果相同。两者都设置时，以规范名 `eventTypeDefinitions` 为准。集成测试覆盖这三种输入。
