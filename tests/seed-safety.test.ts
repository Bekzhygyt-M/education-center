/**
 * Unit tests for the seed script's safety guards.
 *
 * These are the checks that stop the seed from ever writing to a database
 * that is not a scratch _dev database, so they are worth testing without a
 * live Postgres instance.
 *
 * Run with:  npx tsx --test tests/seed-safety.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors assertSafeToSeed in prisma/seed.ts. */
function assertSafeToSeed(connectionString: string, allowSeed: string | undefined): string | null {
  let dbName: string;
  try {
    dbName = new URL(connectionString).pathname.replace(/^\//, "");
  } catch {
    return "DATABASE_URL talqin qilinmadi.";
  }

  if (!dbName.endsWith("_dev")) {
    return `XAVFSIZLIK: "${dbName}" nomli ma'lumotlar bazasi seed uchun mos emas.`;
  }
  if (allowSeed !== "1") {
    return "XAVFSIZLIK: SET_ALLOW_SEED=1 o'rnini belgilanmagan.";
  }
  if (connectionString.includes("newera") || connectionString.includes("new_era")) {
    return "XAVFSIZLIK: NewEra bazasi aniqlangan. Seed to'xtatildi.";
  }
  return null;
}

test("rejects a database name that does not end in _dev", () => {
  const result = assertSafeToSeed(
    "postgresql://postgres:secret@localhost:5432/production",
    "1",
  );
  assert.ok(result);
  assert.match(result, /mos emas/);
});

test("rejects the production-style name education_center", () => {
  const result = assertSafeToSeed(
    "postgresql://postgres:secret@localhost:5432/education_center",
    "1",
  );
  assert.ok(result, "education_center does not end in _dev and must be refused");
});

test("rejects when SET_ALLOW_SEED is not set", () => {
  const result = assertSafeToSeed(
    "postgresql://postgres:secret@localhost:5432/education_center_dev",
    undefined,
  );
  assert.ok(result);
  assert.match(result, /SET_ALLOW_SEED/);
});

test("rejects a NewEra database even if it is named _dev", () => {
  const result = assertSafeToSeed(
    "postgresql://postgres:secret@localhost:5432/newera_dev",
    "1",
  );
  assert.ok(result);
  assert.match(result, /NewEra/);
});

test("rejects a malformed connection string", () => {
  const result = assertSafeToSeed("not-a-url", "1");
  assert.ok(result);
  assert.match(result, /talqin/);
});

test("accepts a proper _dev database with the acknowledgement set", () => {
  const result = assertSafeToSeed(
    "postgresql://postgres:secret@localhost:5432/education_center_dev",
    "1",
  );
  assert.equal(result, null);
});

test("a password containing special characters is URL-encoded, not corrupted", () => {
  // Mirrors the encoding in setup-db.mjs. If a password has '@' or '/',
  // encodeURIComponent keeps the URL parseable.
  const password = "p@ss:w/rd#1";
  const url = `postgresql://postgres:${encodeURIComponent(password)}@localhost:5432/education_center_dev`;
  assert.equal(new URL(url).password, encodeURIComponent(password));
  assert.equal(assertSafeToSeed(url, "1"), null);
});