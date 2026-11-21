import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../DemosPage.wsx";

describe("RFC-0045 DemosPage 事件编辑同步", () => {
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement("demos-page");
    document.body.appendChild(element);
    // 首次挂载后等一帧，确保子组件 wsx-calendar 完成初始化
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });

  afterEach(() => {
    element.remove();
  });

  function getCalendar() {
    const calendar = element.querySelector("wsx-calendar") as
      | (HTMLElement & {
          getEvents: () => Array<{ id: string; title: string }>;
          proposeEventUpdate?: (event: unknown) => boolean;
        })
      | null;
    if (!calendar) throw new Error("wsx-calendar 未渲染");
    return calendar;
  }

  /** @state 变化通过 requestAnimationFrame 调度重渲染，不是同步的，需等一帧再断言 DOM */
  function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function dispatchEditRequest(eventId: string) {
    const calendar = getCalendar();
    const targetEvent = calendar.getEvents().find((e) => e.id === eventId);
    if (!targetEvent) throw new Error(`找不到事件 ${eventId}`);
    element.dispatchEvent(
      new CustomEvent("event-edit-request", {
        detail: { event: targetEvent },
        bubbles: true,
      }),
    );
    await nextFrame();
  }

  it("event-edit-request 打开编辑表单并带出原标题", async () => {
    await dispatchEditRequest("site-demo-1");
    await nextFrame();
    const dialog = element.querySelector('[data-testid="demos-edit-dialog"]');
    const input = element.querySelector(
      '[data-testid="demos-edit-input-title"]',
    ) as HTMLInputElement | null;
    expect(dialog).toBeTruthy();
    expect(input?.value).toBe("团队会议");
  });

  it("event-update 成功后更新本地事件并关闭表单", async () => {
    await dispatchEditRequest("site-demo-1");
    element.dispatchEvent(
      new CustomEvent("event-update", {
        detail: {
          event: {
            id: "site-demo-1",
            type: "meeting",
            title: "已更新标题",
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
          },
        },
        bubbles: true,
      }),
    );
    await nextFrame();
    const dialog = element.querySelector('[data-testid="demos-edit-dialog"]');
    expect(dialog).toBeFalsy();
    const calendar = getCalendar();
    expect(calendar.getEvents().find((e) => e.id === "site-demo-1")?.title).toBe(
      "已更新标题",
    );
  });

  it("event-update-denied 显示权限拒绝提示且不关闭表单", async () => {
    await dispatchEditRequest("site-demo-1");
    element.dispatchEvent(
      new CustomEvent("event-update-denied", { detail: {}, bubbles: true }),
    );
    await nextFrame();
    const dialog = element.querySelector('[data-testid="demos-edit-dialog"]');
    const error = element.querySelector('[data-testid="demos-edit-error"]');
    expect(dialog).toBeTruthy();
    expect(error?.textContent).toContain("没有编辑此事件的权限");
  });

  it("event-update-error 显示校验失败提示且不关闭表单", async () => {
    await dispatchEditRequest("site-demo-1");
    element.dispatchEvent(
      new CustomEvent("event-update-error", {
        detail: { errors: ["标题不能为空"] },
        bubbles: true,
      }),
    );
    await nextFrame();
    const dialog = element.querySelector('[data-testid="demos-edit-dialog"]');
    const error = element.querySelector('[data-testid="demos-edit-error"]');
    expect(dialog).toBeTruthy();
    expect(error?.textContent).toContain("标题不能为空");
  });
});
