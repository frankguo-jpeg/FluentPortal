import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date();
  return {
    weekNumber: getISOWeek(now),
    year: getISOWeekYear(now),
  };
}

export function getWeekDateRange(weekNumber: number, year: number) {
  const jan4 = new Date(year, 0, 4);
  const startOfFirstWeek = startOfISOWeek(jan4);
  const targetDate = new Date(startOfFirstWeek);
  targetDate.setDate(targetDate.getDate() + (weekNumber - 1) * 7);

  return {
    start: startOfISOWeek(targetDate),
    end: endOfISOWeek(targetDate),
  };
}

export function formatWeekLabel(weekNumber: number, year: number): string {
  const { start, end } = getWeekDateRange(weekNumber, year);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Week ${weekNumber} (${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}, ${year})`;
}
