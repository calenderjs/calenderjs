# Why: main

<!-- reasongraph:v1 generated 2026-11-27 — review before sharing; edit freely, edits are preserved -->

## Intent
Maintain the calendar project’s architecture map and RFC records, improve demo coverage and agent-facing usage guidance, and document a WeekView rendering defect that prevents interactions across most day columns.

## Decisions

### Refresh architecture map from current code evidence
Status: discussed
Touches: `.birdify/architecture.json`, `.birdify/architecture.html`, `.birdify/architecture.sources.html`

The map records architecture and evidence, so its revision was updated for the React demo e2e suite, React wrapper client-mount fix, and calendar event Proxy-unwrapping fix. The recorded source commit remained b3f783d because the changes were uncommitted working-tree changes. The map validated with 0 errors and 0 warnings, covering 11 modules and 15 relationships; the rendered HTML grew from 705.2K to 723.9K.

### Keep demo and architecture module boundaries aligned
Status: discussed
Touches: `.birdify/architecture.json`, `demos/react`, `packages/react/src/Calendar.tsx`, `packages/calendar/src/Calendar.wsx`, `packages/calendar/src/__tests__/event-forwarding.test.ts`

The e2e suite, React wrapper fix, and event Proxy-unwrapping fix fit existing module responsibilities, so the map’s evidence and responsibility descriptions were updated without adding modules. The demo evidence records 39 user flows across 3 engines and a coverage gate.

### Run unit and e2e checks in parallel for pull requests
Status: discussed
Touches: `.spec/rfc/0025-ci-pull-request-workflow.md`, `.github/workflows/pull-request.yml`

The drafted workflow separates unit tests from browser e2e checks into parallel pull-request jobs. It uses Node 22 within the declared engine range, pins pnpm 10.27.0, and runs the existing e2e installation and coverage-gated scripts. The transcript later records the workflow as implemented and archived in commit 97ba42a.

### Keep RFC completion records synchronized with archived files
Status: discussed
Touches: `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`, `.spec/rfc/0046-vue-wrapper-package.md`, `.spec/rfc/completed/0046-vue-wrapper-package.md`

The agent ran the specification sync check after archiving RFC-0046 to confirm lifecycle records matched the archived document.

### Archive RFC-0007 as rejected
Status: directed
Touches: `.spec/rfc/0007-vscode-extension-and-online-editor.md`, `.spec/rfc/rejected/0007-vscode-extension-and-online-editor.md`, `.spec/ROADMAP.md`

The RFC was marked Rejected in the roadmap and archived under rejected. The lifecycle CLI did not recognize the existing Chinese status header, so an English Status header was added to let the archive command process the file.

### Reject the human-oriented documentation RFC
Status: directed
Touches: `.spec/rfc/0006-documentation-and-examples.md`, `.spec/rfc/rejected/0006-documentation-and-examples.md`, `.spec/ROADMAP.md`

RFC-0006 describes a documentation website and examples for human readers, which is separate from the agent-oriented skill documentation tracked by RFC-0028. It was marked Rejected and archived; an English Status header was added because the lifecycle CLI did not parse its Chinese status header.

### Align the plugin RFC with the current Event model
Status: directed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `packages/event-model/src/Event.ts`

The plugin design remains relevant, but its examples referenced the removed Event.extra field and included a metadata field absent from the current Event interface. The RFC was updated to use Event.data and match the current interface shape; no extra references remained.

### Add explicit calendar read-only and editable modes
Status: discussed
Touches: `.spec/rfc/0026-calendar-readonly-edit-mode.md`

The drafted RFC proposes a Calendar-level mode property with readonly and editable values, defaulting to editable, to provide a single mode for view-only versus change-enabled interaction. The proposed read-only mode blocks drag, resize, and keyboard editing while preserving per-event editability as a lower-level rule.

### Require behavior-changing RFCs to update and exercise the demo
Status: directed
Touches: `.spec/rfc/0027-rfc-demo-coverage-rule.md`, `AGENTS.md`, `demos/react`

The drafted RFC makes demo coverage part of acceptance for behavior-changing work and requires the relevant demo to be run before closing the RFC. It also identifies that the React demo opens in month view, where drag and resize are unavailable, and proposes a demo change or visible guidance so those interactions can be found.

### Provide verified agent-facing calendar usage guidance
Status: directed
Touches: `.spec/rfc/0028-agent-friendly-skills.md`, `skills/calenderjs-usage/SKILL.md`

The drafted RFC proposes an Agent Skill covering installation, React usage, native custom-element usage in Vue, EventRuntime and DSL wiring, and SSR considerations. It requires examples to be verified by running them. The repository has a React wrapper but no Vue-specific package, so the proposed Vue guidance uses the Web Component.

### Scope event drag and resize support to week and day views
Status: discussed
Touches: `packages/calendar/src/views/WeekView.wsx`, `packages/calendar/src/views/DayView.wsx`, `packages/calendar/src/views/MonthView.wsx`, `.spec/rfc/completed/0020-drag-events-to-new-time.md`, `.spec/rfc/completed/0021-resize-event-duration.md`

The inspected implementation provides mouse drag, mouse resize, and keyboard move and resize in WeekView and DayView; MonthView has no corresponding interactions. Keyboard resize changes the event end in fixed one-hour steps, while mouse resize follows pointer movement. The demo’s month default therefore hides the implemented interactions.

### Document the WeekView hour-cell key collision before changing code
Status: directed
Touches: `.spec/rfc/0029-week-view-hour-cell-key-collision.md`, `packages/calendar/src/views/WeekView.wsx`

A live DOM inspection found 24 hour cells where the seven-day grid should contain 168. Each day column uses the same key for a given hour, so the keyed renderer leaves most columns without drop and click targets. RFC-0029 records the defect; no code fix was made in this transcript.

