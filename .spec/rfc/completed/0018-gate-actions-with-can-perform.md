# RFC 0018: Gate edit and delete with canPerform (child of 0017)

**Status:** Implemented

**Parent:** [0017](../0017-calendar-follow-ons.md)

## Summary

删除和编辑事件之前，先问该事件类型的 EventRuntime `canPerform`。不允许时不发出对应的变更事件。

## Problem

`Calendar.canPerformAction` 已是公开方法，但月视图删除直接派发 `event-delete`，编辑路径同样没有这道门。权限规则因此不生效。

## Goals

有 Runtime 且用户存在时，删除与编辑必须先通过 `canPerform`。拒绝时不派发成功事件，并派发对应的拒绝事件。无 Runtime 或无用户时保持现在的放行行为。

## Non-goals

不实现拖拽（RFC-0020）或拖边缘改时长（RFC-0021）。不改 `canPerform` 在 event-runtime 里的表达式求值。不合并 `description`（RFC-0019）。

## Design

在 `packages/calendar/src/Calendar.wsx` 接到子视图的删除和编辑之前调用已有的 `canPerformAction`。月视图的删除按钮是当前唯一的界面入口；编辑若尚无界面入口，则在 Calendar 对外的编辑提议路径上设门，而不是在视图里复制一套权限判断。

## Acceptance

有 Runtime、用户和 `editable: false`（或删除对应的 behavior 为 false）时，触发删除不派发 `event-delete`。允许时仍派发。无 Runtime 时删除行为与现在相同。用日历包的集成测试覆盖允许与拒绝两条路径。
