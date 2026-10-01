import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * Prisma 7 uses driver adapters for relational databases, so the CLI and the
 * generated client both read the connection string from here rather than from
 * a `url` inside the datasource block of schema.prisma.
 *
 * The URL is read from .env (git-ignored). It is never committed or logged.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});