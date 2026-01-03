"use client";

import { Calendar } from "@calenderjs/react";
import type { Event } from "@calenderjs/event-model";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import { useState, useEffect } from "react";
import type { Event } from "@calenderjs/event-model";

/**
 * DSL → Calendar 完整流程演示
 * 
 * 这个演示展示了：
 * 1. DSL AST 定义
 * 2. 编译 DSL AST → Data Model
 * 3. 创建 Event 对象
 * 4. 验证 Event（基础结构 + 业务规则）
 * 5. 渲染 Event（生成显示数据）
 * 6. Calendar 组件显示
 */

export default function DSLDemoPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month");
    const [events, setEvents] = useState<Event[]>([]);
    const [validationStatus, setValidationStatus] = useState<string>("");
    const [renderedEvents, setRenderedEvents] = useState<any[]>([]);

    // 定义 DSL AST
    const meetingAST: EventTypeAST = {
        type: "meeting",
        name: "团队会议",
        fields: [
            {
                name: "attendees",
                type: { type: "list", itemType: "email" },
                required: true,
            },
            {
                name: "location",
                type: "string",
            },
        ],
        validate: [
            {
                type: "Between",
                field: { type: "FieldAccess", path: ["attendees", "count"] },
                min: 1,
                max: 50,
            },
            {
                type: "Between",
                field: { type: "FieldAccess", path: ["startTime", "hour"] },
                min: 9,
                max: 18,
            },
        ],
        display: [
            {
                name: "color",
                value: "#4285f4",
            },
            {
                name: "icon",
                value: "meeting",
            },
        ],
        behavior: [
            {
                name: "editable",
                value: true,
            },
        ],
    };

    const appointmentAST: EventTypeAST = {
        type: "appointment",
        name: "预约",
        fields: [
            {
                name: "patient",
                type: "string",
                required: true,
            },
        ],
        validate: [
            {
                type: "Comparison",
                operator: ">=",
                left: { type: "FieldAccess", path: ["startTime", "hour"] },
                right: 9,
            },
            {
                type: "Comparison",
                operator: "<=",
                left: { type: "FieldAccess", path: ["startTime", "hour"] },
                right: 17,
            },
        ],
        display: [
            {
                name: "color",
                value: "#ea4335",
            },
        ],
        behavior: [],
    };

    useEffect(() => {
        // 1. 编译 DSL AST → Data Model
        const compiler = new EventDSLCompiler();
        const dataModel = compiler.compileFromAST([meetingAST, appointmentAST]);

        // 2. 创建 Event 对象
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const rawEvents: Event[] = [
            {
                id: "event-1",
                type: "meeting",
                title: "团队会议",
                startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 今天 10:00
                endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 今天 11:00
                extra: {
                    attendees: ["user1@example.com", "user2@example.com"],
                    location: "会议室 A",
                },
            },
            {
                id: "event-2",
                type: "appointment",
                title: "预约",
                startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 今天 14:00
                endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 今天 15:00
                extra: {
                    patient: "张三",
                },
            },
            {
                id: "event-3",
                type: "meeting",
                title: "客户演示",
                startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 明天 10:00
                endTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 明天 11:00
                extra: {
                    attendees: ["client@example.com"],
                    location: "线上会议",
                },
            },
        ];

        // 3. 验证和渲染所有事件
        const eventValidator = new EventValidator();
        const validatedEvents: Event[] = [];
        const rendered: any[] = [];
        const statusMessages: string[] = [];

        rawEvents.forEach((event) => {
            // 找到对应的 Data Model
            const eventTypeDataModel = dataModel.types.find(
                (t) => t.id === event.type
            );
            if (!eventTypeDataModel) {
                statusMessages.push(`❌ 未找到类型 ${event.type} 的 Data Model`);
                return;
            }

            // 验证基础结构
            const baseValidation = eventValidator.validateBase(event);
            if (!baseValidation.valid) {
                statusMessages.push(
                    `❌ ${event.title}: 基础验证失败 - ${baseValidation.errors?.join(", ")}`
                );
                return;
            }

            // 验证 Event.extra
            if (eventTypeDataModel.extraSchema) {
                const extraValidation = eventValidator.validateExtra(
                    event,
                    eventTypeDataModel.extraSchema
                );
                if (!extraValidation.valid) {
                    statusMessages.push(
                        `❌ ${event.title}: extra 验证失败 - ${extraValidation.errors?.join(", ")}`
                    );
                    return;
                }
            }

            // 使用 EventRuntime 验证业务规则
            const runtime = new EventRuntime(eventTypeDataModel);
            const validationResult = runtime.validate(event, {
                events: [],
                now: new Date(),
            });
            if (!validationResult.valid) {
                statusMessages.push(
                    `❌ ${event.title}: 业务规则验证失败 - ${validationResult.errors?.join(", ")}`
                );
                return;
            }

            // 渲染 Event
            const renderedEvent = runtime.render(event, {});

            // 组合用于 Calendar
            const calendarEvent = {
                ...event,
                color: renderedEvent.color,
                icon: renderedEvent.icon,
            };

            validatedEvents.push(event);
            rendered.push(calendarEvent);
            statusMessages.push(`✅ ${event.title}: 验证和渲染成功`);
        });

        setEvents(validatedEvents);
        setRenderedEvents(rendered);
        setValidationStatus(statusMessages.join("\n"));
    }, []);

    const handleDateChange = (e: CustomEvent<{ date: Date }>) => {
        setCurrentDate(e.detail.date);
    };

    const handleViewChange = (
        e: CustomEvent<{ view: "month" | "week" | "day" }>
    ) => {
        setCurrentView(e.detail.view);
    };

    const handleEventClick = (e: CustomEvent<{ event: Event }>) => {
        console.log("Event clicked:", e.detail.event);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h1>DSL → Calendar 完整流程演示</h1>
            <p>
                这个演示展示了完整的端到端流程：DSL → Data Model → Event 验证 →
                Calendar 显示
            </p>

            <div
                style={{
                    marginTop: "20px",
                    padding: "15px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                }}
            >
                <h2>验证状态</h2>
                <pre
                    style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        margin: 0,
                    }}
                >
                    {validationStatus || "正在验证..."}
                </pre>
            </div>

            <div style={{ marginTop: "20px" }}>
                <h2>Calendar 组件显示</h2>
                <p>事件数量: {renderedEvents.length}</p>
                <Calendar
                    view={currentView}
                    date={currentDate}
                    events={renderedEvents as any}
                    onDateChange={handleDateChange}
                    onViewChange={handleViewChange}
                    onEventClick={handleEventClick}
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
                <h2>流程说明</h2>
                <ol>
                    <li>
                        <strong>DSL AST 定义</strong>: 定义了 meeting 和 appointment
                        两种事件类型
                    </li>
                    <li>
                        <strong>编译 DSL AST → Data Model</strong>: 使用
                        EventDSLCompiler 编译成 Data Model
                    </li>
                    <li>
                        <strong>创建 Event 对象</strong>: 创建符合 Event 接口的事件对象
                    </li>
                    <li>
                        <strong>验证 Event</strong>:
                        <ul>
                            <li>使用 EventValidator 验证基础结构</li>
                            <li>使用生成的 JSON Schema 验证 Event.extra</li>
                            <li>使用 EventRuntime 验证业务规则</li>
                        </ul>
                    </li>
                    <li>
                        <strong>渲染 Event</strong>: 使用 EventRuntime 生成显示数据（color,
                        icon）
                    </li>
                    <li>
                        <strong>Calendar 组件显示</strong>: 将验证和渲染后的事件传递给
                        Calendar 组件
                    </li>
                </ol>
            </div>
        </div>
    );
}
