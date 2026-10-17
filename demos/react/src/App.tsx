import {
  Calendar,
  ResizableSplitter,
  type CalendarRef,
} from "@calenderjs/react";
import { EventEditor } from "@calenderjs/react-event-editor";
import type { Event } from "@calenderjs/event-model";
import {
  EventDSLCompiler,
  EventDataGenerator,
  parseEventDSL,
} from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import { EventValidator } from "@calenderjs/event-model";
import { useState, useEffect, useMemo, useRef } from "react";
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
  const calendarRef = useRef<CalendarRef>(null);
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
  const [actionLog, setActionLog] = useState<string>("");

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

  // 拖拽移动、键盘上下键移动或调整时长后同步更新事件 (RFC-0020, RFC-0021)
  const handleEventUpdate = (e: CustomEvent<{ event: Event }>) => {
    const updated = e.detail.event;
    setEvents((prev) =>
      prev.map((item) =>
        item.id === updated.id ? { ...item, ...updated } : item,
      ),
    );
    setActionLog(`已更新事件: ${updated.title}`);
  };

  // 点击时间槽快速新建事件 (RFC-0005)
  const handleSlotClick = (e: CustomEvent<{ date: Date; hour: number }>) => {
    const validHour = Math.min(17, Math.max(9, e.detail.hour));
    const startTime = new Date(e.detail.date);
    startTime.setHours(validHour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const newEvent: Event = {
      id: `slot-event-${Date.now()}`,
      type: "meeting",
      title: "时段预约",
      startTime,
      endTime,
      timeZone: LOCAL_TIME_ZONE,
      data: {
        attendees: ["slot@example.com"],
        location: "快速预约室",
      },
    };
    setEvents((prev) => [...prev, newEvent]);
    setActionLog(`已在 ${validHour}:00 创建时段预约`);
  };

  // 示例 1：通过 EventDataGenerator 根据 DSL 生成并添加新事件 (RFC-0011)
  const handleAddGeneratedEvent = () => {
    const generator = new EventDataGenerator({ timeZone: LOCAL_TIME_ZONE });
    const start = new Date(currentDate);
    start.setHours(11, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(12, 0, 0, 0);
    const generated = generator.generateEvent(dslText, {
      id: `gen-${events.length + 1}`,
      title: "DSL生成会议",
      startTime: start,
      endTime: end,
      data: {
        attendees: ["dsl-gen@example.com"],
        location: "B座会议室",
      },
    });
    setEvents((prev) => [...prev, generated]);
    setActionLog(`已通过 EventDataGenerator 创建: ${generated.title}`);
  };

  // 示例 2：添加重复事件 (Recurring Events - RFC-0005)
  const handleAddRecurringEvent = () => {
    const start = new Date(currentDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(9, 30, 0, 0);
    const recurringEvent: Event = {
      id: "event-recurring",
      type: "meeting",
      title: "每日站会(重复)",
      startTime: start,
      endTime: end,
      timeZone: LOCAL_TIME_ZONE,
      recurring: {
        frequency: "daily",
        interval: 1,
        count: 5,
      },
      data: {
        attendees: ["team@example.com"],
        location: "线上",
      },
    };
    setEvents((prev) => [
      ...prev.filter((e) => e.id !== "event-recurring"),
      recurringEvent,
    ]);
    setActionLog("已添加连续 5 天重复事件: 每日站会(重复)");
  };

  // 示例 3：100 条密集事件虚拟化压测 (RFC-0023)
  const handleStressVirtualization = () => {
    const dense: Event[] = Array.from({ length: 100 }, (_, i) => {
      const hour = 9 + (i % 9);
      const min = (i * 5) % 45;
      const start = new Date(currentDate);
      start.setHours(hour, min, 0, 0);
      const end = new Date(start.getTime() + 15 * 60 * 1000);
      return {
        id: `stress-${i + 1}`,
        type: "meeting",
        title: `压测事件 #${i + 1}`,
        startTime: start,
        endTime: end,
        timeZone: LOCAL_TIME_ZONE,
        data: {
          attendees: ["stress@example.com"],
          location: "压测区",
        },
      };
    });
    setEvents(dense);
    setCurrentView("day");
    setActionLog("已加载 100 条密集事件并切换至日视图（视口虚拟化生效）");
  };

  // 示例 4：从日历组件 API 检索最新 Event DSL 与事件列表
  const handleExportState = () => {
    const exportedEvents = calendarRef.current!.getEvents();
    const exportedDsl = calendarRef.current!.getEventDSL();
    setActionLog(
      `API导出成功: ${exportedEvents.length} 条渲染事件 | DSL长度: ${String(exportedDsl).length}`,
    );
  };

  // 重置为默认数据
  const handleResetDemo = () => {
    setEvents(DEFAULT_EVENTS);
    setActionLog("已重置为默认示例事件");
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
              {/* 右侧面板：验证状态、功能示例工具栏与日历视图 */}
              <div className="demo-validation-panel">
                <div className="demo-validation-header">
                  <h2>验证状态</h2>
                  <div
                    className="demo-feature-toolbar"
                    role="group"
                    aria-label="功能示例"
                  >
                    <button
                      type="button"
                      className="demo-feature-btn"
                      data-testid="btn-add-event"
                      onClick={handleAddGeneratedEvent}
                    >
                      ➕ DSL新建事件
                    </button>
                    <button
                      type="button"
                      className="demo-feature-btn"
                      data-testid="btn-add-recurring"
                      onClick={handleAddRecurringEvent}
                    >
                      🔁 重复事件
                    </button>
                    <button
                      type="button"
                      className="demo-feature-btn"
                      data-testid="btn-stress-100"
                      onClick={handleStressVirtualization}
                    >
                      ⚡ 100事件虚拟化
                    </button>
                    <button
                      type="button"
                      className="demo-feature-btn"
                      data-testid="btn-export-dsl"
                      onClick={handleExportState}
                    >
                      📤 API导出DSL
                    </button>
                    <button
                      type="button"
                      className="demo-feature-btn"
                      data-testid="btn-reset-demo"
                      onClick={handleResetDemo}
                    >
                      🔄 重置
                    </button>
                  </div>
                </div>
                {actionLog && (
                  <div
                    className="demo-action-log"
                    data-testid="demo-action-log"
                  >
                    {actionLog}
                  </div>
                )}
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
                  ref={calendarRef}
                  view={currentView}
                  date={currentDate}
                  events={renderedEvents as any}
                  eventTypeDefinitions={compiledDataModel ? dslText : ""}
                  onDateChange={handleDateChange}
                  onViewChange={handleViewChange}
                  onEventClick={handleEventClick}
                  onEventUpdate={handleEventUpdate}
                  onSlotClick={handleSlotClick}
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

