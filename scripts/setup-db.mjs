/**
 * Interactive local setup for the education_center_dev database.
 *
 * Prompts for the Postgres password in YOUR terminal, never in chat and never
 * in a command line argument (so it cannot leak via shell history or the
 * process list). Writes the result to .env, which is git-ignored.
 *
 * Usage:  npm run db:setup
 */
import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { stdin, stdout, exit, exitCode } from "node:process";

const DB_NAME = "education_center_dev";
const DEFAULT_USER = "postgres";
const ENV_PATH = ".env";

// The password is held in memory only, written straight to .env, then dropped.
// It is never echoed, never printed, and never passed as a CLI argument.
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("Ta'lim markazi — lokal ma'lumotlar bazasi sozlovi\n");

  const user = (await rl.question(`Postgres foydalanuvchisi [${DEFAULT_USER}]: `)).trim() || DEFAULT_USER;
  const host = (await rl.question("Host [localhost]: ")).trim() || "localhost";
  const port = (await rl.question("Port [5432]: ")).trim() || "5432";

  // readline does not mask input, so read the password without echoing it by
  // temporarily replacing the output stream behaviour.
  stdout.write("Parol (ko'rinmaydi): ");
  const password = await new Promise((resolve) => {
    const stdinStream = stdin;
    const output = stdout;

    let value = "";
    stdinStream.setRawMode?.(true);
    stdinStream.resume();
    stdinStream.setEncoding("utf8");

    const onData = (char) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdinStream.setRawMode?.(false);
        stdinStream.pause();
        stdinStream.removeListener("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }
      if (char === "\u0003") {
        // Ctrl+C
        exit(130);
      }
      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };

    stdinStream.on("data", onData);
  });

  const secret = randomBytes(32).toString("base64url");
  const encodedPassword = encodeURIComponent(password);

  const envContents = [
    "# Lokal muhit — bu fayl git ga commit QILINMAYDI",
    "# Postgres bilan bog'liq o'zgarishlardan keyin qayta yozish shart emas.",
    "",
    `DATABASE_URL="postgresql://${user}:${encodedPassword}@${host}:${port}/${DB_NAME}"`,
    "",
    `AUTH_SECRET="${secret}"`,
    `AUTH_URL="http://localhost:3000"`,
    `AUTH_TRUST_HOST="true"`,
    "",
  ].join("\n");

  await writeFile(ENV_PATH, envContents, "utf8");
  console.log(`\n${ENV_PATH} yaratildi (parol va kalit yozildi).`);

  // NOTE: .env is never copied to .env.example. Doing so would put the real
  // password into a git-tracked file. .env.example is committed as-is with
  // placeholders and must never be generated from .env.
  rl.close();

  console.log("\nKeyingi qadamlar:");
  console.log(`  1) Bazani yarating:  createdb -U ${user} ${DB_NAME}`);
  console.log("  2) Migratsiya:      npm run db:migrate");
  console.log("  3) Namuna ma'lumot: SET_ALLOW_SEED=1 npm run db:seed");
  console.log("  4) Ishga tushiring:  npm run dev\n");
}

main().catch((error) => {
  console.error("\nSozlash bajarilmadi:", error instanceof Error ? error.message : error);
  exitCode = 1;
});