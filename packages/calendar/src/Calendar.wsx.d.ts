/**
 * Calendar 组件类型声明
 */

import { ReactiveWebComponent } from "@wsxjs/wsx-core";
import type { Event, ValidationResult } from "@calenderjs/event-model";
import { User } from "@calenderjs/core";
import { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";

declare class Calendar extends ReactiveWebComponent {
    eventDSL?: string | EventTypeAST | EventTypeAST[] | null;
    eventRuntime: EventRuntime | null;
    events: Event[];
    displayEvents: Event[];
    user?: User;
    defaultView: "month" | "week" | "day";
    currentView: "month" | "week" | "day";
    currentDate: Date;

    validateEventForCreate(event: Event): ValidationResult;
    validateEventForUpdate(event: Event): ValidationResult;
    canPerformAction(action: string, event: Event): boolean;
    proposeEventCreate(event: Event): boolean;
    proposeEventUpdate(event: Event): boolean;
}

export default Calendar;
