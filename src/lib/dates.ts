// Local-timezone date helpers.
// The app previously used toISOString() for date keys, which is UTC — in
// Wangaratta (UTC+10/+11) that made "today" roll over at 10-11am local time.
// All date keys are YYYY-MM-DD strings in the device's local timezone.

export const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse a YYYY-MM-DD string as local midnight (new Date('YYYY-MM-DD') is UTC midnight)
export const parseDateString = (dateString: string): Date => {
  const [y, m, d] = dateString.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
};

export const getTodayString = (): string => toDateString(new Date());

// Start of week (Monday) as YYYY-MM-DD
export const getWeekStartString = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  return toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff));
};

export const addDaysToDateString = (dateString: string, days: number): string => {
  const d = parseDateString(dateString);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
};

// Whole days between two date strings (b - a)
export const daysBetween = (a: string, b: string): number => {
  const ms = parseDateString(b).getTime() - parseDateString(a).getTime();
  return Math.round(ms / 86400000);
};
