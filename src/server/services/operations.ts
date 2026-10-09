import type { AttendanceStatus } from "@/generated/prisma/enums";

export function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
    ? hours * 60 + minutes
    : Number.NaN;
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const [a1, a2, b1, b2] = [startA, endA, startB, endB].map(timeToMinutes);
  return [a1, a2, b1, b2].every(Number.isFinite) && a1 < b2 && b1 < a2;
}

export function isWithinWorkHours(start: string, end: string, workHours: { startTime: string; endTime: string }[]): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && startMinutes < endMinutes &&
    workHours.some((hours) => startMinutes >= timeToMinutes(hours.startTime) && endMinutes <= timeToMinutes(hours.endTime));
}

/** Derives attendance status from the actual arrival and configured grace period. */
export function attendanceStatusForArrival(
  lessonStart: string,
  arrivedAt: Date | null,
  thresholdMinutes: number,
  selected: AttendanceStatus,
): AttendanceStatus {
  if (selected === "ABSENT" || selected === "EXCUSED" || !arrivedAt) return selected;
  const start = timeToMinutes(lessonStart);
  if (!Number.isFinite(start)) return selected;
  const arrived = arrivedAt.getHours() * 60 + arrivedAt.getMinutes();
  return arrived > start + thresholdMinutes ? "LATE" : "PRESENT";
}

export function lessonDateForSlot(date: Date, day: string): boolean {
  const weekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return weekDays[date.getDay()] === day;
}
