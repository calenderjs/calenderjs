/**
 * React wrapper for wsx-calendar Web Component
 *
 * 使用方式：
 * ```tsx
 * import { Calendar } from '@calenderjs/react';
 *
 * <Calendar
 *   view="month"
 *   date="2024-12-30"
 *   onDateChange={(e) => console.log('Date changed:', e.detail.date)}
 *   onViewChange={(e) => console.log('View changed:', e.detail.view)}
 * />
 * ```
 */

import React, {
    useRef,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useState,
} from "react";
import { Event } from "@calenderjs/core";

// 延迟加载 Web Component，只在客户端注册
// 避免在服务器端执行（HTMLElement 不存在）
let calendarRegistered = false;
const registerCalendar = () => {
    if (typeof window !== 'undefined' && !calendarRegistered) {
        import("@calenderjs/calendar");
        calendarRegistered = true;
    }
};

// 声明 wsx-calendar 元素类型
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "wsx-calendar": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    view?: "month" | "week" | "day";
                    date?: string;
                },
                HTMLElement
            > & {
                events?: Event[];
                user?: any;
            };
        }
    }
}

/**
 * Calendar 组件的属性
 */
export interface CalendarProps {
    /**
     * 初始视图（month | week | day）
     */
    view?: "month" | "week" | "day";

    /**
     * 初始日期（ISO 8601 字符串或 Date 对象）
     */
    date?: string | Date;

    /**
     * 事件列表（数据模型）
     */
    events?: Event[];

    /**
     * 当前用户
     */
    user?: any;

    /**
     * 日期变化时的回调
     */
    onDateChange?: (event: CustomEvent<{ date: Date }>) => void;

    /**
     * 视图切换时的回调
     */
    onViewChange?: (
        event: CustomEvent<{ view: "month" | "week" | "day" }>
    ) => void;

    /**
     * 事件点击时的回调
     */
    onEventClick?: (event: CustomEvent<{ event: Event }>) => void;

    /**
     * 日期双击时的回调
     */
    onDateDoubleClick?: (event: CustomEvent<{ date: Date }>) => void;

    /**
     * 其他 HTML 属性
     */
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}

/**
 * Calendar 组件的引用类型
 */
export interface CalendarRef {
    /**
     * 获取底层的 Web Component 实例
     */
    getElement: () => HTMLElement | null;

    /**
     * 设置当前视图
     */
    setView: (view: "month" | "week" | "day") => void;

    /**
     * 设置当前日期
     */
    setDate: (date: Date | string) => void;

    /**
     * 跳转到今天
     */
    goToToday: () => void;
}

/**
 * Calendar React 组件
 */
export const Calendar = forwardRef<CalendarRef, CalendarProps>(
    (
        {
            view = "month",
            date,
            events,
            user,
            onDateChange,
            onViewChange,
            onEventClick,
            onDateDoubleClick,
            className,
            style,
            ...rest
        }: CalendarProps,
        ref: React.ForwardedRef<CalendarRef>
    ) => {
        const calendarRef = useRef<
            (HTMLElement & {
                view?: "month" | "week" | "day";
                date?: Date | string;
                events?: Event[];
                user?: any;
            }) | null
        >(null);
        const [isClient, setIsClient] = useState(false);

        // 只在客户端注册 Web Component
        useEffect(() => {
            setIsClient(true);
            registerCalendar();
        }, []);

        // 暴露方法给父组件
        useImperativeHandle(ref, () => ({
            getElement: () => calendarRef.current,
            setView: (newView: "month" | "week" | "day") => {
                if (calendarRef.current) {
                    (calendarRef.current as any).view = newView;
                }
            },
            setDate: (newDate: Date | string) => {
                if (calendarRef.current) {
                    const date =
                        typeof newDate === "string"
                            ? new Date(newDate)
                            : newDate;
                    (calendarRef.current as any).date = date;
                }
            },
            goToToday: () => {
                if (calendarRef.current) {
                    (calendarRef.current as any).date = new Date();
                }
            },
        }));

        // 处理属性变化
        useEffect(() => {
            if (!calendarRef.current) return;

            const element = calendarRef.current as any;

            // 所有属性都通过 property 设置
            if (view !== undefined) {
                element.view = view;
            }

            if (date !== undefined) {
                element.date = date instanceof Date ? date : new Date(date);
            }

            if (events !== undefined) {
                element.events = events;
            }

            if (user !== undefined) {
                element.user = user;
            }
        }, [view, date, events, user]);

        // 绑定事件监听器
        useEffect(() => {
            if (!calendarRef.current) return;

            const element = calendarRef.current;

            const handleDateChange = (e: globalThis.Event) => {
                onDateChange?.(e as CustomEvent<{ date: Date }>);
            };

            const handleViewChange = (e: globalThis.Event) => {
                onViewChange?.(
                    e as CustomEvent<{ view: "month" | "week" | "day" }>
                );
            };

            const handleEventClick = (e: globalThis.Event) => {
                onEventClick?.(e as CustomEvent<{ event: Event }>);
            };

            const handleDateDoubleClick = (e: globalThis.Event) => {
                onDateDoubleClick?.(e as CustomEvent<{ date: Date }>);
            };

            element.addEventListener("date-change", handleDateChange);
            element.addEventListener("view-change", handleViewChange);
            element.addEventListener("event-click", handleEventClick);
            element.addEventListener(
                "date-double-click",
                handleDateDoubleClick
            );

            return () => {
                element.removeEventListener("date-change", handleDateChange);
                element.removeEventListener("view-change", handleViewChange);
                element.removeEventListener("event-click", handleEventClick);
                element.removeEventListener(
                    "date-double-click",
                    handleDateDoubleClick
                );
            };
        }, [onDateChange, onViewChange, onEventClick, onDateDoubleClick]);

        // 服务器端渲染时返回占位符
        if (!isClient) {
            return (
                <div
                    className={className}
                    style={{ ...style, minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    {...rest}
                >
                    <div>加载中...</div>
                </div>
            );
        }

        return (
            <wsx-calendar
                ref={calendarRef}
                className={className}
                style={style}
                {...rest}
            />
        );
    }
);

Calendar.displayName = "Calendar";
