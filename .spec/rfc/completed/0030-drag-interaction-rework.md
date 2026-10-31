# RFC 0030: 拖拽交互重构：原生 HTML5 DnD 换成 pointer-event 自建引擎 (Umbrella)

**Status:** Implemented

**Type:** Umbrella

## Summary

周视图/日视图的拖拽改时间、拖拽改时长全部建在原生 HTML5 Drag and Drop（`draggable="true"` + `dataTransfer`）上。本次会话实测发现这套机制本身不可靠：依赖浏览器/OS 级手势识别，同一次鼠标/触控板操作有时触发、有时完全不触发，且过程中无任何实时视觉反馈。四个用户报告的 bug 根因都在这里，不是四个独立缺陷。本 umbrella 统筹把拖拽/改时长的底层机制从原生 DnD 换成 pointer-event 自建拖拽引擎（`pointerdown` + `pointermove` + `pointerup`），四个子项分别处理共享引擎、WeekView 接入、DayView 接入、resize 实时预览。

## Problem

用户报告 + 本次会话实测复现：

1. **Month 视图完全不能拖拽**——`MonthView.wsx` 里 grep `drag|Drag|tabIndex` 为 0 匹配，本来就没实现，非回归（RFC-0027 已登记此缺口，不重复开）。
2. **Week 视图拖拽——实测行为与用户报告不一致**：本次用真实 `DragEvent`/`DataTransfer` 序列实测，日期和时间都能正确更新（10:00 的事件拖到另一天 16:00 格，结果落在新日期 16:00-17:00，时长保持）。用户反馈"只能改日期不能改时间"在本次复测里没有复现——但下面第 3 点揭示了为什么用户会看到这种表现。
3. **Day 视图拖拽——用真实鼠标手势（`left_click_drag`，等价于用户的物理拖拽操作）完全不触发**：同一事件先用 JS 直接派发的 `DragEvent` 系列验证过可以连续拖两次都成功（14:00→09:00→13:00），但换成真实鼠标 mousedown→move→mouseup 手势后，拖拽**完全无反应**，事件纹丝不动。这证实了原生 HTML5 DnD 对真实指针输入的识别本身就不稳定——取决于 OS 对"这是一次拖拽手势"的判定，不是每次都会触发。这正是用户说"拖一次卡住"的真实机制：不是状态卡死，是浏览器根本没识别出这是拖拽，静默失败，用户以为是功能坏了。
4. **Resize（拖拽改时长）没有实时预览**：`WeekView.wsx` 的 `handleResizeMouseDown` 里 `// 实时预览移动` 的注释下方是空的，从未实现。用户拖动 resize handle 时，事件框的高度不会跟着鼠标位置变化，只有松手那一刻才跳变到最终结果——用户描述为"改时间范围的事件不会跟着拖拽位置 resize"。

四者共同根因：**原生 HTML5 DnD 不是为这种"拖一个绝对定位的 div 到网格另一格"的 UI 模式设计的**——没有中间态钩子能稳定提供"正在拖拽到哪"的实时坐标用于视觉反馈，而且其手势识别层本身对合成/快速/某些真实输入不敏感，会静默不触发。

## Goals

- 子 RFC 落地后，Week/Day 视图的拖拽改时间、拖拽改时长全部改为基于 pointer event 的自建拖拽（不再用 `draggable`/`dataTransfer`/`dragstart`/`dragover`/`drop`）。
- 拖拽与 resize 过程中必须有实时视觉反馈（事件框跟手移动/变形），松手后才提交最终的 `event-update`。
- 原有对外行为契约不变：仍然只在松手时触发一次 `event-update` 自定义事件，不新增/不删除事件名。
- 新机制在真实鼠标/触控板连续多次操作下必须稳定触发（不能像原生 DnD 那样偶发不触发）。

## Non-goals

- 不在本 umbrella 里实现 Month 视图拖拽——那是 RFC-0027 已登记的独立缺口（功能完全空白，不是机制不可靠），留给 0027 或其后续处理，这里不重复立项。
- 不改变 DSL/EventRuntime 层的 `editable`/`draggable` 行为开关语义，只换底层实现机制。
- 不在本 umbrella 里实现 RFC-0026 的 readonly/edit mode——两者正交，0026 决定"能不能拖"，本 umbrella 决定"拖拽机制本身是否可靠"。
- 不要求一次性重写 MonthView（它本就没有拖拽代码，不受这次机制替换影响）。

