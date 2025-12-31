/**
 * 日期工具函数
 */

/**
 * 获取月份的第一天
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 获取周的开始日期（基于 firstDayOfWeek）
 */
export function getWeekStart(date: Date, firstDayOfWeek: 0 | 1 = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day - firstDayOfWeek;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取周的结束日期
 */
export function getWeekEnd(date: Date, firstDayOfWeek: 0 | 1 = 1): Date {
  const start = getWeekStart(date, firstDayOfWeek);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 判断是否是今天
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间
 */
export function formatTime(date: Date, format: '12h' | '24h' = '24h'): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * 生成日期网格（用于月视图）
 */
export function generateDateGrid(
  date: Date,
  firstDayOfWeek: 0 | 1 = 1
): Date[] {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const weekStart = getWeekStart(monthStart, firstDayOfWeek);
  const weekEnd = getWeekEnd(monthEnd, firstDayOfWeek);

  const dates: Date[] = [];
  const current = new Date(weekStart);

  while (current <= weekEnd) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 生成时间槽列表
 */
export function generateTimeSlots(
  minTime: string = '00:00',
  maxTime: string = '23:59',
  slotDuration: number = 30
): Array<{ hour: number; minute: number }> {
  const [minHour, minMinute] = minTime.split(':').map(Number);
  const [maxHour, maxMinute] = maxTime.split(':').map(Number);

  const slots: Array<{ hour: number; minute: number }> = [];
  let currentHour = minHour;
  let currentMinute = minMinute;

  while (
    currentHour < maxHour ||
    (currentHour === maxHour && currentMinute <= maxMinute)
  ) {
    slots.push({ hour: currentHour, minute: currentMinute });

    currentMinute += slotDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
