"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { requireAdmin, requireUser } from "@/server/auth/session";
import { canAccessGroup, canAccessTeacherId } from "@/server/services/authorization";
import { attendanceStatusForArrival, isWithinWorkHours, rangesOverlap } from "@/server/services/operations";
import { getLateThresholdMinutes } from "@/server/queries/settings";
import { emailSchema, entityNameSchema, fullNameSchema, passwordSchema, phoneSchema, timeSchema } from "@/server/validation/auth";
import type { AttendanceStatus, WeekDay } from "@/generated/prisma/enums";
import type { ZodType } from "zod";

type ActionState = { error?: string; success?: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const optional = (data: FormData, key: string) => value(data, key) || null;
const invalidate = (...paths: string[]) => paths.forEach((path) => revalidatePath(path));
const fail = (error: string): ActionState => {
  return { error };
};

/**
 * Validates one raw form value against a Zod schema, returning either the
 * parsed (trimmed/normalised) value or the schema's own error message.
 * Every server action validates with these shared schemas — the same rules
 * that already guard the login form and are unit-tested in
 * tests/validation.test.ts — rather than re-implementing ad-hoc checks.
 */
function parseOrFail<T>(schema: ZodType<T>, raw: string): { value: T } | { error: string } {
  const result = schema.safeParse(raw);
  return result.success ? { value: result.data } : { error: result.error.issues[0]?.message ?? "Noto'g'ri qiymat." };
}

export async function saveTeacher(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = value(formData, "id");
  const branchId = value(formData, "branchId");

  const fullNameResult = parseOrFail(fullNameSchema, value(formData, "fullName"));
  if ("error" in fullNameResult) return fail(fullNameResult.error);
  const emailResult = parseOrFail(emailSchema, value(formData, "email"));
  if ("error" in emailResult) return fail(emailResult.error);

  const phoneRaw = optional(formData, "phone");
  if (phoneRaw) {
    const phoneResult = parseOrFail(phoneSchema, phoneRaw);
    if ("error" in phoneResult) return fail(phoneResult.error);
  }

  const passwordRaw = value(formData, "password");
  if (!id || passwordRaw) {
    const passwordResult = parseOrFail(passwordSchema, passwordRaw);
    if ("error" in passwordResult) return fail(passwordResult.error);
  }

  if (!branchId) return fail("Filial talab qilinadi.");

  const fullName = fullNameResult.value, email = emailResult.value, password = passwordRaw;
  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        const teacher = await tx.teacher.findUnique({ where: { id }, select: { userId: true } });
        if (!teacher) throw new Error("O'qituvchi topilmadi.");
        await tx.user.update({ where: { id: teacher.userId }, data: { fullName, email, phone: phoneRaw, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) } });
        await tx.teacher.update({ where: { id }, data: { branchId, specialization: optional(formData, "specialization"), subjects: { deleteMany: {}, create: formData.getAll("subjectIds").map((subjectId) => ({ subjectId: String(subjectId) })) } } });
      } else {
        await tx.user.create({ data: { fullName, email, phone: phoneRaw, passwordHash: await bcrypt.hash(password, 12), role: "TEACHER", teacher: { create: { branchId, specialization: optional(formData, "specialization"), subjects: { create: formData.getAll("subjectIds").map((subjectId) => ({ subjectId: String(subjectId) })) } } } } });
      }
    });
  } catch { return fail("O'qituvchi saqlanmadi. Email takrorlanmaganini tekshiring."); }
  invalidate("/teachers", "/groups", "/schedule"); return { success: "O'qituvchi saqlandi." };
}

export async function deactivateTeacher(formData: FormData) {
  await requireAdmin(); const id = value(formData, "id");
  const teacher = await prisma.teacher.findUnique({ where: { id }, select: { userId: true } });
  if (!teacher) throw new Error("Topilmadi");
  await prisma.$transaction([prisma.teacher.update({ where: { id }, data: { isActive: false } }), prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } })]);
  invalidate("/teachers", "/groups", "/schedule");
}

export async function saveStudent(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(); const id = value(formData, "id");
  if (user.role !== "ADMIN" && id) { const student = await prisma.student.findFirst({ where: { id, groups: { some: { group: { teacherId: user.teacherId! } } } } }); if (!student) return fail("Ruxsat yo'q."); }
  if (user.role !== "ADMIN" && !id) return fail("Yangi o'quvchini faqat administrator qo'sha oladi.");

  const fullNameResult = parseOrFail(fullNameSchema, value(formData, "fullName"));
  if ("error" in fullNameResult) return fail(fullNameResult.error);

  const phoneRaw = optional(formData, "phone");
  if (phoneRaw) {
    const phoneResult = parseOrFail(phoneSchema, phoneRaw);
    if ("error" in phoneResult) return fail(phoneResult.error);
  }

  const fullName = fullNameResult.value;
  await prisma.student.upsert({ where: { id: id || "__new__" }, create: { fullName, phone: phoneRaw, notes: optional(formData, "notes") }, update: { fullName, phone: phoneRaw, notes: optional(formData, "notes") } });
  invalidate("/students", "/groups"); return { success: "O'quvchi saqlandi." };
}

