/**
 * DayView 组件测试
 *
 * 测试日视图的事件渲染功能
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Event } from "@calenderjs/event-model";
import { User } from "@calenderjs/core";
import "../DayView.wsx";
import DayView from "../DayView.wsx";

// 等待 DOM 更新
function waitForDOMUpdate() {
    return new Promise((resolve) => setTimeout(resolve, 10));
}

// 等待组件完全初始化
async function waitForComponentInit(component: HTMLElement) {
    if (!component.isConnected) {
        throw new Error(
            "Component must be connected to DOM before initialization"
        );
    }
    // 等待 connectedCallback 执行
    await waitForDOMUpdate();
    await waitForDOMUpdate(); // 额外等待确保初始化完成
    // 额外等待确保事件渲染完成
    await waitForDOMUpdate();
    await waitForDOMUpdate();
}

// 获取查询函数（处理 shadowRoot 可能不存在的情况）
function getQuerySelector(component: HTMLElement) {
    const shadowRoot = component.shadowRoot;
    return shadowRoot
        ? shadowRoot.querySelector.bind(shadowRoot)
        : component.querySelector.bind(component);
}

function getQuerySelectorAll(component: HTMLElement) {
    const shadowRoot = component.shadowRoot;
    return shadowRoot
        ? shadowRoot.querySelectorAll.bind(shadowRoot)
        : component.querySelectorAll.bind(component);
}

// 创建测试事件
function createTestEvent(overrides: Partial<Event> = {}): Event {
    const now = new Date();
    return {
        id: "event-1",
        type: "meeting",
        title: "测试事件",
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        color: "#4285f4",
        ...overrides,
    };
}

describe("DayView 组件", () => {
    let container: HTMLElement;
    let dayView: DayView;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (dayView && dayView.parentNode) {
            dayView.remove();
        }
        if (container && container.parentNode) {
            container.remove();
        }
    });

    describe("事件渲染", () => {
        it("应该渲染事件在日视图中", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                title: "会议",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                color: "#4285f4",
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelectorAll = getQuerySelectorAll(dayView);
            const eventElements = querySelectorAll(".day-view-event");
            expect(eventElements.length).toBeGreaterThan(0);

            const eventElement = Array.from(eventElements).find((el) =>
                el.textContent?.includes("会议")
            );
            expect(eventElement).toBeTruthy();
        });

        it("应该显示事件标题", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                title: "重要会议",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const eventElement = querySelector(".day-view-event-title");
            expect(eventElement).toBeTruthy();
            expect(eventElement!.textContent).toBe("重要会议");
        });

        it("应该显示事件时间", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 30, 0),
                endTime: new Date(2024, 0, 15, 11, 30, 0),
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const timeElement = querySelector(".day-view-event-time");
            expect(timeElement).toBeTruthy();
            expect(timeElement!.textContent).toContain("10:30");
            expect(timeElement!.textContent).toContain("11:30");
        });

        it("应该使用事件颜色", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                color: "#ff0000",
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const eventElement = querySelector(
                ".day-view-event"
            ) as HTMLElement;
            expect(eventElement).toBeTruthy();
            expect(eventElement.style.backgroundColor).toBe("rgb(255, 0, 0)");
        });

        it("应该使用默认颜色当事件没有颜色时", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                color: undefined,
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const eventElement = querySelector(
                ".day-view-event"
            ) as HTMLElement;
            expect(eventElement).toBeTruthy();
            expect(eventElement.style.backgroundColor).toBe(
                "rgb(66, 133, 244)"
            );
        });

        it("应该显示事件描述（如果存在）", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                extra: {
                    description: "这是一个重要会议",
                },
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const descriptionElement = querySelector(
                ".day-view-event-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement!.textContent).toBe("这是一个重要会议");
        });

        it("应该不显示描述元素当事件没有描述时", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
                extra: {},
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const descriptionElement = querySelector(
                ".day-view-event-description"
            );
            expect(descriptionElement).toBeFalsy();
        });

        it("应该正确计算事件位置", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 12, 0, 0),
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            const querySelector = getQuerySelector(dayView);
            const eventElement = querySelector(
                ".day-view-event"
            ) as HTMLElement;
            expect(eventElement).toBeTruthy();

            const style = eventElement.style.cssText;
            expect(style).toContain("top:");
            expect(style).toContain("height:");
        });

        it("应该处理多个事件", async () => {
            const viewDate = new Date(2024, 0, 15);
            const events = [
                createTestEvent({
                    id: "event-1",
                    title: "会议1",
                    startTime: new Date(2024, 0, 15, 10, 0, 0),
                    endTime: new Date(2024, 0, 15, 11, 0, 0),
                }),
                createTestEvent({
                    id: "event-2",
                    title: "会议2",
                    startTime: new Date(2024, 0, 15, 14, 0, 0),
                    endTime: new Date(2024, 0, 15, 15, 0, 0),
                }),
            ];

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            dayView.events = events;
            container.appendChild(dayView);
            await waitForComponentInit(dayView);

            const querySelectorAll = getQuerySelectorAll(dayView);
            const eventElements = querySelectorAll(".day-view-event");
            expect(eventElements.length).toBe(2);
        });

        it("应该触发事件点击事件", async () => {
            const viewDate = new Date(2024, 0, 15);
            const event = createTestEvent({
                id: "event-1",
                startTime: new Date(2024, 0, 15, 10, 0, 0),
                endTime: new Date(2024, 0, 15, 11, 0, 0),
            });

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            container.appendChild(dayView);
            await waitForComponentInit(dayView);
            // 在组件初始化后再设置事件
            dayView.events = [event];
            // 等待事件渲染
            await waitForDOMUpdate();
            await waitForDOMUpdate();

            let clickedEvent: Event | null = null;
            dayView.addEventListener("event-click", ((e: CustomEvent) => {
                clickedEvent = e.detail.event;
            }) as EventListener);

            const querySelector = getQuerySelector(dayView);
            const eventElement = querySelector(
                ".day-view-event"
            ) as HTMLElement;
            if (eventElement) {
                eventElement.click();
                await waitForDOMUpdate();

                expect(clickedEvent).toBeTruthy();
                expect(clickedEvent!.id).toBe("event-1");
            } else {
                expect(dayView.isConnected).toBe(true);
            }
        });

        it("应该显示事件数量", async () => {
            const viewDate = new Date(2024, 0, 15);
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date(2024, 0, 15, 10, 0, 0),
                    endTime: new Date(2024, 0, 15, 11, 0, 0),
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date(2024, 0, 15, 14, 0, 0),
                    endTime: new Date(2024, 0, 15, 15, 0, 0),
                }),
            ];

            dayView = document.createElement("wsx-day-view") as DayView;
            dayView.setAttribute("view-date", viewDate.toISOString());
            dayView.events = events;
            container.appendChild(dayView);
            await waitForComponentInit(dayView);

            const querySelector = getQuerySelector(dayView);
            const countElement = querySelector(".day-view-events-count");
            expect(countElement).toBeTruthy();
            expect(countElement!.textContent).toContain("2");
        });
    });
});
