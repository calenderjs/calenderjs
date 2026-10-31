# RFC 0036: MonthView 事件拖拽改日期

**Status:** Implemented

## Summary

`MonthView.wsx` 当前完全没有拖拽代码（`grep "drag|Drag|resize|pointerdown"` 零匹配），事件只能点击打开、删除，不能拖拽改日期。本 RFC 给 MonthView 的事件块接入 RFC-0031 共用的 pointer-event 拖拽引擎（`startPointerDrag`/`elementFromPointDeep`/`findMatchAtPoint`），实现"拖一个事件到另一天的格子，改它的日期"。这是 RFC-0027 已经点名、但从未被独立 RFC 认领的缺口——RFC-0027 的范围是"demo 覆盖率金科玉律 + 把 demo 默认视图切到能展示拖拽的 week 视图"，并不包含给 MonthView 本身实现拖拽；本 RFC 补上这块真正缺失的实现。

## Problem

`MonthView.wsx` 的事件块（`.month-view-event`）只绑了 `onClick`（打开事件）和事件删除按钮的 `onClick`，没有任何指针/拖拽相关的 handler；日期格子（`.month-view-cell`）只有 `onClick`/`onDblClick` 用于新建/选中日期，没有作为拖放落点的数据属性（对比 WeekView 的 `.week-view-hour-cell` 有 `data-column-date`/`data-hour`）。用户在 month 视图下想把一个事件从 10 月 5 日挪到 10 月 12 日，唯一能做的是打开事件详情手动改日期（如果有这个表单 UI 的话），没有直接拖拽的入口。

MonthView 的事件天然是"全天格子"展示（每天最多显示 3 条，超出折叠成"+N 更多"），不像 WeekView/DayView 那样有逐小时的时间轴网格。因此 MonthView 的"拖拽"语义天然只有**改日期**（事件挪到哪一天），没有 WeekView/DayView 那种"改小时"的维度；"改时长"（resize）在 month 格子里没有可操作的像素空间（事件块是整天一行，没有上下边缘可拖的高度），不在 MonthView 的拖拽场景里。

## Goals

- `.month-view-event` 事件块接入 `startPointerDrag`（复用 RFC-0031 的 `packages/calendar/src/utils/pointer-drag.ts`，不重新发明拖拽状态机）。
- 拖拽时事件块跟手移动（视觉预览），松手后用 `elementFromPointDeep`/`findMatchAtPoint` 命中落点的 `.month-view-cell`，取其日期，派发 `event-update-request`（与 WeekView/DayView 同名、同形状的自定义事件，复用 `Calendar.wsx` 的 `handleChildEventUpdateRequest` 汇合点，不新增事件类型）。
- 拖拽只改事件的日期（年/月/日），**保留原事件的时:分:秒和时长**——把 10:00-11:00 的事件从 10 月 5 日拖到 10 月 12 日，结果是 10 月 12 日 10:00-11:00，不是变成全天事件。
- 拖拽阈值、点击与拖拽手势的区分（`_suppressNextClick` 之类的模式）对齐 WeekView 现有实现（RFC-0032），不用两套不同的手感。
- 不实现 resize——如 Problem 所述，month 格子没有可拖的时长维度，不属于本 RFC 范围。

## Non-goals

- 不实现 resize/改时长——month 视图的事件展示没有时间轴，没有可拖拽的"边缘"，这个维度在 month 视图里不存在，留空不是遗漏。
- 不改变 WeekView/DayView 现有拖拽逻辑或共用引擎 `pointer-drag.ts` 本身的实现。
- 不处理 RFC-0035（validate 规则是否拦截拖拽更新）——MonthView 拖拽复用的是同一个 `event-update-request` → `handleChildEventUpdateRequest` 路径，天然享受 0035 落地后的效果（或维持 0035 落地前的现状），本 RFC 不重复决策。
- 不处理"+N 更多"展开/折叠状态下拖拽一个被折叠的事件（源事件侧）——折叠态下事件本身不在 DOM 里渲染（`visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, 3)`，`MonthView.wsx:362-364`），拖拽的源必须是当前可见（未折叠）的事件块，这是现有折叠机制的自然限制，不在本 RFC 里特殊处理。
  - **落点侧的折叠需要处理，不能回避**：如果拖拽目标格子本身已有 ≥3 条事件且未展开，新事件按 `sortEventsByTime` 排序后若排在第 4 条及以后，会被直接收进"+N 更多"而不可见，用户只会看到计数 +1，事件本身看不到。Design 一节规定具体处理方式（见下）。