### Open a repository issue for the hour-cell collision
Status: directed
Touches: `.spec/rfc/0029-week-view-hour-cell-key-collision.md`, `https://github.com/calenderjs/calenderjs/issues/1`

The validated RFC was accompanied by a GitHub issue documenting the defect for shared tracking. RFC-0029 remained Draft and the implementation was not completed.

### Include the day-column date in WeekView hour-cell keys
Status: discussed
Touches: `packages/calendar/src/views/WeekView.wsx`

The shared hour-only key collided across day columns, leaving most columns without hour cells. Adding the normalized date to each key lets the reconciler preserve all 7 columns and their 168 drop and click targets.

Risk: Key stability depends on consistent date normalization across renders.

### Keep DayView hour-cell keys unchanged
Status: discussed
Touches: `packages/calendar/src/views/DayView.wsx`

DayView renders one hour-cell column, and its left and right hour keys are already distinct. The WeekView cross-column collision does not apply there.

### Add a Playwright regression test for cross-column drag and click-to-create
Status: directed
Touches: `demos/react/e2e/week-drag.spec.ts`

Manual browser checks were not repeatable in CI. The test exercises HTML5 drag from Monday to Tuesday and click-to-create on Wednesday, covering columns affected by the key collision.

### Stabilize Playwright drag coordinates before starting the drag
Status: discussed
Touches: `demos/react/e2e/week-drag.spec.ts`

The drag test intermittently selected the wrong event because source coordinates were computed before layout settled. Scrolling the target event into view, allowing layout to settle, and pinning the drag start position made repeated Chromium runs stable.

### Rebuild the calendar package before running demo end-to-end tests
Status: discussed
Touches: `packages/calendar/dist/index.mjs`, `demos/react/package.json`, `demos/react/playwright.config.ts`

The React demo consumes the calendar package's built output, while the Playwright preview serves a built demo bundle. Rebuilding the calendar package and then the demo bundle ensures tests exercise source changes instead of stale artifacts.

### Use the existing three-engine end-to-end coverage gate
Status: discussed
Touches: `demos/react/package.json`, `demos/react/e2e/check-coverage.mjs`, `demos/react/playwright.config.ts`

The repository already has a three-engine Playwright suite and an RFC-0015 coverage gate scoped to demo source. The gate passed after the new scenario was added, so no additional coverage tooling was needed.

Risk: Running the full gate requires installed Chromium, Firefox, and WebKit browser binaries.

### Record the completed fix and end-to-end evidence in RFC-0029
Status: directed
Touches: `.spec/rfc/completed/0029-week-view-hour-cell-key-collision.md`

The implementation record captures the key change, DayView inspection, browser verification, and repeatable regression test so the archived RFC reflects the completed behavior and its evidence.

### Replace native HTML5 drag-and-drop with a shared pointer-event engine
Status: discussed
Touches: `.spec/rfc/0030-drag-interaction-rework.md`, `.spec/rfc/0031-pointer-drag-engine.md`

The interaction review found native drag recognition unreliable for calendar event movement and unable to provide live movement feedback. A shared pointer-event state machine is proposed as the foundation for consistent movement and resize interactions.

### Integrate pointer-based movement into WeekView and DayView separately
Status: discussed
Touches: `.spec/rfc/0032-week-view-pointer-drag.md`, `.spec/rfc/0033-day-view-pointer-drag.md`

The views share the proposed pointer engine but have different movement rules: WeekView must support changing date and time across columns, while DayView changes time within one column. Separate RFCs preserve those distinct acceptance criteria.

### Add live resize feedback through the shared pointer engine
Status: discussed
Touches: `.spec/rfc/0034-resize-live-preview.md`

The current resize interaction updates after release rather than tracking the pointer during the gesture. The RFC proposes using the shared pointer-event engine to preview event duration continuously.

### Use the repository test directory for pointer-drag tests
Status: discussed
Touches: `packages/calendar/src/utils/__tests__/pointer-drag.test.ts`

The engine tests follow the calendar package’s existing `__tests__/<name>.test.ts` convention. This keeps new tests discoverable and consistent with neighboring utilities.

### Keep WeekView updates on the existing event request path
Status: discussed
Touches: `packages/calendar/src/views/WeekView.wsx`, `packages/calendar/src/Calendar.wsx`

WeekView continues to dispatch `event-update-request`, allowing Calendar to apply its existing update handling. The drag implementation changes how the gesture and drop target are collected while preserving the established event contract.

### Use pointer events and cursor hit-testing for WeekView drag
Status: discussed
Touches: `packages/calendar/src/utils/pointer-drag.ts`, `packages/calendar/src/views/WeekView.wsx`, `packages/calendar/src/views/WeekView.css`, `packages/calendar/src/views/__tests__/WeekView.test.ts`

Native HTML5 drag recognition failed to start during real mouse input, while pointer events provide movement coordinates for live preview and drop handling. WeekView uses those coordinates to identify the target time cell and retains click-to-open behavior with a movement threshold.

### Pierce nested shadow roots during drop hit-testing
Status: discussed
Touches: `packages/calendar/src/utils/pointer-drag.ts`, `packages/calendar/src/utils/__tests__/pointer-drag.test.ts`, `packages/calendar/src/views/WeekView.wsx`

Top-level `document.elementsFromPoint` stops at the calendar’s shadow host and cannot find nested hour cells. The shared pointer utility descends through shadow roots so drop resolution can reach the actual target cell.

### Continue drag when pointer capture setup or release throws
Status: discussed
Touches: `packages/calendar/src/utils/pointer-drag.ts`, `packages/calendar/src/utils/__tests__/pointer-drag.test.ts`

Synthetic pointer input can make `setPointerCapture` throw, which otherwise aborts drag setup before listeners are installed. Capture setup and cleanup failures are caught so movement and completion handling can continue.

