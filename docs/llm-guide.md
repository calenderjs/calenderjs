# CalenderJS — AI Agent Guide

> **Purpose**: Machine-oriented repo map. Read this before making changes.
> **Human overview**: [README.md](../README.md)
> **Current sprint**: [TASK_TRACKING.md](../TASK_TRACKING.md)

---

## 1. Task routing

| If you need to…                  | Read first                                         | Edit                                            |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Fix/implement calendar views     | `.cursor/skills/wsx-work/SKILL.md`                 | `packages/calendar/src/views/*.wsx`             |
| Change Calendar API / props      | `docs/rfc/0008-calendar-component-api-redesign.md` | `packages/calendar/src/Calendar.wsx`            |
| Modify Event data shape          | `docs/rfc/0011-event-data-model-integration.md`    | `packages/event-model/src/Event.ts`             |
| Change DSL syntax / parser       | `docs/rfc/0002-event-dsl.md`                       | `packages/event-dsl/src/event-dsl.pegjs`        |
| Change DSL compiler output       | `docs/rfc/0002-event-dsl.md`                       | `packages/event-dsl/src/compiler.ts`            |
| Runtime validate/render/behavior | `packages/event-dsl/README.md`                     | `packages/event-runtime/src/`                   |
| React calendar wrapper / demo    | `packages/react/README.md`                         | `packages/react/src/`, `demos/react/`           |
| React Event DSL editor           | `packages/react-event-editor/README.md`            | `packages/react-event-editor/src/`              |
| Monaco Event DSL language plugin | `packages/monaco-event-dsl/README.md`              | `packages/monaco-event-dsl/src/`                |
| Date/time utilities              | —                                                  | `packages/date-time/src/`                       |
| Add RFC-level feature            | `ROADMAP.md`                                       | `docs/rfc/` (create/update RFC **before** code) |

---

## 2. Implementation status

Use these markers when reasoning about the codebase. **Do not assume PLANNED features exist.**

| Feature                                          | Status               | Notes                          |
| ------------------------------------------------ | -------------------- | ------------------------------ |
| Month/Week/Day views                             | **IMPLEMENTED**      | `packages/calendar/src/views/` |
| Today highlight                                  | **IMPLEMENTED**      | RFC-0013                       |
| Calendar API (observedAttributes, getter/setter) | **IMPLEMENTED**      | RFC-0008                       |
| Pure data-driven rendering (`events` prop)       | **IMPLEMENTED**      | No runtime required            |
| React wrapper + demo                             | **IMPLEMENTED**      | RFC-0004                       |
| Event DSL parse/compile                          | **IMPLEMENTED**      | `packages/event-dsl/`          |
| EventRuntime (validate/render/canPerform)        | **IMPLEMENTED**      | Not yet wired into Calendar    |
| Calendar `eventRuntime` property                 | **IMPLEMENTED**      | RFC-0005 M4                    |
| DSL-driven render via `displayEvents`            | **IMPLEMENTED**      | Uses `EventRuntime.render()`   |
| validate / canPerform / proposeEvent*            | **IMPLEMENTED**      | Calendar.wsx public methods    |
| `extra` → `data` rename                          | **IMPLEMENTED**      | RFC-0011 — use `Event.data`    |
| EventDataGenerator                               | **PLANNED**          | RFC-0011                       |
| Calendar plugin mechanism                        | **PLANNED**          | RFC-0012                       |
| Multi-tenant backend service                     | **DO NOT IMPLEMENT** | RFC-0003 Future Plan           |

---

## 3. Invariants (do not violate)

```
CALENDAR_PACKAGE     = @calenderjs/calendar   # NOT @calenderjs/core
CALENDAR_TAG         = wsx-calendar
EVENT_SSOT           = packages/event-model/src/Event.ts
DSL_COMPILE_TIME     = @calenderjs/event-dsl
DSL_RUN_TIME         = @calenderjs/event-runtime
PACKAGE_MANAGER      = pnpm                  # NEVER npx
TEST_RUNNER          = vitest via pnpm scripts
MONOREPO_TOOL        = turbo + pnpm workspaces
```

### Hard rules

1. **Calendar lives in `@calenderjs/calendar`**, not `@calenderjs/core`. Core = models, contexts, utils only.
2. **Event is the technical model**; Appointment is a business concept defined via DSL.
3. **WSX and Vue/React must not mix** inside `.wsx` files. See `.cursor/skills/wsx-work/SKILL.md`.
4. **Non-trivial changes require RFC** in `docs/rfc/` before implementation.
5. **Use `pnpm`**, not `npx`. Check `package.json` scripts first.
6. **Field name is `data`** — stores DSL-defined business fields on Event.
7. **WSX tests are async** — always `await element.updateComplete` before assertions.

---

## 4. File map

