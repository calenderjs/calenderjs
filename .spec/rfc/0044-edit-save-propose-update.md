# RFC 0044: 编辑保存接入 proposeEventUpdate 通知 host (child of 0038)

**Status:** Draft

**Parent:** [0038](0038-event-edit-popup-umbrella.md)

## Summary

需求：日历允许编辑事件，改完必须**通知 host**，由 host 自己决定要不要真的更新——不是日历内部悄悄直接改数据。`Calendar.wsx` 已有完整通道 `proposeEventUpdate(event)`（权限检查 → 校验 → 派发 `event-update`/`event-update-denied`/`event-update-error`），但 demo 当前的编辑保存路径（`handleSaveEdit`）完全绕开这条通道，直接 `setEvents` 改本地 state。本 RFC 只修这一条保存路径，不涉及表单字段扩展（那是 0040 的范围）。

## Problem

`demos/react/src/App.tsx:225` 的 `handleSaveEdit`：

```ts
const handleSaveEdit = () => {
  setEvents((prev) =>
    prev.map((item) =>
      item.id === editingId ? { ...item, title: editingTitle } : item,
    ),
  );
  ...
};
```

直接本地替换，不经过 `Calendar.wsx` 的 `proposeEventUpdate`：

- 绕过 RFC-0018 的 `editable` 权限网关——`behavior.editable: false` 的事件类型照样能被改。
- 绕过 RFC-0035 落地的 validate 规则——改坏的数据直接进 state，不触发任何校验失败反馈。
- host（这里就是 demo 自己）拿不到"事件已更新"的显式通知事件（`event-update`），没法在真实接入场景里挂钩审计、同步到后端等逻辑——因为更新根本没经过日历组件，是绕过去直接改的。

## Goals

- `handleSaveEdit` 改为调用 `calendarRef.current.proposeEventUpdate(updatedEvent)`（通过 `CalendarRef` 现有能力；若未暴露则在 `packages/react/src/Calendar.tsx` 补上转发，不新增校验逻辑）。
- 保存成功后，host（demo）监听现有 `onEventUpdate`/`event-update` 事件完成本地 state 同步——不再由保存按钮直接 `setEvents`。
- 校验失败（`event-update-error`）或权限拒绝（`event-update-denied`）时，demo 侧内联提示错误，不静默失败、不关闭编辑框。
- 保留现有单字段标题编辑 UI 不变（不新增字段、不改表单形态）——这是 0040 的范围。

## Non-goals

- 不新增多字段表单 UI（标题以外的字段编辑、动态 schema 渲染）——完整留给 RFC-0040。
- 不改变 `proposeEventUpdate`/`canPerformAction`/`validateEventForUpdate` 的现有签名或语义（RFC-0035 已定稿）。
- 不改变触发机制（双击/键盘打开编辑框）——RFC-0039 已完成，本 RFC 不碰。

## Design

涉及文件：

- `demos/react/src/App.tsx`：
  - `handleSaveEdit` 改为构造 `{ ...editingEvent, title: editingTitle }`，调用 `proposeEventUpdate`（走 `CalendarRef` 或监听返回事件），不再直接 `setEvents`。
  - 已有的 `handleEventUpdate`（监听 `event-update`，见 `App.tsx:232`）承接保存成功后的 state 同步——复用现有正确路径，不新开一条。
  - 新增对 `event-update-error`/`event-update-denied` 的监听，保存失败时在编辑框内联提示，不关闭。
- `packages/react/src/Calendar.tsx` / `CalendarRef`：若当前未暴露 `proposeEventUpdate` 方法，补上（直接转发到 Web Component 同名方法，不新增逻辑）。
- `packages/calendar/src/Calendar.wsx`：不改动——`proposeEventUpdate` 签名已够用。

## Acceptance

- 双击打开编辑框，改标题保存，日历对应事件更新，且更新经过 `event-update` 事件（在 `handleEventUpdate` 里可观察到），不是直接 `setEvents`。
- 把对应事件类型 DSL 的 `behavior.editable` 设为 `false`，打开编辑框保存，触发 `event-update-denied`，事件不更新，编辑框内联提示权限拒绝。
- 故意改出违反 validate 规则的标题（若现有 DSL 规则适用），保存触发 `event-update-error`，事件不更新，编辑框内联显示错误。
- 新增/更新单测覆盖：保存成功走 `event-update`、权限拒绝走 `event-update-denied`、校验失败走 `event-update-error` 三条路径。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：完整走一次"双击打开→改标题→保存→日历刷新"流程，并验证一次权限拒绝/校验失败场景确实阻止了更新。
