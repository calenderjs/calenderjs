# RFC 0020: Drag events to a new time (child of 0017)

**Status:** Implemented

**Parent:** [0017](0017-calendar-follow-ons.md)

## Summary

在周视图或日视图里把事件拖到另一时刻，拖完后按新的开始和结束时间提议更新。

## Problem

RFC-0005 把 HTML5 拖拽写进了同一张日历规格。拖拽是独立交互，当时没有实现。

## Goals

用户可以把已有事件拖到同一视图中的另一个时间格。落下后日历用新时间调用更新提议。若 RFC-0018 已落地，落下前先过 `canPerform`。

## Non-goals

不改事件时长（RFC-0021）。不做视图切换动画（RFC-0022）。不做虚拟滚动（RFC-0023）。不在本 RFC 里发明新的重复事件展开规则。

## Design

在 `packages/calendar/src/views/` 的周视图或日视图上使用 HTML5 Drag and Drop。拖拽结果回到 `Calendar.wsx` 的更新提议，而不是由视图直接改 `events` 数组。

## Acceptance

把一个定时事件拖到另一小时后，对外事件携带新的 `startTime` 和相应的 `endTime`（时长不变）。拖拽被权限拒绝时不发出成功的更新事件。
