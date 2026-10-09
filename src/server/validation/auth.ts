import { z } from "zod";

/** Uzbek Latin, with an optional leading + for international format. */
export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Telefon kamida 9 ta belgidan iborat bo'lishi kerak")
  .max(20, "Telefon juda uzun")
  .regex(/^\+?[0-9\s()-]+$/, "Telefon faqat raqamlardan iborat bo'lishi kerak");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Elektron pochta kiritilishi shart")
    .email("Elektron pochta noto'g'ri kiritilgan"),
  password: z.string().min(1, "Parol kiritilishi shart").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Uzbek Latin letters plus space, apostrophe and hyphen. */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak")
  .max(120)
  .regex(
    /^[\p{L}][\p{L}\s'-]*$/u,
    "Faqat harflar, bo'shliq, apostrof va chiziqcha qo'llanadi",
  );

/** Account email: trimmed and lower-cased so lookups and uniqueness checks are case-insensitive. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Elektron pochta noto'g'ri");

export const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
  .max(200);

export const createUserSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt HH:mm formatida bo'lishi kerak");

/**
 * Name of a non-person entity (course, group, classroom). Deliberately
 * broader than fullNameSchema — these names may contain digits, e.g. "IELTS 7.0"
 * or "A-203" — so it only enforces a sane length, not a letters-only shape.
 */
export const entityNameSchema = z
  .string()
  .trim()
  .min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak")
  .max(120, "Nom juda uzun");