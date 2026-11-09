---
version: 1
slug: "site"
primary_target: "site"
related_targets: []
---

Scope: Home, Features, Demos, Docs shell, Header/Footer — one visual world across all routes. Visitor mode: Persuade. Audience: frontend developers evaluating whether to adopt CalenderJS. Job: judge rigor/fit within a few screens, then either run the embedded demo or open docs. Proof/content: the real `<wsx-calendar>` component rendered live (no screenshots/video), real feature copy (Event DSL validation, framework-agnostic Web Components), MIT + zh/en badges. Constraints: keep `.wsx` component format (no React/Vue), keep i18next zh/en, replace the three emoji icons (📅📝✓) with authored iconography, no invented customers/benchmarks/testimonials.

## Direction contract

**THESIS:** CalenderJS is read as a mechanical record-of-truth, not a styled dashboard — every event type is a punched card row, and the card's cutouts ARE the DSL's validation rules made visible. Refuses the category default (dark hero, gradient headline, floating code snippet, three equal feature cards).

**OWN-WORLD:** Cream/ivory card-stock ground (#f2ead9), near-black print ink (#1a1a1a), one brick-red accent (#b5452e) for the single committed action and active/denied states. Tabulator monospace for data and labels (IBM Plex Mono or Space Mono), a sturdy grotesk for reading copy (Space Grotesk — no training-data-default serif). Recognizable signature: rectangular punch-cutouts (real cut shapes in SVG/CSS, never decorative gradients) mark which fields are editable/validated per event type; row-rule hairlines run the full width like a tabulator form.

**STORY:** Visitor sees the hero as one oversized punch card for a real event type, cutouts visibly gating which fields can change; reads this as "this library enforces rules I'd otherwise hand-roll"; believes it's more rigorous than what they use now; clicks the single primary action (brick-red, card-shaped) into the live demo.

**FIRST VIEWPORT:** Full-bleed punch card fills the viewport edge to edge, no browser chrome, no device frame. Card header strip: CalenderJS wordmark in tabulator caps, nav as stencilled column labels along the card's top edge. Body: one real DSL-governed event type as the card's punched columns (title, time, type, editable-gate), with real cutout shapes showing which fields the current event's permissions allow. Primary action ("Run the demo") sits as a stamped/punched button in the position a card's corner-cut normally occupies. MIT + zh/en badges render as small embossed stamps in the card's margin, not as a stats row.

**FORM:** Punch Card Ledger — IMPECCABLE'S PICK (top-ranked grounded candidate; not the assigned roll). Raise kept from challenger ikeda-datamatics (competitive on fuse): the DSL-validation demo section renders as a canvas-drawn black/white data field (seeded, reduced-motion safe) proving rules at work — donated discipline is the black/white/canvas-rendered precision, not ikeda's barcode motif itself. seed: 1f136304c524a6ad

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Exact typeface pairing (Space Grotesk/IBM Plex Mono vs Space Grotesk/Space Mono) — decide at build time.
- Whether Docs page shell (wsx-press wrapper) gets full punch-card chrome or a quieter "inherits the system" treatment — Docs Markdown content itself is out of scope, only its shell/nav changes.
- Icon replacement for the three emoji (📅📝✓ in FeaturesPage) — authored as punch-cutout glyphs matching the card system, not generic icon-library glyphs.