- 不新增"跨天多日事件"的专门渲染或拖拽支持。现状 `groupEventsByDate`（`packages/calendar/src/utils/event-utils.ts:34`）只按事件的 `startTime` 分组，一个跨多天的事件只在它开始那天的格子里渲染一份，不是每天各渲染一份。本 RFC 不改变这个分组逻辑；因为只有一个显示块、且拖拽保留原时长，拖动这一个块本身就能正确整体平移这个跨天事件，不需要额外处理。

## Design

涉及文件：
- `packages/calendar/src/views/MonthView.wsx`：
  - `.month-view-cell` 的 JSX 增加 `data-date={normalizedDate.getTime()}`——**定死用时间戳，不用 `dateKey` 字符串**。`dateKey`（`YYYY-MM-DD`，来自 `formatDateKey`）被 `new Date(...)` 解析会当成 UTC 零点，在非 UTC 时区（e2e 跑在 `America/Los_Angeles`，见 `demos/react/playwright.config.ts:33`）会偏移一天。和 WeekView 的 `data-column-date` 保持同一种写法。
  - `.month-view-event` 的 JSX 去掉（原本就没有的）`draggable`，加 `onPointerDown`，调用一个新的 `handleEventPointerDown(e, event)`：
    - 开头先排除删除按钮：`if ((e.target as HTMLElement).closest(".month-view-event-delete")) return;`——否则点 × 删除也会被当成一次拖拽手势启动（`setPointerCapture` 会改变后续 click 的派发对象，导致点 × 可能变成打开详情而不是删除）。对齐 WeekView 对 resize 手柄的同类排除（`WeekView.wsx:393`）。
    - 其余逻辑调用 `startPointerDrag`：
      - `onMove`：更新一个 `@state private _dragPreview: { eventId, dx, dy } | null`，渲染时据此给对应事件块加 `transform: translate(dx, dy)px; z-index: 20;` 与 `.dragging` class（`z-index` 必须显式设置——月视图格子有 `.today`/`.other-month`/hover 背景色，没有 `z-index` 时预览块拖到相邻格子会被盖住；对齐 WeekView 的内联样式写法，`WeekView.wsx:688`）。
      - `onEnd`：清空 `_dragPreview`；若位移超过阈值（对齐 WeekView 的 `DRAG_THRESHOLD`），调用 `commitEventDrop(event, upEvent.clientX, upEvent.clientY)`；否则视为点击，不触发更新（并设置 `_suppressNextClick` 避免同时触发 `handleEventClick` 打开详情）。
  - 新增 `commitEventDrop`：用 `findMatchAtPoint(clientX, clientY, ".month-view-cell")` 找落点格子，读其 `data-date`（时间戳）：
    - 若落点日期和原日期相同（拖回原格子/没有实际移动），**不派发更新请求**，直接返回——避免触发一次无意义的 `event-update-request` 和下游的校验/事件通知。
    - 否则按 WeekView 同款换算方式构造新事件（`WeekView.wsx` 的 `commitEventDrop` 换算逻辑）：`const newStart = new Date(targetMs); newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds()); const newEnd = new Date(newStart.getTime() + durationMs);`——只替换日期部分、保留时刻，用一次 `setHours` 而不是分两步改 `setMonth`/`setDate`（分两步在月末/跨月边界会算错，如 1/31 加一月会溢出成 3/3）。
    - 若落点格子是"+N 更多"折叠态且目标格子的 `dayEvents.length >= 3`：拖放生效后把 `_expandedDateKey` 设为目标格子的 `dateKey`，自动展开该格子，让刚拖入的事件可见（而不是让它悄悄落进折叠计数里看不见）。
  - `handleEventClick` 开头先调用 `evt.stopPropagation()`，**再**检查 `_suppressNextClick`——顺序不能反。`MonthView.wsx:285-287` 现有的 `handleEventClick` 本身会 `stopPropagation`（和 WeekView 不同，WeekView 的点击处理本来就不调用它）；如果检查放在 `stopPropagation` 之前就 return，拖拽松手后的那次 click 会冒泡到原格子的 `onClick`，触发 `date-click` → `Calendar.wsx` 的 `date-change`，把当前选中日期悄悄改回原来那天。