### Exclude the drag preview from drop hit-testing
Status: discussed
Touches: `packages/calendar/src/views/WeekView.css`

The preview can remain transformed in the DOM until the state update renders. Setting `pointer-events: none` on the dragging event lets hit-testing reach the underlying time cell during that interval.

### Update the WeekView drag test for removal of native draggable attribute
Status: discussed
Touches: `packages/calendar/src/views/__tests__/WeekView.test.ts`

The native `draggable` attribute was removed with the HTML5 drag mechanism, so the existing keyboard sanity assertion now checks the retained styling class instead.

### Document why pragmatic-drag-and-drop was not selected
Status: discussed
Touches: `.spec/rfc/0030-drag-interaction-rework.md`

The RFC records the alternative assessment: the library builds on native HTML5 drag-and-drop, while the selected implementation uses pointer events to address observed gesture failures. Its behavior with nested Shadow DOM was also unverified, while the existing pointer implementation had browser and end-to-end evidence.

### Keep RFC-0035 focused on drag and resize validation behavior
Status: discussed
Touches: `.spec/rfc/0035-drag-rejection-feedback.md`, `packages/calendar/src/Calendar.wsx`, `packages/event-runtime/src/EventRuntime.ts`, `packages/event-model/src/runtime-types.ts`

Runtime documentation describes validation as application-layer validation for manually entered event data, while Calendar routes drag and resize updates through the general update proposal path. The RFC was revised to address that design boundary and preserve the separate editable permission gate; it remains Draft in this transcript.

### Keep readonly mode interception at the Calendar update boundary
Status: discussed
Touches: `.spec/rfc/0026-calendar-readonly-edit-mode.md`, `packages/calendar/src/Calendar.wsx`

Child views already funnel update requests through Calendar, so readonly mode can be handled at that single boundary without adding mode state or duplicate checks to WeekView and DayView. The RFC was updated to align its design with the current pointer-event architecture and notes that rejected updates need visible feedback.

### Archive RFC-0012 as implemented
Status: directed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `.spec/rfc/completed/*`, `README.md`

The RFC was advanced to Implemented and archived after its acceptance evidence and full checks were completed. The README RFC index was updated to point to the archived file and show its implemented status.

### Route edit validation policy through Calendar’s update funnel
Status: discussed
Touches: `.spec/rfc/0035-drag-rejection-feedback.md`, `packages/calendar/src/Calendar.wsx`, `packages/calendar/src/Calendar.wsx.d.ts`

The revised RFC places the validation policy at `handleChildEventUpdateRequest`, the shared entry point for drag, resize, and keyboard edits. It proposes an optional `skipValidation` argument while retaining the editable permission gate, avoiding per-view changes and preserving existing callers by default.

### Keep invalid edited events visible in the React demo
Status: discussed
Touches: `.spec/rfc/0035-drag-rejection-feedback.md`, `demos/react/src/App.tsx`

The demo revalidates events after updates and filters invalid events from its rendered list, which would make a successfully moved event disappear. The RFC now includes a demo change to retain such events while excluding structural or schema failures.

### Notify the originating view directly when an edit is denied
Status: discussed
Touches: `.spec/rfc/0035-drag-rejection-feedback.md`, `packages/calendar/src/Calendar.wsx`, `.spec/rfc/0026-calendar-readonly-edit-mode.md`

A denial event dispatched by the Calendar host does not propagate inward to a view in its shadow root. The RFC now specifies a direct `notifyUpdateDenied(eventId)` notification and updates RFC-0026 to reuse that mechanism.

### Treat validation bypass for direct edits as an explicit product decision
Status: discussed
Touches: `.spec/rfc/0035-drag-rejection-feedback.md`

The revision no longer relies on conflicting runtime comments as proof of validation intent. It states the decision directly and acknowledges that moving events may violate rules such as `no conflict`; the application layer remains responsible for those outcomes. Keyboard moves and duration changes are included because they share the same update funnel.

### Specify MonthView date dragging with the shared pointer engine
Status: discussed
Touches: `.spec/rfc/0036-month-view-drag-move.md`, `packages/calendar/src/views/MonthView.wsx`, `packages/calendar/src/utils/pointer-drag.ts`

MonthView has no drag implementation, so the RFC proposes reusing the existing pointer-drag engine to move event dates between day cells while preserving time and duration. It excludes resize because the month grid has no time axis and specifies timestamp-based cell dates to avoid timezone shifts.

### Define MonthView drag edge cases in RFC-0036
Status: discussed
Touches: `.spec/rfc/0036-month-view-drag-move.md`, `packages/calendar/src/views/MonthView.wsx`, `packages/calendar/src/utils/event-utils.ts`, `packages/calendar/src/views/WeekView.wsx`

The revised design excludes delete-button presses from drag handling, stops click propagation before suppressing the post-drag click, expands a collapsed target cell, raises the preview above neighboring cells, and skips same-day no-op drops. It also corrects the documented multi-day behavior: events are grouped by start date and rendered once.

### 本地化首页穿孔卡片中的可读文案
Status: discussed
Touches: `apps/site/src/components/pages/HomePage.wsx`, `apps/site/public/locales/zh/home.json`, `apps/site/public/locales/en/home.json`

首页卡片的字段标签、状态戳、示例标题和无障碍标签改用 i18n key，确保中英文界面显示对应文案，并遵循站点 locale 文件的现有模式。`meeting`、`10:00`、`—` 和 `中文 / EN` 保持原样，因为它们是技术标识、时间、符号和语言标记。

### 完成并归档 RFC-0039
Status: discussed
Touches: `.spec/rfc/completed/0039-event-edit-trigger.md`, `.spec/rfc/0038-event-edit-popup-umbrella.md`, `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`, `packages/calendar/src/__tests__/event-edit-request.test.ts`, `demos/react/e2e/demo.spec.ts`, `packages/react/src/__tests__/Calendar.test.tsx`

