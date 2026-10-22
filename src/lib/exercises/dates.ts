export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PAGER_DAYS = 28; // this week + the next three
export const DAY_MS = 86_400_000;

// Changes once a day — used to rotate "fresh" picks.
export const daySeed = () => Math.floor(Date.now() / DAY_MS);

export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// 0 = Monday … 6 = Sunday.
export const weekdayOf = (d: Date) => (d.getDay() + 6) % 7;

export function relativeLabel(index: number, todayIdx: number): string | null {
  const diff = index - todayIdx;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return null;
}

export const formatDayLabel = (date: Date, weekday: number) =>
  `${WEEKDAY_LONG[weekday]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
