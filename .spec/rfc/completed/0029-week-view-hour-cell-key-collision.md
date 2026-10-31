# RFC 0029: Fix WeekView hour-cell key collision breaking drag/click per column

**Status:** Implemented

## Summary

`packages/calendar/src/views/WeekView.wsx:634` 的 `key={"time-slot-cell-" + hour}` 在 7 个日期列的 `.map()` 里用的是同一套 key（没有按日期区分），导致 WSX keyed 渲染器把 7 列的 24 格 hour-cell 当成同一份列表去重，实测全周视图里真实 DOM 只剩 24 个 `.week-view-hour-cell`（应为 168 = 7×24），6/7 的日期列完全没有时段格子。没有格子就没有 `onDrop`/`onDragOver`/`onClick`（新建事件）挂载点，等于这 6 天拖拽改时间、点格子新建事件全部失效。

## Problem

本次会话里亲手在浏览器实测（不是看代码推断）：

1. 打开 demo，切到周视图，尝试把"团队会议"从周日拖到周一同一时间——UI 无任何变化，`event-update`/`event-update-request` 均未触发。
2. 用 JS 直接查询 shadow DOM：`weekEl.shadowRoot.querySelectorAll('.week-view-hour-cell').length` 返回 **24**，`querySelectorAll('.week-view-day-column')` 返回 **7** 列，但 `columns.map(c => c.children.length)` 结果是 `[2, 0, 0, 0, 0, 0, 24]`——只有 1 列真正有 24 个 hour-cell，其余列要么空（无格子只有的话有事件时也只剩事件 div），要么完全空。
3. 对照源码 `WeekView.wsx:630-651`：每个日期列内部都 `this.hours.map((hour) => <div key={"time-slot-cell-" + hour} ... />)`，7 个列各自跑一次这个 `.map()`，但 7 次跑出来的 24 个 key 字符串完全相同（`"time-slot-cell-0"` 到 `"time-slot-cell-23"`），没有把 `normalizedDate`/列标识编进 key。WSX 的响应式渲染器据此判定"这是同一组节点"，跨列复用/丢弃，只留下最后一次渲染赢家的那一份。

对照：同一文件里 `week-view-time-label`（左侧时间刻度，line 602，`key={"time-gutter-label-" + hour}`）只渲染一次（不在日期列循环内），不受影响；`week-view-event`（事件本身，line 667，`key={"time-slot-event-" + event.id}`）天然按 event id 区分，也不受影响。唯独 hour-cell 这一处是在"每列重复跑同一个 `hours.map()`"又"key 没带列标识"的组合下出的问题。

## Goals

- `WeekView.wsx` 的 hour-cell key 加入列标识（如 `normalizedDate.getTime()`），确保 7 列、每列 24 格，总共真实渲染 168 个 `.week-view-hour-cell` DOM 节点。
- 检查 `DayView.wsx` 是否存在同类模式（当前只有单列，理论上不触发同款 bug，但仍需确认其 key 策略本身是否安全、是否有其他循环结构存在类似风险）。
- 修完后在浏览器里重新实测：对非当前"幸存列"的某一天（例如周一）执行真实拖拽（HTML5 DnD 完整事件序列：dragstart → dragover → drop），确认 `event-update` 正确触发且 UI 更新。
- 同时验证点击空白时段新建事件（`handleSlotClick`）在所有 7 天都能触发，不只是幸存的那一列。

## Non-goals

- 不改动 resize（鼠标拖拽改时长）逻辑——键盘版 resize 已实测可用，鼠标版 resize handle 挂在事件 div 上（`week-view-event` 内部），不受 hour-cell key 冲突影响，问题不在这里。
- 不改动 MonthView（本就没有 hour-cell 结构，不适用这个 bug 模式）。
- 不新增任何 UI 可见变化——纯粹是渲染层的 key 修复，用户看到的格子布局、样式都不变，只是之前"看不见"的格子现在真实存在于 DOM 里并能响应事件。
- 不在本 RFC 里顺带实现 RFC-0026/0027/0028——各自独立关单。

## Acceptance

