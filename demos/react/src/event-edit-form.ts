import type { Event } from "@calenderjs/event-model";
import type { JSONSchema } from "@calenderjs/event-model";

export type SchemaFieldControl = "text" | "number" | "checkbox" | "select" | "readonly";

export interface SchemaField {
  name: string;
  label: string;
  control: SchemaFieldControl;
  required: boolean;
  options: Array<string | number>;
}

export function schemaToFields(schema?: JSONSchema): SchemaField[] {
  return Object.entries(schema?.properties ?? {}).map(([name, property]) => {
    const options = property.enum ?? [];
    const control: SchemaFieldControl = options.length
      ? "select"
      : property.type === "string"
        ? "text"
        : property.type === "number"
          ? "number"
          : property.type === "boolean"
            ? "checkbox"
            : "readonly";

    return {
      name,
      label: property.title ?? name,
      control,
      required: schema?.required?.includes(name) ?? false,
      options,
    };
  });
}

export function isLocalTimeEditable(
  eventTimeZone?: string,
  browserTimeZone?: string,
): boolean {
  return Boolean(eventTimeZone && browserTimeZone && eventTimeZone === browserTimeZone);
}

export function formatDateTimeLocal(value: Date | string | undefined): string {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseNumberField(value: string): number | undefined {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

export function eventWithDraft(
  event: Event,
  draft: { title: string; startTime: string; endTime: string; data: Record<string, unknown> },
): Event {
  const startTime = parseDateTimeLocal(draft.startTime);
  const endTime = parseDateTimeLocal(draft.endTime);
  return {
    ...event,
    title: draft.title,
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
    data: { ...draft.data },
  };
}
