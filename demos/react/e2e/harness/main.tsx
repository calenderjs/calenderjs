import React, { useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Calendar, type CalendarRef } from "@calenderjs/react";
import type { Event } from "@calenderjs/event-model";

// 模块级稳定引用：首挂载必须靠 wrapper 自身应用 props，不能靠父组件二次渲染补齐。
const INITIAL_DATE = new Date("2026-08-20T10:00:00");
const INITIAL_EVENTS: Event[] = [
  {
    id: "initial",
    type: "meeting",
    title: "首次挂载事件",
    startTime: INITIAL_DATE,
    endTime: new Date("2026-08-20T11:00:00"),
  },
];
const UPDATED_EVENTS: Event[] = [
  {
    id: "updated",
    type: "meeting",
    title: "属性更新事件",
    startTime: new Date("2026-08-21T14:00:00"),
    endTime: new Date("2026-08-21T15:00:00"),
  },
];

function Harness() {
  const calendar = useRef<CalendarRef>(null);
  const [mounted, setMounted] = useState(true);
  const [updated, setUpdated] = useState(false);
  // 累计计数供契约断言：每次用户动作恰 +1，重挂载不得偷加。
  const [calls, setCalls] = useState({ event: 0, date: 0, view: 0, double: 0 });
  const onEventClick = useCallback(
    () => setCalls((value) => ({ ...value, event: value.event + 1 })),
    [],
  );
  const onDateChange = useCallback(
    () => setCalls((value) => ({ ...value, date: value.date + 1 })),
    [],
  );
  const onViewChange = useCallback(
    () => setCalls((value) => ({ ...value, view: value.view + 1 })),
    [],
  );
  const onDateDoubleClick = useCallback(
    () => setCalls((value) => ({ ...value, double: value.double + 1 })),
    [],
  );

  return (
    <main>
      <h1>React Calendar 契约验证</h1>
      <button onClick={() => setUpdated(true)}>更新属性</button>
      <button onClick={() => calendar.current?.setView("month")}>
        命令切月
      </button>
      <button onClick={() => calendar.current?.setDate("2026-08-20T10:00:00")}>
        命令设置日期
      </button>
      <button onClick={() => calendar.current?.goToToday()}>命令回今天</button>
      <button onClick={() => setMounted((value) => !value)}>
        {mounted ? "卸载日历" : "挂载日历"}
      </button>
      <output data-testid="calls">{JSON.stringify(calls)}</output>
      {mounted && (
        <Calendar
          ref={calendar}
          view="day"
          date={updated ? "2026-08-21T14:00:00" : INITIAL_DATE}
          events={updated ? UPDATED_EVENTS : INITIAL_EVENTS}
          onEventClick={onEventClick}
          onDateChange={onDateChange}
          onViewChange={onViewChange}
          onDateDoubleClick={onDateDoubleClick}
          style={{ display: "block", height: 900 }}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Harness />
  </React.StrictMode>,
);