验收证据覆盖三视图双击与键盘触发、单击语义、React 回调转发及拖拽交互；相关单测 17 项通过，React 包装层测试 3/3 通过，demo 的 Chromium E2E 为 10/10。RFC-0039 已推进为 Implemented 并归档；同步检查结果为 0 errors、0 warnings。

### 用事件类型 JSON Schema 驱动多字段表单
Status: discussed
Touches: `.spec/rfc/0040-event-edit-form.md`, `packages/event-model/src/EventTypeDataModel.ts`, `packages/calendar/src/Calendar.wsx`, `demos/react/src/App.tsx`

表单以固定事件字段和 `Event.data` 的 JSON Schema 为数据来源，可按字段类型、必填约束和枚举生成基本输入控件。方案限定在示例应用，不新增通用表单包；提交复用现有事件更新路径，使表单编辑继续经过权限与完整校验。

### 将 WSX 开发指南放入共享 agent skill 路径
Status: directed
Touches: `.agents/skills/wsx-work/*`, `.agents/rules/*`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/llm-guide.md`, `llms.txt`, `site/public/llms.txt`, `scripts/validate-llm-docs.mjs`

旧 `.agents/rules` 文件采用规则格式，不能直接充当按需加载的 skill。WSX 指南保留为 `.agents/skills/wsx-work`；通用不变量和任务路由并入 `AGENTS.md`，并同步活跃文档与文档校验器，避免路径重命名后留下断链。

Considered/rejected: 将始终生效的 onboarding 内容改成按需 skill 会改变加载语义；保留已删除的旧规则路径会造成失效引用。

### 以 AGENTS.md 作为唯一项目规则源
Status: directed
Touches: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/llm-guide.md`

项目规则集中在 `AGENTS.md`，避免维护重复且容易分叉的 `CLAUDE.md`。活跃文档中的规则源引用同步更新后删除 `CLAUDE.md`。

Risk: 依赖 `CLAUDE.md` 项目级指令的工具不再从该文件读取规则。

### 要求用户可见 RFC 经实际 E2E 与 demo 验证后才能报告完成
Status: discussed
Touches: `demos/react/e2e/demo.spec.ts`, `demos/react/e2e/month-drag.spec.ts`

The RFC remains Approved because only Chromium was reported as verified; Firefox and WebKit results were not established. The session summary also did not include Chromium's final run output, so end-to-end completion evidence remains incomplete.

### 为 RFC-0039 补齐 React 事件转发测试
Status: discussed
Touches: `packages/calendar/src/__tests__/event-edit-request.test.ts`

Add unit coverage for edit-request dispatch and month-cell double-click isolation. The session reported all 20 unit-test tasks passing.

### 让编辑保存通过日历更新提议通道通知 host
Status: discussed
Touches: `.spec/rfc/0044-edit-save-propose-update.md`, `.spec/rfc/0038-event-edit-popup-umbrella.md`, `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`, `demos/react/src/App.tsx`, `packages/calendar/src/Calendar.wsx`

日历已有 `proposeEventUpdate` 通道，可执行权限与数据校验并通过 `event-update` 通知 host；demo 的保存处理直接改本地状态，绕过该通道。将此接入修复与多字段表单拆成独立 RFC-0044，后者继续由 RFC-0040 负责。RFC-0044 已验证无错误或警告，保持 Draft，尚未实现。

### Move the site under apps/site
Status: directed
Touches: `apps/site/*`, `pnpm-workspace.yaml`, `README.md`, `AGENTS.md`, `docs/llm-guide.md`, `llms.txt`, `scripts/validate-llm-docs.mjs`

The site now lives under the app workspace, so workspace discovery and in-repository documentation paths were updated to match. References to the sibling repository path ../site/ were retained because they point outside this monorepo.

### Resolve workspace package aliases from the new site path
Status: directed
Touches: `apps/site/vite.config.ts`

The development aliases still resolved package source paths relative to the former site directory depth, causing imports such as @calenderjs/calendar to fail. Moving the aliases up two directory levels restores resolution from apps/site.

### Specify site demo event-edit synchronization before implementation
Status: discussed
Touches: `.spec/rfc/0045-site-demo-sync-event-editing.md`, `apps/site/src/components/pages/DemosPage.wsx`

RFC-0045 records the gap between the site demo and the event-edit behavior covered by RFC-0039 and the proposed host-update flow in RFC-0044. It remains Draft, so the demo behavior is not authorized for implementation yet.

### Use punch-card ledger as the site's visual direction
Status: discussed
Touches: `apps/site/PRODUCT.md`, `apps/site/.impeccable/decision-payload.json`, `apps/site/.impeccable/surfaces/site.md`

The visual direction uses punch-card and tabulator references to connect structured event records and validation rules with the product's calendar domain. Swiss transit-timetable styling and a data-field direction were considered, but the punch-card direction was selected.

### Build the redesign directly in code without generated comps
Status: discussed — image generation unavailable in the environment
Touches: `apps/site/.impeccable/surfaces/site.md`, `apps/site/src/*`

The redesign proceeded as code-led work because no image-generation tool was available. The surface brief carries the visual direction and first-viewport requirements for the implementation.

### Use a light punch-card palette with dark-theme override
Status: discussed
Touches: `apps/site/src/main.css`, `apps/site/src/main.ts`, `apps/site/src/components/layout/AppHeader.wsx`

The cream-and-ink palette makes the card-stock direction the default, with a dark-theme override. Theme initialization now defaults to light while preserving stored light or dark preferences and the existing toggle behavior.

### Self-host the site's display and data fonts
Status: agent-initiated — not surfaced in the design choice
Touches: `apps/site/public/fonts/*`, `apps/site/src/main.css`

