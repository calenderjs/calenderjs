/**
 * 属性升级工具测试
 */

import { describe, it, expect } from "vitest";
import { upgradeProperty, upgradeProperties } from "../upgrade-property";

class Host {
  received: unknown[] = [];

  get value(): unknown {
    return this.received[this.received.length - 1];
  }
  set value(next: unknown) {
    this.received.push(next);
  }

  get other(): unknown {
    return this.received[this.received.length - 1];
  }
  set other(next: unknown) {
    this.received.push(next);
  }
}

describe("upgrade-property", () => {
  it("把升级前写入的自有数据属性重新过一遍 setter", () => {
    const host = new Host();
    // 模拟 customElements 升级前赋值
    Object.defineProperty(host, "value", {
      value: 42,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    expect(host.received).toEqual([]);

    upgradeProperty(host, "value");

    expect(host.received).toEqual([42]);
    expect(Object.prototype.hasOwnProperty.call(host, "value")).toBe(false);
    expect(host.value).toBe(42);
  });

  it("没有自有属性时不做任何事", () => {
    const host = new Host();
    upgradeProperty(host, "value");
    expect(host.received).toEqual([]);
  });

  it("自有访问器（如 @state）不被升级", () => {
    const host = new Host();
    let stored: unknown = "kept";
    Object.defineProperty(host, "value", {
      get: () => stored,
      set: (next: unknown) => {
        stored = next;
      },
      configurable: true,
    });

    upgradeProperty(host, "value");

    expect(host.received).toEqual([]);
    expect(host.value).toBe("kept");
  });

  it("批量升级多个属性", () => {
    const host = new Host();
    for (const [prop, value] of [
      ["value", 1],
      ["other", 2],
    ] as const) {
      Object.defineProperty(host, prop, {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    upgradeProperties(host, ["value", "other"]);

    expect(host.received).toEqual([1, 2]);
  });
});
