import "server-only";

import { prisma } from "@/server/db/prisma";
import type { SessionUser } from "@/server/auth/session";
import { ATTENDANCE_STATUS_LABELS } from "@/server/constants";

export type DashboardStats = {
  students: number;
  teachers: number;
  groups: number;
  lessonsToday: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
  };
  upcomingLessons: {
    id: string;
    date: string;
    topic: string | null;
    groupName: string;
    teacherName: string;
    status: string;
  }[];
};

/**
 * Everything the dashboard shows, in one query round trip.
 *
 * A teacher sees the whole-centre counts (they are not sensitive) but their
 * "today's lessons" list is limited to the groups they teach. Access rules are
 * applied in the query, not in the UI.
 */
export async function getDashboardData(user: SessionUser): Promise<DashboardStats> {
  const isTeacher = user.role === "TEACHER";
  const teacherId = user.teacherId;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  // A teacher only sees lessons for groups they are assigned to.
  const lessonScope = isTeacher && teacherId ? { teacherId } : {};

  const [
    students,
    teachers,
    groups,
    lessonsToday,
    todaysLessons,
    roster,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.group.count({ where: { isActive: true } }),
    prisma.lesson.count({
      where: { ...lessonScope, date: { gte: startOfToday, lt: endOfToday }, status: { not: "CANCELLED" } },
    }),
    prisma.lesson.findMany({
      where: { ...lessonScope, date: { gte: startOfToday, lt: endOfToday } },
      orderBy: { date: "asc" },
      take: 8,
      select: {
        id: true,
        date: true,
        topic: true,
        status: true,
        group: { select: { name: true } },
        teacher: { select: { user: { select: { fullName: true } } } },
      },
    }),
    // Students enrolled in today's groups, with their attendance rows for
    // today. Attendance hangs off Student, so we select through it. One
    // query yields both the status tally and the unmarked count.
    prisma.student.findMany({
      where: {
        isActive: true,
        groups: {
          some: isTeacher && teacherId
            ? { group: { teacherId, isActive: true } }
            : { group: { isActive: true } },
        },
      },
      select: {
        id: true,
        attendance: {
          where: { lesson: { ...lessonScope, date: { gte: startOfToday, lt: endOfToday } } },
          select: { status: true },
        },
      },
    }),
  ]);

  const tally = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  let unmarked = 0;

  for (const student of roster) {
    if (student.attendance.length === 0) {
      unmarked += 1;
      continue;
    }
    // A student enrolled in two groups can have two rows for today; count the
    // most severe status rather than double-counting them.
    const statuses = student.attendance.map((a) => a.status);
    const effective = statuses.includes("ABSENT")
      ? "ABSENT"
      : statuses.includes("LATE")
        ? "LATE"
        : statuses.includes("EXCUSED")
          ? "EXCUSED"
          : "PRESENT";
    tally[effective] += 1;
  }

  return {
    students,
    teachers,
    groups,
    lessonsToday,
    todayAttendance: {
      present: tally.PRESENT,
      absent: tally.ABSENT,
      late: tally.LATE,
      excused: tally.EXCUSED,
      unmarked,
    },
    upcomingLessons: todaysLessons.map((lesson) => ({
      id: lesson.id,
      date: lesson.date.toISOString(),
      topic: lesson.topic,
      groupName: lesson.group.name,
      teacherName: lesson.teacher.user.fullName,
      status: lesson.status,
    })),
  };
}

export const attendanceStatusLabels = ATTENDANCE_STATUS_LABELS;