Space Grotesk and IBM Plex Mono font files were added locally and declared with @font-face, replacing the hosted Google Fonts import. One invalid Space Grotesk download was discarded and the valid variable font retained.

### Use Punch Card Ledger styling across the site shell and pages
Status: discussed
Touches: `apps/site/src/components/layout/AppHeader.css`, `apps/site/src/components/pages/HomePage.wsx`, `apps/site/src/components/pages/HomePage.css`, `apps/site/src/components/pages/FeaturesPage.wsx`, `apps/site/src/components/pages/FeaturesPage.css`, `apps/site/src/components/pages/DemosPage.css`, `apps/site/src/components/layout/AppFooter.css`

The agent applied cream card stock, ink borders, a brick-red accent, and mono labels to establish a consistent ledger visual system. The home hero presents an illustrative event record, while the features page uses ledger rows and authored SVG glyphs instead of emoji and equal-sized cards.

### Style wsx-link anchors through their exposed shadow part
Status: discussed
Touches: `apps/site/src/components/layout/AppHeader.css`, `apps/site/src/components/pages/HomePage.css`

The agent found that light-DOM selectors did not reach wsx-link's internal anchor, leaving browser-default blue and underlined links. The component exposes part="link", so the agent added ::part(link) styling to apply the site's link and button appearance.

### Keep documentation internals and calendar chrome outside the site redesign
Status: discussed
Touches: `apps/site/src/components/pages/DemosPage.css`, `apps/site/src/components/layout/AppFooter.css`

The agent kept the documentation shell token-driven and styled only the frame around the embedded calendar. This preserves the site-only scope without re-theming wsx-press internals or the calendar package's own controls and event colors.

### Update the site path in the repository guidance
Status: discussed
Touches: `AGENTS.md`

The agent corrected the website path from site/ to apps/site/ in the repository guidance to match the current layout.

### 将日历组件颜色映射到站点主题
Status: discussed
Touches: `apps/site/src/main.css`

站点主题通过 CSS 自定义属性为日历组件的 `--calender-*` 变量提供浅色和深色值，使组件在两种主题下都跟随站点配色。日历样式位于 shadow DOM 中，但自定义属性可穿透该边界，因此无需修改组件包源码。

Reviewer attention: 确认浅色和深色主题下日历背景、文字、边框及强调色均映射到站点 token。

### Use IBM Plex Mono for display and data text
Status: discussed
Touches: `apps/site/src/main.css`, `apps/site/public/fonts/SpaceGrotesk-Variable.ttf`

The agent chose IBM Plex Mono for both display and data text to reinforce the site's punch-card and typewriter visual direction. This also removes the overused Space Grotesk font and avoids adding another font family.

Considered/rejected: Keeping Space Grotesk for headings was rejected because it weakened the mechanical visual direction and added a separate font family.

### Set site hero headings to bold
Status: discussed
Touches: `apps/site/src/components/pages/HomePage.css`, `apps/site/src/components/pages/FeaturesPage.css`, `apps/site/src/components/pages/DemosPage.css`

The agent set hero headings to font weight 700 because the large IBM Plex Mono headings needed more visual weight. The header brand title already used a suitable monospace font and weight, so it was left unchanged.

### Define plugin detail-card integration with the event edit flow before implementation
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `packages/calendar/src/*`

The RFC does not define whether plugin-rendered detail cards are read-only or participate in the current event edit and validation flow. That relationship must be specified before implementation proceeds.

### Align plugin detail-card rendering with the WSX component model
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `packages/calendar/src/*`

The RFC proposes returning HTML strings or HTMLElement values, while the calendar uses WSX components. Aligning the rendering contract with that component model avoids introducing a separate rendering path.

### Keep RFC-0012 in Draft until its design gaps are resolved
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`

The revised RFCs remain Draft, and implementation has not started. Approval remains a prerequisite under the repository's RFC workflow.

### Keep event-detail plugins outside framework wrappers
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `AGENTS.md`

The plugin mechanism belongs in a framework-neutral layer so native WSX, React, and Vue consumers can share the same capability. Framework wrappers remain thin bindings and must not become the exclusive home for new behavior.

### Keep detail-card rendering in the host layer
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`, `packages/calendar/src/Calendar.wsx`

Calendar dispatches interaction events while the host owns popup and detail UI. Keeping rendering in the host avoids making Calendar responsible for presentation and aligns the plugin design with the existing event flow.

