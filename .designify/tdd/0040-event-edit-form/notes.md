# RFC 0040 TDD evidence

## RED

- Added `CalendarRef.canPerformAction` forwarding test before implementation.
- `pnpm --filter @calenderjs/react test -- --run src/__tests__/Calendar.test.tsx` failed because `ref.current.canPerformAction` was missing.

## GREEN

- Implemented wrapper forwarding, schema mapping helpers, and form serialization.
- `pnpm --filter @calenderjs/react test`: 8/8 passed.
- `pnpm --filter @calenderjs/demos-react test`: 4/4 passed; `event-edit-form.ts` line/branch/function coverage 100%.
- Chromium E2E: 51/51 passed, including P0 rejection, P1 Month/Week/Day edits and timezone read-only case, and P2 permission read-only case.
