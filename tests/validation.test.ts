import { test } from "node:test";
import assert from "node:assert/strict";

import {
  emailSchema,
  entityNameSchema,
  fullNameSchema,
  loginSchema,
  passwordSchema,
  phoneSchema,
  timeSchema,
} from "../src/server/validation/auth";

test("loginSchema rejects an invalid email", () => {
  const result = loginSchema.safeParse({
    email: "not-an-email",
    password: "secret",
  });

  assert.equal(result.success, false);
});

test("loginSchema rejects an empty password", () => {
  const result = loginSchema.safeParse({
    email: "a@b.uz",
    password: "",
  });

  assert.equal(result.success, false);
});

test("loginSchema trims and accepts valid credentials", () => {
  const result = loginSchema.safeParse({
    email: "  admin@markaz.uz ",
    password: "secret1",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.email, "admin@markaz.uz");
  }
});

test("phoneSchema rejects letters", () => {
  assert.equal(phoneSchema.safeParse("+998 90 abc").success, false);
});

test("phoneSchema rejects too-short input", () => {
  assert.equal(phoneSchema.safeParse("12345").success, false);
});

test("phoneSchema accepts an Uzbek mobile number", () => {
  assert.equal(phoneSchema.safeParse("+998 90 123 45 67").success, true);
});

test("timeSchema rejects an invalid hour", () => {
  assert.equal(timeSchema.safeParse("25:00").success, false);
});

test("timeSchema rejects missing minutes", () => {
  assert.equal(timeSchema.safeParse("09:0").success, false);
});

test("timeSchema accepts HH:mm", () => {
  assert.equal(timeSchema.safeParse("09:30").success, true);
  assert.equal(timeSchema.safeParse("23:59").success, true);
});

test("timeSchema accepts midnight", () => {
  assert.equal(timeSchema.safeParse("00:00").success, true);
});

test("timeSchema rejects 24:00", () => {
  assert.equal(timeSchema.safeParse("24:00").success, false);
});

test("timeSchema rejects minutes above 59", () => {
  assert.equal(timeSchema.safeParse("12:60").success, false);
});

test("timeSchema rejects a single-digit hour", () => {
  assert.equal(timeSchema.safeParse("9:30").success, false);
});

test("fullNameSchema accepts Uzbek Latin names", () => {
  assert.equal(fullNameSchema.safeParse("Dilnoza Rahimova").success, true);
  assert.equal(fullNameSchema.safeParse("Madina Yo'ldosheva").success, true);
});

test("fullNameSchema rejects digits", () => {
  assert.equal(fullNameSchema.safeParse("Ali 123").success, false);
});

test("fullNameSchema rejects a single character", () => {
  assert.equal(fullNameSchema.safeParse("A").success, false);
});

test("emailSchema accepts and normalises a mixed-case address", () => {
  const result = emailSchema.safeParse("  Teacher@Markaz.UZ ");

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data, "teacher@markaz.uz");
  }
});

test("emailSchema rejects a value with no @", () => {
  assert.equal(emailSchema.safeParse("not-an-email").success, false);
});

test("emailSchema rejects an empty string", () => {
  assert.equal(emailSchema.safeParse("").success, false);
});

test("passwordSchema rejects a password shorter than 8 characters", () => {
  assert.equal(passwordSchema.safeParse("short1").success, false);
});

test("passwordSchema accepts an 8-character password", () => {
  assert.equal(passwordSchema.safeParse("longenough").success, true);
});

test("entityNameSchema accepts names with digits (course/group/classroom)", () => {
  assert.equal(entityNameSchema.safeParse("IELTS 7.0").success, true);
  assert.equal(entityNameSchema.safeParse("A-203").success, true);
});

test("entityNameSchema rejects a single character", () => {
  assert.equal(entityNameSchema.safeParse("A").success, false);
});

test("entityNameSchema trims surrounding whitespace", () => {
  const result = entityNameSchema.safeParse("  Front Desk  ");

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data, "Front Desk");
  }
});