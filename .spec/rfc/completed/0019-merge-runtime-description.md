# RFC 0019: Merge runtime description into display events (child of 0017)

**Status:** Implemented

**Parent:** [0017](../0017-calendar-follow-ons.md)

## Summary

`runtime.render()` 产出的 `description`，以及会改写标题的 display 规则，合并进日历用来显示的事件。

## Problem

`mergeRenderedIntoEvent` 只写回 `title`、`color`、`icon`。`description` 被丢掉。现有集成测试名叫增强标题，断言的却仍是原标题，标题模板没有被证明生效。

## Goals

有 Runtime 时，`displayEvents` 带上渲染结果里的 `description`。DSL 的 title display 规则会改变显示标题。无 Runtime 时事件保持原样。

## Non-goals

不改权限门禁（RFC-0018）。不改视图里事件块的视觉排版，除了消费已经合并好的字段。不实现拖拽或虚拟滚动。

## Design

改 `packages/calendar/src/utils/event-runtime-integration.ts` 的 `mergeRenderedIntoEvent`，把 `description` 写入显示用事件（放在现有 `data` 或渲染结果已有字段上，不新增第二套事件模型）。三视图已经读取 `displayEvents`，不必再各写一套合并。

## Acceptance

集成测试用一条会改写 title 的 display 规则，断言 `displayEvents` 标题变为模板结果。另一条断言 `description` 出现在显示事件上。无 Runtime 时标题与描述与输入相同。
