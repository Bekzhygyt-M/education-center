/**
 * Generates a cryptographically random AUTH_SECRET for .env.
 * Run with:  node scripts/gen-secret.mjs
 *
 * The generated value is printed to the terminal only. Hermes must never copy
 * it into chat, a commit, or any log.
 */
import { randomBytes } from "node:crypto";

const secret = randomBytes(32).toString("base64url");

console.log("AUTH_SECRET uchun yangi kalit:\n");
console.log(secret);
console.log(
  "\nBu qiymatni .env faylidagi AUTH_SECRET= qatoriga yozing.",
  "\n.env hech qachon git ga commit qilinmaydi.",
);