import { Calendar, EventEditor, ResizableSplitter } from "@calenderjs/react";
import type { Event } from "@calenderjs/event-model";
import { EventDSLCompiler, parseEventDSL } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import { useState, useEffect, useMemo } from "react";
import { Editor } from "@monaco-editor/react";

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
        data: {
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
        data: {
            attendees: ["client@example.com"],
            location: "线上会议",
        },
    },
];

export default function App() {
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
    const [isDarkMode, setIsDarkMode] = useState(false);

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
            if (compiledDataModel.dataSchema) {
                const extraValidation = eventValidator.validateData(
                    event,
                    compiledDataModel.dataSchema
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

    // 暗色模式样式变量
    const darkModeStyles = {
        bg: isDarkMode ? "#1a1a1a" : "#fff",
        bgSecondary: isDarkMode ? "#2d2d2d" : "#f5f5f5",
        bgTertiary: isDarkMode ? "#3d3d3d" : "#f9f9f9",
        text: isDarkMode ? "#e0e0e0" : "#000",
        textSecondary: isDarkMode ? "#aaa" : "#666",
        border: isDarkMode ? "#444" : "#ddd",
        errorBg: isDarkMode ? "#4a1f1f" : "#fee",
        errorText: isDarkMode ? "#ff6b6b" : "#c33",
        successBg: isDarkMode ? "#1f4a1f" : "#efe",
        successText: isDarkMode ? "#6bff6b" : "#3c3",
        headerBg: isDarkMode ? "#0d0d0d" : "#1a1a1a",
        splitterColor: isDarkMode ? "#444" : "#ddd",
        splitterHover: isDarkMode ? "#555" : "#bbb",
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                backgroundColor: darkModeStyles.bg,
                color: darkModeStyles.text,
                // 设置日历 CSS 变量以支持暗色模式
                ...(isDarkMode
                    ? {
                          "--calender-bg-color": "#1a1a1a",
                          "--calender-text-color": "#e0e0e0",
                          "--calender-text-secondary-color": "#aaa",
                          "--calender-primary-text-color": "#fff",
                          "--calender-border-color": "#444",
                          "--calender-border-light-color": "#3d3d3d",
                          "--calender-border-hover-color": "#555",
                          "--calender-primary-color": "#4285f4",
                          "--calender-primary-hover-color": "#357ae8",
                          "--calender-today-bg-color": "#2d2d2d",
                          "--calender-selected-bg-color": "#2d2d2d",
                          "--calender-hover-bg-color": "#2d2d2d",
                          "--calender-hover-bg-color-light": "#3d3d3d",
                          "--calender-active-bg-color": "#3d3d3d",
                          "--calender-event-text-color": "#fff",
                      }
                    : {
                          "--calender-bg-color": "#fff",
                          "--calender-text-color": "#202124",
                          "--calender-text-secondary-color": "#5f6368",
                          "--calender-primary-text-color": "#fff",
                          "--calender-border-color": "#dadce0",
                          "--calender-border-light-color": "#e8eaed",
                          "--calender-border-hover-color": "#c4c7c5",
                          "--calender-primary-color": "#1a73e8",
                          "--calender-primary-hover-color": "#1765cc",
                          "--calender-today-bg-color": "#e8f0fe",
                          "--calender-selected-bg-color": "#e8f0fe",
                          "--calender-hover-bg-color": "#f1f3f4",
                          "--calender-hover-bg-color-light": "#f8f9fa",
                          "--calender-active-bg-color": "#e8eaed",
                          "--calender-event-text-color": "#fff",
                      }),
            } as React.CSSProperties}
        >
            {/* Header */}
            <header
                style={{
                    padding: "20px",
                    backgroundColor: darkModeStyles.headerBg,
                    color: "white",
                    borderBottom: `1px solid ${darkModeStyles.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: "24px" }}>
                        CalenderJS Demo
                    </h1>
                    <p
                        style={{
                            margin: "8px 0 0 0",
                            color: "#aaa",
                            fontSize: "14px",
                        }}
                    >
                        DSL → Data Model → Event 验证 → Calendar 显示
                    </p>
                </div>
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: isDarkMode ? "#4a4a4a" : "#4285f4",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                            ? "#5a5a5a"
                            : "#357ae8";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                            ? "#4a4a4a"
                            : "#4285f4";
                    }}
                >
                    {isDarkMode ? "☀️ 浅色模式" : "🌙 暗色模式"}
                </button>
            </header>

            {/* Main Content with Resizable Splitter */}
            <div style={{ flex: 1, overflow: "hidden" }}>
                <ResizableSplitter
                    initialLeftWidth={40}
                    minLeftWidth={20}
                    maxLeftWidth={80}
                    left={
                        <>
                            {/* Left Panel: DSL Editor */}
                            <div
                                style={{
                                    padding: "15px",
                                    backgroundColor: darkModeStyles.bgSecondary,
                                    borderBottom: `1px solid ${darkModeStyles.border}`,
                                }}
                            >
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "18px",
                                        color: darkModeStyles.text,
                                    }}
                                >
                                    DSL 编辑器
                                </h2>
                                <p
                                    style={{
                                        margin: "5px 0 0 0",
                                        fontSize: "12px",
                                        color: darkModeStyles.textSecondary,
                                    }}
                                >
                                    编辑 Event DSL 定义，实时查看编译结果
                                </p>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    position: "relative",
                                    backgroundColor: darkModeStyles.bg,
                                }}
                            >
                                <EventEditor
                                    EditorComponent={Editor}
                                    value={dslText}
                                    onChange={(value) =>
                                        setDslText(value || "")
                                    }
                                    height="100%"
                                    darkMode={isDarkMode}
                                />
                            </div>
                            {compilationError && (
                                <div
                                    style={{
                                        padding: "10px 15px",
                                        backgroundColor: darkModeStyles.errorBg,
                                        color: darkModeStyles.errorText,
                                        fontSize: "12px",
                                        borderTop: `1px solid ${darkModeStyles.border}`,
                                    }}
                                >
                                    <strong>编译错误:</strong>{" "}
                                    {compilationError}
                                </div>
                            )}
                            {!compilationError && compiledDataModel && (
                                <div
                                    style={{
                                        padding: "10px 15px",
                                        backgroundColor:
                                            darkModeStyles.successBg,
                                        color: darkModeStyles.successText,
                                        fontSize: "12px",
                                        borderTop: `1px solid ${darkModeStyles.border}`,
                                    }}
                                >
                                    <strong>✓ 编译成功:</strong>{" "}
                                    {compiledDataModel.name} (
                                    {compiledDataModel.id})
                                </div>
                            )}
                        </>
                    }
                    right={
                        <>
                            {/* Right Panel: Calendar */}
                            {/* Validation Status */}
                            <div
                                style={{
                                    padding: "15px",
                                    backgroundColor: darkModeStyles.bgTertiary,
                                    borderBottom: `1px solid ${darkModeStyles.border}`,
                                }}
                            >
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "18px",
                                        color: darkModeStyles.text,
                                    }}
                                >
                                    验证状态
                                </h2>
                                <div
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                    }}
                                >
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
                                                        ? darkModeStyles.successText
                                                        : darkModeStyles.errorText,
                                                }}
                                            >
                                                {result.valid ? "✓" : "✗"}{" "}
                                                {event?.title || result.eventId}
                                                {result.errors &&
                                                    result.errors.length >
                                                        0 && (
                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    "10px",
                                                                color: darkModeStyles.textSecondary,
                                                            }}
                                                        >
                                                            {result.errors.join(
                                                                ", "
                                                            )}
                                                        </span>
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Calendar */}
                            <div
                                style={{
                                    flex: 1,
                                    padding: "20px",
                                    overflow: "auto",
                                    backgroundColor: darkModeStyles.bg,
                                }}
                            >
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
                        </>
                    }
                />
            </div>
        </div>
    );
}