export async function deactivateStudent(formData: FormData) {
  const user = await requireUser(); const id = value(formData, "id");
  const student = await prisma.student.findFirst({ where: { id, ...(user.role === "TEACHER" ? { groups: { some: { group: { teacherId: user.teacherId! } } } } : {}) } });
  if (!student) throw new Error("Ruxsat yo'q"); await prisma.student.update({ where: { id }, data: { isActive: false } }); invalidate("/students", "/groups");
}

export async function setEnrollment(formData: FormData) {
  const user = await requireUser(); const groupId = value(formData, "groupId"), studentId = value(formData, "studentId"), remove = value(formData, "remove") === "1";
  const group = await prisma.group.findUnique({ where: { id: groupId } }); if (!group || !canAccessGroup(user, group)) throw new Error("Ruxsat yo'q");
  if (!remove && !await prisma.student.findFirst({ where: { id: studentId, isActive: true } })) throw new Error("O'quvchi topilmadi");
  if (!remove && await prisma.groupStudent.count({ where: { groupId } }) >= group.capacity) throw new Error("Guruh sig'imi to'lgan");
  if (remove) await prisma.groupStudent.deleteMany({ where: { groupId, studentId } }); else await prisma.groupStudent.upsert({ where: { groupId_studentId: { groupId, studentId } }, create: { groupId, studentId }, update: {} });
  invalidate("/students", "/groups", "/attendance");
}

export async function saveCourse(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(); const id = value(formData, "id");
  const nameResult = parseOrFail(entityNameSchema, value(formData, "name"));
  if ("error" in nameResult) return fail(nameResult.error);
  const name = nameResult.value;
  try { await prisma.course.upsert({ where: { id: id || "__new__" }, create: { name, description: optional(formData, "description"), durationWeeks: Number(value(formData, "durationWeeks")) || null, priceUZS: Number(value(formData, "priceUZS")) || null }, update: { name, description: optional(formData, "description"), durationWeeks: Number(value(formData, "durationWeeks")) || null, priceUZS: Number(value(formData, "priceUZS")) || null } }); } catch { return fail("Kurs nomi takrorlanmagan bo'lishi kerak."); }
  invalidate("/groups", "/schedule"); return { success: "Kurs saqlandi." };
}

export async function saveGroup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(); const id = value(formData, "id"), teacherId = value(formData, "teacherId");
  if (user.role !== "ADMIN" && (!id || teacherId !== user.teacherId)) return fail("Ruxsat yo'q.");
  if (id) { const old = await prisma.group.findUnique({ where: { id } }); if (!old || !canAccessGroup(user, old)) return fail("Ruxsat yo'q."); }
  const nameResult = parseOrFail(entityNameSchema, value(formData, "name"));
  if ("error" in nameResult) return fail(nameResult.error);
  const name = nameResult.value, courseId = value(formData, "courseId"), branchId = value(formData, "branchId"); if (!courseId || !branchId || !teacherId) return fail("Barcha majburiy maydonlarni to'ldiring.");
  try { await prisma.group.upsert({ where: { id: id || "__new__" }, create: { name, courseId, branchId, teacherId, capacity: Math.max(1, Number(value(formData, "capacity")) || 15) }, update: { name, courseId, branchId, teacherId, capacity: Math.max(1, Number(value(formData, "capacity")) || 15) } }); } catch { return fail("Guruh saqlanmadi. Nomi yagona bo'lishi kerak."); }
  invalidate("/groups", "/students", "/schedule"); return { success: "Guruh saqlandi." };
}

export async function deactivateGroup(formData: FormData) {
  const user = await requireUser(); const id = value(formData, "id"); const group = await prisma.group.findUnique({ where: { id } }); if (!group || !canAccessGroup(user, group)) throw new Error("Ruxsat yo'q");
  await prisma.group.update({ where: { id }, data: { isActive: false } }); invalidate("/groups", "/schedule");
}

export async function saveClassroom(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(); const id = value(formData, "id"), branchId = value(formData, "branchId"); if (!branchId) return fail("Filial talab qilinadi.");
  const nameResult = parseOrFail(entityNameSchema, value(formData, "name"));
  if ("error" in nameResult) return fail(nameResult.error);
  const name = nameResult.value;
  try { await prisma.classroom.upsert({ where: { id: id || "__new__" }, create: { name, branchId, capacity: Math.max(1, Number(value(formData, "capacity")) || 20) }, update: { name, branchId, capacity: Math.max(1, Number(value(formData, "capacity")) || 20) } }); } catch { return fail("Xona nomi takrorlanmagan bo'lishi kerak."); }
  invalidate("/groups", "/schedule"); return { success: "Xona saqlandi." };
}

export async function deactivateClassroom(formData: FormData) { await requireAdmin(); await prisma.classroom.update({ where: { id: value(formData, "id") }, data: { isActive: false } }); invalidate("/groups", "/schedule"); }

