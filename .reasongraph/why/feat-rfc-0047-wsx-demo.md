# Why: feat-rfc-0047-wsx-demo

<!-- reasongraph:v1 generated 2026-11-21 — review before sharing; edit freely, edits are preserved -->

## Intent
Add and validate a native Web Component demo under `demos/wsx`.

## Decisions

### Use a flat locator for event text assertions
Status: discussed
Touches: `demos/wsx/e2e/demo.spec.ts`

The agent replaced chained `locator().getByText()` with a flat locator using `hasText` because the chained locator timed out in Firefox despite the dialog closing. The flat locator resolved successfully in the Firefox test.

### Rely on the repository root ignore rules
Status: discussed
Touches: `.gitignore`, `demos/wsx/*`

The root ignore rules cover generated build artifacts and test results for the new demo. Keeping ignore configuration centralized avoids redundant package-level rules.

### Exclude generated ReasonGraph state from the commit
Status: discussed
Touches: `.reasongraph/why/main.md`, `.reasongraph/why/feat-rfc-0047-wsx-demo.md`

Generated ReasonGraph state was kept out of the implementation commit to avoid adding tool-generated noise to shared source history.

### Advance and archive the completed RFC
Status: discussed
Touches: `.spec/rfc/0047-*.md`, `.spec/rfc/completed/`, `.spec/ROADMAP.md`

RFC-0047 was marked Implemented and archived after the feature was implemented, tested, and verified. The roadmap was updated to reflect the completed status.

### Include the WSX end-to-end test configuration
Status: discussed
Touches: `demos/wsx/vite.e2e.config.ts`

The demo's Vite end-to-end test configuration was included with the implementation so CI can run its browser checks.