- `packages/calendar/src/views/MonthView.css`：新增 `.month-view-event.dragging` 规则，对齐 WeekView.css 的 `opacity: 0.5; cursor: grabbing; pointer-events: none;`（`pointer-events: none` 是 RFC-0032 实测踩过的坑——拖拽预览的 DOM 更新是异步的，不加这个会在松手瞬间可能命中到预览框本身而不是它下面的格子）。
- 不改 `Calendar.wsx`——`event-update-request` 的监听与转发逻辑已经是通用的，MonthView 接入后自动享受同一条路径，不需要新增分支。

## Acceptance

- 真实浏览器验证（遵循 RFC-0027 金科玉律）：在 month 视图下，把一个有具体时间（非全天）的事件从一天拖到另一天，松手后事件出现在新的一天，时:分:秒和时长不变；原来的一天不再显示该事件。
- 连续两次拖拽同一个事件都生效（不是"拖一次就卡住"——参考 RFC-0032 曾经真实踩过的坑，新实现要验证不会重犯）。
- 点击事件块（不拖动，位移小于阈值）仍然正常触发 `event-click`，不会被新加的 pointerdown handler 误判成拖拽。
- 点击事件块上的删除按钮 `×` 仍然正常触发删除，不会被 pointerdown handler 当成一次拖拽手势。
- 拖拽到一个事件数已达 3 条、处于未展开状态的目标格子：拖放后该格子自动展开，能看到刚拖入的事件（不是只看到"+N 更多"计数 +1）。
- 跨月边界的拖拽（如月末最后一天拖到下个月第一天）日期和时长换算正确，不出现日期溢出错位。
- 新增 e2e 覆盖：month 视图下真实拖拽事件到另一天的格子，断言目标格子出现事件、原格子不再显示、事件的时间部分不变；以及拖到已有 3 条事件的折叠格子时自动展开的场景。
- 不影响 WeekView/DayView 现有拖拽行为、不影响 month 视图现有的点击新建/点击打开/删除/"+N 更多"展开功能、不影响点击选中日期（`date-click`）的行为（跑现有 MonthView 相关单测 + 手动过一遍这些交互）。

## Implementation record

- `MonthView.wsx` uses RFC-0031 pointer drag, timestamp cell targets, local-time preservation, same-date no-op, crowded-cell expansion, and rejection feedback. Delete-button pointerdown remains separate from drag initiation.
- E17 checks two consecutive moves, preserved time and duration, cross-month movement, and event click without changing the selected date. E23 checks denied updates. E24 checks expansion of a crowded destination. E25 checks the delete callback.
- Browser interaction record (MCP `page.mouse` pointer input): MonthView drag moved the timed event from October 31 to October 1, then from October 1 to September 30. Final event remained at 10:00–11:00; the destination showed one event.
- Verification: the RFC E2E matrix passed 33/33 across Chromium, Firefox, and WebKit. Calendar unit tests passed 107 tests.
