import { differenceInDays, format, parseISO, addDays as dfnsAddDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

export type PriorityLevel = 'high' | 'medium' | 'low';

export function calculatePriority(dueDate: string | null | undefined): PriorityLevel {
  if (!dueDate) return 'low';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(dueDate);
  const daysUntil = differenceInDays(due, today);
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
}

export function getPriorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case 'high': return 'text-red-500';
    case 'medium': return 'text-amber-500';
    case 'low': return 'text-emerald-500';
  }
}

export function getPriorityBg(priority: PriorityLevel): string {
  switch (priority) {
    case 'high': return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'low': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  }
}

export function getPriorityDot(priority: PriorityLevel): string {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-emerald-500';
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd/MM');
  } catch {
    return dateStr;
  }
}

export function formatTime12(hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return '';
  const [hh, mm] = hhmm.split(':').map(Number);
  const isPM = hh >= 12;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')}${isPM ? 'pm' : 'am'}`;
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekDays(weekEndingDate: string, weekEndingDay: string = 'Sunday'): { day: string; date: string; dateStr: string }[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const endDate = parseISO(weekEndingDate);
  const days: { day: string; date: string; dateStr: string }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = dfnsAddDays(endDate, -i);
    days.push({
      day: dayNames[d.getDay()],
      date: format(d, 'yyyy-MM-dd'),
      dateStr: format(d, 'dd/MM'),
    });
  }
  return days;
}

export function getTwoWeekDays(weekEndingDate: string): { day: string; date: string; dateStr: string }[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const endDate = parseISO(weekEndingDate);
  const days: { day: string; date: string; dateStr: string }[] = [];
  
  for (let i = 13; i >= 0; i--) {
    const d = dfnsAddDays(endDate, -i);
    days.push({
      day: dayNames[d.getDay()],
      date: format(d, 'yyyy-MM-dd'),
      dateStr: format(d, 'dd/MM'),
    });
  }
  return days;
}

export function calculateHours(start: string, finish: string, lunchMinutes: number = 0): number {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(finish)) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let finishMins = fh * 60 + fm;
  if (finishMins < startMins) finishMins += 24 * 60;
  const total = Math.max(0, finishMins - startMins - lunchMinutes);
  return Math.round(total / 15) * 15 / 60; // round to nearest 15 min
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return eachDayOfInterval({ start, end });
}

export function getCalendarGrid(year: number, month: number): (Date | null)[][] {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days[0].getDay(); // 0 = Sunday
  const grid: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  
  // pad start
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push(null);
  }
  
  for (const d of days) {
    week.push(d);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  
  // pad end
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  
  return grid;
}
