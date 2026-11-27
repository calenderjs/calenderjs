# RFC 0052: Demo readonly/editable mode toggle

**Status:** Draft

## Summary

`demos/react` 新增一个 UI 控件，让用户在浏览器里直接切换 Calendar 的 `mode`（`"editable"` ↔ `"readonly"`，RFC-0026 已落地），能对比体验两种模式，而不需要打开浏览器控制台手动设置 property。

## Problem

RFC-0026 落地了 Calendar 的 `mode` attribute/property 和对应的拖拽拒绝/反馈逻辑，`packages/calendar`、`packages/react` 两层都已单测覆盖，也在真实浏览器里通过手动设置 `document.querySelector("wsx-calendar").mode = "readonly"` 验证过行为正确。但 `demos/react` 的 UI 本身没有任何暴露 `mode` 的控件——普通用户打开 `pnpm dev:react` 看不到、也摸不到这个功能，只有读代码或开控制台的人才知道它存在。

本 RFC 最初是 RFC-0027（demo coverage golden rule）的一个 Goal 条目（"demo 里应同时能演示 editable 与 readonly 两种模式的对比"），但 0027 的 Design/Non-goals 明确"不改动 `demos/react/src/App.tsx`"，与这条 Goal 自相矛盾。为了不丢失这个诉求，拆成独立 RFC 单独跟踪，不卡在 0027 的流程纪律主题里。

## Goals

- `demos/react/src/App.tsx` 新增一个开关（按钮或 toggle），在 `editable`/`readonly` 之间切换，绑定到 `<Calendar mode={...} />` 的 `mode` prop（RFC-0026 已暴露）。
- 切到 `readonly` 后，用户能在 UI 上直观感受到：拖拽手势仍可发起（视觉上跟手），但松手后事件弹回原位，不会真正改变时间（对应 RFC-0026 的既有行为，不是新实现）。
- 切回 `editable` 后行为恢复正常，和当前 demo 行为完全一致。

## Non-goals

- 不改变 Calendar 组件本身的 `mode` 语义或实现——RFC-0026 已经做完这部分，本 RFC 只是在 demo 层暴露一个 UI 入口。
- 不做权限模型或多用户场景的演示，仍是单一 `mode` 开关。
- 不影响 `demos/react` 默认视图（仍是 month，RFC-0027 已确认不需要改）。

## Design

涉及文件：
- `demos/react/src/App.tsx`：新增一个 `useState<"editable" | "readonly">("editable")` 状态 + 一个切换按钮（放在工具栏，对齐现有按钮风格），传给 `<Calendar mode={...} />`。

## Acceptance

- 打开 `pnpm dev:react`，能看到新增的 mode 切换控件。
- 切到 readonly 后拖拽一个事件：视觉上能拖动，松手后弹回原位，不提交。
- 切回 editable 后同样操作能正常提交。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：关单前实际点击该控件并操作过，而非只凭代码推断。
