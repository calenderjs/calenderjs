# RFC 0021: Resize event duration by dragging the edge (child of 0017)

**Status:** Draft

**Parent:** [0017](0017-calendar-follow-ons.md)

## Summary

拖事件块的下边缘，只改变结束时间，从而改变时长。

## Problem

改时长和把整段事件拖到新时刻是两次不同的手势。它曾被写在 RFC-0005 的交互增强里，没有单独的完成标准。

## Goals

在周视图或日视图中，拖下边缘后 `endTime` 变化、`startTime` 不变。结果走更新提议。

## Non-goals

不移动事件的开始时间（RFC-0020）。不实现全天事件的跨天拉伸，除非现有时间格已经能表达。不改 Runtime 的时长校验规则本身。

## Design

在周视图或日视图的事件块底部增加拖拽手柄。指针位移换算成该视图的时间增量，只更新 `endTime`，再交给 `Calendar.wsx` 的更新提议。

## Acceptance

向下拖边缘后，事件的开始时间与拖之前相同，结束时间晚于拖之前。向上拖且结果仍晚于开始时间时，结束时间提前。开始时间不早于结束时间的结果不发出成功更新。
