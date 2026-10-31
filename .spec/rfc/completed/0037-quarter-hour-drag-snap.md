# RFC 0037: DayView/WeekView 拖拽与 resize 支持 15 分钟粒度

**Status:** Implemented

## Summary

DayView and WeekView currently snap event moves and resize changes to whole hours. Add 15-minute snapping to pointer-based moves and resize while preserving event duration on moves and the existing edit-permission and validation rules.

## Problem

Both views render 24 hour cells at 48 pixels per hour. DayView derives the drop time with `Math.floor(... / 48)` and keeps the old minute. WeekView takes only the target cell's hour. Resize rounds pointer movement to 48-pixel increments and changes duration by whole hours. Users cannot move an event to 10:15 or resize its end to 11:15.

## Goals

- Snap DayView and WeekView pointer event moves to the nearest 15-minute mark within the selected day and hour.
- Snap DayView and WeekView resize deltas to 15-minute increments, with a matching live height preview.
- Preserve the event's duration when moving it and preserve existing permission checks and update events.
- Keep the implementation consistent between both views.

## Non-goals

- Do not change keyboard movement or resize key increments.
- Do not change MonthView date-only dragging.
- Do not change hour-cell layout, event validation, or event update API.

## Design

Two implementation options:

1. Add independent 15-minute calculations to DayView and WeekView handlers. This keeps each change local, but duplicates snapping rules and risks the views diverging.
2. Add pure helpers in `packages/calendar/src/utils/time-grid.ts` for snapping pointer offsets to 15-minute increments. Reuse them in both views and unit-test boundary behavior. This adds one small utility but keeps move and resize behavior identical.

Recommend option 2. Both views share the same 48-pixel-per-hour scale and need the same rounding rules. A pure utility expresses that rule once without changing event data or component APIs.

Implementation touches `DayView.wsx`, `WeekView.wsx`, and their E2E specs. Add focused unit tests for the pure snapping helpers. For event moves, derive the minute offset from the pointer's position within the target hour cell. For resize, convert vertical pointer delta to the nearest 15-minute duration delta and preview the corresponding height before commit. Keep start times within the selected day and clamp minute-within-hour to 0, 15, 30, or 45.

## Acceptance

- Unit tests cover offsets that snap to 0, 15, 30, and 45 minutes, signed resize deltas, and hour-cell edge clamping.
- E2E tests move existing events to a quarter-hour time in both DayView and WeekView and assert start and end times.
- E2E tests resize events by 15 minutes in both views and assert live preview height and committed end time.
- Existing whole-hour movement, cross-day WeekView movement, permission rejection, and event duration preservation continue to pass.
- Run Calendar unit tests and the DayView/WeekView drag E2E cases in Chromium, Firefox, and WebKit.

## Implementation record

- Added `packages/calendar/src/utils/time-grid.ts`. DayView and WeekView share 15-minute pixel snapping for event moves and signed resize deltas. Move preserves duration; resize previews the matching height and commits the same snapped delta.
- E27 and E29 verify moving an event from 10:00 to 10:15 in DayView and WeekView. E28 and E30 verify resizing by 15 minutes and seeing the height update before pointer release.
- The full E14–E30 drag matrix passed 51/51 across Chromium, Firefox, and WebKit. After symmetric negative-delta rounding coverage was added, E27–E30 passed 12/12 across all three engines.
- Calendar unit tests passed 124 tests with 25 skipped. The monorepo typecheck passed all 11 packages. Calendar build, Calendar lint, and E2E build passed.
