/**
 * Reproduction Test for WeekView Today Handling
 *
 * Verifies that 'today' class is applied ONLY when today is in the view.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../WeekView.wsx";
import type WeekView from "../WeekView.wsx";

function waitForDOMUpdate() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

async function waitForComponentInit(component: HTMLElement) {
  if (!component.isConnected) {
    throw new Error("Component must be connected to DOM before initialization");
  }
  await waitForDOMUpdate();
  await waitForDOMUpdate();
}

function getQuerySelectorAll(component: HTMLElement) {
  const shadowRoot = component.shadowRoot;
  return shadowRoot
    ? shadowRoot.querySelectorAll.bind(shadowRoot)
    : component.querySelectorAll.bind(component);
}

describe("WeekView Reproduction", () => {
  let container: HTMLElement;
  let weekView: WeekView;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Mock system time to Nov 30, 2025 (Sunday)
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 10, 30));
  });

  afterEach(() => {
    if (weekView && weekView.parentNode) {
      weekView.remove();
    }
    if (container && container.parentNode) {
      container.remove();
    }
    vi.useRealTimers();
  });

  it("should highlight today when the week contains today", async () => {
    // View Date: Nov 30, 2025 (Sunday)
    // Week starts on Sunday (Nov 30) -> Dec 6
    const viewDate = new Date(2025, 10, 30);

    weekView = document.createElement("wsx-week-view") as WeekView;
    weekView.setAttribute("view-date", viewDate.toISOString());
    container.appendChild(weekView);
    await waitForComponentInit(weekView);

    const querySelectorAll = getQuerySelectorAll(weekView);
    const dayHeaders = Array.from(querySelectorAll(".week-view-day-header"));

    // First day (Sunday Nov 30) should be today
    const firstDay = dayHeaders[0];
    expect(firstDay.textContent).toContain("30");
    expect(firstDay.classList.contains("today")).toBe(true);
  });

  it("should NOT highlight anything as today when the week does NOT contain today", async () => {
    // View Date: Dec 7, 2025 (Next Sunday)
    // Week: Dec 7 -> Dec 13
    const viewDate = new Date(2025, 11, 7);

    weekView = document.createElement("wsx-week-view") as WeekView;
    weekView.setAttribute("view-date", viewDate.toISOString());
    container.appendChild(weekView);
    await waitForComponentInit(weekView);

    const querySelectorAll = getQuerySelectorAll(weekView);
    const dayHeaders = Array.from(querySelectorAll(".week-view-day-header"));

    // No day should have 'today' class
    const todayEl = dayHeaders.find((el) => el.classList.contains("today"));
    expect(todayEl).toBeUndefined();
  });
});
