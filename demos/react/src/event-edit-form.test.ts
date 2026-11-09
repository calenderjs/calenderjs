import assert from "node:assert/strict";
import { test } from "node:test";
import type { Event, JSONSchema } from "@calenderjs/event-model";
import {
  formatDateTimeLocal,
  eventWithDraft,
  isLocalTimeEditable,
  parseDateTimeLocal,
  parseNumberField,
  schemaToFields,
} from "./event-edit-form.js";

test("schemaToFields maps primitive, enum, required, and unsupported fields", () => {
  const schema: JSONSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      count: { type: "number" },
      enabled: { type: "boolean" },
      status: { type: "string", enum: ["open", "closed"] },
      list: { type: "array", items: { type: "string" } },
      details: { type: "object", properties: { note: { type: "string" } } },
      empty: { type: "null" },
      mystery: {},
    },
    required: ["name", "status"],
  };

  assert.deepEqual(schemaToFields(schema), [
    { name: "name", label: "name", control: "text", required: true, options: [] },
    { name: "count", label: "count", control: "number", required: false, options: [] },
    { name: "enabled", label: "enabled", control: "checkbox", required: false, options: [] },
    { name: "status", label: "status", control: "select", required: true, options: ["open", "closed"] },
    { name: "list", label: "list", control: "readonly", required: false, options: [] },
    { name: "details", label: "details", control: "readonly", required: false, options: [] },
    { name: "empty", label: "empty", control: "readonly", required: false, options: [] },
    { name: "mystery", label: "mystery", control: "readonly", required: false, options: [] },
  ]);
  assert.deepEqual(schemaToFields(undefined), []);
  assert.deepEqual(schemaToFields({ type: "object" }), []);
  assert.deepEqual(schemaToFields({ properties: { label: { type: "string", title: "Label" } } }), [
    { name: "label", label: "Label", control: "text", required: false, options: [] },
  ]);
});

test("time helpers allow only matching named zones and parse local input", () => {
  assert.equal(isLocalTimeEditable("America/Los_Angeles", "America/Los_Angeles"), true);
  assert.equal(isLocalTimeEditable("Asia/Tokyo", "America/Los_Angeles"), false);
  assert.equal(isLocalTimeEditable(undefined, "America/Los_Angeles"), false);
  assert.equal(isLocalTimeEditable("America/Los_Angeles", undefined), false);

  const date = new Date(2026, 8, 7, 10, 15);
  assert.equal(formatDateTimeLocal(date), "2026-09-07T10:15");
  assert.equal(formatDateTimeLocal("invalid"), "");
  assert.equal(formatDateTimeLocal(undefined), "");
  assert.equal(parseDateTimeLocal("2026-09-07T10:15")?.getTime(), date.getTime());
  assert.equal(parseDateTimeLocal(""), undefined);
  assert.equal(parseDateTimeLocal("invalid"), undefined);
});

test("parseNumberField preserves empty and invalid values instead of coercing to zero", () => {
  assert.equal(parseNumberField("42"), 42);
  assert.equal(parseNumberField(""), undefined);
  assert.equal(parseNumberField("nope"), undefined);
});

test("eventWithDraft replaces editable values and preserves existing values for empty dates", () => {
  const original = {
    id: "event-1",
    type: "meeting",
    title: "Old title",
    startTime: new Date(2026, 8, 7, 10),
    endTime: new Date(2026, 8, 7, 11),
    timeZone: "America/Los_Angeles",
    data: { attendees: ["a@example.com"], location: "Old room" },
  } as Event;
  const updated = eventWithDraft(original, {
    title: "New title",
    startTime: "2026-09-07T10:30",
    endTime: "",
    data: { attendees: original.data!.attendees, location: "New room" },
  });

  assert.equal(updated.title, "New title");
  assert.equal(new Date(updated.startTime).getHours(), 10);
  assert.equal(new Date(updated.startTime).getMinutes(), 30);
  assert.equal(updated.endTime, original.endTime);
  assert.equal(updated.timeZone, original.timeZone);
  assert.deepEqual(updated.data, { attendees: ["a@example.com"], location: "New room" });
  assert.notEqual(updated.data, original.data);

  const endOnlyUpdate = eventWithDraft(original, {
    title: "Keep start",
    startTime: "",
    endTime: "2026-09-07T11:30",
    data: { ...original.data! },
  });
  assert.equal(endOnlyUpdate.startTime, original.startTime);
  assert.equal(new Date(endOnlyUpdate.endTime).getMinutes(), 30);
});