export async function saveScheduleSlot(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(); const groupId = value(formData, "groupId"), teacherId = value(formData, "teacherId"), classroomId = value(formData, "classroomId"), courseId = value(formData, "courseId"), day = value(formData, "day") as WeekDay, id = value(formData, "id");
  const startTimeResult = parseOrFail(timeSchema, value(formData, "startTime"));
  if ("error" in startTimeResult) return fail(startTimeResult.error);
  const endTimeResult = parseOrFail(timeSchema, value(formData, "endTime"));
  if ("error" in endTimeResult) return fail(endTimeResult.error);
  const startTime = startTimeResult.value, endTime = endTimeResult.value;
  const [group, classroom, hours] = await Promise.all([prisma.group.findUnique({ where: { id: groupId } }), prisma.classroom.findUnique({ where: { id: classroomId } }), prisma.teacherWorkHours.findMany({ where: { teacherId, day } })]);
  if (!group || !classroom || group.teacherId !== teacherId || group.courseId !== courseId || group.branchId !== classroom.branchId) return fail("Guruh, o'qituvchi, kurs va xona mos emas.");
  if (!isWithinWorkHours(startTime, endTime, hours)) return fail("Vaqt o'qituvchining ish vaqtiga mos emas.");
  const candidates = await prisma.scheduleSlot.findMany({ where: { day, isActive: true, ...(id ? { id: { not: id } } : {}), OR: [{ teacherId }, { groupId }, { classroomId }] } });
  if (candidates.some((slot) => rangesOverlap(startTime, endTime, slot.startTime, slot.endTime))) return fail("O'qituvchi, guruh yoki xona uchun vaqt to'qnashuvi bor.");
  await prisma.scheduleSlot.upsert({ where: { id: id || "__new__" }, create: { branchId: group.branchId, groupId, teacherId, courseId, classroomId, day, startTime, endTime }, update: { groupId, teacherId, courseId, classroomId, day, startTime, endTime } });
  invalidate("/schedule", "/groups", "/dashboard"); return { success: "Dars jadvali saqlandi." };
}

export async function deleteScheduleSlot(formData: FormData) { await requireAdmin(); await prisma.scheduleSlot.delete({ where: { id: value(formData, "id") } }); invalidate("/schedule", "/groups"); }

export async function generateLessons(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin(); const from = new Date(`${value(formData, "from")}T00:00:00`), to = new Date(`${value(formData, "to")}T00:00:00`); if (Number.isNaN(+from) || Number.isNaN(+to) || from > to || (to.getTime() - from.getTime()) > 93 * 86400000) return fail("1–93 kunlik to'g'ri oraliq kiriting.");
  const slots = await prisma.scheduleSlot.findMany({ where: { isActive: true } }); let count = 0;
  for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) for (const slot of slots) if (["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getDay()] === slot.day) { const result = await prisma.lesson.upsert({ where: { slotId_date: { slotId: slot.id, date: new Date(date) } }, create: { slotId: slot.id, groupId: slot.groupId, teacherId: slot.teacherId, date: new Date(date) }, update: {} }); if (result.createdAt.getTime() === result.updatedAt.getTime()) count++; }
  invalidate("/attendance", "/dashboard"); return { success: `${count} ta dars yaratildi (mavjudlari takrorlanmadi).` };
}

export async function saveAttendance(formData: FormData) {
  const user = await requireUser(); const lessonId = value(formData, "lessonId"), studentId = value(formData, "studentId"), selected = value(formData, "status") as AttendanceStatus, arrived = optional(formData, "arrivedAt");
  if (!(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as string[]).includes(selected)) throw new Error("Noto'g'ri holat");
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { slot: true, group: { include: { students: { where: { studentId } } } } } }); if (!lesson || !canAccessTeacherId(user, lesson.teacherId) || !lesson.group.students.length) throw new Error("Ruxsat yo'q");
  const arrivedAt = arrived ? new Date(arrived) : null; const status = attendanceStatusForArrival(lesson.slot?.startTime ?? "00:00", arrivedAt, await getLateThresholdMinutes(), selected);
  await prisma.attendance.upsert({ where: { lessonId_studentId: { lessonId, studentId } }, create: { lessonId, studentId, status, arrivedAt, recordedBy: user.email }, update: { status, arrivedAt, recordedBy: user.email } }); invalidate("/attendance", "/dashboard");
}

export async function saveLessonPlan(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(); const lessonId = value(formData, "lessonId"), lesson = await prisma.lesson.findUnique({ where: { id: lessonId } }); if (!lesson || !canAccessTeacherId(user, lesson.teacherId)) return fail("Ruxsat yo'q.");
  const topic = value(formData, "topic").trim(); if (!topic) return fail("Mavzu talab qilinadi."); await prisma.lessonPlan.upsert({ where: { lessonId }, create: { lessonId, teacherId: lesson.teacherId, groupId: lesson.groupId, topic, objectives: optional(formData, "objectives"), homework: optional(formData, "homework"), notes: optional(formData, "notes") }, update: { topic, objectives: optional(formData, "objectives"), homework: optional(formData, "homework"), notes: optional(formData, "notes") } }); invalidate("/attendance"); return { success: "Dars rejasi saqlandi." };
}
