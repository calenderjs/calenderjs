/**
 * Calendar 组件类型声明
 */

import { ReactiveWebComponent } from "@wsxjs/wsx-core";
import type { Event } from "@calenderjs/event-model";
import { User } from "@calenderjs/core";
import { EventTypeAST } from "@calenderjs/event-dsl";

declare class Calendar extends ReactiveWebComponent {
    eventDSL?: string | EventTypeAST | EventTypeAST[];
    events: Event[];
    user?: User;
    defaultView: "month" | "week" | "day";
    currentDate?: Date;
}

export default Calendar;
