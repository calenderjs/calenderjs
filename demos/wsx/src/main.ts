import "@calenderjs/calendar";
import type { Event as CalendarEvent } from "@calenderjs/event-model";

type WsxCalendarElement = HTMLElement & {
  getEvents: () => CalendarEvent[];
  proposeEventUpdate: (event: CalendarEvent) => boolean;
  events: string;
};

const today = new Date().toISOString().slice(0, 10);

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "wsx-demo-1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date(`${today}T10:00:00.000Z`),
    endTime: new Date(`${today}T11:00:00.000Z`),
    data: { attendees: ["a@example.com"], location: "会议室 A" },
  },
  {
    id: "wsx-demo-2",
    type: "meeting",
    title: "客户演示",
    startTime: new Date(`${today}T14:00:00.000Z`),
    endTime: new Date(`${today}T15:30:00.000Z`),
    data: { attendees: ["b@example.com"], location: "线上" },
  },
];

const calendar = document.getElementById("calendar") as WsxCalendarElement;
const actionLog = document.getElementById("action-log") as HTMLDivElement;
const backdrop = document.getElementById("edit-backdrop") as HTMLDivElement;
const dialogTitleInput = document.getElementById(
  "edit-title-input",
) as HTMLInputElement;
const errorEl = document.getElementById("edit-error") as HTMLParagraphElement;
const saveBtn = document.getElementById("edit-save-btn") as HTMLButtonElement;
const cancelBtn = document.getElementById("edit-cancel-btn") as HTMLButtonElement;

let editingEventId: string | null = null;
let events: CalendarEvent[] = INITIAL_EVENTS;

function setEvents(next: CalendarEvent[]) {
  events = next;
  calendar.setAttribute("events", JSON.stringify(events));
}

function log(message: string) {
  actionLog.textContent = message;
}

function openEditDialog(event: CalendarEvent) {
  editingEventId = event.id;
  dialogTitleInput.value = event.title;
  errorEl.hidden = true;
  errorEl.textContent = "";
  backdrop.hidden = false;
}

function closeEditDialog() {
  editingEventId = null;
  backdrop.hidden = true;
}

function showEditError(message: string) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

calendar.addEventListener("event-edit-request", (e: Event) => {
  const detail = (e as CustomEvent<{ event: CalendarEvent }>).detail;
  openEditDialog(detail.event);
});

calendar.addEventListener("event-update", (e: Event) => {
  const updated = (e as CustomEvent<{ event: CalendarEvent }>).detail.event;
  setEvents(
    events.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
  );
  log(`已更新事件: ${updated.title}`);
  closeEditDialog();
});

calendar.addEventListener("event-update-denied", () => {
  showEditError("没有编辑此事件的权限");
});

calendar.addEventListener("event-update-error", (e: Event) => {
  const errors = (e as CustomEvent<{ errors: string[] }>).detail.errors;
  showEditError(`校验失败: ${errors.join("、") || "请检查输入"}`);
});

saveBtn.addEventListener("click", () => {
  if (!editingEventId) return;
  const current = events.find((item) => item.id === editingEventId);
  if (!current) return;
  calendar.proposeEventUpdate({ ...current, title: dialogTitleInput.value });
});

cancelBtn.addEventListener("click", () => {
  closeEditDialog();
});

setEvents(INITIAL_EVENTS);
calendar.setAttribute("date", today);
