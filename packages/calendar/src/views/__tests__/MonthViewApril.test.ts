/**
 * MonthView 四月份日期显示测试
 * 
 * 验证四月份的所有日期（包括 4/30）都正确显示
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../MonthView.wsx";
import type MonthView from "../MonthView.wsx";
import { getMonthDates } from "@calenderjs/date-time";

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
    await waitForDOMUpdate();
    await waitForDOMUpdate();
    await waitForDOMUpdate();
    await waitForDOMUpdate();
}

// 获取查询函数（处理 shadowRoot 可能不存在的情况）
function getQuerySelectorAll(component: HTMLElement) {
    const shadowRoot = component.shadowRoot;
    return shadowRoot
        ? shadowRoot.querySelectorAll.bind(shadowRoot)
        : component.querySelectorAll.bind(component);
}

describe("MonthView 四月份日期显示", () => {
    let container: HTMLElement;
    let monthView: MonthView;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (monthView && monthView.parentNode) {
            monthView.remove();
        }
        if (container && container.parentNode) {
            container.remove();
        }
    });

    it("应该显示四月份的所有日期，包括 4/30", async () => {
        // 2024年4月15日
        const viewDate = new Date(2024, 3, 15);
        
        monthView = document.createElement("wsx-month-view") as MonthView;
        monthView.setAttribute("view-date", viewDate.toISOString());
        container.appendChild(monthView);
        await waitForComponentInit(monthView);

        // 获取应该显示的日期
        const expectedDates = getMonthDates(viewDate, 0);
        const aprilDates = expectedDates.filter(
            (d) => d.getMonth() === 3 && d.getFullYear() === 2024
        );

        // 验证应该包含 4/30
        const hasApril30 = aprilDates.some(
            (d) => d.getDate() === 30 && d.getMonth() === 3
        );
        expect(hasApril30).toBe(true);

        // 获取实际渲染的日期单元格
        const querySelectorAll = getQuerySelectorAll(monthView);
        const cells = querySelectorAll(".month-view-cell");
        
        // 验证单元格数量
        expect(cells.length).toBe(expectedDates.length);

        // 检查是否包含 4/30
        const cellTexts = Array.from(cells).map((cell) => {
            const dateElement = cell.querySelector(".month-view-cell-date");
            return dateElement?.textContent?.trim();
        });

        // 查找 4/30 的单元格（应该显示 "30"）
        const has30 = cellTexts.includes("30");
        expect(has30).toBe(true);

        // 验证四月份的日期数量（应该包含 1-30）
        const aprilCellTexts = Array.from(cells)
            .map((cell) => {
                const dateElement = cell.querySelector(".month-view-cell-date");
                const text = dateElement?.textContent?.trim();
                // 检查是否是当前月份的单元格（不是 other-month）
                const isOtherMonth = cell.classList.contains("other-month");
                return { text, isOtherMonth };
            })
            .filter(({ isOtherMonth }) => !isOtherMonth)
            .map(({ text }) => text);

        // 应该包含 1-30
        for (let i = 1; i <= 30; i++) {
            expect(aprilCellTexts).toContain(i.toString());
        }
    });

    it("应该正确显示四月份的最后一周", async () => {
        const viewDate = new Date(2024, 3, 15); // 2024年4月15日
        
        monthView = document.createElement("wsx-month-view") as MonthView;
        monthView.setAttribute("view-date", viewDate.toISOString());
        container.appendChild(monthView);
        await waitForComponentInit(monthView);

        const querySelectorAll = getQuerySelectorAll(monthView);
        const cells = Array.from(querySelectorAll(".month-view-cell"));

        // 查找包含 "30" 的单元格
        const april30Cell = cells.find((cell) => {
            const dateElement = cell.querySelector(".month-view-cell-date");
            return dateElement?.textContent?.trim() === "30";
        });

        expect(april30Cell).toBeTruthy();
        
        // 验证 4/30 不是 other-month
        if (april30Cell) {
            expect(april30Cell.classList.contains("other-month")).toBe(false);
        }
    });
});
