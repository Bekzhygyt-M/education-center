/** Shared constants and Uzbek label maps used on both server and client. */

/** Settings key for the configurable "late" attendance threshold. */
export const LATE_THRESHOLD_KEY = "attendance.lateThresholdMinutes";

/** Compiled fallback, also written by the seed. */
export const DEFAULT_LATE_THRESHOLD_MINUTES = 10;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Keldi",
  ABSENT: "Kelmadi",
  LATE: "Kechikdi",
  EXCUSED: "Sababli",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
};

export const WEEK_DAY_LABELS: Record<string, string> = {
  MONDAY: "Dushanba",
  TUESDAY: "Seshanba",
  WEDNESDAY: "Chorshanba",
  THURSDAY: "Payshanba",
  FRIDAY: "Juma",
  SATURDAY: "Shanba",
  SUNDAY: "Yakshanba",
};

export const LESSON_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Rejalashtirilgan",
  HELD: "O'tkazilgan",
  CANCELLED: "Bekor qilingan",
};

/** Formats an integer sum of UZS, e.g. 4500000 -> "4 500 000 so'm". */
export function formatUZS(value: number): string {
  return `${new Intl.NumberFormat("uz-UZ").format(value)} so'm`;
}