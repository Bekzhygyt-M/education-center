/**
 * Database seed for the Education Center Management System.
 *
 * SAFETY RULES — this script refuses to run unless ALL of these hold:
 *   1. DATABASE_URL points at a database whose name ends in `_dev`.
 *   2. The target database contains none of our tables already.
 *   3. SET_ALLOW_SEED=1 is present, as an explicit acknowledgement.
 *
 * It never drops an existing database and never touches any other database.
 *
 * Run with:  npm run db:seed
 */
import { randomBytes } from "node:crypto";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  DEFAULT_LATE_THRESHOLD_MINUTES,
  LATE_THRESHOLD_KEY,
} from "../src/server/constants";

const BCRYPT_ROUNDS = 12;

function assertSafeToSeed(connectionString: string): void {
  const dbName = (() => {
    try {
      return new URL(connectionString).pathname.replace(/^\//, "");
    } catch {
      throw new Error("DATABASE_URL talqin qilinmadi.");
    }
  })();

  if (!dbName.endsWith("_dev")) {
    throw new Error(
      `XAVFSIZLIK: "${dbName}" nomli ma'lumotlar bazasi seed uchun mos emas. ` +
        "Faqat _dev bilan tugagan bazaga yoziladi. Jaratildi.",
    );
  }

  if (process.env.SET_ALLOW_SEED !== "1") {
    throw new Error(
      "XAVFSIZLIK: SET_ALLOW_SEED=1 o'rnini belgilanmagan. " +
        "Bu ma'lumotlar bazasi bo'sh ekanini tasdiqlaganingizdan keyin qo'ying.",
    );
  }

  if (process.env.DATABASE_URL?.includes("newera") ||
      process.env.DATABASE_URL?.includes("new_era")) {
    throw new Error("XAVFSIZLIK: NewEra bazasi aniqlangan. Seed to'xtatildi.");
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belgilanmagan. .env faylini to'ldiring.");
  }
  assertSafeToSeed(connectionString);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  // Refuse to write on top of an existing schema.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    throw new Error(
      `XAVFSIZLIK: bazada ${existingUsers} ta foydalanuvchi mavjud. ` +
        "Seed faqat bo'sh bazada ishlaydi. Jaratildi.",
    );
  }

  console.log("Seed boshlanmoqda...");

  // --- Settings ---------------------------------------------------------
  await prisma.setting.create({
    data: {
      key: LATE_THRESHOLD_KEY,
      value: String(DEFAULT_LATE_THRESHOLD_MINUTES),
      description:
        "Kechikish chegarasi: shundan ko'p daqiqa kechikgan o'quvchi KECHIKDI deb belgilanadi",
    },
  });

  // --- Branch -----------------------------------------------------------
  const branch = await prisma.branch.create({
    data: {
      name: "Asosiy markaz",
      address: "Toshkent shahri, Mustaqillik ko'chasi, 12-uy",
      phone: "+998 71 200 00 00",
    },
  });

  // --- Users (passwords are bcrypt hashed, never stored in plain text) --
  const teacherPasswordHash = await bcrypt.hash(randomBytes(12).toString("hex"), BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: "admin@markaz.uz",
      // Dev-only known password. Change before any shared deployment.
      passwordHash: await bcrypt.hash("Admin12345", BCRYPT_ROUNDS),
      fullName: "Alisher Karimov",
      phone: "+998 90 123 45 67",
      role: "ADMIN",
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: "o.qituvchi@markaz.uz",
      passwordHash: await bcrypt.hash("Oqituvchi123", BCRYPT_ROUNDS),
      fullName: "Dilnoza Rahimova",
      phone: "+998 91 234 56 78",
      role: "TEACHER",
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: "b.oqituvchi@markaz.uz",
      passwordHash: teacherPasswordHash,
      fullName: "Sardor Tursunov",
      phone: "+998 93 345 67 89",
      role: "TEACHER",
    },
  });

  // --- Teachers ---------------------------------------------------------
  const subjects = await Promise.all(
    [
      { name: "Matematika", code: "MAT" },
      { name: "Informatika", code: "INF" },
      { name: "Ingliz tili", code: "ENG" },
      { name: "Fizika", code: "FIZ" },
    ].map((s) => prisma.subject.create({ data: s })),
  );

  const [math, inf, eng] = subjects;

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      branchId: branch.id,
      specialization: "Matematika va Informatika",
      hiredAt: new Date("2023-09-01"),
      subjects: {
        create: [{ subjectId: math.id }, { subjectId: inf.id }],
      },
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      branchId: branch.id,
      specialization: "Ingliz tili",
      hiredAt: new Date("2024-02-15"),
      subjects: { create: [{ subjectId: eng.id }] },
    },
  });

  // --- Courses ----------------------------------------------------------
  const course = await prisma.course.create({
    data: {
      name: "IT kursi",
      description: "Kompyuter savodxonligi va dasturlash asoslari",
      durationWeeks: 24,
      priceUZS: 4_500_000,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: "Ingliz tili kursi",
      description: "General English, B1 darajasidan yuqori",
      durationWeeks: 32,
      priceUZS: 3_200_000,
    },
  });

  // --- Groups -----------------------------------------------------------
  const groupA = await prisma.group.create({
    data: { name: "IT-101", branchId: branch.id, courseId: course.id, teacherId: teacher.id, capacity: 15 },
  });
  const groupB = await prisma.group.create({
    data: { name: "IT-102", branchId: branch.id, courseId: course.id, teacherId: teacher.id, capacity: 12 },
  });
  const groupC = await prisma.group.create({
    data: { name: "ENG-201", branchId: branch.id, courseId: course2.id, teacherId: teacher2.id, capacity: 14 },
  });

  // --- Students ---------------------------------------------------------
  const studentNames = [
    "Boburiskhan Ismoilov", "Kamola Tosheva", "Javlon Yusupov",
    "Malika Norqulova", "Azizbek Qodirov", "Dilfuza Sobirova",
    "Sardor Aliyev", "Nodira Ergasheva", "Bekzod Mirzayev",
    "Zarnigor Tursunova", "Otabek Sharipov", "Madina Yo'ldosheva",
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i += 1) {
    students.push(
      await prisma.student.create({
        data: {
          fullName: studentNames[i],
          phone: `+998 9${(i % 9) + 1} ${100 + i} ${20 + i} ${30 + i}`,
          birthDate: new Date(2006 + (i % 6), (i * 3) % 12, 5 + (i % 20)),
          enrolledAt: new Date(2025, 8, 1 + i),
        },
      }),
    );
  }

  // Enrolment. Note student[0] is in two groups on purpose, to demonstrate
  // that the join table supports multi-group membership.
  await prisma.groupStudent.createMany({
    data: [
      ...students.slice(0, 5).map((s) => ({ groupId: groupA.id, studentId: s.id })),
      ...students.slice(4, 9).map((s) => ({ groupId: groupB.id, studentId: s.id })),
      ...students.slice(8, 12).map((s) => ({ groupId: groupC.id, studentId: s.id })),
    ],
  });

  // --- Classrooms --------------------------------------------------------
  const classroom1 = await prisma.classroom.create({ data: { name: "1-xona", capacity: 20, branchId: branch.id } });
  const classroom2 = await prisma.classroom.create({ data: { name: "2-xona", capacity: 16, branchId: branch.id } });
  const classroom3 = await prisma.classroom.create({ data: { name: "3-kompyuter xona", capacity: 12, branchId: branch.id } });

  // --- Work hours --------------------------------------------------------
  await prisma.teacherWorkHours.createMany({
    data: [
      { teacherId: teacher.id, day: "MONDAY", startTime: "09:00", endTime: "18:00" },
      { teacherId: teacher.id, day: "TUESDAY", startTime: "09:00", endTime: "18:00" },
      { teacherId: teacher.id, day: "WEDNESDAY", startTime: "09:00", endTime: "18:00" },
      { teacherId: teacher.id, day: "THURSDAY", startTime: "09:00", endTime: "18:00" },
      { teacherId: teacher.id, day: "FRIDAY", startTime: "09:00", endTime: "18:00" },
      { teacherId: teacher2.id, day: "MONDAY", startTime: "10:00", endTime: "17:00" },
      { teacherId: teacher2.id, day: "WEDNESDAY", startTime: "10:00", endTime: "17:00" },
      { teacherId: teacher2.id, day: "FRIDAY", startTime: "10:00", endTime: "17:00" },
    ],
  });

  // --- Schedule slots ----------------------------------------------------
  await prisma.scheduleSlot.createMany({
    data: [
      { branchId: branch.id, groupId: groupA.id, teacherId: teacher.id, courseId: course.id, classroomId: classroom3.id, day: "MONDAY", startTime: "09:00", endTime: "10:30" },
      { branchId: branch.id, groupId: groupA.id, teacherId: teacher.id, courseId: course.id, classroomId: classroom3.id, day: "WEDNESDAY", startTime: "09:00", endTime: "10:30" },
      { branchId: branch.id, groupId: groupA.id, teacherId: teacher.id, courseId: course.id, classroomId: classroom3.id, day: "FRIDAY", startTime: "09:00", endTime: "10:30" },
      { branchId: branch.id, groupId: groupB.id, teacherId: teacher.id, courseId: course.id, classroomId: classroom2.id, day: "TUESDAY", startTime: "11:00", endTime: "12:30" },
      { branchId: branch.id, groupId: groupB.id, teacherId: teacher.id, courseId: course.id, classroomId: classroom2.id, day: "THURSDAY", startTime: "11:00", endTime: "12:30" },
      { branchId: branch.id, groupId: groupC.id, teacherId: teacher2.id, courseId: course2.id, classroomId: classroom1.id, day: "MONDAY", startTime: "10:00", endTime: "11:30" },
      { branchId: branch.id, groupId: groupC.id, teacherId: teacher2.id, courseId: course2.id, classroomId: classroom1.id, day: "FRIDAY", startTime: "10:00", endTime: "11:30" },
    ],
  });

  // --- Lessons (last 7 days + today) -------------------------------------
  const lessons = [];
  for (let back = 6; back >= 0; back -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - back);
    const dow = (["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const)[date.getDay()];

    const slots = await prisma.scheduleSlot.findMany({
      where: { day: dow },
      select: { id: true, groupId: true, teacherId: true, courseId: true },
    });

    for (const slot of slots) {
      lessons.push(
        await prisma.lesson.create({
          data: {
            slotId: slot.id,
            groupId: slot.groupId,
            teacherId: slot.teacherId,
            date,
            status: back === 0 ? "PLANNED" : "HELD",
            topic: back === 0 ? null : "Avvalgi dars mavzusi",
          },
        }),
      );
    }
  }

  // --- Attendance (past lessons only) ------------------------------------
  const pastLessons = lessons.filter((l) => l.status === "HELD");
  for (const lesson of pastLessons) {
    const roster = await prisma.groupStudent.findMany({
      where: { groupId: lesson.groupId },
      select: { studentId: true },
    });

    for (const [i, { studentId }] of roster.entries()) {
      const status = i % 7 === 0 ? "ABSENT" : i % 5 === 0 ? "LATE" : "PRESENT";
      const arrivedAt =
        status === "ABSENT" ? null : new Date(`${lesson.date.toISOString().slice(0, 10)}T${status === "LATE" ? "09:12" : "08:58"}:00`);
      const leftAt = arrivedAt ? new Date(arrivedAt.getTime() + 80 * 60 * 1000) : null;

      await prisma.attendance.create({
        data: { lessonId: lesson.id, studentId, status, arrivedAt, leftAt, recordedBy: admin.email },
      });
    }
  }

  // --- Lesson plans ------------------------------------------------------
  const firstLesson = pastLessons[0];
  if (firstLesson) {
    await prisma.lessonPlan.create({
      data: {
        lessonId: firstLesson.id,
        teacherId: firstLesson.teacherId,
        groupId: firstLesson.groupId,
        topic: "Masshtab va joylashuv",
        objectives:
          "O'quvchilar masshtab nima uchun kerakligini tushunadi va joylashuvni o'zlari to'g'ri belgilaydi.",
        homework: "Uy ishi: 5 ta xonalik uy rejasini masshtabda chizish",
        notes: "Qo'shimcha material kerak bo'ldi — keyingi darsda ko'rib chiqamiz.",
      },
    });
  }

  const counts = {
    branches: await prisma.branch.count(),
    users: await prisma.user.count(),
    teachers: await prisma.teacher.count(),
    subjects: await prisma.subject.count(),
    courses: await prisma.course.count(),
    groups: await prisma.group.count(),
    students: await prisma.student.count(),
    enrollments: await prisma.groupStudent.count(),
    classrooms: await prisma.classroom.count(),
    workHours: await prisma.teacherWorkHours.count(),
    scheduleSlots: await prisma.scheduleSlot.count(),
    lessons: await prisma.lesson.count(),
    attendance: await prisma.attendance.count(),
    lessonPlans: await prisma.lessonPlan.count(),
    settings: await prisma.setting.count(),
  };

  console.log("\nSeed yakunlandi:");
  console.table(counts);
  console.log(
    "\nAdmin hisobi:     admin@markaz.uz / Admin12345" +
      "\nO'qituvchi hisobi: o.qituvchi@markaz.uz / Oqituvchi123" +
      "\n\n(Ishlab chiqarish uchun mo'ljallangan parollar. Real foydalanishda almashtiring.)\n",
  );
}

main()
  .catch((error) => {
    console.error("\nSeed bajarilmadi:\n", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });