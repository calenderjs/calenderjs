/**
 * pointer-drag 引擎测试
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { startPointerDrag, elementFromPointDeep, findMatchAtPoint } from "../pointer-drag";

function makeTarget() {
  return {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  } as unknown as Element;
}

function makePointerEvent(
  type: string,
  props: { pointerId?: number; clientX?: number; clientY?: number; currentTarget?: Element } = {},
): PointerEvent {
  const event = new Event(type) as PointerEvent;
  Object.defineProperty(event, "pointerId", { value: props.pointerId ?? 1 });
  Object.defineProperty(event, "clientX", { value: props.clientX ?? 0 });
  Object.defineProperty(event, "clientY", { value: props.clientY ?? 0 });
  Object.defineProperty(event, "currentTarget", { value: props.currentTarget ?? null });
  return event;
}

describe("pointer-drag", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("setPointerCapture 抛错（合成输入无活跃指针）时拖拽仍继续，不中断 move/up", () => {
    const target = {
      setPointerCapture: vi.fn(() => {
        throw new DOMException("No active pointer with the given id is found.", "NotFoundError");
      }),
      releasePointerCapture: vi.fn(() => {
        throw new DOMException("No active pointer with the given id is found.", "NotFoundError");
      }),
    } as unknown as Element;
    const down = makePointerEvent("pointerdown", { pointerId: 9, clientX: 0, clientY: 0, currentTarget: target });
    const onMove = vi.fn();
    const onEnd = vi.fn();

    expect(() => startPointerDrag(down, { onMove, onEnd })).not.toThrow();

    window.dispatchEvent(makePointerEvent("pointermove", { pointerId: 9, clientX: 20, clientY: 10 }));
    expect(onMove).toHaveBeenCalledWith(20, 10, expect.any(Object));

    expect(() =>
      window.dispatchEvent(makePointerEvent("pointerup", { pointerId: 9, clientX: 20, clientY: 10 })),
    ).not.toThrow();
    expect(onEnd).toHaveBeenCalledWith(20, 10, expect.any(Object));
  });

  it("down -> move -> up：onMove 收到相对位移，onEnd 提交最终位移", () => {
    const target = makeTarget();
    const down = makePointerEvent("pointerdown", { pointerId: 1, clientX: 100, clientY: 100, currentTarget: target });
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const onCancel = vi.fn();

    startPointerDrag(down, { onMove, onEnd, onCancel });
    expect(target.setPointerCapture).toHaveBeenCalledWith(1);

    window.dispatchEvent(makePointerEvent("pointermove", { pointerId: 1, clientX: 130, clientY: 80 }));
    expect(onMove).toHaveBeenCalledWith(30, -20, expect.any(Object));

    window.dispatchEvent(makePointerEvent("pointerup", { pointerId: 1, clientX: 150, clientY: 60 }));
    expect(onEnd).toHaveBeenCalledWith(50, -40, expect.any(Object));
    expect(onCancel).not.toHaveBeenCalled();
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it("down -> cancel：触发 onCancel 而不是 onEnd，并清理监听", () => {
    const target = makeTarget();
    const down = makePointerEvent("pointerdown", { pointerId: 2, currentTarget: target });
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const onCancel = vi.fn();

    startPointerDrag(down, { onMove, onEnd, onCancel });
    window.dispatchEvent(makePointerEvent("pointercancel", { pointerId: 2 }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
    expect(target.releasePointerCapture).toHaveBeenCalledWith(2);

    // 清理后不再响应同一 pointerId 的事件
    window.dispatchEvent(makePointerEvent("pointermove", { pointerId: 2, clientX: 999 }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("忽略不相关的 pointerId", () => {
    const target = makeTarget();
    const down = makePointerEvent("pointerdown", { pointerId: 5, currentTarget: target });
    const onMove = vi.fn();
    const onEnd = vi.fn();

    startPointerDrag(down, { onMove, onEnd });
    window.dispatchEvent(makePointerEvent("pointermove", { pointerId: 999, clientX: 50 }));
    window.dispatchEvent(makePointerEvent("pointerup", { pointerId: 999 }));

    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("up 后清理监听，不残留 move 响应", () => {
    const target = makeTarget();
    const down = makePointerEvent("pointerdown", { pointerId: 3, currentTarget: target });
    const onMove = vi.fn();
    const onEnd = vi.fn();

    startPointerDrag(down, { onMove, onEnd });
    window.dispatchEvent(makePointerEvent("pointerup", { pointerId: 3 }));
    expect(onEnd).toHaveBeenCalledTimes(1);

    window.dispatchEvent(makePointerEvent("pointermove", { pointerId: 3, clientX: 500 }));
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe("elementFromPointDeep / findMatchAtPoint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("穿透一层 shadow DOM 找到真实命中元素", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    inner.className = "real-target";
    shadow.appendChild(inner);
    // jsdom 的 ShadowRoot 不实现 elementFromPoint，手动打桩
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => inner;

    vi.spyOn(document, "elementFromPoint").mockReturnValue(host);

    const result = elementFromPointDeep(10, 10);
    expect(result).toBe(inner);
  });

  it("document.elementFromPoint 命中普通元素时直接返回，不下钻", () => {
    const plain = document.createElement("div");
    vi.spyOn(document, "elementFromPoint").mockReturnValue(plain);
    expect(elementFromPointDeep(0, 0)).toBe(plain);
  });

  it("findMatchAtPoint 在命中节点的祖先链上找 selector", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const cell = document.createElement("div");
    cell.className = "week-view-hour-cell";
    const child = document.createElement("span");
    cell.appendChild(child);
    shadow.appendChild(cell);
    (shadow as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => child;

    vi.spyOn(document, "elementFromPoint").mockReturnValue(host);

    const result = findMatchAtPoint(5, 5, ".week-view-hour-cell");
    expect(result).toBe(cell);
  });

  it("没有命中任何元素时返回 null", () => {
    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    expect(findMatchAtPoint(0, 0, ".anything")).toBeNull();
  });
});
