import { Calendar, ResizableSplitter } from "@calenderjs/react";
import { EventEditor } from "@calenderjs/react-event-editor";
import type { Event } from "@calenderjs/event-model";
import { EventDSLCompiler, parseEventDSL } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import { useState, useEffect, useMemo } from "react";
import { Editor } from "@monaco-editor/react";

const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    timeZone: LOCAL_TIME_ZONE,
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
    timeZone: LOCAL_TIME_ZONE,
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
    "month",
  );
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<
    Array<{ eventId: string; valid: boolean; errors?: string[] }>
  >([]);
  const [renderedEvents, setRenderedEvents] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 同步品牌主题属性至 documentElement
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  // 编译 DSL
  const compiledDataModel = useMemo(() => {
    try {
      setCompilationError(null);
      const ast = parseEventDSL(dslText);
      const compiler = new EventDSLCompiler();
      const dataModel = compiler.compileFromAST([ast]);
      return dataModel.types[0];
    } catch (error) {
      setCompilationError((error as Error).message);
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

      // 验证 data
      if (compiledDataModel.dataSchema) {
        const dataValidation = eventValidator.validateData(
          event,
          compiledDataModel.dataSchema,
        );
        if (!dataValidation.valid) {
          results.push({
            eventId: event.id,
            valid: false,
            errors: dataValidation.errors,
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
    e: CustomEvent<{ view: "month" | "week" | "day" }>,
  ) => {
    setCurrentView(e.detail.view);
  };

  const handleEventClick = (e: CustomEvent<{ event: Event }>) => {
    // 打印 id，避免 Proxy 在控制台显示为 Proxy(Object) 导致验收无法断言。
    console.log("Event clicked:", e.detail.event.id);
  };

  return (
    <div className="demo-app" data-theme={isDarkMode ? "dark" : "light"}>
      {/* 品牌风格 Header */}
      <header className="demo-header">
        <div className="demo-brand">
          <div className="demo-brand-logo" aria-hidden="true">
            📅
          </div>
          <div className="demo-title-group">
            <h1>CalenderJS Demo</h1>
            <p>DSL → Data Model → Event 验证 → Calendar 显示</p>
          </div>
        </div>
        <button
          className="demo-theme-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? "☀️ 浅色模式" : "🌙 暗色模式"}
        </button>
      </header>

      {/* 主工作区 - 可拖拽分割面板 */}
      <div className="demo-main">
        <ResizableSplitter
          initialLeftWidth={40}
          minLeftWidth={20}
          maxLeftWidth={80}
          left={
            <>
              {/* 左侧面板：DSL 编辑器 */}
              <div className="demo-panel-header">
                <h2>DSL 编辑器</h2>
                <p>编辑 Event DSL 定义，实时查看编译结果</p>
              </div>
              <div className="demo-editor-container">
                <EventEditor
                  EditorComponent={Editor}
                  value={dslText}
                  onChange={(value = "") => setDslText(value)}
                  height="100%"
                  darkMode={isDarkMode}
                />
              </div>
              {compilationError && (
                <div className="demo-status-banner demo-status-error">
                  <strong>编译错误:</strong> {compilationError}
                </div>
              )}
              {!compilationError && compiledDataModel && (
                <div className="demo-status-banner demo-status-success">
                  <strong>✓ 编译成功:</strong> {compiledDataModel.name} (
                  {compiledDataModel.id})
                </div>
              )}
            </>
          }
          right={
            <>
              {/* 右侧面板：验证状态与日历视图 */}
              <div className="demo-validation-panel">
                <h2>验证状态</h2>
                <div className="demo-validation-list">
                  {validationResults.map((result) => {
                    const event = events.find((e) => e.id === result.eventId);
                    return (
                      <div
                        key={result.eventId}
                        className={`demo-validation-item ${result.valid ? "valid" : "invalid"}`}
                      >
                        <span className="demo-validation-indicator">
                          {result.valid ? "✓" : "✗"}
                        </span>{" "}
                        {event?.title || result.eventId}
                        {result.errors && result.errors.length > 0 && (
                          <span className="demo-validation-errors">
                            {result.errors.join(", ")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 日历展示区域 */}
              <div className="demo-calendar-container">
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
