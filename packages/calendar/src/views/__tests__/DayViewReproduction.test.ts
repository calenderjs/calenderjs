/**
 * Reproduction Test for DayView Today Handling
 *
 * Verifies that 'today' class is applied when viewDate is today.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../DayView.wsx";
import type DayView from "../DayView.wsx";

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

function getQuerySelector(component: HTMLElement) {
  const shadowRoot = component.shadowRoot;
  return shadowRoot
    ? shadowRoot.querySelector.bind(shadowRoot)
    : component.querySelector.bind(component);
}

describe("DayView Reproduction", () => {
  let container: HTMLElement;
  let dayView: DayView;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Mock system time to Nov 30, 2025
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 10, 30));
  });

  afterEach(() => {
    if (dayView && dayView.parentNode) {
      dayView.remove();
    }
    if (container && container.parentNode) {
      container.remove();
    }
    vi.useRealTimers();
  });

  it("should highlight date as today when viewDate is today", async () => {
    // viewDate = Today (Nov 30)
    const viewDate = new Date(2025, 10, 30);

    dayView = document.createElement("wsx-day-view") as DayView;
    dayView.setAttribute("view-date", viewDate.toISOString());
    container.appendChild(dayView);
    await waitForComponentInit(dayView);

    const querySelector = getQuerySelector(dayView);

    // Find the date element
    // In DayView.wsx logic: has class "day-view-date"
    const dateEl = querySelector(".day-view-date");
    expect(dateEl).toBeTruthy();

    // Expect it to have 'today' class (Currently EXPECTED TO FAIL)
    expect(dateEl!.classList.contains("today")).toBe(true);
  });

  it("should NOT highlight date as today when viewDate is NOT today", async () => {
    // viewDate = Dec 1 (Not today)
    const viewDate = new Date(2025, 11, 1);

    dayView = document.createElement("wsx-day-view") as DayView;
    dayView.setAttribute("view-date", viewDate.toISOString());
    container.appendChild(dayView);
    await waitForComponentInit(dayView);

    const querySelector = getQuerySelector(dayView);
    const dateEl = querySelector(".day-view-date");
    expect(dateEl).toBeTruthy();

    expect(dateEl!.classList.contains("today")).toBe(false);
  });
});
