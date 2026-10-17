# RFC 0022: Animate calendar view switches (child of 0017)

**Status:** Implemented

**Parent:** [0017](0017-calendar-follow-ons.md)

## Summary

月、周、日视图切换时有一段短过渡，而不是瞬间换掉整棵视图。

## Problem

视图切换动画被写在 RFC-0005 里，和日历本体、拖拽、性能混在一起，所以一直没有单独验收。

## Goals

在月、周、日之间切换时，用户能看到过渡，而不是硬切。过渡结束后只存在目标视图。

## Non-goals

不改变三个视图的数据或布局规则。不做拖拽（RFC-0020）。不把动画做成可配置的插件（RFC-0012）。

## Design

过渡放在 `packages/calendar/src/Calendar.wsx` 切换视图的位置，用 CSS transition。视图组件本身仍只负责自己的网格。

## Acceptance

从月视图切到周视图再切到日视图，每次都能观察到过渡，且过渡结束后 `currentView` 与可见视图一致。关闭动画或减少动态效果时，切换仍然完成。
