"use client";

import { Calendar } from "@calenderjs/react";
import type { Event } from "@calenderjs/event-model";
import { useState } from "react";
import Link from "next/link";

// 创建示例事件数据
const createSampleEvents = (): Event[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events: Event[] = [
        {
            id: "1",
            type: "meeting",
            title: "团队会议",
            startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 今天 9:00
            endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 今天 10:00
            data: {
                color: "#4285f4",
                description: "每周团队同步会议",
                location: "会议室 A",
            },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
        {
            id: "2",
            type: "task",
            title: "代码审查",
            startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 今天 14:00
            endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 今天 15:00
            data: {
                color: "#34a853",
                description: "审查 PR #123",
            },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
        {
            id: "3",
            type: "meeting",
            title: "客户演示",
            startTime: new Date(
                today.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
            ), // 明天 10:00
            endTime: new Date(
                today.getTime() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000
            ), // 明天 11:00
            data: {
                color: "#ea4335",
                description: "向客户展示新功能",
                location: "线上会议",
            },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
        {
            id: "4",
            type: "holiday",
            title: "假期",
            startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3天后
            endTime: new Date(
                today.getTime() + 3 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000
            ), // 3天后+1天
            data: {
                color: "#fbbc04",
                description: "年假",
            },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
    ];

    return events;
};

export default function Home() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
        "month"
    );
    const [events] = useState<Event[]>(createSampleEvents());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleDateChange = (e: CustomEvent<{ date: Date }>) => {
        setCurrentDate(e.detail.date);
        console.log("Date changed:", e.detail.date);
    };

    const handleViewChange = (
        e: CustomEvent<{ view: "month" | "week" | "day" }>
    ) => {
        setCurrentView(e.detail.view);
        console.log("View changed:", e.detail.view);
    };

    const handleEventClick = (e: CustomEvent<{ event: Event }>) => {
        setSelectedEvent(e.detail.event);
        console.log("Event clicked:", e.detail.event);
    };

    const handleDateDoubleClick = (e: CustomEvent<{ date: Date }>) => {
        console.log("Date double clicked:", e.detail.date);
        alert(
            `双击日期: ${e.detail.date.toLocaleDateString(
                "zh-CN"
            )}\n可以在这里创建新事件`
        );
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ marginBottom: "20px" }}>
                <h1>CalenderJS Demo</h1>
                <Link
                    href="/dsl-demo"
                    style={{
                        display: "inline-block",
                        marginTop: "10px",
                        padding: "10px 20px",
                        backgroundColor: "#4285f4",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px",
                    }}
                >
                    → 查看 DSL → Calendar 完整流程演示
                </Link>
            </div>
            <p>当前日期: {currentDate.toLocaleDateString("zh-CN")}</p>
            <p>当前视图: {currentView}</p>
            <p>事件数量: {events.length}</p>

            {selectedEvent && (
                <div
                    style={{
                        marginTop: "10px",
                        padding: "10px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                    }}
                >
                    <h3>选中的事件:</h3>
                    <p>
                        <strong>标题:</strong> {selectedEvent.title}
                    </p>
                    <p>
                        <strong>类型:</strong> {selectedEvent.type}
                    </p>
                    <p>
                        <strong>时间:</strong>{" "}
                        {selectedEvent.startTime.toLocaleString("zh-CN")} -{" "}
                        {selectedEvent.endTime.toLocaleString("zh-CN")}
                    </p>
                    {selectedEvent.data?.description && (
                        <p>
                            <strong>描述:</strong>{" "}
                            {selectedEvent.data.description}
                        </p>
                    )}
                    {selectedEvent.data?.location && (
                        <p>
                            <strong>地点:</strong> {selectedEvent.data.location}
                        </p>
                    )}
                    <button
                        onClick={() => setSelectedEvent(null)}
                        style={{ marginTop: "10px", padding: "5px 10px" }}
                    >
                        关闭
                    </button>
                </div>
            )}

            <div style={{ marginTop: "20px" }}>
                <Calendar
                    view={currentView}
                    date={currentDate}
                    events={events}
                    onDateChange={handleDateChange}
                    onViewChange={handleViewChange}
                    onEventClick={handleEventClick}
                    onDateDoubleClick={handleDateDoubleClick}
                    style={{ width: "100%", minHeight: "600px" }}
                />
            </div>

            <div
                style={{
                    marginTop: "30px",
                    padding: "20px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "4px",
                }}
            >
                <h2>使用说明</h2>
                <ul>
                    <li>点击工具栏的"月"、"周"、"日"按钮切换视图</li>
                    <li>点击左右箭头导航日期</li>
                    <li>点击"今天"按钮跳转到当前日期</li>
                    <li>在月视图中，点击日期单元格可以选中该日期</li>
                    <li>在周/日视图中，点击时间槽可以选中该时间</li>
                    <li>点击事件可以查看详情</li>
                    <li>双击日期可以创建新事件（功能待实现）</li>
                </ul>
            </div>
        </div>
    );
}
