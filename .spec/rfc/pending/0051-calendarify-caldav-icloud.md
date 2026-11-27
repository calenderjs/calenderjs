# RFC 0051: calendarify 支持 iCloud/通用 CalDAV 日历源

**Status:** Pending

## Summary

为 `apps/calendarify`（RFC-0048）增加 iCloud/通用 CalDAV 协议日历源支持，作为 Google/Outlook 之外的第三种数据源。本 RFC 由 RFC-0048 的 Non-goals 拆出，暂缓到后续排期，先占位记录范围，不展开设计细节。

## Problem

RFC-0048 首版只接入 Google Calendar 和 Outlook（Microsoft Graph），不支持 iCloud 或标准 CalDAV 协议。CalDAV 的鉴权与数据格式（iCalendar/ICS）与前两者的 REST JSON API 差异较大，需要独立的 adapter 设计，决定先不做，留待确认有实际需要后再细化设计。

## Goals

（暂缓，留待立项时补充）

## Non-goals

（暂缓，留待立项时补充）

## Design

（暂缓，留待立项时补充——占位 RFC，不在此阶段展开技术方案）

## Acceptance

（暂缓，留待立项时补充）
