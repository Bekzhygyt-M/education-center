/**
 * Unit tests for the Zod validation schemas.
 *
 * Run with:  npx tsx --test tests/validation.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fullNameSchema,
  loginSchema,
  phoneSchema,
  timeSchema,
} from "../src/server/validation/auth";

test("loginSchema rejects an invalid email", () => {
  const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
  assert.equal(result.success, false);
});

test("loginSchema rejects an empty password", () => {
  const result = loginSchema.safeParse({ email: "a@b.uz", password: "" });
  assert.equal(result.success, false);
});

test("loginSchema trims and accepts valid credentials", () => {
  const result = loginSchema.safeParse({ email: "  admin@markaz.uz ", password: "secret1" });
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