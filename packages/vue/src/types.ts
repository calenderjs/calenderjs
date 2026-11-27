import type { Event } from "@calenderjs/event-model";
import type { User } from "@calenderjs/core";

export interface CalendarProps {
  view?: "month" | "week" | "day";
  date?: string | Date;
  events?: Event[];
  user?: User;
  eventTypeDefinitions?: string | unknown;
}
