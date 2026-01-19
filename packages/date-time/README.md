# @calenderjs/date-time

CalenderJS 日期时间工具函数库 - 提供统一的日期和时间处理工具

## 功能特性

- ✅ 支持 `Date` 对象和日期字符串（ISO 8601 格式）
- ✅ 完整的类型定义（TypeScript）
- ✅ 100% 测试覆盖率
- ✅ 零依赖
- ✅ 双格式输出（CommonJS + ESM）

## 安装

```bash
pnpm add @calenderjs/date-time
```

## 使用

```typescript
import {
    getMonthStart,
    getMonthEnd,
    getWeekDates,
    isSameDay,
    formatDateKey,
    getTimeString,
} from "@calenderjs/date-time";

// 支持 Date 对象
const date = new Date(2024, 0, 15);
const monthStart = getMonthStart(date);

// 支持字符串日期
const monthStart2 = getMonthStart("2024-01-15");

// 判断同一天
const isSame = isSameDay("2024-01-15", new Date(2024, 0, 15));

// 格式化日期
const dateKey = formatDateKey(new Date(2024, 0, 15)); // "2024-01-15"
const timeStr = getTimeString(new Date(2024, 0, 15, 14, 30, 0)); // "14:30"
```

## API 文档

### 日期操作

- `getMonthStart(date: Date | string): Date` - 获取月份的第一天
- `getMonthEnd(date: Date | string): Date` - 获取月份的最后一天
- `getWeekStart(date: Date | string, firstDayOfWeek?: 0 | 1): Date` - 获取周的开始日期（周一）
- `getWeekEnd(date: Date | string, firstDayOfWeek?: 0 | 1): Date` - 获取周的结束日期（周日）
- `getWeekDates(date: Date | string, firstDayOfWeek?: 0 | 1): Date[]` - 获取日期所在周的所有日期
- `getMonthDates(date: Date | string, firstDayOfWeek?: 0 | 1): Date[]` - 获取月份的所有日期（包括前后月份）
- `isSameDay(date1: Date | string, date2: Date | string): boolean` - 判断两个日期是否是同一天
- `isToday(date: Date | string): boolean` - 判断是否是今天
- `isSameMonth(date1: Date | string, date2: Date | string): boolean` - 判断日期是否在同一个月
- `isBusinessDay(date: Date | string): boolean` - 判断是否是工作日（周一到周五）
- `isWeekend(date: Date | string): boolean` - 判断是否是周末（周六或周日）
- `daysBetween(date1: Date | string, date2: Date | string): number` - 计算两个日期之间的天数
- `generateDateGrid(date: Date | string, firstDayOfWeek?: 0 | 1): Date[]` - 生成日期网格（用于月视图）

### 时间操作

- `isValidTimeRange(startTime: Date | string, endTime: Date | string): boolean` - 验证时间范围是否有效
- `calculateDuration(startTime: Date | string, endTime: Date | string): number` - 计算持续时间（分钟数）
- `isTimeInRange(time: Date | string, startTime: Date | string, endTime: Date | string): boolean` - 判断时间是否在范围内
- `isBusinessHours(date: Date | string, startHour?: number, endHour?: number, useUTC?: boolean): boolean` - 判断是否在工作时间
- `getDayHours(): number[]` - 获取一天的所有小时（0-23）
- `generateTimeSlots(minTime?: string, maxTime?: string, slotDuration?: number): Array<{ hour: number; minute: number }>` - 生成时间槽列表

### 格式化

- `formatDateKey(date: Date | string): string` - 格式化日期为 YYYY-MM-DD
- `getTimeString(date: Date | string): string` - 获取日期的小时和分钟（HH:mm 格式）
- `formatTime(date: Date | string, format?: "12h" | "24h"): string` - 格式化时间（支持 12/24 小时制）

## 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test -- --coverage
```

## 构建

```bash
pnpm build
```

## 许可证

MIT
