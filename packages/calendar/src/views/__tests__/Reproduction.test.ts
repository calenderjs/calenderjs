/**
 * Reproduction Test for Today Handling
 *
 * Verifies that 'today' class is NOT applied to days outside the current month.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// Import component to register it
import "../MonthView.wsx";
import type MonthView from "../MonthView.wsx";

// Wait for DOM update
function waitForDOMUpdate() {
    return new Promise((resolve) => setTimeout(resolve, 10));
}

async function waitForComponentInit(component: HTMLElement) {
    if (!component.isConnected) {
        throw new Error(
            "Component must be connected to DOM before initialization",
        );
    }
    await waitForDOMUpdate();
    await waitForDOMUpdate();
    await waitForDOMUpdate();
}

function getQuerySelectorAll(component: HTMLElement) {
    const shadowRoot = component.shadowRoot;
    return shadowRoot
        ? shadowRoot.querySelectorAll.bind(shadowRoot)
        : component.querySelectorAll.bind(component);
}

describe("MonthView Reproduction", () => {
    let container: HTMLElement;
    let monthView: MonthView;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        // Mock system time to November 30, 2025
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2025, 10, 30)); // Month is 0-indexed: 10 = November
    });

    afterEach(() => {
        if (monthView && monthView.parentNode) {
            monthView.remove();
        }
        if (container && container.parentNode) {
            container.remove();
        }
        vi.useRealTimers();
    });

    it("should NOT highlight today if it is not in the current view month", async () => {
        // View Date: December 2025
        // November 30 (Today) should appear as "other-month"
        const viewDate = new Date(2025, 11, 15); // December 2025

        monthView = document.createElement("wsx-month-view") as MonthView;
        monthView.setAttribute("view-date", viewDate.toISOString());
        container.appendChild(monthView);
        await waitForComponentInit(monthView);

        const querySelectorAll = getQuerySelectorAll(monthView);
        const cells = Array.from(querySelectorAll(".month-view-cell"));

        // Find the cell for the 30th (which should be Nov 30 in the first row)
        // Since Dec 1, 2025 is a Monday.
        // Sunday will be Nov 30.
        // Wait, let's check calendar for Dec 2025.
        // Dec 1, 2025 is Monday.
        // So the grid starts at Nov 30 (Sunday) if week starts on Sunday.

        const cell30 = cells.find(
            (cell) =>
                cell
                    .querySelector(".month-view-cell-date")
                    ?.textContent?.trim() === "30",
        );

        expect(cell30).toBeTruthy();

        // It should be an "other-month" cell
        expect(cell30!.classList.contains("other-month")).toBe(true);

        // BUG REPRODUCTION ASSERTION:
        // Originally, this would fail if we expect it NOT to be 'today'.
        // But to reproduce the bug, we assert what currently happens (which is wrong),
        // OR we write the correct expectation and expect it to fail.
        // I will write the CORRECT EXPECTATION and expect it to FAIL.
        expect(cell30!.classList.contains("today")).toBe(false);
    });

    it("should highlight today when it IS in the current view month", async () => {
        // View Date: November 2025 (same as mocked "today" Nov 30)
        const viewDate = new Date(2025, 10, 15); // November 2025

        monthView = document.createElement("wsx-month-view") as MonthView;
        monthView.setAttribute("view-date", viewDate.toISOString());
        container.appendChild(monthView);
        await waitForComponentInit(monthView);

        const querySelectorAll = getQuerySelectorAll(monthView);
        // In November view there should be exactly one cell with "today" (Nov 30), and it must not be other-month
        const todayCells = Array.from(
            querySelectorAll(".month-view-cell.today"),
        );
        expect(todayCells.length).toBe(1);
        expect(todayCells[0].classList.contains("other-month")).toBe(false);
        expect(
            todayCells[0].querySelector(".month-view-cell-date")?.textContent?.trim(),
        ).toBe("30");
    });
});
