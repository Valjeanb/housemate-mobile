// Recurrence logic for household calendar events

import { HouseholdEvent } from './types';
import { parseDateString, daysBetween } from './dates';

// Does this event fall on the given YYYY-MM-DD date?
export function eventOccursOn(event: HouseholdEvent, dateString: string): boolean {
  if (dateString < event.anchorDate) return false;

  const date = parseDateString(dateString);
  const anchor = parseDateString(event.anchorDate);

  switch (event.recurrence) {
    case 'once':
      return dateString === event.anchorDate;
    case 'weekly':
      return date.getDay() === anchor.getDay();
    case 'fortnightly':
      return date.getDay() === anchor.getDay() && daysBetween(event.anchorDate, dateString) % 14 === 0;
    case 'monthly':
      return date.getDate() === anchor.getDate();
    case 'yearly':
      return date.getDate() === anchor.getDate() && date.getMonth() === anchor.getMonth();
  }
}

export function getEventsForDate(events: HouseholdEvent[], dateString: string): HouseholdEvent[] {
  return events.filter((e) => eventOccursOn(e, dateString));
}