```
packages/
  calendar/src/
    Calendar.wsx              # <wsx-calendar> root component
    Calendar.css
    views/
      DayView.wsx / .css
      WeekView.wsx / .css
      MonthView.wsx / .css
      __tests__/              # View-level tests
    __tests__/Calendar.test.ts
    utils/event-utils.ts

  event-model/src/
    Event.ts                  # Event interface — SSOT
    validator.ts              # EventValidator + JSON Schema
    EventTypeDataModel.ts

  event-dsl/src/
    event-dsl.pegjs           # Grammar (edit → run build:parser)
    generated/parser.js       # Generated — do not hand-edit
    compiler.ts
    parser/parse.ts

  event-runtime/src/
    EventRuntime.ts           # validate(), render(), canPerform()

  react/src/                  # React calendar wrappers
  react-event-editor/src/     # React Event DSL editor (Monaco)
  monaco-event-dsl/src/       # Monaco language plugin (framework-agnostic)
  core/src/                   # Shared models, NOT calendar UI
  date-time/src/              # Date helpers

demos/react/                  # React demo app
site/                         # WSX docs site (i18n)
docs/rfc/                     # RFC specs
docs/llm-guide.md             # This file
```

---

## 5. Package dependency graph

```
event-model (SSOT)
    ↑
core ← date-time
    ↑
event-dsl (compile-time)     event-runtime (runtime)
    ↑                              ↑
calendar ←─────────────────────────┘
    ↑
react                          monaco-event-dsl
    ↑                                ↑
demos/react ←── react-event-editor ──┘
```

**Rule**: `event-dsl` is dev/build-time; `event-runtime` is production runtime. Keep them separate for tree-shaking.

---

## 6. Commands

```bash
pnpm install
pnpm dev                              # all packages (pangu)
pnpm dev:react                        # React demo
pnpm --filter @calenderjs/site dev    # docs site
pnpm build
pnpm test
pnpm --filter @calenderjs/calendar test
pnpm lint
pnpm typecheck
```

After editing `event-dsl.pegjs`:

```bash
pnpm --filter @calenderjs/event-dsl build
```

---

## 7. Architecture decisions (2026-03-15)

| Decision             | Choice                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Calendar ↔ DSL       | DSL-driven; Calendar accepts `EventRuntime`; degrades without runtime |
| Event vs Appointment | Appointment = business; Event = technical model                       |
| DSL form             | Text DSL → PEG.js → AST                                               |
| Extension field      | `extra` now → `data` planned (RFC-0011)                               |
| Compile vs runtime   | `event-dsl` vs `event-runtime` separation                             |

---

## 8. Common mistakes (avoid)

| Mistake                                       | Correct                                      |
| --------------------------------------------- | -------------------------------------------- |
| Import Calendar from `@calenderjs/core`       | Import from `@calenderjs/calendar`           |
| Use Vue refs in `.wsx`                        | Use `@state` decorator                       |
| Use `extra` field on Event                    | Use `data`                                   |
| Assume `eventRuntime` prop exists on Calendar | Not implemented yet — check TASK_TRACKING    |
| Run `npx vitest`                              | `pnpm --filter @calenderjs/calendar test`    |
| Implement RFC-0003 backend                    | Future plan — out of scope                   |
| Skip `updateComplete` in WSX tests            | `await element.updateComplete` before assert |
| Hand-edit `generated/parser.js`               | Edit `.pegjs` and rebuild                    |

---

## 9. RFC workflow

1. Check [ROADMAP.md](../ROADMAP.md) for RFC status
2. Read relevant RFC in `docs/rfc/`
3. For new features: write/update RFC **before** code
4. Update [TASK_TRACKING.md](../TASK_TRACKING.md) when completing sprint items
5. Move completed RFCs to `docs/rfc/completed/` when appropriate

---

## 10. Tooling (how this doc stays accurate)

```bash
pnpm validate:docs    # verify links in llms.txt / llm-guide.md / README.md
                      # syncs llms.txt → site/public/llms.txt
```

Runs automatically in **husky pre-commit**.

### Cursor integration

| File                                  | Scope                  | Purpose                              |
| ------------------------------------- | ---------------------- | ------------------------------------ |
| `.cursor/rules/00-llm-onboarding.mdc` | always                 | Read order, invariants, task routing |
| `.cursor/rules/wsx-calendar.mdc`      | `packages/calendar/**` | WSX dev rules                        |
| `.cursor/skills/wsx-work/SKILL.md`    | on demand              | Full WSX skill                       |

---

## 11. Related docs

| Doc                                     | Audience   | Content                   |
| --------------------------------------- | ---------- | ------------------------- |
| [llms.txt](../llms.txt)                 | AI (index) | Curated link index        |
| [AGENTS.md](../AGENTS.md)               | AI         | Rules, personas, commands |
| [README.md](../README.md)               | Human      | Overview, examples        |
| [TASK_TRACKING.md](../TASK_TRACKING.md) | Both       | Current sprint tasks      |
| [ROADMAP.md](../ROADMAP.md)             | Both       | Milestones, RFC status    |
