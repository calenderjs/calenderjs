import type { Event } from "@calenderjs/event-model";
import type { EventDetailPlugin, EventDetailDescription } from "./types";

export class EventDetailPluginRegistry {
  private plugins: EventDetailPlugin[] = [];

  register(plugin: EventDetailPlugin): void {
    if (this.plugins.some((p) => p.name === plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.push(plugin);
  }

  unregister(name: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== name);
  }

  /** 按 event.type 查找优先级最高的匹配插件，没有则退到 "*" 默认插件 */
  describe(event: Event): EventDetailDescription {
    const candidates = this.plugins
      .filter((p) => p.type !== "*" && p.supports(event))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const plugin = candidates[0] ?? this.plugins.find((p) => p.type === "*");
    if (!plugin) {
      return { title: event.title, fields: [] };
    }
    return plugin.describe(event);
  }
}
