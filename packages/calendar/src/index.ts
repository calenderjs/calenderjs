/**
 * @calenderjs/calendar
 *
 * Calendar 组件包 - 基于 WSX 框架构建的事件日历组件
 *
 * 根据 RFC-0001 定义
 */

// 导出 Calendar 组件
export { default as Calendar } from "./Calendar.wsx";

// 静态导入以确保所有 WSX 文件都被 wsx 插件正确处理
// Calendar.wsx 已经导入了所有视图组件，所以只需要导入它
// 这会在构建时处理所有装饰器
import "./Calendar.wsx";

// 导出类型（从单独的 types 文件）
export type { CalendarProps } from "./types";

// 重新导出核心类型
export * from "@calenderjs/core";
