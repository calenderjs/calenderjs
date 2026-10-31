export const DEFAULT_HOUR_CELL_HEIGHT_PX = 48;
export const MINUTES_PER_HOUR = 60;
export const TIME_SNAP_MINUTES = 15;

export function snapMinutesFromPixelOffset(
  offsetPx: number,
  hourCellHeightPx = DEFAULT_HOUR_CELL_HEIGHT_PX,
): number {
  const minutes = (offsetPx / hourCellHeightPx) * MINUTES_PER_HOUR;
  return Math.round(minutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
}

export function snapMinuteWithinHour(
  offsetPx: number,
  hourCellHeightPx = DEFAULT_HOUR_CELL_HEIGHT_PX,
): number {
  return Math.min(
    MINUTES_PER_HOUR - TIME_SNAP_MINUTES,
    Math.max(0, snapMinutesFromPixelOffset(offsetPx, hourCellHeightPx)),
  );
}
