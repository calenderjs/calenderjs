import { useState, type FormEvent } from "react";
import type { Event, JSONSchema } from "@calenderjs/event-model";
import {
  eventWithDraft,
  formatDateTimeLocal,
  isLocalTimeEditable,
  parseNumberField,
  schemaToFields,
  type SchemaField,
} from "./event-edit-form.js";

interface EventEditDialogProps {
  event: Event;
  schema?: JSONSchema;
  editable: boolean;
  browserTimeZone: string;
  error?: string;
  onSave: (event: Event) => void;
  onCancel: () => void;
}

function initialDraft(event: Event) {
  return {
    title: event.title,
    startTime: formatDateTimeLocal(event.startTime),
    endTime: formatDateTimeLocal(event.endTime),
    data: { ...(event.data ?? {}) },
  };
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null) return "未设置";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function EventEditDialog({
  event,
  schema,
  editable,
  browserTimeZone,
  error,
  onSave,
  onCancel,
}: EventEditDialogProps) {
  const [draft, setDraft] = useState(() => initialDraft(event));
  const fields = schemaToFields(schema);
  const canEditTime = isLocalTimeEditable(event.timeZone, browserTimeZone);

  function updateData(field: SchemaField, value: string | number | boolean | undefined) {
    setDraft((current) => {
      const data = { ...current.data };
      if (value === undefined || (value === "" && !field.required)) {
        delete data[field.name];
      } else {
        data[field.name] = value;
      }
      return { ...current, data };
    });
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    onSave(eventWithDraft(event, draft));
  }

  function renderField(field: SchemaField) {
    const value = draft.data[field.name];
    const disabled = !editable;
    const common = {
      id: `event-data-${field.name}`,
      "data-testid": `event-data-${field.name}`,
      name: field.name,
      disabled,
      required: field.required,
      "aria-required": field.required,
    };

    if (field.control === "readonly") {
      return (
        <output id={common.id} data-testid={common["data-testid"]} className="event-edit-readonly">
          {displayValue(value)}
        </output>
      );
    }
    if (field.control === "checkbox") {
      return (
        <input
          {...common}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(changeEvent) => updateData(field, changeEvent.target.checked)}
        />
      );
    }
    if (field.control === "select") {
      return (
        <select
          {...common}
          value={value === undefined ? "" : String(value)}
          onChange={(changeEvent) => {
            const selected = field.options.find(
              (option) => String(option) === changeEvent.target.value,
            );
            updateData(field, selected);
          }}
        >
          <option value="">选择…</option>
          {field.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      );
    }
    if (field.control === "number") {
      return (
        <input
          {...common}
          type="number"
          value={value === undefined ? "" : String(value)}
          onChange={(changeEvent) =>
            updateData(field, parseNumberField(changeEvent.target.value))
          }
        />
      );
    }
    return (
      <input
        {...common}
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(changeEvent) => updateData(field, changeEvent.target.value)}
      />
    );
  }

  return (
    <div className="event-edit-backdrop" data-testid="event-edit-backdrop">
      <section
        className="event-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-edit-title"
        data-testid="event-edit-dialog"
      >
        <header className="event-edit-header">
          <h2 id="event-edit-title">编辑事件</h2>
          <button type="button" aria-label="关闭编辑窗口" onClick={onCancel}>
            ×
          </button>
        </header>
        {!editable && (
          <p className="event-edit-notice" role="status">
            当前事件不可编辑
          </p>
        )}
        {!canEditTime && (
          <p className="event-edit-notice" role="note">
            事件时区与浏览器时区不同，时间字段只读
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="event-edit-field" htmlFor="input-edit-title">
            <span>标题 *</span>
            <input
              id="input-edit-title"
              data-testid="input-edit-title"
              type="text"
              required
              disabled={!editable}
              value={draft.title}
              onChange={(changeEvent) =>
                setDraft((current) => ({ ...current, title: changeEvent.target.value }))
              }
            />
          </label>
          <label className="event-edit-field" htmlFor="input-edit-start-time">
            <span>开始时间 *</span>
            <input
              id="input-edit-start-time"
              data-testid="input-edit-start-time"
              type="datetime-local"
              required
              disabled={!editable || !canEditTime}
              value={draft.startTime}
              onChange={(changeEvent) =>
                setDraft((current) => ({ ...current, startTime: changeEvent.target.value }))
              }
            />
          </label>
          <label className="event-edit-field" htmlFor="input-edit-end-time">
            <span>结束时间 *</span>
            <input
              id="input-edit-end-time"
              data-testid="input-edit-end-time"
              type="datetime-local"
              required
              disabled={!editable || !canEditTime}
              value={draft.endTime}
              onChange={(changeEvent) =>
                setDraft((current) => ({ ...current, endTime: changeEvent.target.value }))
              }
            />
          </label>
          {fields.map((field) => (
            <label
              className="event-edit-field"
              htmlFor={`event-data-${field.name}`}
              key={field.name}
            >
              <span>{field.label}{requiredMarkFor(field)}</span>
              {renderField(field)}
            </label>
          ))}
          {error && <p className="event-edit-error" role="alert" data-testid="edit-error">{error}</p>}
          <footer className="event-edit-actions">
            <button type="button" className="event-edit-cancel" onClick={onCancel}>
              取消
            </button>
            {editable && (
              <button type="submit" data-testid="btn-save-edit">
                保存
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}

function requiredMarkFor(field: SchemaField): string {
  return field.required ? " *" : "";
}
