/**
 * 共用 pointer-event 拖拽引擎
 *
 * 替代原生 HTML5 Drag and Drop（draggable/dataTransfer）：原生 DnD 依赖浏览器/OS
 * 级手势识别，对真实指针输入不稳定（实测真实鼠标拖拽有时完全不触发 dragstart），
 * 且没有可靠的中间态坐标用于实时视觉反馈。本模块用 pointerdown/pointermove/
 * pointerup 手写状态机，配合 setPointerCapture 保证指针移出元素边界也能持续收到
 * move 事件。
 *
 * 不耦合任何业务语义（不知道「小时格」「事件」是什么），只提供相对位移回调，
 * 由调用方（WeekView/DayView/resize）自行换算成具体的时间/日期/高度。
 */

export interface PointerDragHandlers {
  onMove: (dx: number, dy: number, moveEvent: PointerEvent) => void;
  onEnd: (dx: number, dy: number, endEvent: PointerEvent) => void;
  onCancel?: () => void;
}

export function startPointerDrag(
  downEvent: PointerEvent,
  handlers: PointerDragHandlers,
  captureTarget?: Element,
): void {
  const target = captureTarget ?? downEvent.currentTarget as Element | null;
  const pointerId = downEvent.pointerId;
  const startX = downEvent.clientX;
  const startY = downEvent.clientY;

  try {
    target?.setPointerCapture?.(pointerId);
  } catch {
    // 某些合成/测试输入没有「活跃指针」，setPointerCapture 会抛错；
    // 拖拽仍可继续——只是指针移出元素边界时可能丢失 capture 带来的持续跟踪。
  }

  const handleMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    handlers.onMove(moveEvent.clientX - startX, moveEvent.clientY - startY, moveEvent);
  };

  const handleUp = (upEvent: PointerEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    cleanup();
    handlers.onEnd(upEvent.clientX - startX, upEvent.clientY - startY, upEvent);
  };

  const handleCancel = (cancelEvent: PointerEvent) => {
    if (cancelEvent.pointerId !== pointerId) return;
    cleanup();
    handlers.onCancel?.();
  };

  function cleanup() {
    try {
      target?.releasePointerCapture?.(pointerId);
    } catch {
      // capture 本就可能未成功建立，释放失败不影响清理监听器
    }
    window.removeEventListener("pointermove", handleMove, true);
    window.removeEventListener("pointerup", handleUp, true);
    window.removeEventListener("pointercancel", handleCancel, true);
  }

  window.addEventListener("pointermove", handleMove, true);
  window.addEventListener("pointerup", handleUp, true);
  window.addEventListener("pointercancel", handleCancel, true);
}

/**
 * 穿透 shadow DOM 边界的 elementFromPoint。
 *
 * `document.elementFromPoint`/`elementsFromPoint` 不会穿过 shadow boundary——
 * 遇到 shadow host 就停在 host 本身，不会进入其 shadowRoot 继续命中测试。
 * WeekView/DayView 都是嵌套在 <wsx-calendar> 的 shadow DOM 里的自定义元素，
 * 拖拽松手时用坐标找落点格子必须手动下钻每一层 shadowRoot。
 */
export function elementFromPointDeep(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

/** 在 elementFromPointDeep 命中的节点及其祖先链里找第一个匹配 selector 的元素 */
export function findMatchAtPoint(x: number, y: number, selector: string): HTMLElement | null {
  return elementFromPointDeep(x, y)?.closest(selector) as HTMLElement | null ?? null;
}