## Children

| RFC | Concern |
|-----|---------|
| [0031](0031-pointer-drag-engine.md) | 共用 pointer-event 拖拽引擎（WeekView/DayView/resize 共用的底层实现） |
| [0032](0032-week-view-pointer-drag.md) | WeekView 接入新拖拽引擎（移动改时间 + 跨列改日期） |
| [0033](0033-day-view-pointer-drag.md) | DayView 接入新拖拽引擎（移动改时间） |
| [0034](0034-resize-live-preview.md) | Resize（拖拽改时长）实时预览，基于同一套 pointer-event 引擎 |

## 备选方案评估：为什么不用现成的拖拽库

决策这一层的选择只论证一次，四个子 RFC 共享这个结论，不重复评估。

调研过 [Atlassian pragmatic-drag-and-drop](https://github.com/atlassian/pragmatic-drag-and-drop)（Trello/Jira/Confluence 在用，核心包 ~4.7kB，无头设计，跨框架）。不采用，原因：

1. **它的底层还是原生 HTML5 DnD，不是 pointer events**——官方文档的主要篇幅是"如何安全正确地使用浏览器原生拖放"，说明 Atlassian 的路线是在原生 DnD 之上封装、踩平坑，而不是绕开它。本 umbrella 存在的前提恰恰是**实测证明原生 DnD 的手势识别层对真实指针输入不稳定**（DayView 下真实鼠标拖拽完全不触发 `dragstart`，见 Problem 第 3 点）。换一个同样建立在原生 DnD 之上的库，大概率只是把同一个不稳定性换了层包装，不能保证解决根因。
2. **Shadow DOM 兼容性未知、极可能要重新踩坑**：日历组件整条渲染链路在嵌套 shadow DOM 里（`<wsx-calendar>` → `<wsx-week-view>`/`<wsx-day-view>`）。本次实现过程中踩到的两个真实 bug——`document.elementFromPoint` 不穿透 shadow boundary、`setPointerCapture` 对合成指针输入抛 `NotFoundError`——都是「自定义元素 + 嵌套 shadow DOM」这个具体场景触发的，查不到该库对此场景的文档或已知方案，引入后极可能要重新走一遍同等量级的调试才能用，节省不了排查成本。
3. **换依赖的边际收益不成立**：问题已经用不到 100 行的 `pointer-drag.ts`（RFC-0031）解决，且经真实浏览器连续多次鼠标拖拽验证稳定。引入一个新的外部依赖换来的是维护面增加（版本升级、API 变更跟踪、CSP/构建配置适配）和一次不确定的 shadow DOM 兼容性调研，而不确定能换来比现状更好的结果。
4. **该库的强项（虚拟化长列表、辅助技术/a11y 自动化支持）目前不是这几个 bug 的诉求**——这次要解决的是"真实拖拽不稳定触发""没有实时预览"这两个具体问题，不是列表虚拟化或 a11y 缺口。如果未来日历要支持数千事件的虚拟滚动，或者要补齐拖拽场景的键盘/屏幕阅读器等价操作（注意：WeekView/DayView 已有独立的键盘移动/resize 路径，不依赖鼠标拖拽），到那时候这类库的虚拟化/a11y 能力才值得重新评估，但那是另一个决策点，不在本 umbrella 范围内。

## Acceptance

- 0031-0034 全部 Approved/Implemented 时本 umbrella 可关闭。
- 关闭前必须有真实浏览器实测记录：连续多次真实鼠标拖拽（不只是 JS 派发的合成事件）在 Week 和 Day 视图都能稳定触发 `event-update`，resize 过程有可见的实时跟手反馈。
- 不因为新发现的问题重新打开本 umbrella——新问题另开 RFC。

## Implementation record

- RFC-0031 through RFC-0034 are Implemented. DayView and WeekView event movement and resize use the shared pointer-event engine.
- E15 verifies two consecutive WeekView moves. E16 verifies three consecutive DayView moves. E18 and E19 verify that DayView and WeekView resize heights change before pointer release and commit the new end time.
- Browser interaction records use MCP `page.mouse` pointer input. DayView event movement committed the target time; DayView and WeekView resize both showed a live height change before commit.
- The full RFC E2E matrix passed 33/33 across Chromium, Firefox, and WebKit. Calendar unit tests passed 107 tests.
