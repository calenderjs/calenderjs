"use client";

import { Calendar } from "@calenderjs/react";
import type { Event } from "@calenderjs/event-model";
import { EventDSLCompiler, parseEventDSL } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// 动态导入 Monaco Editor（避免 SSR 问题）
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

// 默认 DSL 示例
const DEFAULT_DSL = `type: meeting
name: "团队会议"
description: "标准团队会议类型"

fields:
  - attendees: list of email, required
  - location: string

validate:
  attendees.count between 1 and 50
  startTime.hour >= 9
  startTime.hour <= 18

display:
  color: "#4285f4"
  icon: "meeting"

behavior:
  editable: true
  draggable: true
`;

// 默认事件数据
const DEFAULT_EVENTS: Event[] = [
    {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date(new Date().setHours(10, 0, 0, 0)),
        endTime: new Date(new Date().setHours(11, 0, 0, 0)),
        extra: {
            attendees: ["user1@example.com", "user2@example.com"],
            location: "会议室 A",
        },
    },
    {
        id: "event-2",
        type: "meeting",
        title: "客户演示",
        startTime: new Date(new Date().setHours(14, 0, 0, 0)),
        endTime: new Date(new Date().setHours(15, 30, 0, 0)),
        extra: {
            attendees: ["client@example.com"],
            location: "线上会议",
        },
    },
];

export default function Home() {
    const [dslText, setDslText] = useState(DEFAULT_DSL);
    const [events, setEvents] = useState<Event[]>(DEFAULT_EVENTS);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
        "month"
    );
    const [compilationError, setCompilationError] = useState<string | null>(
        null
    );
    const [validationResults, setValidationResults] = useState<
        Array<{ eventId: string; valid: boolean; errors?: string[] }>
    >([]);
    const [renderedEvents, setRenderedEvents] = useState<any[]>([]);

    // 编译 DSL
    const compiledDataModel = useMemo(() => {
        try {
            setCompilationError(null);
            const ast = parseEventDSL(dslText);
            const compiler = new EventDSLCompiler();
            const dataModel = compiler.compileFromAST([ast]);
            return dataModel.types[0];
        } catch (error) {
            setCompilationError(
                error instanceof Error ? error.message : String(error)
            );
            return null;
        }
    }, [dslText]);

    // 验证和渲染事件
    useEffect(() => {
        if (!compiledDataModel) {
            setRenderedEvents([]);
            setValidationResults([]);
            return;
        }

        const eventValidator = new EventValidator();
        const runtime = new EventRuntime(compiledDataModel);
        const results: Array<{
            eventId: string;
            valid: boolean;
            errors?: string[];
        }> = [];
        const rendered: any[] = [];

        events.forEach((event) => {
            // 验证基础结构
            const baseValidation = eventValidator.validateBase(event);
            if (!baseValidation.valid) {
                results.push({
                    eventId: event.id,
                    valid: false,
                    errors: baseValidation.errors,
                });
                return;
            }

            // 验证 extra
            if (compiledDataModel.extraSchema) {
                const extraValidation = eventValidator.validateExtra(
                    event,
                    compiledDataModel.extraSchema
                );
                if (!extraValidation.valid) {
                    results.push({
                        eventId: event.id,
                        valid: false,
                        errors: extraValidation.errors,
                    });
                    return;
                }
            }

            // 验证业务规则
            const validationResult = runtime.validate(event, {
                events: [],
                now: new Date(),
            });
            if (!validationResult.valid) {
                results.push({
                    eventId: event.id,
                    valid: false,
                    errors: validationResult.errors,
                });
                return;
            }

            // 渲染
            const renderedEvent = runtime.render(event, {});
            rendered.push({
                ...event,
                color: renderedEvent.color,
                icon: renderedEvent.icon,
            });

            results.push({
                eventId: event.id,
                valid: true,
            });
        });

        setValidationResults(results);
        setRenderedEvents(rendered);
    }, [compiledDataModel, events]);

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
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
            }}
        >
            {/* Header */}
            <header
                style={{
                    padding: "20px",
                    backgroundColor: "#1a1a1a",
                    color: "white",
                    borderBottom: "1px solid #333",
                }}
            >
                <h1 style={{ margin: 0, fontSize: "24px" }}>CalenderJS Demo</h1>
                <p
                    style={{
                        margin: "8px 0 0 0",
                        color: "#aaa",
                        fontSize: "14px",
                    }}
                >
                    DSL → Data Model → Event 验证 → Calendar 显示
                </p>
            </header>

            {/* Main Content */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Left Panel: DSL Editor */}
                <div
                    style={{
                        width: "40%",
                        display: "flex",
                        flexDirection: "column",
                        borderRight: "1px solid #ddd",
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    <div
                        style={{
                            padding: "15px",
                            backgroundColor: "#fff",
                            borderBottom: "1px solid #ddd",
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: "18px" }}>
                            DSL 编辑器
                        </h2>
                        <p
                            style={{
                                margin: "5px 0 0 0",
                                fontSize: "12px",
                                color: "#666",
                            }}
                        >
                            编辑 Event DSL 定义，实时查看编译结果
                        </p>
                    </div>
                    <div style={{ flex: 1, position: "relative" }}>
                        <MonacoEditor
                            height="100%"
                            language="plaintext"
                            value={dslText}
                            onChange={(value) => setDslText(value || "")}
                            theme="vs-light"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                    {compilationError && (
                        <div
                            style={{
                                padding: "10px 15px",
                                backgroundColor: "#fee",
                                color: "#c33",
                                fontSize: "12px",
                                borderTop: "1px solid #ddd",
                            }}
                        >
                            <strong>编译错误:</strong> {compilationError}
                        </div>
                    )}
                    {!compilationError && compiledDataModel && (
                        <div
                            style={{
                                padding: "10px 15px",
                                backgroundColor: "#efe",
                                color: "#3c3",
                                fontSize: "12px",
                                borderTop: "1px solid #ddd",
                            }}
                        >
                            <strong>✓ 编译成功:</strong>{" "}
                            {compiledDataModel.name} ({compiledDataModel.id})
                        </div>
                    )}
                </div>

                {/* Right Panel: Calendar */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                    }}
                >
                    {/* Validation Status */}
                    <div
                        style={{
                            padding: "15px",
                            backgroundColor: "#f9f9f9",
                            borderBottom: "1px solid #ddd",
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: "18px" }}>
                            验证状态
                        </h2>
                        <div style={{ marginTop: "10px", fontSize: "12px" }}>
                            {validationResults.map((result) => {
                                const event = events.find(
                                    (e) => e.id === result.eventId
                                );
                                return (
                                    <div
                                        key={result.eventId}
                                        style={{
                                            marginBottom: "5px",
                                            color: result.valid
                                                ? "#3c3"
                                                : "#c33",
                                        }}
                                    >
                                        {result.valid ? "✓" : "✗"}{" "}
                                        {event?.title || result.eventId}
                                        {result.errors &&
                                            result.errors.length > 0 && (
                                                <span
                                                    style={{
                                                        marginLeft: "10px",
                                                        color: "#666",
                                                    }}
                                                >
                                                    {result.errors.join(", ")}
                                                </span>
                                            )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Calendar */}
                    <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
                        <Calendar
                            view={currentView}
                            date={currentDate}
                            events={renderedEvents as any}
                            onDateChange={handleDateChange}
                            onViewChange={handleViewChange}
                            onEventClick={handleEventClick}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
