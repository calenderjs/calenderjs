# RFC 0049: calendarify 双向同步（webhook 订阅 + 冲突合并）

**Status:** Pending

## Summary

为 `apps/calendarify`（RFC-0048）增加远程→本地的自动增量同步：订阅 Google Calendar push notification / Microsoft Graph webhook，在远程事件变更时推送更新，并处理与本地未提交编辑的冲突合并。本 RFC 由 RFC-0048 的 Non-goals 拆出，暂缓到后续排期，先占位记录范围，不展开设计细节。

## Problem

RFC-0048 首版只做"登录后拉取 + 本地编辑回写"，没有远程变更的实时感知——如果用户在 Google Calendar 网页端改了事件，calendarify 里看到的还是旧数据，要手动刷新。真正接近生产可用，需要这类同步能力，但权衡实现复杂度（webhook 订阅续期、冲突合并策略、重试/幂等），决定先不做，留待确认有实际需要后再细化设计。

## Goals

（暂缓，留待立项时补充）

## Non-goals

（暂缓，留待立项时补充）

## Design

（暂缓，留待立项时补充——占位 RFC，不在此阶段展开技术方案）

## Acceptance

（暂缓，留待立项时补充）
