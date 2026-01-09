/**
 * DayView 组件类型声明
 */

import { WebComponent } from "@wsxjs/wsx-core";
import type { Event } from "@calenderjs/event-model";
import type { User } from "@calenderjs/core";

declare class DayView extends WebComponent {
    viewDate: Date | string;
    events: Event[] | string;
    user?: User | string;
}

export default DayView;
