import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 singleton.
 *
 * Prisma 7 talks to PostgreSQL through a driver adapter, so the client is
 * constructed with a pg Pool rather than a connection string. The pool is
 * created lazily so that merely importing this module (e.g. during `next build`
 * with no database available) does not open a connection.
 *
 * The singleton pattern caches one client on globalThis so Next.js hot reloads
 * in development do not exhaust the Postgres connection limit.
 */

declare global {
  var __educationCenterPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalThis.__educationCenterPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__educationCenterPrisma = prisma;
}