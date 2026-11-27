<script setup lang="ts">
import { ref, reactive } from "vue";
import { Calendar } from "@calenderjs/vue";
import type { Event as CalendarEvent } from "@calenderjs/event-model";

const today = new Date().toISOString().slice(0, 10);

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "vue-demo-1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date(`${today}T10:00:00.000Z`),
    endTime: new Date(`${today}T11:00:00.000Z`),
    data: { attendees: ["a@example.com"], location: "会议室 A" },
  },
  {
    id: "vue-demo-2",
    type: "meeting",
    title: "客户演示",
    startTime: new Date(`${today}T14:00:00.000Z`),
    endTime: new Date(`${today}T15:30:00.000Z`),
    data: { attendees: ["b@example.com"], location: "线上" },
  },
];

const calendarRef = ref<InstanceType<typeof Calendar> | null>(null);
const events = ref<CalendarEvent[]>(INITIAL_EVENTS);
const actionLog = ref("");

const editState = reactive({
  open: false,
  eventId: null as string | null,
  title: "",
  error: "",
});

function openEditDialog(event: CalendarEvent) {
  editState.open = true;
  editState.eventId = event.id;
  editState.title = event.title;
  editState.error = "";
}

function closeEditDialog() {
  editState.open = false;
  editState.eventId = null;
}

function onEventEditRequest(e: CustomEvent<{ event: CalendarEvent }>) {
  openEditDialog(e.detail.event);
}

function onEventUpdate(e: CustomEvent<{ event: CalendarEvent }>) {
  const updated = e.detail.event;
  events.value = events.value.map((item) =>
    item.id === updated.id ? { ...item, ...updated } : item,
  );
  actionLog.value = `已更新事件: ${updated.title}`;
  closeEditDialog();
}

function onEventUpdateDenied() {
  editState.error = "没有编辑此事件的权限";
}

function onEventUpdateError(e: CustomEvent<{ errors: string[] }>) {
  editState.error = `校验失败: ${e.detail.errors.join("、") || "请检查输入"}`;
}

function handleSave() {
  if (!editState.eventId) return;
  const current = events.value.find((item) => item.id === editState.eventId);
  if (!current) return;
  calendarRef.value?.proposeEventUpdate({ ...current, title: editState.title });
}
</script>

<template>
  <header class="demo-header">
    <h1>CalenderJS Vue Demo</h1>
    <p>基于 @calenderjs/vue 封装，不依赖原生 WSX/React 实现细节</p>
  </header>
  <div
    id="action-log"
    data-testid="demo-action-log"
  >
    {{ actionLog }}
  </div>
  <div id="calendar-container">
    <Calendar
      ref="calendarRef"
      :view="'month'"
      :date="today"
      :events="events"
      @event-edit-request="onEventEditRequest"
      @event-update="onEventUpdate"
      @event-update-denied="onEventUpdateDenied"
      @event-update-error="onEventUpdateError"
    />
  </div>
  <div
    v-if="editState.open"
    class="demo-edit-backdrop"
    data-testid="demos-edit-backdrop"
  >
    <div
      class="demo-edit-dialog"
      role="dialog"
      aria-modal="true"
      data-testid="demos-edit-dialog"
    >
      <h2>编辑事件</h2>
      <label>
        <span>标题</span>
        <input
          v-model="editState.title"
          type="text"
          data-testid="demos-edit-input-title"
        >
      </label>
      <p
        v-if="editState.error"
        class="demo-edit-error"
        role="alert"
        data-testid="demos-edit-error"
      >
        {{ editState.error }}
      </p>
      <div class="demo-edit-actions">
        <button
          type="button"
          @click="closeEditDialog"
        >
          取消
        </button>
        <button
          type="button"
          data-testid="demos-edit-save"
          @click="handleSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
