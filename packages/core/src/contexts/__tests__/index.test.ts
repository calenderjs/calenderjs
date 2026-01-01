import { describe, it, expect } from "vitest";
import type { ValidationContext, RenderContext } from "../index";

describe("contexts/index", () => {
    it("should export ValidationContext type", () => {
        const context: ValidationContext = {
            events: [],
            now: new Date(),
        };
        expect(context).toBeDefined();
    });

    it("should export RenderContext type", () => {
        const context: RenderContext = {};
        expect(context).toBeDefined();
    });
});
