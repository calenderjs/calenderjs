<!-- eslint-disable vue/multi-word-component-names -- 与 @calenderjs/react 的 Calendar 导出名保持一致 -->
<!--
  Vue 3 wrapper for wsx-calendar Web Component

  使用方式：
  ```vue
  <script setup lang="ts">
  import { Calendar } from "@calenderjs/vue";
  </script>

  <template>
    <Calendar
      view="month"
      :date="new Date()"
      @event-click="(e) => console.log(e.detail.event)"
    />
  </template>
  ```
-->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import type { Event } from "@calenderjs/event-model";
import type { User } from "@calenderjs/core";
import type { CalendarProps } from "./types";

// 延迟加载 Web Component，只在客户端注册
let calendarRegistered = false;
const registerCalendar = () => {
  if (typeof window !== "undefined" && !calendarRegistered) {
    import("@calenderjs/calendar");
    calendarRegistered = true;
  }
};

type WsxCalendarElement = HTMLElement & {
  view?: "month" | "week" | "day";
  date?: Date | string;
  events?: Event[];
  user?: User;
  eventTypeDefinitions?: unknown;
  getEvents?: () => Event[];
  getEventDSL?: () => string | unknown | null;
  addEvent?: (event: Event) => boolean;
  proposeEventUpdate?: (event: Event) => boolean;
  canPerformAction?: (action: string, event: Event) => boolean;
};

const props = withDefaults(defineProps<CalendarProps>(), {
  view: "month",
});

const emit = defineEmits<{
  "date-change": [event: CustomEvent<{ date: Date }>];
  "view-change": [event: CustomEvent<{ view: "month" | "week" | "day" }>];
  "event-click": [event: CustomEvent<{ event: Event }>];
  "event-edit-request": [event: CustomEvent<{ event: Event }>];
  "date-double-click": [event: CustomEvent<{ date: Date }>];
  "event-create": [event: CustomEvent<{ event: Event }>];
  "event-update": [event: CustomEvent<{ event: Event }>];
  "event-update-denied": [event: CustomEvent<{ event: Event }>];
  "event-update-error": [event: CustomEvent<{ event: Event; errors: string[] }>];
  "event-delete": [event: CustomEvent<{ event: Event }>];
  "event-action-denied": [
    event: CustomEvent<{ action: "edit" | "delete"; event: Event }>,
  ];
  "slot-click": [event: CustomEvent<{ date: Date; hour: number }>];
}>();

const calendarRef = ref<WsxCalendarElement | null>(null);

function syncProps() {
  const element = calendarRef.value;
  if (!element) return;
  if (props.view !== undefined) element.view = props.view;
  if (props.date !== undefined) {
    element.date = props.date instanceof Date ? props.date : new Date(props.date);
  }
  if (props.events !== undefined) element.events = props.events;
  if (props.user !== undefined) element.user = props.user;
  if (props.eventTypeDefinitions !== undefined) {
    element.eventTypeDefinitions = props.eventTypeDefinitions;
  }
}

onMounted(() => {
  registerCalendar();
  // 模板 ref 在 mount 后才指向真实 DOM 元素，watch 的 immediate 回调先于此执行时 ref 还是 null
  syncProps();
});

// 所有属性都通过 property 设置，不走 attribute；初始同步见 onMounted 的 syncProps()
watch(
  () => props.view,
  (view) => {
    if (calendarRef.value && view !== undefined) {
      calendarRef.value.view = view;
    }
  },
);

watch(
  () => props.date,
  (date) => {
    if (calendarRef.value && date !== undefined) {
      calendarRef.value.date = date instanceof Date ? date : new Date(date);
    }
  },
);

watch(
  () => props.events,
  (events) => {
    if (calendarRef.value && events !== undefined) {
      calendarRef.value.events = events;
    }
  },
);

watch(
  () => props.user,
  (user) => {
    if (calendarRef.value && user !== undefined) {
      calendarRef.value.user = user;
    }
  },
);

watch(
  () => props.eventTypeDefinitions,
  (eventTypeDefinitions) => {
    if (calendarRef.value && eventTypeDefinitions !== undefined) {
      calendarRef.value.eventTypeDefinitions = eventTypeDefinitions;
    }
  },
);

