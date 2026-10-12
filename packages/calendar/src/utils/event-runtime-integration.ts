/**
 * EventRuntime 与 Calendar 的集成工具（纯函数）
 */
import type {
  Event,
  EventDSLDataModel,
  RenderedEvent,
  ValidationResult,
} from "@calenderjs/event-model";
import type { RenderContext, User, ValidationContext } from "@calenderjs/core";
import { EventRuntime } from "@calenderjs/event-runtime";
import { expandRecurringEvents } from "./event-utils";

/** 从编译后的 Data Model 构建按 type 索引的 Runtime 映射 */
export function createRuntimeMap(
  dataModel: EventDSLDataModel,
): Map<string, EventRuntime> {
  const map = new Map<string, EventRuntime>();
  for (const typeModel of dataModel.types) {
    map.set(typeModel.id, new EventRuntime(typeModel));
  }
  return map;
}

/** 将 Runtime 渲染结果合并回 Event（供视图显示） */
export function mergeRenderedIntoEvent(
  event: Event,
  rendered: RenderedEvent,
): Event {
  return {
    ...event,
    title: rendered.title ?? event.title,
    color: rendered.color ?? event.color,
    icon: rendered.icon ?? event.icon,
    // render() 默认 description 为 ""，空串不覆盖已有 data.description
    ...(rendered.description
      ? { data: { ...event.data, description: rendered.description } }
      : {}),
  };
}

/** 有 Runtime 时增强事件显示数据，展开重复事件为实例；否则原样展开返回 */
export function getDisplayEvents(
  events: Event[],
  runtimeByType: Map<string, EventRuntime> | null,
  user?: User,
): Event[] {
  const expanded = expandRecurringEvents(events);
  if (!runtimeByType || runtimeByType.size === 0) {
    return expanded;
  }

  const renderContext: RenderContext = { user };

  return expanded.map((event) => {
    const runtime = runtimeByType.get(event.type);
    if (!runtime) {
      return event;
    }
    return mergeRenderedIntoEvent(event, runtime.render(event, renderContext));
  });
}

/** 构建 Runtime 验证上下文 */
export function buildValidationContext(
  events: Event[],
  user?: User,
): ValidationContext {
  return {
    events,
    now: new Date(),
    user,
  };
}

/** 使用 EventRuntime 验证单个事件 */
export function validateEventWithRuntime(
  event: Event,
  runtimeByType: Map<string, EventRuntime> | null,
  allEvents: Event[],
  user?: User,
): ValidationResult {
  if (!runtimeByType || runtimeByType.size === 0) {
    return { valid: true, errors: [] };
  }

  const runtime = runtimeByType.get(event.type);
  if (!runtime) {
    return { valid: true, errors: [] };
  }

  return runtime.validate(event, buildValidationContext(allEvents, user));
}

/** 使用 EventRuntime 检查行为权限 */
export function canPerformEventAction(
  action: string,
  event: Event,
  runtimeByType: Map<string, EventRuntime> | null,
  user?: User,
): boolean {
  if (!runtimeByType || runtimeByType.size === 0 || !user) {
    return true;
  }

  const runtime = runtimeByType.get(event.type);
  if (!runtime) {
    return true;
  }

  return runtime.canPerform(action, event, user);
}