- 全周视图 7 天 × 24 小时，真实 DOM 节点数为 168 个 `.week-view-hour-cell`（修复前实测 24 个）。
- 在浏览器里对任意一天（不只是之前碰巧幸存的那一列）执行真实拖拽，事件能从一天移到另一天，`event-update` 正确触发，UI 视觉更新。
- 对任意一天的空白时段点击，`handleSlotClick` → 新建事件流程能跑通（之前只有 1 列能跑通）。
- `DayView.wsx` 排查结论写进本 RFC 的实施记录：是否存在同类 key 冲突，若有一并修。
- 本次修复必须在真实浏览器里人工验证一遍（对齐 RFC-0027 的金科玉律），不能只看单测/代码走查就关单。

## 实施记录

- 修复：`WeekView.wsx:634` key 改为 `"time-slot-cell-" + normalizedDate.getTime() + "-" + hour`，按列加日期标识。
- `DayView.wsx` 排查结论：**无同类问题**。左侧时间列（`left-hour-${hour}`）、右侧 hour-cell 列（`right-hour-${hour}`）各自只跑一次 `hours.map()`，不存在跨列重复循环，key 天然互斥，无需改动。
- 浏览器真实验证（Claude in Chrome + 真实 DOM/DragEvent，非单测/代码推断）：
  - JS 查询 `.week-view-hour-cell` 总数：**168**（7 列 × 24，修复前 24）。
  - 真实 `dragstart`/`dragover`/`drop`/`dragend`（带 `DataTransfer`）把"团队会议"从周日拖到周一 10:00——`event-update` 触发（UI 顶部显示"已更新事件: 团队会议"），事件实际移动到周一 10:00-11:00，周日/周一事件计数同步更新。
  - 点击周二（非幸存列）10:00 空白格——`handleSlotClick` 触发（UI 显示"已在 10:00 创建时段预约"），新事件"时段预约"正确渲染在周二列。

## e2e 固化（补写）

会话手动验证不可重复、不进 CI，用户明确要求补一个真实 Playwright e2e 用例固化这次验证，而不是只留人工记录。

- 新增 `demos/react/e2e/week-drag.spec.ts`（E14）：周视图断言 7×24=168 个 hour-cell；把"客户演示"从周一真实拖拽（`locator.dragTo`，走浏览器原生 `dragstart`/`dragover`/`drop`）到周二 14:00；点击周三（曾被清空的列）新建事件。三步全部命中之前 bug 影响的非幸存列。
- 过程中发现并修复两个额外的真实问题（都不是臆测，都是实跑复现的）：
  1. **demo 消费的是 `packages/calendar/dist/` 预构建产物，不是源码**——仅改 `.wsx` 源码、不跑 `pnpm build:calendar` + `pnpm --filter demos-react build:e2e`，e2e 测出来的永远是修复前的旧行为（168 断言会稳定失败在 24）。这次顺带确认了"改 calendar 包代码后必须重新 build 才能让 demo/e2e 看到"这条隐性依赖，未来任何 WSX 组件改动走 e2e 验证前都要记得重 build。
  2. **`locator.dragTo()` 本身有偶发 flake**：实测约 30%-40% 概率在 mousedown 时抓到了错误的相邻事件（本例中把"团队会议"而非目标"客户演示"拖走），根因是 WSX shadow DOM 在重渲染后短暂有过渡态，`dragTo()` 用调用时刻的 bounding box 定位，偶尔撞上未稳定的坐标。修复：显式 `scrollIntoViewIfNeeded()` + `expect.poll` 等 bounding box 先稳定、再用 `dragTo(target, { sourcePosition: {x: width/2, y: height/2} })` 显式锁死源点坐标，而不是让 Playwright 自己重新计算。连续 18 次本地重跑（`--repeat-each=10` 两轮）0 失败，确认稳定。
- 验证：`pnpm --filter @calenderjs/demos-react test:e2e`（含 `week-drag.spec.ts`）chromium 项目全绿（23/23，含既有 22 条不回归）；firefox/webkit 项目在本机因 Playwright 浏览器二进制未安装无法跑（`browserType.launch: Executable doesn't exist`），属环境缺失非代码回归，未改动 CI 配置或安装浏览器二进制。
