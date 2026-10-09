import "server-only";

import { prisma } from "@/server/db/prisma";
import type { SessionUser } from "@/server/auth/session";

export async function getTeachers(user: SessionUser, search = "") {
  if (user.role !== "ADMIN") return [];
  return prisma.teacher.findMany({
    where: search ? { user: { fullName: { contains: search, mode: "insensitive" } } } : undefined,
    include: { user: true, subjects: { include: { subject: true } }, branch: true }, orderBy: { user: { fullName: "asc" } },
  });
}

export async function getStudents(user: SessionUser, search = "") {
  const scoped = user.role === "TEACHER" ? { groups: { some: { group: { teacherId: user.teacherId! } } } } : {};
  return prisma.student.findMany({
    where: { ...scoped, ...(search ? { fullName: { contains: search, mode: "insensitive" } } : {}) },
    include: { groups: { include: { group: { include: { course: true, teacher: { include: { user: true } } } } } } }, orderBy: { fullName: "asc" },
  });
}

export async function getGroups(user: SessionUser) {
  return prisma.group.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.teacherId! } : undefined,
    include: { course: true, teacher: { include: { user: true } }, students: { include: { student: true } }, scheduleSlots: { include: { classroom: true } } }, orderBy: { name: "asc" },
  });
}

export async function getSchedule(user: SessionUser) {
  return prisma.scheduleSlot.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.teacherId! } : undefined,
    include: { group: { include: { course: true } }, teacher: { include: { user: true } }, classroom: true }, orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export async function getAttendanceLessons(user: SessionUser, date?: string) {
  const parsedDate = date ? new Date(`${date}T00:00:00`) : undefined;
  return prisma.lesson.findMany({
    where: { ...(user.role === "TEACHER" ? { teacherId: user.teacherId! } : {}), ...(parsedDate ? { date: parsedDate } : {}) },
    include: { slot: true, group: { include: { students: { include: { student: true } } } }, teacher: { include: { user: true } }, attendance: true, lessonPlan: true },
    orderBy: [{ date: "desc" }], take: 80,
  });
}

export async function getFormData(user: SessionUser) {
  const groupWhere = user.role === "TEACHER" ? { teacherId: user.teacherId! } : undefined;
  const [branches, subjects, teachers, courses, groups, students, classrooms, workHours] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true } }), prisma.subject.findMany(),
    user.role === "ADMIN" ? prisma.teacher.findMany({ where: { isActive: true }, include: { user: true } }) : prisma.teacher.findMany({ where: { id: user.teacherId! }, include: { user: true } }),
    prisma.course.findMany({ where: { isActive: true } }), prisma.group.findMany({ where: groupWhere, include: { course: true } }),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" } }), prisma.classroom.findMany({ where: { isActive: true } }),
    prisma.teacherWorkHours.findMany({ where: user.role === "TEACHER" ? { teacherId: user.teacherId! } : undefined }),
  ]);
  return { branches, subjects, teachers, courses, groups, students, classrooms, workHours };
}
