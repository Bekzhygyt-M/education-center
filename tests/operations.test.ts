import { test } from "node:test";
import assert from "node:assert/strict";
import { attendanceStatusForArrival, isWithinWorkHours, rangesOverlap } from "../src/server/services/operations";
import { canAccessGroup, canAccessTeacherId } from "../src/server/services/authorization";
import type { SessionUser } from "../src/server/auth/session";

const admin: SessionUser = { id: "a", email: "a@test.uz", fullName: "Admin", role: "ADMIN", teacherId: null };
const teacher: SessionUser = { id: "t", email: "t@test.uz", fullName: "Teacher", role: "TEACHER", teacherId: "teacher-1" };

test("teacher scope never permits another teacher's resource", () => {
  assert.equal(canAccessTeacherId(admin, "teacher-2"), true);
  assert.equal(canAccessTeacherId(teacher, "teacher-1"), true);
  assert.equal(canAccessTeacherId(teacher, "teacher-2"), false);
  assert.equal(canAccessGroup(teacher, { teacherId: "teacher-2" }), false);
});

test("admin may access any teacher's group; a teacher only their own", () => {
  assert.equal(canAccessGroup(admin, { teacherId: "teacher-1" }), true);
  assert.equal(canAccessGroup(admin, { teacherId: "teacher-2" }), true);
  assert.equal(canAccessGroup(teacher, { teacherId: "teacher-1" }), true);
});

test("schedule intervals detect overlap but allow adjacent lessons", () => {
  assert.equal(rangesOverlap("09:00", "10:30", "10:00", "11:00"), true);
  assert.equal(rangesOverlap("09:00", "10:30", "10:30", "11:30"), false);
});

test("schedule must fit one declared teacher work period", () => {
  const hours = [{ startTime: "09:00", endTime: "12:00" }];
  assert.equal(isWithinWorkHours("09:00", "10:30", hours), true);
  assert.equal(isWithinWorkHours("08:59", "10:30", hours), false);
});

test("attendance changes to late only after configured threshold", () => {
  assert.equal(attendanceStatusForArrival("09:00", new Date(2026, 0, 1, 9, 10), 10, "PRESENT"), "PRESENT");
  assert.equal(attendanceStatusForArrival("09:00", new Date(2026, 0, 1, 9, 11), 10, "PRESENT"), "LATE");
  assert.equal(attendanceStatusForArrival("09:00", new Date(), 10, "EXCUSED"), "EXCUSED");
});