### Represent plugin output as structured data
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`

The plugin registry returns structured field descriptions and leaves rendering to the host. This keeps the plugin mechanism independent of HTML, DOM, and framework-specific rendering.

### Validate framework-neutral behavior in native WSX, React, and Vue demos
Status: discussed
Touches: `demos/wsx/*`, `demos/react/*`, `demos/vue/*`, `.spec/rfc/0012-calendar-plugin-mechanism.md`

The same built-in plugin mechanism was manually verified in a real browser across all three demos. Meeting events rendered appointment-specific fields, while an event without a matching plugin rendered the generic default fields.

### Specify a thin Vue wrapper and demo in RFC-0046
Status: discussed
Touches: `.spec/rfc/0046-vue-wrapper-package.md`, `packages/react/package.json`, `packages/react/src/Calendar.tsx`

The Vue wrapper is specified as a thin counterpart to the existing React binding, with Vue-native props, emitted events, and exposed methods. A Vue demo provides a concrete consumer for validating framework-neutral APIs.

### Reuse RFC-0045 for native site demo event editing
Status: discussed
Touches: `.spec/rfc/0045-site-demo-sync-event-editing.md`, `.spec/TASK_TRACKING.md`

RFC-0045 already covers connecting the site demo to the event editing flow, so creating RFC-0047 would duplicate existing scope. The existing RFC was updated to include end-to-end validation across the three demos.

### Keep the site demo editing flow smaller than the React demo
Status: discussed
Touches: `.spec/rfc/0045-site-demo-sync-event-editing.md`, `apps/site/src/components/pages/DemosPage.wsx`, `demos/react/src/App.tsx`

The site demo is a showcase page, while the React demo is a full application with additional editors and runtime features. The site RFC therefore focuses on event editing through the existing request and update flow without importing unrelated React demo features.

### Normalize RFC-0012 to the current specification format
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`

The existing RFC used a status heading that failed the specification validator. The revision updates the format while replacing the conflicting design, keeping the RFC usable by the repository's validation workflow.

### Keep apps/site outside framework-neutral validation
Status: discussed
Touches: `.spec/rfc/0045-*.md`, `.spec/rfc/0012-calendar-plugin-mechanism.md`, `.spec/rfc/0046-*.md`

The site remains a GitHub Pages showcase, while technical validation belongs to peer demos under demos/. This keeps site presentation responsibilities separate from framework validation.

### Create demos/wsx as a native Web Component demo
Status: directed
Touches: `demos/wsx/*`, `.spec/rfc/completed/0047-wsx-demo-app.md`, `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`

The demo uses the calendar Web Component directly, without React, Vue, DSL, or Monaco dependencies. Its edit flow covers event display, edit requests, successful saves, denied updates, and validation errors, matching the RFC’s acceptance scope.

### Separate event selection from edit requests
Status: discussed
Touches: `packages/calendar/src/views/MonthView.wsx`, `packages/calendar/src/views/WeekView.wsx`, `packages/calendar/src/views/DayView.wsx`

Each view keeps `event-click` for selection and dispatches `event-edit-request` with the event as detail for edit intent. This preserves a distinct selection state before editing.

### Forward child edit requests through Calendar
Status: discussed
Touches: `packages/calendar/src/Calendar.wsx`

Calendar re-dispatches `event-edit-request` from its child view so consumers can observe the event through the public component boundary.

### Expose edit requests through the React wrapper
Status: discussed
Touches: `packages/react/src/Calendar.tsx`

The React wrapper exposes an `onEventEditRequest` prop, carrying the new calendar event through React's component API.

### Add keyboard edit requests to MonthView
Status: discussed
Touches: `packages/calendar/src/views/MonthView.wsx`

MonthView event elements become focusable and request editing on Enter or Space. The handler checks that focus is on the event itself so keyboard activation of its delete button does not also request editing.

### Stop MonthView event double-click from reaching the date cell
Status: discussed
Touches: `packages/calendar/src/views/MonthView.wsx`

The event double-click handler stops propagation because the containing month cell also handles double-clicks for `date-double-click`. It skips the delete button to avoid interpreting that control's interaction as an edit request.

### Update demo edit flows to use double-click
Status: discussed
Touches: `demos/react/src/App.tsx`, `demos/react/e2e/demo.spec.ts`

The React demo and end-to-end cases use the new edit-request event and double-click interaction. This keeps the demo aligned with the separation between selection and editing.

### Update RFC-0039 for event edit request behavior
Status: discussed
Touches: `.spec/rfc/0039-event-edit-trigger.md`, `.spec/ROADMAP.md`

The RFC records Calendar-level event forwarding, MonthView double-click propagation handling, and demo changes needed by the implementation. Its status was advanced to Approved, but the work was not reported as implemented or committed.

### 为 apps/site 添加 Vitest 与 happy-dom 测试基建
Status: directed
Touches: `apps/site/package.json`, `apps/site/vitest.config.ts`, `pnpm-lock.yaml`

apps/site 原先没有测试基建，无法满足 RFC-0045 的单测验收要求。使用 Vitest 与 happy-dom，并通过现有 WSX 插件支持组件测试。

### 在 DemosPage 测试中等待 WSX 的动画帧重渲染
Status: discussed
Touches: `apps/site/src/components/pages/__tests__/DemosPage.test.ts`

WSX 的状态更新通过 requestAnimationFrame 调度重渲染，因此状态变更后的 DOM 断言必须等待动画帧。测试在挂载和事件分发后等待一帧，避免读取过期 DOM。

### 通过 PR 工作流交付 RFC-0045 实现
Status: discussed
Touches: `.github/workflows/pull-request.yml`

必需的 E2E 检查由 pull_request 事件触发，直接推送无法产生该检查结果。实现通过分支和 PR 验证；PR 合并后回到 main 并同步最新提交。

### Use ports 5204 and 4178 for the WSX demo
Status: discussed
Touches: `demos/wsx/vite.config.ts`, `demos/wsx/playwright.config.ts`, `../../spark/port.md`

The demo reserves distinct development and Playwright ports after checking the shared port registry, preventing collisions with existing project servers.

### Use the local event list as the demo source of truth
Status: discussed
Touches: `demos/wsx/src/main.ts`

The calendar validates and emits edit proposals but does not commit accepted updates to its event list. The host therefore merges accepted updates into its local list and reapplies that list to the calendar.

### Hide the edit backdrop when its hidden attribute is set
Status: discussed
Touches: `demos/wsx/src/style.css`

The backdrop’s flex display rule overrode the browser’s default hidden styling, leaving the edit dialog visible on initial load. An explicit hidden-state rule restores the intended initial state.

### Add Playwright coverage for native WSX demo edit outcomes
Status: discussed
Touches: `demos/wsx/*`

端到端套件覆盖原生 WSX demo 的编辑结果，并在构建 demo 与相关包后运行。构建成功；测试运行结果尚未记录。

Risk: 当前记录无法确认端到端测试是否通过。

### 为保存成功断言限定日历事件范围 (updated)
Status: discussed
Touches: `demos/wsx/e2e/demo.spec.ts`

保存用例通过文本定位器匹配到操作日志和日历事件，触发 Playwright strict-mode 冲突。将断言限定到日历事件，避免把测试定位器错误误判为产品故障。

### 将 Firefox 双击失败作为待确认的测试波动调查
Status: discussed
Touches: `demos/wsx/e2e/demo.spec.ts`

Firefox 双击与保存测试失败具有一致性，单测通过不足以证明只是随机波动。代理缩短断言超时时间以定位卡住的步骤，并继续检查浏览器追踪与 DOM 状态。

Risk: 诊断性超时调整若保留，可能改变测试行为；最终根因和修复尚未确定。
Reviewer attention: 确认后续调查区分了应用行为问题与 Playwright 定位器或等待问题，并移除仅用于诊断的超时调整。

### Register WSX demo development and end-to-end ports
Status: directed
Touches: `/Volumes/ORICO/ws/prj/spark/port.md`, `demos/wsx/vite.config.ts`, `demos/wsx/playwright.config.ts`

The shared port registry assigns 5204 to the Vite development server and 4178 to Playwright end-to-end tests. Recording both assignments in the registry and app configuration avoids collisions with other projects.

### Merge host event state after accepted calendar updates
Status: discussed
Touches: `demos/wsx/src/main.ts`, `packages/calendar/src/Calendar.wsx`

The calendar dispatches an accepted update but does not mutate its internal event list. The demo host therefore merges the updated event into its own list and resets the calendar’s events attribute so the displayed event reflects the save.

### Override hidden-state styling for the edit backdrop
Status: discussed
Touches: `demos/wsx/src/style.css`

The backdrop’s display rule overrides the browser’s default hidden styling. An explicit hidden-state rule keeps the edit dialog closed on initial page load and allows the hidden attribute to control visibility.

### Use flat Playwright locators for the updated event assertion
Status: discussed
Touches: `demos/wsx/e2e/demo.spec.ts`

The chained text locator hung in Firefox even when the expected DOM was present. Using a flat locator with a hasText filter preserved the assertion and passed the full three-browser suite, which completed with 15 of 15 tests passing.

### Draft RFC-0048 for the Calendarify production proof app
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

The agent recorded the proposed app architecture and acceptance criteria in a Draft RFC before implementation. This keeps the integration scope reviewable before code changes.

Considered/rejected: Bidirectional sync, webhooks, multi-tenant support, iCloud/CalDAV, and changes to the core calendar package were excluded from scope.

### Use Next.js App Router with Auth.js for Google and Microsoft sign-in
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

The RFC proposes a Vercel-hosted Next.js App Router app with Auth.js providers for Google and Microsoft Entra ID. This supplies account authentication for accessing the two calendar APIs.

Risk: Provider configuration and OAuth behavior require validation during implementation.

### Store OAuth tokens in Postgres and map provider events to the shared Event model
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

The RFC proposes a Postgres or Supabase token store and provider adapters using Google APIs and Microsoft Graph. Adapters map provider data to `@calenderjs/event-model` events so the existing React calendar can render them.

Risk: Provider-specific event fields and token handling may not map cleanly to the shared event model.

### Route calendar edits back to the source provider API
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

The RFC proposes connecting `proposeEventUpdate` to provider PATCH requests, keeping edits within the existing calendar update flow while persisting them to Google or Microsoft.

Risk: Provider update semantics and rejected edits need verification.

### Require mocked CI coverage, real-account verification, and a Vercel deployment
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

The RFC sets mocked end-to-end coverage in CI, a manual verification pass with a real account, and an actual Vercel deployment as acceptance evidence. These checks exercise both isolated integration behavior and deployed app behavior.

### Reserve ports 5205 and 4179 for the Vue demo
Status: discussed
Touches: `../../spark/port.md`, `demos/vue/vite.config.ts`, `demos/vue/playwright.config.ts`

The demo uses port 5205 for Vite development and 4179 for Playwright end-to-end runs. Both assignments were added to the shared port registry.

### File deferred Calendarify capabilities as Pending RFCs
Status: discussed
Touches: `.spec/rfc/pending/0049-calendarify-bidirectional-sync.md`, `.spec/rfc/pending/0050-calendarify-multi-tenant.md`, `.spec/rfc/pending/0051-calendarify-caldav-icloud.md`

Separate RFCs preserve deferred scope for bidirectional sync, multi-tenant access, and iCloud/CalDAV support without expanding RFC-0048 implementation. Each record contains enough summary to satisfy validation while remaining pending.

### Link deferred RFCs from Calendarify production proof scope
Status: discussed
Touches: `.spec/rfc/0048-calendarify-prod-proof.md`

RFC-0048 Non-goals link to the pending RFCs so excluded capabilities retain traceable follow-up scope. This keeps the production proof RFC focused on its initial behavior.

### Finish RFC-0046 before RFC-0012
Status: directed
Touches: `.spec/rfc/0046-vue-wrapper-package.md`, `packages/vue/*`, `demos/vue/*`, `.spec/rfc/0012*`

The work order puts the Vue wrapper and demo first because RFC-0012 acceptance depends on `demos/vue` existing. RFC-0048 remains outside this implementation scope.

### Mirror the React wrapper contract in the Vue package
Status: discussed
Touches: `packages/vue/*`

The Vue wrapper follows the React wrapper contract so both framework integrations expose consistent calendar behavior.

### Keep the Vue demo within the minimal acceptance scope
Status: discussed
Touches: `demos/vue/*`

The Vue demo covers the wrapper’s required behavior with five end-to-end scenarios aligned to the React and WSX demos.

### Sync initial Vue props after mount
Status: agent-initiated
Touches: `packages/vue/src/Calendar.vue`, `packages/vue/src/__tests__/Calendar.test.ts`

An immediate watcher runs before the template ref is available, so initial props were not copied to the custom element. The wrapper now applies initial properties on mount and reserves watchers for subsequent reactive updates.

### Treat wsx-calendar as a Vue custom element
Status: agent-initiated
Touches: `packages/vue/vite.config.ts`, `packages/vue/vitest.config.ts`

Vue's compiler needs an explicit custom-element rule for `wsx-calendar`; otherwise it reports the element as an unresolved component. The rule is configured for both build and unit-test compilation.

### Use Vue-specific markers to verify external runtime packaging
Status: agent-initiated
Touches: `packages/vue/scripts/verify-vue-externals.mjs`

The React-oriented forbidden markers incorrectly flagged normal Vue SFC output. The check now looks for Vue runtime implementation signatures while confirming the bundle imports Vue as an external dependency.

### Use Vite 7.3.8 across packages already on Vite 7.3.0
Status: discussed
Touches: `package.json`, `pnpm-lock.yaml`, `**/package.json`

Packages using Vite 7.3.0 were updated to the 7.3.8 range. The transcript reports successful monorepo validation after the dependency update.

### 保留 Vue flat recommended 配置的完整处理器 wiring
Status: discussed
Touches: `demos/vue/eslint.config.js`

Vue SFC 配置需保留 flat recommended 配置对象中的 processor wiring，避免 `vue/comment-directive` 在 `</script>` 和 `</template>` 边界产生误报。调整后 lint 从错误状态变为零错误；后续格式清理后，lint 与 typecheck 均无问题。

Considered/rejected: 手动合并 recommended 配置的 rules 会丢失 processor；未改动 packages/vue/eslint.config.js，因为该文件编辑被保护钩子阻止，且当前没有触发问题的 Vue 文件。

### 清理 Vue demo 模板格式告警
Status: discussed
Touches: `demos/vue/src/App.vue`

调整模板空白和标签格式，清除剩余样式告警，同时保留 demo 行为。最终 lint 与 typecheck 均无问题。

### 在运行 Vue demo E2E 前构建测试产物
Status: discussed
Touches: `demos/vue/*`

The Vue demo end-to-end suite depends on built package artifacts; building them first keeps test execution aligned with the package consumers use.

### Investigate Firefox failures as possible environment instability
Status: discussed
Touches: `demos/vue/e2e/demo.spec.ts`, `demos/wsx/e2e/*`

Firefox failures persisted with different symptoms after reinstall, while Chromium and WebKit passed all 10 end-to-end checks. The agent treated the failures as environment instability and avoided claiming Firefox coverage passed.

### Reinstall the Playwright Firefox binary to investigate runtime failures
Status: discussed
Touches: `demos/vue/e2e/demo.spec.ts`

The Firefox binary was reinstalled to check whether runtime failures came from a damaged browser installation. Failures persisted with a different symptom, so the reinstall did not resolve them.

### 完成并归档 RFC-0046
Status: discussed
Touches: `.spec/rfc/0046*`

RFC-0046 was advanced to Implemented and archived after package and demo checks completed. The transcript reports Vue package typecheck, lint, 9 unit tests, and build passing; demo typecheck and lint passing; Chromium and WebKit E2E each passing 5 tests. Firefox E2E remained unstable at the machine level and was documented rather than treated as a code defect.

### Keep mixed RFC changes together when shared records cannot be safely split
Status: discussed
Touches: `.spec/rfc/0046*`, `.spec/rfc/0048*`, `.spec/rfc/0049*`, `.spec/rfc/0050*`, `.spec/rfc/0051*`

The commit grouped the completed Vue RFC work with related RFC-0048 scope and deferred capability records because these shared specification changes were delivered together.

### Exclude generated ReasonGraph notes from the commit
Status: discussed
Touches: `.reasongraph/why/main.md`

Generated ReasonGraph index changes were left unstaged to avoid committing regenerated noise.

### Preserve the Vue recommended-config processor in the Vue package
Status: discussed
Touches: `packages/vue/eslint.config.js`

The Vue ESLint configuration was corrected so its recommended processor wiring works and the lint run completes cleanly.

### Keep the Vue component name aligned with the React wrapper
Status: discussed
Touches: `packages/vue/src/Calendar.vue`

The Vue wrapper keeps the canonical `Calendar` name shared with the React wrapper. A file-scoped exception handles the single-word component-name rule, while the custom element uses self-closing syntax to satisfy lint.

### Ship built-in event detail plugins from the calendar package
Status: discussed
Touches: `packages/calendar/src/plugins/types.ts`, `packages/calendar/src/plugins/EventDetailPluginRegistry.ts`, `packages/calendar/src/plugins/built-in.ts`, `packages/calendar/src/index.ts`

The calendar package exports a registry and built-in default and appointment plugins so hosts can resolve event details from structured data. The event model allows a free-form type and extension data, so plugins match by type and provide a fallback when no specialized plugin matches.

Considered/rejected: Embedding detail rendering in individual demos would duplicate plugin behavior across frameworks.

### Keep plugin objects independent of Calendar lifecycle
Status: discussed
Touches: `.spec/rfc/0012-calendar-plugin-mechanism.md`

The RFC removes `initialize(calendar)` and `destroy()` hooks because plugins do not hold or depend on a `Calendar` instance. Plugin objects therefore remain stateless and have no lifecycle coupling.

### Update RFC-0012 examples to import built-in plugins
Status: discussed
Touches: `.spec/rfc/completed/0012-calendar-plugin-mechanism.md`

The archived RFC records built-in plugin imports and acceptance evidence for unit, cross-framework demo, and browser validation. New plugin code reached 96.29% branch coverage; calendar tests passed 153 tests across 17 files, WSX and Vue E2E each passed 12 tests across Chromium and WebKit, and React E2E passed 55 Chromium tests.