const handleDateChange = (e: globalThis.Event) => emit("date-change", e as CustomEvent<{ date: Date }>);
const handleViewChange = (e: globalThis.Event) =>
  emit("view-change", e as CustomEvent<{ view: "month" | "week" | "day" }>);
const handleEventClick = (e: globalThis.Event) =>
  emit("event-click", e as CustomEvent<{ event: Event }>);
const handleEventEditRequest = (e: globalThis.Event) =>
  emit("event-edit-request", e as CustomEvent<{ event: Event }>);
const handleDateDoubleClick = (e: globalThis.Event) =>
  emit("date-double-click", e as CustomEvent<{ date: Date }>);
const handleEventCreate = (e: globalThis.Event) =>
  emit("event-create", e as CustomEvent<{ event: Event }>);
const handleEventUpdate = (e: globalThis.Event) =>
  emit("event-update", e as CustomEvent<{ event: Event }>);
const handleEventUpdateDenied = (e: globalThis.Event) =>
  emit("event-update-denied", e as CustomEvent<{ event: Event }>);
const handleEventUpdateError = (e: globalThis.Event) =>
  emit("event-update-error", e as CustomEvent<{ event: Event; errors: string[] }>);
const handleEventDelete = (e: globalThis.Event) =>
  emit("event-delete", e as CustomEvent<{ event: Event }>);
const handleEventActionDenied = (e: globalThis.Event) =>
  emit(
    "event-action-denied",
    e as CustomEvent<{ action: "edit" | "delete"; event: Event }>,
  );
const handleSlotClick = (e: globalThis.Event) =>
  emit("slot-click", e as CustomEvent<{ date: Date; hour: number }>);

const LISTENERS: Array<[string, EventListener]> = [
  ["date-change", handleDateChange as EventListener],
  ["view-change", handleViewChange as EventListener],
  ["event-click", handleEventClick as EventListener],
  ["event-edit-request", handleEventEditRequest as EventListener],
  ["date-double-click", handleDateDoubleClick as EventListener],
  ["event-create", handleEventCreate as EventListener],
  ["event-update", handleEventUpdate as EventListener],
  ["event-update-denied", handleEventUpdateDenied as EventListener],
  ["event-update-error", handleEventUpdateError as EventListener],
  ["event-delete", handleEventDelete as EventListener],
  ["event-action-denied", handleEventActionDenied as EventListener],
  ["slot-click", handleSlotClick as EventListener],
];

onMounted(() => {
  const element = calendarRef.value;
  if (!element) return;
  for (const [name, handler] of LISTENERS) {
    element.addEventListener(name, handler);
  }
});

onUnmounted(() => {
  const element = calendarRef.value;
  if (!element) return;
  for (const [name, handler] of LISTENERS) {
    element.removeEventListener(name, handler);
  }
});

defineExpose({
  getElement: (): HTMLElement | null => calendarRef.value,
  setView: (view: "month" | "week" | "day") => {
    if (calendarRef.value) calendarRef.value.view = view;
  },
  setDate: (date: Date | string) => {
    if (calendarRef.value) {
      calendarRef.value.date = date instanceof Date ? date : new Date(date);
    }
  },
  goToToday: () => {
    if (calendarRef.value) calendarRef.value.date = new Date();
  },
  getEvents: (): Event[] => {
    const element = calendarRef.value;
    if (element && typeof element.getEvents === "function") {
      return element.getEvents();
    }
    return element?.events ?? [];
  },
  getEventDSL: (): string | unknown | null => {
    const element = calendarRef.value;
    if (element && typeof element.getEventDSL === "function") {
      return element.getEventDSL();
    }
    return element?.eventTypeDefinitions ?? null;
  },
  addEvent: (event: Event): boolean => {
    const element = calendarRef.value;
    if (element && typeof element.addEvent === "function") {
      return element.addEvent(event);
    }
    return false;
  },
  proposeEventUpdate: (event: Event): boolean => {
    const element = calendarRef.value;
    if (!element || typeof element.proposeEventUpdate !== "function") return false;
    return element.proposeEventUpdate(event);
  },
  canPerformAction: (action: string, event: Event): boolean => {
    const element = calendarRef.value;
    if (!element || typeof element.canPerformAction !== "function") return false;
    return element.canPerformAction(action, event);
  },
});
</script>

<template>
  <wsx-calendar ref="calendarRef" />
</template>
